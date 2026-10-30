import { Router } from 'express';
import { all } from '../db.js';
import { NISR_DATASET } from '../data/nisr.js';
import { getNisrMetrics } from '../services/analytics.js';
import { getChatContext, sampleChatQuestions } from '../services/chat.js';
import { addDays, toDateStr } from '../lib/time.js';

const router = Router();

router.get('/meta', (_req, res) => {
  const today = new Date();
  const tomorrow = addDays(today, 1);

  const routes = all('SELECT * FROM routes ORDER BY destination').map((row) => ({
    id: row.id,
    origin: row.origin,
    destination: row.destination,
    district: row.district,
    region: row.region,
    distanceKm: row.distance_km,
    durationMin: row.duration_min,
    baseFare: row.base_fare,
    nisrCommuteWeight: row.nisr_commute_weight,
    regionalMultiplier: row.regional_multiplier
  }));

  const companies = all('SELECT * FROM companies ORDER BY name').map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    color: row.color
  }));

  res.json({
    app: {
      name: 'NyabuGo',
      tagline: 'Smart Intercity Transit & Predictive Fleet Platform',
      origin: 'Nyabugogo, Kigali'
    },
    routes,
    companies,
    dates: [
      { value: toDateStr(today), label: 'Today' },
      { value: toDateStr(tomorrow), label: 'Tomorrow' }
    ],
    nisr: {
      ...NISR_DATASET,
      metrics: getNisrMetrics()
    },
    chat: {
      context: getChatContext(),
      suggestions: sampleChatQuestions()
    },
    formula:
      'Predicted_Demand = (Live_Bookings × 1.15) + (NISR_Commute_Weight_D23A × Regional_Multiplier × 4.18)'
  });
});

export default router;
