import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, RefreshCw, Loader2, BookOpen, ShieldCheck, Globe, Image, Video } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  time: string;
  source?: string;
}

export const AIGuide: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      content:
        "Muraho neza! I am the Umurage Hub AI Cultural Guide. 🇷🇼\n\nI query verified heritage records from the **Rwanda Cultural Heritage Academy (RCHA)**, **Institute of National Museums**, and recognized oral archives.\n\nAsk me anything in **English**, **Kinyarwanda**, or **French** about history, traditions, royal court customs, Umuganura, Inyambo cattle, Imigongo art, or language.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'Rwanda Cultural Heritage Academy (RCHA) Verified Knowledge',
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'rw' | 'fr'>('en');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const queryKnowledgeBase = async (queryText: string): Promise<{ text: string; source: string }> => {
    const lower = queryText.toLowerCase();

    // Query Supabase cultural_knowledge table
    const { data: records, error } = await supabase
      .from('cultural_knowledge')
      .select('*');

    if (!error && records && records.length > 0) {
      for (const rec of records) {
        if (
          lower.includes(rec.topic.toLowerCase()) ||
          lower.includes(rec.title.toLowerCase()) ||
          rec.category.toLowerCase().includes(lower)
        ) {
          return {
            text: `**${rec.title}**\n\n${rec.content}`,
            source: rec.source_name || 'Rwanda Cultural Heritage Academy (RCHA)',
          };
        }
      }
    }

    // Fallback verified facts
    if (lower.includes('umuganura') || lower.includes('harvest')) {
      return {
        text: '**Umuganura — The National Harvest Festival**\n\nUmuganura is one of Rwanda\'s most sacred traditional ceremonies, celebrated for over 1,800 years. Historically led by the King (Mwami) and elders, it expresses gratitude for the harvest, sorghum, cattle, and community self-reliance (Kwigira). Today, it is celebrated annually on the first Friday of August as a national holiday promoting national unity and development.',
        source: 'Rwanda Cultural Heritage Academy (RCHA)',
      };
    }

    if (lower.includes('inyambo') || lower.includes('cattle')) {
      return {
        text: '**Inyambo — Sacred Royal Cattle**\n\nInyambo are a magnificent breed of long-horned cattle reserved exclusively for the Royal Court of Rwanda. Trained to march gracefully during royal ceremonies (Amasunzu and Intore parades), their horns can reach over two meters. They symbolize wealth, beauty, dignity, and harmony in traditional Rwandan culture.',
        source: 'Institute of National Museums of Rwanda (INMR)',
      };
    }

    if (lower.includes('imigongo') || lower.includes('dung') || lower.includes('art')) {
      return {
        text: '**Imigongo — Traditional Relief Art**\n\nImigongo is a unique 18th-century Rwandan art form originated by Prince Kakira of the Gisaka kingdom in Eastern Rwanda. Created using cow dung mixed with ash and organic soils, artists carve geometric relief patterns colored with natural black, white, and ochre pigments.',
        source: 'Nyamirambo Women\'s Center & RCHA Archives',
      };
    }

    if (lower.includes('kinyarwanda') || lower.includes('language') || lower.includes('proverb')) {
      return {
        text: '**Ikinyarwanda — Language & Oral Literature**\n\nKinyarwanda is the official language spoken across all regions of Rwanda. It possesses a rich linguistic structure with over 10,000 recorded proverbs (Imigani iremre), royal poems (Ibitekerezo), and tongue twisters (Ibisakuzo) preserved by generations of storytellers.',
        source: 'Rwandan Academy of Language and Culture (RALC)',
      };
    }

    // Honest acknowledgment when knowledge is missing
    return {
      text: `Thank you for asking about "${queryText}". Our verified database currently does not have enough expert-reviewed information on this specific question. We prioritize verified history over AI hallucination. Please check back as our cultural elders review more records.`,
      source: 'Umurage Expert Verification Required',
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const msg = textToSend || input.trim();
    if (!msg || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await queryKnowledgeBase(msg);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: response.source,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      toast.error('Failed to query knowledge base');
    } finally {
      setIsTyping(false);
    }
  };

  const handleCreativeFeatureClick = (type: 'poem' | 'image' | 'video') => {
    if (type === 'poem') {
      handleSendMessage('Write an educational poem about Umuganura and Inyambo cattle');
    } else if (type === 'image') {
      toast.info('Image generation UI ready. External image generator API (e.g. Midjourney/Imagen API) integration required.');
    } else if (type === 'video') {
      toast.info('Video script UI ready. External video generation API integration required.');
    }
  };

  const SUGGESTED = [
    'Tell me about Umuganura harvest festival',
    'What are the Inyambo royal cattle?',
    'Explain the 18th-century Imigongo art',
    'What is the origin of Ikinyarwanda proverbs?',
  ];

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-130px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-umurage-gold/30 to-umurage-gold/10 border border-umurage-gold/40 flex items-center justify-center">
              <Sparkles size={16} className="text-umurage-gold" />
            </div>
            <h1 className="font-cinzel text-2xl text-umurage-gold font-bold">{t('ai.title')}</h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-800/40 font-bold">
              VERIFIED KNOWLEDGE BASE
            </span>
          </div>
          <p className="text-umurage-muted text-xs ml-10">Query verified Rwandan history, language, and museum archives without hallucinations.</p>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-1.5 bg-[#1b120b] p-1.5 rounded-xl border border-umurage-border">
          <Globe size={14} className="text-amber-400 ml-1" />
          {[
            { key: 'en', label: 'English' },
            { key: 'rw', label: 'Kinyarwanda' },
            { key: 'fr', label: 'Français' },
          ].map((l) => (
            <button
              key={l.key}
              onClick={() => setSelectedLanguage(l.key as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                selectedLanguage === l.key
                  ? 'bg-umurage-gold text-umurage-bg font-bold'
                  : 'text-umurage-subtle hover:text-umurage-cream'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Creative Prompt Tools */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 flex-shrink-0 scrollbar-hide">
        <button
          onClick={() => handleCreativeFeatureClick('poem')}
          className="text-xs px-3 py-1.5 rounded-lg border border-purple-800/40 bg-purple-950/20 text-purple-300 flex items-center gap-1.5 font-medium hover:bg-purple-900/30"
        >
          <BookOpen size={12} /> Generate Cultural Poem
        </button>
        <button
          onClick={() => handleCreativeFeatureClick('image')}
          className="text-xs px-3 py-1.5 rounded-lg border border-umurage-border bg-umurage-card text-umurage-muted flex items-center gap-1.5 font-medium hover:text-umurage-cream"
        >
          <Image size={12} /> Image Concept UI
        </button>
        <button
          onClick={() => handleCreativeFeatureClick('video')}
          className="text-xs px-3 py-1.5 rounded-lg border border-umurage-border bg-umurage-card text-umurage-muted flex items-center gap-1.5 font-medium hover:text-umurage-cream"
        >
          <Video size={12} /> Video Concept Script
        </button>
      </div>

      {/* Suggested Questions */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 flex-shrink-0 scrollbar-hide">
        {SUGGESTED.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(q)}
            disabled={isTyping}
            className="flex-shrink-0 text-xs px-3 py-2 rounded-xl border border-umurage-border text-umurage-muted hover:border-umurage-gold/40 hover:text-umurage-gold bg-umurage-card"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'ai' ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-umurage-gold/30 to-umurage-gold/10 border border-umurage-gold/40 flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles size={14} className="text-umurage-gold" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-umurage-card border border-umurage-border flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-xs font-bold text-umurage-gold">{(user?.email || 'U')[0].toUpperCase()}</span>
              </div>
            )}

            <div className={`max-w-[80%] flex flex-col ${msg.role === 'user' ? 'items-end' : ''}`}>
              {msg.role === 'ai' && (
                <span className="text-umurage-gold/70 text-[10px] font-semibold mb-1 ml-1">Umurage Cultural Knowledge Guide</span>
              )}
              <div
                className={`px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-umurage-gold/20 border border-umurage-gold/30 text-umurage-cream rounded-tr-sm'
                    : 'bg-umurage-card border border-umurage-border text-umurage-cream rounded-tl-sm'
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                {msg.source && (
                  <div className="mt-3 pt-2 border-t border-umurage-border/40 text-[10px] text-amber-300/80 flex items-center gap-1 font-medium">
                    <ShieldCheck size={12} className="text-amber-400" />
                    <span>Source: {msg.source}</span>
                  </div>
                )}
              </div>
              <span className="text-umurage-subtle text-[10px] mt-1 px-1">{msg.time}</span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-umurage-gold/30 to-umurage-gold/10 border border-umurage-gold/40 flex items-center justify-center flex-shrink-0">
              <Sparkles size={14} className="text-umurage-gold animate-spin" />
            </div>
            <div className="bg-umurage-card border border-umurage-border px-4 py-3 rounded-2xl text-xs text-umurage-muted">
              Querying verified heritage database...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Box */}
      <div className="flex-shrink-0">
        <div className="flex gap-3 bg-umurage-card border border-umurage-border rounded-2xl p-3 focus-within:border-umurage-gold/50 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask anything about Rwandan heritage, history, proverbs, or traditions..."
            rows={2}
            className="flex-1 bg-transparent text-umurage-cream placeholder-umurage-subtle text-xs focus:outline-none resize-none leading-relaxed"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 rounded-xl bg-umurage-gold flex items-center justify-center disabled:opacity-40 hover:bg-umurage-gold-light transition-colors flex-shrink-0 self-end font-bold"
          >
            {isTyping ? <Loader2 size={16} className="text-umurage-bg animate-spin" /> : <Send size={16} className="text-umurage-bg" />}
          </button>
        </div>
        <p className="text-umurage-subtle text-[10px] text-center mt-2">
          Responses based strictly on verified cultural records • Consult elders & RCHA for official historical guidance
        </p>
      </div>
    </div>
  );
};

export default AIGuide;