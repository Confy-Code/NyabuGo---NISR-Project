import { Router } from 'express';
import { answerChat, getChatContext, sampleChatQuestions } from '../services/chat.js';
import { aiStatus, speechToText } from '../services/huggingface.js';
import { buildAdminOverview } from '../services/analytics.js';

const router = Router();

router.get('/ai/status', (_req, res) => {
  res.json({ ...aiStatus(), context: getChatContext(), suggestions: sampleChatQuestions() });
});

router.post('/ai/chat', async (req, res, next) => {
  try {
    const message = req.body?.message;
    const result = await answerChat(message);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/ai/forecast', (_req, res) => {
  const overview = buildAdminOverview();
  res.json({
    generatedAt: overview.generatedAt,
    model: aiStatus().forecastModel,
    mode: 'nisr-weighted-time-series-regressor',
    recommendations: overview.recommendations,
    heatmap: overview.heatmap
  });
});

router.post('/ai/asr', async (req, res) => {
  const audio = req.body?.audio;
  if (!audio) {
    return res.status(400).json({ error: 'Send a base64 encoded audio payload in the "audio" field.' });
  }

  const status = aiStatus();
  if (!status.enabled) {
    return res.status(503).json({
      error: 'Speech recognition needs HF_TOKEN. Use the text chat or the browser microphone instead.',
      model: status.asrModel
    });
  }

  try {
    const buffer = Buffer.from(String(audio).replace(/^data:audio\/\w+;base64,/, ''), 'base64');
    const text = await speechToText(buffer);
    res.json({ text, model: status.asrModel });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

export default router;
