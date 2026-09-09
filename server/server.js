import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedData } from './db/seed.js';
import { router as apiRouter } from './routes/api.js';
import { FootballApiService } from './services/footballApiService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Inicializar e popular clubes se necessário
seedData();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api', apiRouter);

// Servir frontend compilado em produção
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientDist, 'index.html'));
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`⚽ STRIKER Backend a rodar em http://localhost:${PORT}`);
  // Iniciar sincronização automática com a API oficial
  FootballApiService.startAutoSync(30);
});
