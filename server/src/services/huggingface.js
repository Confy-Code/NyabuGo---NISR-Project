const HF_TOKEN = process.env.HF_TOKEN || '';
const HF_INFERENCE_URL =
  process.env.HF_INFERENCE_URL || 'https://router.huggingface.co/hf-inference/models';
const CHAT_MODEL = process.env.HF_CHAT_MODEL || 'mbazaNLP/Nllb_finetuned_general_en_kin';
const ASR_MODEL = process.env.HF_ASR_MODEL || 'mbazaNLP/Whisper-Small-Kinyarwanda';
const FORECAST_MODEL = process.env.HF_FORECAST_MODEL || 'huggingface/Time-Series-Transformer';

export function aiStatus() {
  return {
    enabled: Boolean(HF_TOKEN),
    provider: 'Hugging Face Inference',
    chatModel: CHAT_MODEL,
    asrModel: ASR_MODEL,
    forecastModel: FORECAST_MODEL,
    note: HF_TOKEN
      ? 'Live Hugging Face inference enabled.'
      : 'Running with the built-in offline NLU fallback. Set HF_TOKEN to enable Kinyarwanda translation and Whisper speech recognition.'
  };
}

async function hfFetch(model, body, { binary = false, contentType = 'application/json' } = {}) {
  if (!HF_TOKEN) {
    throw new Error('HF_TOKEN is not configured');
  }

  const response = await fetch(`${HF_INFERENCE_URL}/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      ...(binary ? { 'Content-Type': contentType } : { 'Content-Type': 'application/json' })
    },
    body: binary ? body : JSON.stringify(body),
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Hugging Face ${response.status}: ${detail.slice(0, 200)}`);
  }

  return response.json();
}

function extractText(result) {
  if (typeof result === 'string') return result;
  if (Array.isArray(result)) {
    for (const item of result) {
      if (typeof item === 'string') return item;
      if (item?.translation_text) return item.translation_text;
      if (item?.generated_text) return item.generated_text;
      if (item?.summary_text) return item.summary_text;
    }
  }
  if (result?.translation_text) return result.translation_text;
  if (result?.generated_text) return result.generated_text;
  return '';
}

export async function translateToKinyarwanda(text) {
  const result = await hfFetch(CHAT_MODEL, {
    inputs: text,
    options: { wait_for_model: true, use_cache: true }
  });
  return extractText(result).trim();
}

export async function translateToEnglish(text) {
  const model =
    process.env.HF_TRANSLATE_MODEL || 'facebook/nllb-200-distilled-600M';
  const result = await hfFetch(model, {
    inputs: text,
    parameters: { src_lang: 'kin_Latn', tgt_lang: 'eng_Latn' },
    options: { wait_for_model: true }
  });
  return extractText(result).trim();
}

export async function speechToText(audioBuffer) {
  const result = await hfFetch(ASR_MODEL, audioBuffer, {
    binary: true,
    contentType: 'audio/wav'
  });
  return (result?.text || '').trim();
}

export function getAiConfig() {
  return { enabled: Boolean(HF_TOKEN), chatModel: CHAT_MODEL, asrModel: ASR_MODEL };
}
