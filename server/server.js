import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.on('uncaughtException', (err) => {
  console.error('💥 Erro capturado no processo:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('💥 Rejeição capturada no processo:', reason);
});

import { seedData } from './db/seed.js';
import { router as apiRouter } from './routes/api.js';
import { FootballApiService } from './services/footballApiService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Inicializar e popular clubes se necessário
try {
  seedData();
} catch (e) {
  console.error('Aviso ao inicializar seedData:', e.message);
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check para Coolify / Traefik
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Rotas da API
app.use('/api', apiRouter);

// Servir frontend compilado em produção
const clientDist = path.join(__dirname, '../client/dist');

// Assets com hash imutável (cache longa)
app.use('/assets', express.static(path.join(clientDist, 'assets'), {
  maxAge: '1y',
  immutable: true
}));

// Outros estáticos com no-cache para forçar atualização no browser e PWA
app.use(express.static(clientDist, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('sw.js') || filePath.endsWith('manifest.webmanifest')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// SPA Fallback sem cache para index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(clientDist, 'index.html'));
  }
});

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`⚽ STRIKER Backend a rodar em http://0.0.0.0:${PORT}`);
  // Iniciar sincronização automática periódica
  try {
    FootballApiService.startAutoSync(1);
  } catch (e) {
    console.warn('Aviso no startAutoSync:', e.message);
  }
  try {
    await FootballApiService.syncMatchday(6);
    await FootballApiService.syncMatchday(7);
  } catch (e) {
    console.warn('Aviso no sync inicial:', e.message);
  }
});
