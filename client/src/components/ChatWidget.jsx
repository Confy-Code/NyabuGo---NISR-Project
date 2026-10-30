import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Mic,
  MicOff,
  MessageCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import api from '../lib/api.js';
import { formatTime, formatRwf } from '../lib/format.js';

const GREETING = {
  role: 'assistant',
  text:
    'Muraho! Ndi NyabuGo AI. Baza mu Kinyarwanda cyangwa Icyongereza ku bihe bisi zihaguruka, ibiciro, imyanya isigaye cyangwa itike yawe.\n\nHi! Ask me about departure times, fares, seat availability or your QR ticket.',
  meta: 'nyabugo-rules-v1'
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState([
    'Bus ijya Musanze ihaguruka ryari?',
    'Itike yo kujya Huye ni angahe?'
  ]);
  const [model, setModel] = useState('');
  const [listening, setListening] = useState(false);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    api
      .aiStatus()
      .then((status) => {
        if (!active) return;
        setSuggestions(status.suggestions || suggestions);
        setModel(status.chatModel || '');
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending, open]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop?.();
    };
  }, []);

  async function send(text) {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: message }]);
    setSending(true);
    try {
      const result = await api.chat(message);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: result.reply,
          meta: result.model,
          source: result.source,
          options: result.options || []
        }
      ]);
      if (result.suggestions) setSuggestions(result.suggestions);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Sorry, I could not reach the assistant (${error.message}). Please try again.`,
          error: true
        }
      ]);
    } finally {
      setSending(false);
    }
  }

  function toggleMic() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Voice input is not supported in this browser. Please type your question instead.',
          error: true
        }
      ]);
      return;
    }

    if (listening) {
      recognitionRef.current?.stop?.();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'rw-RW';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="no-print fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-white shadow-soft transition hover:scale-105 hover:bg-brand-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-300"
        aria-label={open ? 'Close assistant' : 'Open NyabuGo assistant'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
        )}
      </button>

      {open && (
        <div className="no-print fixed bottom-24 right-4 z-50 flex max-h-[calc(100vh-7rem)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center gap-3 bg-gradient-to-br from-brand-700 to-brand-600 px-4 py-3.5 text-white">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15">
              <Bot className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">NyabuGo Assistant</p>
              <p className="truncate text-[11px] text-white/70">
                {model ? `HF · ${model}` : 'Kinyarwanda & English support'}
              </p>
            </div>
            <span className="pill bg-white/15 text-[10px] text-white">
              <Sparkles className="h-3 w-3" /> AI
            </span>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    message.role === 'user'
                      ? 'rounded-br-sm bg-brand-600 text-white'
                      : message.error
                        ? 'rounded-bl-sm border border-rose-200 bg-rose-50 text-rose-700'
                        : 'rounded-bl-sm border border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  {message.text}

                  {message.options?.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      {message.options.slice(0, 3).map((option) => (
                        <Link
                          key={option.busId}
                          to={`/book/${option.busId}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center justify-between gap-2 rounded-lg border border-brand-100 bg-brand-50/70 px-2.5 py-2 text-[11px] font-semibold text-brand-800 transition hover:border-brand-300 hover:bg-brand-50"
                        >
                          <span>
                            {option.company} · {formatTime(option.departureAt)} · {option.seatsAvailable} seats
                          </span>
                          <span className="flex items-center gap-1 text-brand-700">
                            {formatRwf(option.price, { compact: true })}
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {message.meta && (
                    <span className="mt-1.5 block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      {message.source === 'huggingface-nllb' ? 'Hugging Face' : 'Local NLU'} · {message.meta}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  NyabuGo is typing…
                </div>
              </div>
            )}
          </div>

          {suggestions.length > 0 && !sending && (
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto border-t border-slate-100 bg-white px-3 py-2">
              {suggestions.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="shrink-0 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
            className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-3"
          >
            <button
              type="button"
              onClick={toggleMic}
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition ${
                listening
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-700'
              }`}
              aria-label="Voice input"
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Andika ikibazo… / Type a question…"
              className="input h-9 rounded-full py-1.5 text-[13px]"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
