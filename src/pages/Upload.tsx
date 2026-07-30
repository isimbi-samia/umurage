import React, { useState, useRef, useCallback } from 'react';
import {
  Upload as UploadIcon, X, Image, Video, Mic, BookOpen, FileText,
  Loader2, CheckCircle, CloudUpload, Play, Pause, ZoomIn, AlertCircle, Shield, XCircle, Info, Radio
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatePost } from '@/hooks/usePosts';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const CONTENT_TYPES = [
  { value: 'video', label: 'Video', icon: Video, desc: 'Traditional dances, ceremonies, documentaries, and long-form cultural videos', accept: 'video/*', maxMB: 500 },
  { value: 'audio', label: 'Audio', icon: Mic, desc: 'Oral histories, elder interviews, traditional songs', accept: 'audio/*', maxMB: 30 },
  { value: 'image', label: 'Image', icon: Image, desc: 'Art, clothing, artifacts, cultural events', accept: 'image/*', maxMB: 10 },
  { value: 'book', label: 'Book / PDF', icon: BookOpen, desc: 'Research papers, history books, articles, and long-form documents', accept: '.pdf,.doc,.docx', maxMB: 200 },
  { value: 'article', label: 'Article', icon: FileText, desc: 'Written stories, research, proverbs, lessons', accept: '', maxMB: 0 },
  { value: 'story', label: 'Story', icon: Radio, desc: '24-hour cultural stories that appear in the Stories feed', accept: 'video/*', maxMB: 100 },
];

const CATEGORIES = ['History', 'Traditions', 'Arts & Music', 'Language', 'Oral Heritage', 'Ceremonies', 'Nature & Land', 'Education', 'Dance', 'General'];
const REGIONS = ['Kigali City', 'Northern Province', 'Southern Province', 'Eastern Province', 'Western Province', 'All Rwanda'];

// Compress image using Canvas API
async function compressImage(file: File, maxWidthPx = 1920, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxWidthPx) {
        height = Math.round((height * maxWidthPx) / width);
        width = maxWidthPx;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
          // Only use compressed if smaller
          resolve(compressed.size < file.size ? compressed : file);
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file); };
    img.src = objectUrl;
  });
}

const Upload: React.FC = () => {
  const { user, isAuthenticated, openAuth } = useAuth();
  const navigate = useNavigate();
  const createPost = useCreatePost();
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbnailRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const [type, setType] = useState('video');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('History');
  const [region, setRegion] = useState('Kigali City');
  const [tags, setTags] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [truthDetected, setTruthDetected] = useState<boolean | null>(null);
  const [truthScore, setTruthScore] = useState<number | null>(null);
  const [truthFlagged, setTruthFlagged] = useState(false);
  const [truthAnalyzing, setTruthAnalyzing] = useState(false);
  const [truthResult, setTruthResult] = useState<any>(null);

  const selectedType = CONTENT_TYPES.find(t => t.value === type)!;

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="font-cinzel text-umurage-gold text-2xl font-bold mb-3">Sign In Required</h2>
        <p className="text-umurage-muted text-sm mb-6 text-center max-w-sm">You need to be signed in to upload cultural content to Umurage Hub.</p>
        <button onClick={() => openAuth('login')} className="btn-gold px-8 py-3">Sign In</button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-umurage-gold/20 border border-umurage-gold/40 flex items-center justify-center mb-5">
          <CheckCircle size={40} className="text-umurage-gold" />
        </div>
        <h2 className="font-cinzel text-umurage-gold text-2xl font-bold mb-3">Content Published!</h2>
        <p className="text-umurage-muted text-sm text-center max-w-sm mb-6">Your cultural content is now live on Umurage Hub for all to discover.</p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/')} className="btn-gold px-6 py-2.5">View Feed</button>
          <button onClick={() => { setSuccess(false); setTitle(''); setDescription(''); setMediaFile(null); setThumbnailFile(null); setThumbnailPreview(''); setMediaPreviewUrl(''); setUploadProgress(0); setTags(''); setTruthDetected(null); setTruthScore(null); setTruthFlagged(false); setTruthResult(null); }} className="btn-outline-gold px-6 py-2.5">Upload Another</button>
        </div>
      </div>
    );
  }

  const handleThumbnail = async (file: File) => {
    setCompressing(true);
    const compressed = await compressImage(file, 1280, 0.85);
    setThumbnailFile(compressed);
    setThumbnailPreview(URL.createObjectURL(compressed));
    setCompressing(false);
    const savedKB = Math.round((file.size - compressed.size) / 1024);
    if (savedKB > 10) toast.success(`Image compressed — saved ${savedKB}KB`);
  };

  const handleMediaFile = async (file: File) => {
    const maxBytes = selectedType.maxMB * 1024 * 1024;
    if (selectedType.maxMB > 0 && file.size > maxBytes) {
      toast.error(`File too large. Max ${selectedType.maxMB}MB for ${selectedType.label}`);
      return;
    }
    if (file.type.startsWith('image/')) {
      setCompressing(true);
      const compressed = await compressImage(file, 1920, 0.82);
      setMediaFile(compressed);
      setMediaPreviewUrl(URL.createObjectURL(compressed));
      setCompressing(false);
    } else {
      setMediaFile(file);
      if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        setMediaPreviewUrl(URL.createObjectURL(file));
      }
    }
  };

  // Drag & Drop
  const onDragEnter = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); }, []);
  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    // Detect type from file
    if (file.type.startsWith('image/')) {
      if (type === 'image' || type === 'video' || type === 'audio') {
        await handleMediaFile(file);
      } else {
        await handleThumbnail(file);
      }
    } else if (file.type.startsWith('video/')) {
      setType('video');
      await handleMediaFile(file);
    } else if (file.type.startsWith('audio/')) {
      setType('audio');
      await handleMediaFile(file);
    } else {
      await handleMediaFile(file);
    }
  }, [type]);

  const uploadFile = async (file: File, folder: string, onProgress?: (pct: number) => void): Promise<string> => {
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${user!.id}/${folder}/${Date.now()}.${ext}`;

    // Use fetch with blob for progress tracking
    const { error } = await supabase.storage.from('umurage-media').upload(path, file, {
      upsert: false,
      contentType: file.type,
    });
    if (error) throw error;
    onProgress?.(100);
    const { data } = supabase.storage.from('umurage-media').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Please add a title'); return; }
    if (!user) return;

    // Step 1: Run truth detector BEFORE publishing
    setTruthAnalyzing(true);
    let truthResultData: any = null;
    try {
      const { data: truthData, error: truthError } = await supabase.functions.invoke('truth-detector', {
        body: {
          title: title.trim(),
          description: description.trim() || '',
          tags: tags.split(',').map((t: string) => t.trim()).filter(Boolean),
          content: description.trim() || '',
        },
      });
      if (truthError) throw truthError;
      truthResultData = truthData;
      setTruthResult(truthData);
      setTruthDetected(truthData.is_culturally_relevant);
      setTruthScore(truthData.score);
      setTruthFlagged(truthData.flagged);
    } catch (err) {
      console.error('Truth detector error:', err);
      toast.error('Truth analysis failed. Please try again.');
      setTruthAnalyzing(false);
      return;
    }
    setTruthAnalyzing(false);

    // Step 2: If not culturally relevant, STOP the upload
    if (truthResultData && !truthResultData.is_culturally_relevant) {
      toast.error('Content rejected: This does not appear to be related to Rwandan culture. Please upload cultural content only.');
      return;
    }

    // Step 3: Proceed with upload
    setUploading(true);
    setUploadProgress(0);

    try {
      let mediaUrl: string | undefined;
      let thumbnailUrl: string | undefined;

      if (thumbnailFile) {
        setUploadProgress(10);
        thumbnailUrl = await uploadFile(thumbnailFile, 'thumbnails', (p) => setUploadProgress(10 + p * 0.3));
        setUploadProgress(40);
      }

      if (mediaFile) {
        setUploadProgress(50);
        mediaUrl = await uploadFile(mediaFile, 'media', (p) => setUploadProgress(50 + p * 0.4));
        setUploadProgress(90);
      }

      setUploadProgress(95);
      await createPost.mutateAsync({
        user_id: user.id,
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        thumbnail_url: thumbnailUrl,
        media_url: mediaUrl,
        category,
        region,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        truth_score: truthResultData?.score ?? null,
        cultural_relevance: truthResultData?.is_culturally_relevant ?? null,
        cultural_topics: truthResultData?.cultural_topics ?? null,
        flagged: truthResultData?.flagged ?? null,
        truth_analysis: truthResultData?.reason ?? null,
        analyzed_at: new Date().toISOString(),
        analyzed_by: user.id,
        story_expires_at: type === 'story' ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() : null,
      });

      setUploadProgress(100);
      setSuccess(true);
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Upload failed');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const inputClass = "w-full bg-umurage-surface border border-umurage-border rounded-xl px-4 py-3 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60 transition-colors";

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <UploadIcon size={24} className="text-umurage-gold" />
          <h1 className="font-cinzel text-3xl text-umurage-gold font-bold">Share Cultural Content</h1>
        </div>
        <p className="text-umurage-muted text-base">Contribute to preserving Rwanda's rich cultural heritage for future generations.</p>
      </div>

      {/* Cultural Content Notice */}
      <div className="mb-5 rounded-xl border border-umurage-gold/30 bg-umurage-gold/5 p-4 flex items-start gap-3">
        <Shield size={18} className="text-umurage-gold flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-umurage-gold-light text-xs font-semibold">Cultural Content Only</p>
          <p className="text-umurage-subtle text-[11px] mt-0.5">All uploads are analyzed by our Truth Detector AI. Content not related to Rwandan culture will be blocked before publishing.</p>
        </div>
      </div>

      {/* Content type picker */}
      <div className="umurage-card rounded-2xl p-5 mb-5">
        <h3 className="text-umurage-cream font-semibold text-sm mb-3">Content Type</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {CONTENT_TYPES.map(ct => {
            const Icon = ct.icon;
            return (
              <button
                key={ct.value}
                type="button"
                onClick={() => { setType(ct.value); setMediaFile(null); setMediaPreviewUrl(''); }}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all duration-200 ${
                  type === ct.value
                    ? 'border-umurage-gold bg-umurage-gold/10 text-umurage-gold'
                    : 'border-umurage-border text-umurage-muted hover:border-umurage-gold/40 hover:text-umurage-cream'
                }`}
              >
                <Icon size={18} />
                <span className="text-[11px] font-semibold leading-tight">{ct.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-umurage-subtle text-xs mt-2.5 flex items-center gap-1.5">
          <AlertCircle size={11} /> {selectedType.desc}
          {selectedType.maxMB > 0 && ` · Max ${selectedType.maxMB}MB`}
        </p>
      </div>

      {/* Drag & Drop Zone for media */}
      {type !== 'article' && (
        <div
          ref={dropRef}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={e => e.preventDefault()}
          onDrop={onDrop}
          className={`umurage-card rounded-2xl p-5 mb-5 transition-all duration-200 ${isDragOver ? 'border-umurage-gold bg-umurage-gold/5' : ''}`}
        >
          <h3 className="text-umurage-cream font-semibold text-sm mb-3">{selectedType.label} File</h3>

          {compressing && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 size={18} className="text-umurage-gold animate-spin" />
              <span className="text-umurage-muted text-sm">Compressing image...</span>
            </div>
          )}

          {!compressing && mediaFile ? (
            <div className="space-y-3">
              {/* Preview */}
              {mediaPreviewUrl && type === 'video' && (
                <div className="rounded-xl overflow-hidden bg-black">
                  <video src={mediaPreviewUrl} controls className="w-full max-h-48 object-contain" />
                </div>
              )}
              {mediaPreviewUrl && type === 'audio' && (
                <div className="rounded-xl bg-umurage-surface border border-umurage-border p-3">
                  <audio src={mediaPreviewUrl} controls className="w-full" />
                </div>
              )}
              {mediaPreviewUrl && type === 'image' && (
                <div className="rounded-xl overflow-hidden relative group">
                  <img src={mediaPreviewUrl} alt="Preview" className="w-full max-h-52 object-cover" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn size={24} className="text-white" />
                  </div>
                </div>
              )}

              {/* File info */}
              <div className="flex items-center gap-3 p-3 bg-umurage-surface border border-umurage-gold/30 rounded-xl">
                <selectedType.icon size={18} className="text-umurage-gold flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-umurage-cream text-sm font-medium truncate">{mediaFile.name}</p>
                  <p className="text-umurage-subtle text-xs">{(mediaFile.size / 1024 / 1024).toFixed(2)} MB · Ready to upload</p>
                </div>
                <button type="button" onClick={() => { setMediaFile(null); setMediaPreviewUrl(''); }} className="text-umurage-subtle hover:text-red-400 transition-colors p-1">
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : !compressing ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 py-10 transition-all cursor-pointer ${
                isDragOver ? 'border-umurage-gold bg-umurage-gold/5' : 'border-umurage-border hover:border-umurage-gold/50 hover:bg-umurage-surface/50'
              }`}
            >
              <CloudUpload size={32} className={isDragOver ? 'text-umurage-gold' : 'text-umurage-subtle'} />
              <div className="text-center">
                <p className="text-umurage-cream text-sm font-medium">
                  {isDragOver ? 'Drop to upload' : `Upload ${selectedType.label}`}
                </p>
                <p className="text-umurage-subtle text-xs mt-1">
                  Drag & drop here or <span className="text-umurage-gold underline cursor-pointer">browse</span>
                </p>
                {selectedType.maxMB > 0 && (
                  <p className="text-umurage-subtle text-[10px] mt-1">Max {selectedType.maxMB}MB</p>
                )}
              </div>
            </button>
          ) : null}

          <input
            ref={fileRef}
            type="file"
            accept={selectedType.accept}
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleMediaFile(f); }}
          />
        </div>
      )}

      {/* Thumbnail */}
      <div className="umurage-card rounded-2xl p-5 mb-5">
        <h3 className="text-umurage-cream font-semibold text-sm mb-3">
          Cover Thumbnail
          <span className="text-umurage-subtle font-normal text-xs ml-2">(auto-compressed)</span>
        </h3>
        {thumbnailPreview ? (
          <div className="relative rounded-xl overflow-hidden mb-2 group">
            <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-44 object-cover" />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <button
              type="button"
              onClick={() => { setThumbnailFile(null); setThumbnailPreview(''); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
            >
              <X size={14} />
            </button>
            <div className="absolute bottom-2 left-2">
              <span className="text-white text-[10px] bg-black/60 px-2 py-0.5 rounded-full">
                {thumbnailFile && `${(thumbnailFile.size / 1024).toFixed(0)}KB`}
              </span>
            </div>
          </div>
        ) : compressing ? (
          <div className="flex items-center justify-center gap-2 h-32">
            <Loader2 size={18} className="text-umurage-gold animate-spin" />
            <span className="text-umurage-muted text-sm">Compressing...</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => thumbnailRef.current?.click()}
            className="w-full h-32 border-2 border-dashed border-umurage-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-umurage-gold/40 hover:bg-umurage-surface/50 transition-all cursor-pointer"
          >
            <Image size={22} className="text-umurage-subtle" />
            <span className="text-umurage-muted text-sm">Upload cover thumbnail</span>
            <span className="text-umurage-subtle text-xs">JPG, PNG, WebP — auto-compressed</span>
          </button>
        )}
        <input ref={thumbnailRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleThumbnail(f); }} />
      </div>

      {/* Metadata */}
      <form onSubmit={handleSubmit}>
        <div className="umurage-card rounded-2xl p-5 space-y-4 mb-5">
          <h3 className="text-umurage-cream font-semibold text-sm">Content Details</h3>
          <div>
            <label className="text-umurage-muted text-xs font-medium block mb-1.5">Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Traditional Intore Dance Performance" className={inputClass} required />
          </div>
          <div>
            <label className="text-umurage-muted text-xs font-medium block mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Describe the cultural significance of this content..."
              rows={3} className={`${inputClass} resize-none leading-relaxed`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={`${inputClass} cursor-pointer`}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Region</label>
              <select value={region} onChange={e => setRegion(e.target.value)} className={`${inputClass} cursor-pointer`}>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-umurage-muted text-xs font-medium block mb-1.5">Tags (comma separated)</label>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)}
              placeholder="e.g. Intore, Dance, Traditions, Kigali" className={inputClass} />
          </div>
        </div>

        {/* Progress bar */}
        {uploading && (
          <div className="umurage-card rounded-2xl p-5 mb-5 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-umurage-cream text-sm font-medium flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-umurage-gold" />
                Uploading to cultural archive...
              </span>
              <span className="text-umurage-gold text-sm font-bold">{uploadProgress}%</span>
            </div>
            <div className="h-2 bg-umurage-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-umurage-gold to-yellow-400 rounded-full transition-all duration-500"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-umurage-subtle text-xs mt-2">
              {uploadProgress < 40 ? 'Compressing and uploading thumbnail...' : uploadProgress < 90 ? 'Uploading main file...' : 'Saving to database...'}
            </p>
          </div>
        )}

        {/* Truth Detector Results after publishing */}
        {truthResult && success && (
          <div className="umurage-card rounded-2xl p-5 mb-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={18} className="text-umurage-gold" />
              <h3 className="text-umurage-cream font-semibold text-sm">Cultural Relevance Analysis</h3>
              {truthResult.flagged ? (
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 border border-red-800/40 font-semibold flex items-center gap-1">
                  <AlertCircle size={10} /> FLAGGED
                </span>
              ) : (
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-green-900/30 text-green-400 border border-green-800/40 font-semibold flex items-center gap-1">
                  <CheckCircle size={10} /> APPROVED
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-umurage-surface border border-umurage-border rounded-xl p-3 text-center">
                <p className="text-umurage-subtle text-[10px] uppercase tracking-wider mb-1">Relevance Score</p>
                <p className={`text-2xl font-bold ${truthResult.is_culturally_relevant ? 'text-green-400' : 'text-red-400'}`}>
                  {truthResult.score}%
                </p>
              </div>
              <div className="bg-umurage-surface border border-umurage-border rounded-xl p-3 text-center">
                <p className="text-umurage-subtle text-[10px] uppercase tracking-wider mb-1">Confidence</p>
                <p className="text-2xl font-bold text-umurage-gold">{truthResult.confidence}%</p>
              </div>
            </div>
            {truthResult.rwandan_keywords_found && truthResult.rwandan_keywords_found.length > 0 && (
              <div className="mb-2">
                <p className="text-umurage-subtle text-[10px] uppercase tracking-wider mb-1.5">Cultural Keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {truthResult.rwandan_keywords_found.map(kw => (
                    <span key={kw} className="text-[10px] px-2 py-0.5 rounded-full bg-green-900/20 text-green-400 border border-green-800/30">{kw}</span>
                  ))}
                </div>
              </div>
            )}
            {truthResult.non_cultural_indicators && truthResult.non_cultural_indicators.length > 0 && (
              <div className="mb-2">
                <p className="text-umurage-subtle text-[10px] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <XCircle size={10} className="text-red-400" /> Non-Cultural Indicators
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {truthResult.non_cultural_indicators.map(ind => (
                    <span key={ind} className="text-[10px] px-2 py-0.5 rounded-full bg-red-900/20 text-red-400 border border-red-800/30">{ind}</span>
                  ))}
                </div>
              </div>
            )}
            {truthResult.cultural_topics && truthResult.cultural_topics.length > 0 && (
              <div className="mb-2">
                <p className="text-umurage-subtle text-[10px] uppercase tracking-wider mb-1.5">Detected Topics</p>
                <div className="flex flex-wrap gap-1.5">
                  {truthResult.cultural_topics.map(topic => (
                    <span key={topic} className="text-[10px] px-2 py-0.5 rounded-full bg-umurage-gold/10 text-umurage-gold border border-umurage-gold/20">{topic}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-start gap-2 p-3 bg-umurage-gold/5 border border-umurage-gold/20 rounded-xl">
              <Info size={14} className="text-umurage-gold flex-shrink-0 mt-0.5" />
              <p className="text-umurage-subtle text-xs leading-relaxed">{truthResult.reason}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !title.trim()}
          className="btn-gold w-full py-4 text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <UploadIcon size={18} />}
          {uploading ? 'Publishing...' : 'Publish to Umurage Hub'}
        </button>
      </form>
    </div>
  );
};

export default Upload;
