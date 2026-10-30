import { Router } from 'express';
import { buildAdminOverview, getNisrMetrics, getRecommendations, getRouteDemand } from '../services/analytics.js';

const router = Router();

router.get('/admin/overview', (_req, res) => {
  res.json(buildAdminOverview());
});

router.get('/admin/nisr', (_req, res) => {
  res.json({
    dataset: 'RW_LFS2025',
    title: 'Rwanda Labour Force Survey 2025',
    publisher: 'National Institute of Statistics of Rwanda (NISR)',
    metrics: getNisrMetrics()
  });
});

router.get('/admin/recommendations', (_req, res) => {
  const routes = getRouteDemand();
  res.json({ recommendations: getRecommendations(routes), routes });
});

export default router;
