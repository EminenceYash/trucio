import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  isGeminiConfigured,
  performGeminiAnalysis,
} from './server/geminiAnalyze';
import { lookupLiveDomainIntel } from './server/domainLookup';

dotenv.config({ path: '.env.local' });
dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      geminiConfigured: isGeminiConfigured(),
    });
  });

  app.get('/api/domain-lookup', async (req, res) => {
    const domain = typeof req.query.domain === 'string' ? req.query.domain : '';
    const outcome = await lookupLiveDomainIntel(domain);
    res.status(outcome.status).json(outcome.body);
  });

  app.post('/api/analyze', async (req, res) => {
    const outcome = await performGeminiAnalysis(req.body);
    res.status(outcome.status).json(outcome.body);
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TRUCIO server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
