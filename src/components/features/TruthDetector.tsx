import React, { useState } from 'react';
import { Shield, AlertCircle, CheckCircle, Loader2, Search, XCircle, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface TruthResult {
  is_culturally_relevant: boolean;
  confidence: number;
  score: number;
  cultural_topics: string[];
  flagged: boolean;
  reason: string;
  rwandan_keywords_found: string[];
  non_cultural_indicators: string[];
  summary: string;
}

interface TruthDetectorProps {
  title: string;
  description: string;
  tags: string[];
  content?: string;
}

const TruthDetector: React.FC<TruthDetectorProps> = ({ title, description, tags, content }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<TruthResult | null>(null);

  const analyze = async () => {
    if (!title && !description && !content) {
      toast.error('Add a title or description first to analyze');
      return;
    }
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('truth-detector', {
        body: {
          title: title || '',
          description: description || '',
          content: content || '',
          tags: tags || [],
        },
      });
      if (error) throw error;
      setResult(data as TruthResult);
      toast.success('Cultural relevance analysis complete');
    } catch (err) {
      console.error('Truth detector error:', err);
      toast.error('Failed to analyze content');
    } finally {
      setAnalyzing(false);
    }
  };

  if (!result) {
    return (
      <div className="umurage-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Shield size={18} className="text-umurage-gold" />
          <h3 className="text-umurage-cream font-semibold text-sm">Truth Detector</h3>
        </div>
        <p className="text-umurage-muted text-xs mb-4 leading-relaxed">
          AI-powered analysis to detect whether this content is related to Rwandan culture.
          This helps maintain the integrity of Umurage Hub's cultural heritage focus.
        </p>
        <button
          type="button"
          onClick={analyze}
          disabled={analyzing}
          className="btn-gold w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {analyzing ? 'Analyzing...' : 'Run Truth Detector'}
        </button>
      </div>
    );
  }

  return (
    <div className="umurage-card rounded-2xl p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={18} className="text-umurage-gold" />
        <h3 className="text-umurage-cream font-semibold text-sm">Truth Detector Results</h3>
        {result.flagged && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 border border-red-800/40 font-semibold flex items-center gap-1">
            <AlertCircle size={10} /> FLAGGED
          </span>
        )}
        {!result.flagged && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-green-900/30 text-green-400 border border-green-800/40 font-semibold flex items-center gap-1">
            <CheckCircle size={10} /> APPROVED
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-umurage-surface border border-umurage-border rounded-xl p-3 text-center">
          <p className="text-umurage-subtle text-[10px] uppercase tracking-wider mb-1">Relevance Score</p>
          <p className={`text-2xl font-bold ${result.is_culturally_relevant ? 'text-green-400' : 'text-red-400'}`}>
            {result.score}%
          </p>
        </div>
        <div className="bg-umurage-surface border border-umurage-border rounded-xl p-3 text-center">
          <p className="text-umurage-subtle text-[10px] uppercase tracking-wider mb-1">Confidence</p>
          <p className="text-2xl font-bold text-umurage-gold">{result.confidence}%</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-umurage-surface border border-umurage-border rounded-xl p-3">
          <p className="text-umurage-subtle text-[10px] uppercase tracking-wider mb-1">Assessment</p>
          <p className="text-umurage-cream text-sm leading-relaxed">{result.reason}</p>
        </div>

        {result.rwandan_keywords_found.length > 0 && (
          <div>
            <p className="text-umurage-subtle text-[10px] uppercase tracking-wider mb-1.5">Cultural Keywords Found</p>
            <div className="flex flex-wrap gap-1.5">
              {result.rwandan_keywords_found.map(kw => (
                <span key={kw} className="text-[10px] px-2 py-0.5 rounded-full bg-green-900/20 text-green-400 border border-green-800/30">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {result.cultural_topics.length > 0 && (
          <div>
            <p className="text-umurage-subtle text-[10px] uppercase tracking-wider mb-1.5">Cultural Topics</p>
            <div className="flex flex-wrap gap-1.5">
              {result.cultural_topics.map(topic => (
                <span key={topic} className="text-[10px] px-2 py-0.5 rounded-full bg-umurage-gold/10 text-umurage-gold border border-umurage-gold/20">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {result.non_cultural_indicators.length > 0 && (
          <div>
            <p className="text-umurage-subtle text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <XCircle size={10} className="text-red-400" /> Non-Cultural Indicators
            </p>
            <div className="flex flex-wrap gap-1.5">
              {result.non_cultural_indicators.map(ind => (
                <span key={ind} className="text-[10px] px-2 py-0.5 rounded-full bg-red-900/20 text-red-400 border border-red-800/30">
                  {ind}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 mt-4 p-3 bg-umurage-gold/5 border border-umurage-gold/20 rounded-xl">
        <Info size={14} className="text-umurage-gold flex-shrink-0 mt-0.5" />
        <p className="text-umurage-subtle text-xs leading-relaxed">{result.summary}</p>
      </div>
    </div>
  );
};

export default TruthDetector;