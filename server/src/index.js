import './env.js';
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initSchema } from './db.js';
import { seedDatabase } from './seed.js';
import metaRouter from './routes/meta.js';
import busesRouter from './routes/buses.js';
import ticketsRouter from './routes/tickets.js';
import adminRouter from './routes/admin.js';
import aiRouter from './routes/ai.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4000);

initSchema();
const seedResult = seedDatabase();

const app = express();
app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '12mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'nyabugo-api',
    seeded: seedResult,
    time: new Date().toISOString()
  });
});

app.use('/api', metaRouter);
app.use('/api', busesRouter);
app.use('/api', ticketsRouter);
app.use('/api', adminRouter);
app.use('/api', aiRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    return res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((error, _req, res, _next) => {
  console.error('[NyabuGo]', error);
  res.status(500).json({ error: error.message || 'Unexpected server error.' });
});

app.listen(PORT, () => {
  console.log(`[NyabuGo] API listening on http://localhost:${PORT}`);
  if (seedResult.seeded) {
    console.log('[NyabuGo] Database seeded:', seedResult);
  }
});
