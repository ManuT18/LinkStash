import express from 'express';
import path from 'path';
import { apiRouter } from './routes.js';

export function createServer() {
  const app = express();

  app.use(express.json());

  // Servir archivos estáticos del dashboard
  const publicDir = path.resolve(process.cwd(), 'public');
  app.use(express.static(publicDir));

  // Rutas API
  app.use('/api', apiRouter);

  // Fallback a index.html para SPA
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });

  return app;
}
