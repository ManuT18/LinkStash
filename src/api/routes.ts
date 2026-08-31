import { Router } from 'express';
import { getLinks, updateLink, deleteLink, getAllCategories, getStats, saveLink } from '../db/queries.js';
import { extractMetadata } from '../services/metadata.js';
import { categorizeLink } from '../services/categorizer.js';

export const apiRouter = Router();

// GET /api/links - Obtener lista de links con filtros
apiRouter.get('/links', async (req, res) => {
  try {
    const { category, status, platform, search, page, limit } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    const result = await getLinks({
      category: category as string,
      status: status as string,
      platform: platform as string,
      search: search as string,
      limit: limitNum,
      offset
    });

    res.json({
      links: result.links,
      total: result.total,
      page: pageNum,
      totalPages: Math.ceil(result.total / limitNum) || 1
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/links - Crear manualmente un link desde el dashboard
apiRouter.post('/links', async (req, res) => {
  try {
    const { url, category: customCategory } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL es requerida' });
    }

    const meta = await extractMetadata(url);
    const aiResult = await categorizeLink(url, meta.title, meta.description);
    const category = customCategory || aiResult.category;
    const title = aiResult.shortTitle || meta.title;

    const newLink = await saveLink({
      url,
      title,
      description: meta.description,
      thumbnail: meta.thumbnail,
      platform: meta.platform,
      category
    });

    res.status(201).json(newLink);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/links/:id - Actualizar estado/categoría/notas/título/url
apiRouter.patch('/links/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { category, status, notes, title, url } = req.body;

    const updated = await updateLink(id, { category, status, notes, title, url });
    if (!updated) {
      return res.status(404).json({ error: 'Link no encontrado' });
    }

    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/links/:id - Eliminar un link
apiRouter.delete('/links/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const success = await deleteLink(id);

    if (!success) {
      return res.status(404).json({ error: 'Link no encontrado' });
    }

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/categories - Obtener categorías
apiRouter.get('/categories', async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.json(categories);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

import { updateCategoryKeywords } from '../db/queries.js';

// PUT /api/categories/:id/keywords - Actualizar palabras clave de una categoría
apiRouter.put('/categories/:id/keywords', async (req, res) => {
  try {
    const { keywords } = req.body;
    if (!Array.isArray(keywords)) {
      return res.status(400).json({ error: 'Keywords debe ser un arreglo de strings' });
    }
    const success = await updateCategoryKeywords(req.params.id, keywords);
    if (!success) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/stats - Obtener estadísticas
apiRouter.get('/stats', async (req, res) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
