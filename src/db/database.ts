import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const dataDir = path.resolve(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbName = process.env.DB_NAME || 'linkstash.db';
  const dbPath = process.env.DB_PATH || path.join(dataDir, dbName);

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await dbInstance.exec('PRAGMA journal_mode = WAL;');
  await dbInstance.exec('PRAGMA busy_timeout = 5000;');

  return dbInstance;
}

export async function closeDb(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}

export async function initDatabase() {
  const db = await getDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      emoji TEXT NOT NULL,
      keywords TEXT NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      thumbnail TEXT DEFAULT '',
      platform TEXT NOT NULL CHECK(platform IN ('youtube', 'tiktok', 'instagram', 'other')),
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'reviewed')),
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME
    );
  `);

  const { count } = (await db.get('SELECT COUNT(*) as count FROM categories')) || { count: 0 };

  if (count === 0) {
    const defaultCategories = [
      {
        name: 'Diseño Web',
        emoji: '🎨',
        keywords: JSON.stringify(['css', 'ui', 'ux', 'web', 'design', 'frontend', 'tailwind', 'figma', 'animation', 'layout', 'canvas', 'svg', 'component']),
        color: '#8b5cf6'
      },
      {
        name: 'Impresión 3D',
        emoji: '🖨️',
        keywords: JSON.stringify(['3d', 'print', 'stl', 'filament', 'slicer', 'cura', 'bambu', 'prusa', 'ender', 'cad', 'fusion', 'mesh']),
        color: '#f97316'
      },
      {
        name: 'Cursos',
        emoji: '📚',
        keywords: JSON.stringify(['course', 'curso', 'tutorial', 'class', 'learn', 'aprender', 'guide', 'roadmap', 'masterclass', 'bootcamp']),
        color: '#06b6d4'
      },
      {
        name: 'Herramientas',
        emoji: '🔧',
        keywords: JSON.stringify(['tool', 'herramienta', 'app', 'extension', 'utility', 'ai tool', 'software', 'saas', 'generator']),
        color: '#10b981'
      },
      {
        name: 'Programación',
        emoji: '💻',
        keywords: JSON.stringify(['code', 'python', 'javascript', 'typescript', 'react', 'node', 'docker', 'api', 'backend', 'git', 'linux', 'rust']),
        color: '#3b82f6'
      },
      {
        name: 'Entretenimiento',
        emoji: '🎮',
        keywords: JSON.stringify(['game', 'gaming', 'meme', 'funny', 'music', 'movie', 'short', 'humor', 'viral']),
        color: '#ec4899'
      },
      {
        name: 'Otros',
        emoji: '📦',
        keywords: JSON.stringify([]),
        color: '#6b7280'
      }
    ];

    for (const cat of defaultCategories) {
      await db.run(
        'INSERT INTO categories (name, emoji, keywords, color) VALUES (?, ?, ?, ?)',
        [cat.name, cat.emoji, cat.keywords, cat.color]
      );
    }
    console.log('✅ Base de datos inicializada con categorías por defecto.');
  }
}
