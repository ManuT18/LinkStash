import { getDb } from './database.js';
import { LinkItem, Category } from '../types/index.js';

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDb();
  const rows = await db.all('SELECT * FROM categories');
  return rows.map(r => ({
    ...r,
    keywords: JSON.parse(r.keywords || '[]')
  }));
}

export async function saveLink(data: {
  url: string;
  title: string;
  description?: string;
  thumbnail?: string;
  platform: 'youtube' | 'tiktok' | 'instagram' | 'other';
  category: string;
}): Promise<LinkItem> {
  const db = await getDb();
  const result = await db.run(`
    INSERT INTO links (url, title, description, thumbnail, platform, category, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `, [
    data.url,
    data.title,
    data.description || '',
    data.thumbnail || '',
    data.platform,
    data.category
  ]);

  const row = await db.get('SELECT * FROM links WHERE id = ?', [result.lastID]);
  return row as LinkItem;
}

export async function getLinkByUrl(url: string): Promise<LinkItem | undefined> {
  const db = await getDb();
  return (await db.get('SELECT * FROM links WHERE url = ?', [url])) as LinkItem | undefined;
}

export async function getLinks(filters: {
  category?: string;
  status?: string;
  platform?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ links: LinkItem[]; total: number }> {
  const db = await getDb();
  let query = 'SELECT * FROM links WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM links WHERE 1=1';
  const params: any[] = [];

  if (filters.category && filters.category !== 'all') {
    query += ' AND category = ?';
    countQuery += ' AND category = ?';
    params.push(filters.category);
  }

  if (filters.status && filters.status !== 'all') {
    query += ' AND status = ?';
    countQuery += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters.platform && filters.platform !== 'all') {
    query += ' AND platform = ?';
    countQuery += ' AND platform = ?';
    params.push(filters.platform);
  }

  if (filters.search) {
    query += ' AND (title LIKE ? OR description LIKE ? OR notes LIKE ?)';
    countQuery += ' AND (title LIKE ? OR description LIKE ? OR notes LIKE ?)';
    const searchParam = `%${filters.search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  const { total } = (await db.get(countQuery, params)) as { total: number };

  query += ' ORDER BY created_at DESC';

  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }
  }

  const links = await db.all(query, params) as LinkItem[];

  return { links, total };
}

export async function updateLink(id: number, updates: {
  category?: string;
  status?: 'pending' | 'reviewed';
  notes?: string;
  title?: string;
  url?: string;
}): Promise<LinkItem | null> {
  const db = await getDb();
  const current = await db.get('SELECT * FROM links WHERE id = ?', [id]) as LinkItem | undefined;
  if (!current) return null;

  let query = 'UPDATE links SET ';
  const fields: string[] = [];
  const params: any[] = [];

  if (updates.category !== undefined) {
    fields.push('category = ?');
    params.push(updates.category);
    
    // Si la categoría cambió, "aprendemos" palabras clave del título
    if (updates.category !== current.category) {
      await learnCategoryKeywords(updates.category, current.title);
    }
  }

  if (updates.status !== undefined) {
    fields.push('status = ?');
    params.push(updates.status);
    if (updates.status === 'reviewed') {
      fields.push("reviewed_at = CURRENT_TIMESTAMP");
    }
  }

  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    params.push(updates.notes);
  }

  if (updates.title !== undefined) {
    fields.push('title = ?');
    params.push(updates.title);
  }

  if (updates.url !== undefined) {
    fields.push('url = ?');
    params.push(updates.url);
  }

  if (fields.length === 0) return current;

  query += fields.join(', ') + ' WHERE id = ?';
  params.push(id);

  await db.run(query, params);
  const updated = await db.get('SELECT * FROM links WHERE id = ?', [id]);
  return updated as LinkItem;
}

export async function deleteLink(id: number): Promise<boolean> {
  const db = await getDb();
  const result = await db.run('DELETE FROM links WHERE id = ?', [id]);
  return (result.changes || 0) > 0;
}

export async function updateCategoryKeywords(categoryId: string, keywords: string[]): Promise<boolean> {
  const db = await getDb();
  // Ensure we only store unique keywords
  const uniqueKeywords = [...new Set(keywords.map(k => k.toLowerCase().trim()).filter(k => k.length > 0))];
  const result = await db.run('UPDATE categories SET keywords = ? WHERE id = ?', [JSON.stringify(uniqueKeywords), categoryId]);
  return (result.changes || 0) > 0;
}

interface CountResult {
  c: number;
}

export async function getStats() {
  const db = await getDb();
  
  const totalRes = await db.get<CountResult>('SELECT COUNT(*) as c FROM links');
  const pendingRes = await db.get<CountResult>("SELECT COUNT(*) as c FROM links WHERE status = 'pending'");
  const reviewedRes = await db.get<CountResult>("SELECT COUNT(*) as c FROM links WHERE status = 'reviewed'");

  const total = totalRes?.c || 0;
  const pending = pendingRes?.c || 0;
  const reviewed = reviewedRes?.c || 0;

  const byCategory = await db.all<{category: string, count: number}[]>(`
    SELECT category, COUNT(*) as count FROM links GROUP BY category
  `);

  const byPlatform = await db.all<{platform: string, count: number}[]>(`
    SELECT platform, COUNT(*) as count FROM links GROUP BY platform
  `);

  return { total, pending, reviewed, byCategory, byPlatform };
}

export async function learnCategoryKeywords(categoryId: string, text: string) {
  if (!text) return;
  const db = await getDb();
  const category = await db.get<Category>('SELECT * FROM categories WHERE id = ? OR name = ?', [categoryId, categoryId]);
  if (!category) return;
  
  const currentKeywords: string[] = typeof category.keywords === 'string' 
    ? JSON.parse(category.keywords || '[]') 
    : (category.keywords || []);
  
  // Extraer palabras significativas (más de 3 letras, evitar stopwords comunes)
  const stopWords = new Set(['para', 'como', 'este', 'esta', 'estos', 'estas', 'pero', 'todo', 'nada', 'algo', 'esto', 'eso', 'video', 'tutorial']);
  const words = text.toLowerCase().replace(/[^\wáéíóúñ]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
  
  let changed = false;
  for (const word of words) {
    if (!currentKeywords.includes(word)) {
      currentKeywords.push(word);
      changed = true;
    }
  }
  
  if (changed) {
    await db.run('UPDATE categories SET keywords = ? WHERE id = ?', [JSON.stringify(currentKeywords), category.id]);
    console.log(`[Categorizer] Aprendidas nuevas keywords para ${category.name}: ${words.join(', ')}`);
  }
}
