import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import TruthDetector from '@/components/features/TruthDetector';

const TruthDetectorPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isAuthenticated] = useState(true);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="font-cinzel text-umurage-gold text-2xl font-bold mb-3">Sign In Required</h2>
        <p className="text-umurage-muted text-sm mb-6 text-center max-w-sm">Sign in to use the Truth Detector AI.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield size={24} className="text-umurage-gold" />
          <h1 className="font-cinzel text-3xl text-umurage-gold font-bold">Truth Detector AI</h1>
        </div>
        <p className="text-umurage-muted text-base">
          AI-powered analysis to detect whether content is related to Rwandan culture.
          Paste or type content below to check its cultural relevance.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="umurage-card rounded-2xl p-5 space-y-4">
          <h3 className="text-umurage-cream font-semibold text-sm">Content to Analyze</h3>
          <div>
            <label className="text-umurage-muted text-xs font-medium block mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Traditional Rwandan Dance Performance"
              className="w-full bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60 transition-colors"
            />
          </div>
          <div>
            <label className="text-umurage-muted text-xs font-medium block mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the content..."
              rows={3}
              className="w-full bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60 transition-colors resize-none leading-relaxed"
            />
          </div>
          <div>
            <label className="text-umurage-muted text-xs font-medium block mb-1.5">Content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Paste the full text content to analyze..."
              rows={5}
              className="w-full bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60 transition-colors resize-none leading-relaxed"
            />
          </div>
          <div>
            <label className="text-umurage-muted text-xs font-medium block mb-1.5">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="e.g. Intore, Dance, Traditions, Kigali"
              className="w-full bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60 transition-colors"
            />
          </div>
        </div>

        <TruthDetector title={title} description={description} tags={tags.split(',').map(t => t.trim()).filter(Boolean)} content={content} />
      </div>
    </div>
  );
};

export default TruthDetectorPage;