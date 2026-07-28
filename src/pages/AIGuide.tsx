import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, RefreshCw, Loader2, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { AI_SUGGESTED_QUESTIONS, AI_RESPONSES } from '@/data/mockData';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  time: string;
}

function findBestResponse(query: string): string {
  const lower = query.toLowerCase();
  const keywords: Record<string, string[]> = {
    umuganura: ['umuganura', 'first fruits', 'harvest festival', 'umuganura festival', 'celebrate harvest', 'give thanks'],
    inyambo: ['inyambo', 'cattle', 'long-horned', 'royal cattle', 'sacred animal', 'pastoral'],
    intore: ['intore', 'dance', 'warrior dance', 'traditional dance', 'umheto', 'ikinyabuge', 'indirimbo'],
    imigongo: ['imigongo', 'geometric art', 'cow dung', 'eastern province', 'akagera', 'pattern', 'craft'],
    kalinga: ['kalinga', 'drum', 'royal drum', 'sacred drum', 'kingdom of rwanda'],
    kingdom: ['kingdom', 'mwami', 'royal', 'monarchy', 'rubanzi ndoli'],
    wedding: ['wedding', 'traditional wedding', 'marriage', 'bride', 'groom', 'ceremony'],
    ubwuzu: ['ubwuzu', 'meaning', 'concept', 'philosophy'],
    umubyeyi: ['umubyeyi', 'meaning', 'word', 'language'],
  };

  for (const [key, terms] of Object.entries(keywords)) {
    if (terms.some(term => lower.includes(term))) {
      return AI_RESPONSES[key] || AI_RESPONSES.default;
    }
  }

  return AI_RESPONSES.default;
}

const AIGuide: React.FC = () => {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: "Muraho neza! I am the Umurage Hub AI Cultural Guide. 🇷🇼\n\nI am powered by advanced AI to help you explore Rwanda's rich cultural heritage — history, traditions, ceremonies, language, arts, and much more.\n\nAsk me anything in **English**, **Kinyarwanda**, or **French**. I will provide culturally accurate, educational responses drawn from Rwanda's living heritage.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const generateResponse = useCallback((userText: string, history: Message[]) => {
    const lower = userText.toLowerCase();

    if (lower.includes('umuganura') || lower.includes('first fruits') || lower.includes('harvest') || lower.includes('festival of the first fruits')) {
      return AI_RESPONSES.umuganura;
    }
    if (lower.includes('inyambo') || lower.includes('cattle') || lower.includes('long-horned') || lower.includes('royal cow')) {
      return AI_RESPONSES.inyambo;
    }
    if (lower.includes('intore') || lower.includes('dance of heroes') || lower.includes('warrior dance') || lower.includes('traditional dance')) {
      return AI_RESPONSES.intore;
    }
    if (lower.includes('imigongo') || lower.includes('geometric art') || lower.includes('cow dung') || lower.includes('geometric pattern')) {
      return AI_RESPONSES.imigongo;
    }
    if (lower.includes('kalinga') || lower.includes('drum') || lower.includes('royal drum') || lower.includes('sacred drum')) {
      return AI_RESPONSES.kalinga;
    }
    if (lower.includes('kingdom') || lower.includes('mwami') || lower.includes('monarchy') || lower.includes('royal court') || lower.includes('rubanzi')) {
      return AI_RESPONSES.kingdom;
    }
    if (lower.includes('wedding') || lower.includes('marriage') || lower.includes('gusaba') || lower.includes('traditional wedding') || lower.includes('gukwa')) {
      return AI_RESPONSES.gusaba;
    }
    if (lower.includes('kwita izina') || lower.includes('gorilla naming') || lower.includes('naming ceremony') || lower.includes('baby gorilla')) {
      return AI_RESPONSES.kwitaizina;
    }
    if (lower.includes('ubwuzu') || lower.includes('communal harmony') || lower.includes('shared prosperity')) {
      return AI_RESPONSES.ubwuzu;
    }
    if (lower.includes('umubyeyi') || lower.includes('ancestor') || lower.includes('lineage') || lower.includes('parent')) {
      return AI_RESPONSES.umubyeyi;
    }
    if (lower.includes('rcha') || lower.includes('rwanda cultural heritage') || lower.includes('cultural heritage academy') || lower.includes('inteko y\'umuco')) {
      return AI_RESPONSES.rcha;
    }

    return findBestResponse(userText);
  }, []);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const history = [...messages, userMsg].slice(-10);

    try {
      const aiContent = generateResponse(msg, history);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: aiContent,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI error:', err);
      toast.error('Failed to get AI response');
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: AI_RESPONSES.default,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const reset = () => {
    setMessages([{
      id: `welcome-${Date.now()}`,
      role: 'ai',
      content: "Muraho! New conversation started. 🇷🇼\n\nAsk me anything about Rwandan culture, history, language, or traditions!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  };

  const formatContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={i}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="text-umurage-gold font-semibold">{part.slice(2, -2)}</strong>;
            }
            return <span key={j}>{part}</span>;
          })}
          {i < lines.length - 1 && <br />}
        </span>
      );
    });
  };

  const SUGGESTED = AI_SUGGESTED_QUESTIONS.slice(0, 6);

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-umurage-gold/30 to-umurage-gold/10 border border-umurage-gold/40 flex items-center justify-center">
              <Sparkles size={16} className="text-umurage-gold" />
            </div>
            <h1 className="font-cinzel text-2xl text-umurage-gold font-bold">{t('ai.title')}</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-900/40 text-green-300 border border-green-800/40 font-semibold">LIVE AI</span>
          </div>
          <p className="text-umurage-muted text-sm ml-10">{t('ai.subtitle')}</p>
        </div>
        <button onClick={reset} className="flex items-center gap-1.5 btn-outline-gold text-xs py-2 px-3">
          <RefreshCw size={13} />
          New Chat
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 flex-shrink-0 scrollbar-hide">
        {SUGGESTED.map((q, i) => (
          <button
            key={i}
            onClick={() => sendMessage(q)}
            disabled={isTyping}
            className="flex-shrink-0 text-xs px-3 py-2 rounded-lg border border-umurage-border text-umurage-muted hover:border-umurage-gold/40 hover:text-umurage-gold transition-all duration-200 bg-umurage-card disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 mb-4 pr-1">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {msg.role === 'ai' ? (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-umurage-gold/30 to-umurage-gold/10 border border-umurage-gold/40 flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles size={15} className="text-umurage-gold" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-umurage-card border border-umurage-border flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-umurage-gold">{(user?.name || 'U')[0].toUpperCase()}</span>
                )}
              </div>
            )}

            <div className={`max-w-[78%] flex flex-col ${msg.role === 'user' ? 'items-end' : ''}`}>
              {msg.role === 'ai' && (
                <span className="text-umurage-gold/70 text-[10px] font-semibold mb-1 ml-1">Umurage AI Guide</span>
              )}
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-umurage-gold/15 border border-umurage-gold/25 text-umurage-cream rounded-tr-sm'
                    : 'bg-umurage-card border border-umurage-border text-umurage-cream rounded-tl-sm'
                }`}
              >
                {formatContent(msg.content)}
              </div>
              <span className="text-umurage-subtle text-[10px] mt-1 px-1">{msg.time}</span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-umurage-gold/30 to-umurage-gold/10 border border-umurage-gold/40 flex items-center justify-center flex-shrink-0">
              <Sparkles size={15} className="text-umurage-gold" />
            </div>
            <div className="flex flex-col">
              <span className="text-umurage-gold/70 text-[10px] font-semibold mb-1 ml-1">Umurage AI Guide</span>
              <div className="bg-umurage-card border border-umurage-border px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1.5 items-center h-4">
                  <div className="w-2 h-2 rounded-full bg-umurage-gold/70 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-umurage-gold/70 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-umurage-gold/70 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex-shrink-0">
        <div className="flex gap-3 bg-umurage-card border border-umurage-border rounded-2xl p-3 focus-within:border-umurage-gold/40 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={t('ai.placeholder')}
            rows={2}
            className="flex-1 bg-transparent text-umurage-cream placeholder-umurage-subtle text-sm focus:outline-none resize-none leading-relaxed"
          />
          <div className="flex flex-col justify-end">
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 rounded-xl bg-umurage-gold flex items-center justify-center disabled:opacity-40 hover:bg-umurage-gold-light transition-colors flex-shrink-0"
            >
              {isTyping ? <Loader2 size={16} className="text-umurage-bg animate-spin" /> : <Send size={16} className="text-umurage-bg" />}
            </button>
          </div>
        </div>
        <p className="text-umurage-subtle text-[10px] text-center mt-2">
          Powered by OnSpace AI · Responses based on verified cultural sources · Consult elders for official guidance
        </p>
      </div>
    </div>
  );
};

export default AIGuide;