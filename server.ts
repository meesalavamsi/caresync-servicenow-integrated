import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { registerRoutes } from './server/routes.js';

async function startServer() {
  const app = express();
  const basePort = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  // All CareSync + ServiceNow API routes.
  registerRoutes(app);

  // Check if static dist bundle exists (Production mode or dist build)
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));
  const isProd = process.env.NODE_ENV === 'production' || hasDist;

  if (!isProd) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: { port: 24679 },
        },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err: any) {
      console.warn('[Vite Dev Middleware Warning]:', err?.message || err);
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Attempt to listen on basePort, falling back to next available port if occupied
  function listenOnPort(port: number) {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log('=======================================================');
      console.log(' CareSync · Hospital Service Management Portal');
      console.log(` Server active on http://localhost:${port}`);
      console.log(' Target ServiceNow PDI: https://dev183600.service-now.com');
      console.log('=======================================================');
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[Port Warning]: Port ${port} is in use. Attempting port ${port + 1}...`);
        listenOnPort(port + 1);
      } else {
        console.error('[Server Start Error]:', err);
      }
    });
  }

  listenOnPort(basePort);
}

startServer();
