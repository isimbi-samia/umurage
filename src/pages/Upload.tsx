import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload as UploadIcon, X, Image, Video, Mic, BookOpen, FileText, Radio,
  Loader2, CheckCircle, CloudUpload, ZoomIn, AlertCircle, Shield, Wand2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatePost } from '@/hooks/usePosts';
import { useUploadStory } from '@/hooks/useStories';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  validateUploadFile,
  detectFileCategory,
  FileCategory,
  getUserFriendlyValidationMessage,
  getFileExtension,
} from '@/lib/fileValidation';
import {
  generateVideoThumbnail,
  getVideoDuration,
  formatFileSize,
  processMediaFile,
  uploadMediaToStorage,
} from '@/lib/uploadMedia';

const CONTENT_TYPES = [
  { value: 'video', label: 'Video', icon: Video, desc: 'Traditional dances, ceremonies, documentaries, and long-form cultural videos', accept: 'video/*', maxMB: 500 },
  { value: 'image', label: 'Image', icon: Image, desc: 'Art, clothing, artifacts, cultural events', accept: 'image/*', maxMB: 10 },
  { value: 'audio', label: 'Audio', icon: Mic, desc: 'Oral histories, elder interviews, traditional songs', accept: 'audio/*', maxMB: 30 },
  { value: 'document', label: 'Document', icon: FileText, desc: 'Research papers, historical documents, archives, certificates', accept: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.rtf,.epub,.odt', maxMB: 200 },
  { value: 'book', label: 'Book / PDF', icon: BookOpen, desc: 'History books, research papers, long-form documents', accept: '.pdf,.doc,.docx,.epub,.rtf,.txt', maxMB: 200 },
  { value: 'article', label: 'Article', icon: FileText, desc: 'Written stories, research, proverbs, lessons', accept: '', maxMB: 0 },
  { value: 'story', label: 'Story', icon: Radio, desc: '24-hour cultural stories that appear in the Stories feed', accept: 'video/*', maxMB: 100 },
];

const CATEGORIES = ['History', 'Traditions', 'Arts & Music', 'Language', 'Oral Heritage', 'Ceremonies', 'Nature & Land', 'Education', 'Dance', 'General'];
const REGIONS = ['Kigali City', 'Northern Province', 'Southern Province', 'Eastern Province', 'Western Province', 'All Rwanda'];

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
  const uploadStory = useUploadStory();
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
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string; type: string } | null>(null);
  const [processingStep, setProcessingStep] = useState('');

  const selectedType = CONTENT_TYPES.find(t => t.value === type)!;

  useEffect(() => {
    return () => {
      if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [mediaPreviewUrl, thumbnailPreview]);

  const handleThumbnail = useCallback(async (file: File) => {
    setCompressing(true);
    const compressed = await compressImage(file, 1280, 0.85);
    setThumbnailFile(compressed);
    setThumbnailPreview(URL.createObjectURL(compressed));
    setCompressing(false);
    const savedKB = Math.round((file.size - compressed.size) / 1024);
    if (savedKB > 10) toast.success(`Image compressed — saved ${savedKB}KB`);
  }, []);

  const processAndSetMedia = useCallback(async (file: File, targetType: string) => {
    setValidationError(null);
    setProcessingStep('Validating file...');
    
    const category = targetType as FileCategory;
    const validation = await validateUploadFile(file, category, selectedType.maxMB);
    
    if (!validation.valid) {
      const message = getUserFriendlyValidationMessage(validation, file.name);
      setValidationError(message);
      toast.error(message || 'Invalid file. Please check the file and try again.');
      setProcessingStep('');
      return;
    }

    if (validation.needsConversion) {
      const message = getUserFriendlyValidationMessage(validation, file.name);
      setValidationError(message);
      toast.info(message);
    }

    setProcessingStep('Processing media...');
    setFileInfo({
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type || getFileExtension(file.name).toUpperCase(),
    });

    let processingResult: { thumbnailBlob: Blob | null; thumbnailUrl: string | null; duration: string | null; needsConversion: boolean };
    try {
      processingResult = await processMediaFile(file, category);
    } catch {
      processingResult = { thumbnailBlob: null, thumbnailUrl: null, duration: null, needsConversion: false };
    }

    const hasThumb = !!thumbnailPreview;

    if (processingResult.thumbnailUrl && !hasThumb) {
      setThumbnailPreview(processingResult.thumbnailUrl);
      const thumbResponse = await fetch(processingResult.thumbnailUrl);
      const thumbBlob = await thumbResponse.blob();
      const ext = getFileExtension(file.name);
      setThumbnailFile(new File([thumbBlob], file.name.replace(/\.[^.]+$/, '_thumb.jpg'), { type: 'image/jpeg' }));
    }

    if (category === 'image') {
      setCompressing(true);
      const compressed = await compressImage(file, 1920, 0.82);
      setMediaFile(compressed);
      setMediaPreviewUrl(URL.createObjectURL(compressed));
      setCompressing(false);
    } else {
      setMediaFile(file);
      if (processingResult.thumbnailUrl) {
        setMediaPreviewUrl(processingResult.thumbnailUrl);
      } else if (category === 'video' || category === 'audio' || category === 'document' || category === 'book') {
        setMediaPreviewUrl(URL.createObjectURL(file));
      }
    }

    if (processingResult.needsConversion) {
      toast.info('Video format detected. It will be processed for universal playback.');
    }

    setProcessingStep('');
  }, [selectedType.maxMB, thumbnailPreview]);

  const onDragEnter = useCallback((e: React.DragEvent) => { 
    e.preventDefault(); 
    setIsDragOver(true); 
  }, []);
  
  const onDragLeave = useCallback((e: React.DragEvent) => { 
    e.preventDefault(); 
    setIsDragOver(false); 
  }, []);
  
  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    const autoCategory = await detectFileCategory(file);
    if (autoCategory) {
      setType(autoCategory.category);
    }
    
    await processAndSetMedia(file, autoCategory?.category || type);
  }, [processAndSetMedia, type]);

  const uploadFile = useCallback(async (file: File, folder: string, category: FileCategory, onProgress?: (pct: number) => void): Promise<string> => {
    const { url } = await uploadMediaToStorage(file, category, user!.id, folder, onProgress);
    return url;
  }, [user]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Please add a title'); return; }
    if (!mediaFile && type !== 'article') { toast.error('Please select a file to upload'); return; }
    if (!user) return;

    setUploading(true);
    setUploadProgress(0);
    setValidationError(null);

    try {
      // ── Stories go to the dedicated `stories` table, never `posts` ──────
      if (type === 'story') {
        if (!mediaFile) {
          toast.error('Please select a file to upload');
          setUploading(false);
          return;
        }
        setUploadProgress(30);
        const storyType: 'image' | 'video' = mediaFile.type.startsWith('video') ? 'video' : 'image';
        await uploadStory.mutateAsync({
          file: mediaFile,
          userId: user.id,
          type: storyType,
          caption: description.trim() || title.trim() || undefined,
        });
        setUploadProgress(100);
        setUploading(false);
        setSuccess(true);
        return;
      }

      // ── Everything else goes through the normal posts flow ─────────────
      let mediaUrl: string | undefined;
      let thumbnailUrl: string | undefined;
      let duration: string | null = null;

      if (thumbnailFile) {
        setUploadProgress(10);
        thumbnailUrl = await uploadFile(thumbnailFile, 'thumbnails', 'image', (p) => setUploadProgress(10 + p * 0.3));
        setUploadProgress(40);
      }

      if (mediaFile) {
        setUploadProgress(50);
        mediaUrl = await uploadFile(mediaFile, 'media', type as FileCategory, (p) => setUploadProgress(50 + p * 0.4));
        setUploadProgress(90);
      }

      if (type === 'video' || type === 'audio') {
        const dur = await getVideoDuration(mediaFile!);
        duration = dur;
      }

      setUploadProgress(95);
      await createPost.mutateAsync({
        user_id: user.id,
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        thumbnail_url: thumbnailUrl,
        media_url: mediaUrl,
        duration,
        category,
        region,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });

      setUploadProgress(100);
      setUploading(false);
      setSuccess(true);
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Upload failed');
      setUploading(false);
      setUploadProgress(0);
    }
  }, [title, mediaFile, type, user, description, category, region, tags, thumbnailFile, uploadFile, createPost, uploadStory]);

  const inputClass = "w-full bg-[#1a110a] border border-[#2d1e13] rounded-lg px-3.5 py-2.5 text-xs text-[#f2e6d8] placeholder-[#7a6754] focus:outline-none focus:border-[#c8960c]/60 transition-colors";

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
          <button onClick={() => { setSuccess(false); setTitle(''); setDescription(''); setMediaFile(null); setThumbnailFile(null); setThumbnailPreview(''); setMediaPreviewUrl(''); setUploadProgress(0); setTags(''); setValidationError(null); setFileInfo(null); }} className="btn-outline-gold px-6 py-2.5">Upload Another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <UploadIcon size={24} className="text-umurage-gold" />
          <h1 className="font-cinzel text-3xl text-umurage-gold font-bold">Share Cultural Content</h1>
        </div>
        <p className="text-umurage-muted text-base">Contribute to preserving Rwanda's rich cultural heritage for future generations.</p>
      </div>

      <div className="mb-5 rounded-xl border border-umurage-gold/30 bg-umurage-gold/5 p-4 flex items-start gap-3">
        <Shield size={18} className="text-umurage-gold flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-umurage-gold-light text-xs font-semibold">Cultural Content Only</p>
          <p className="text-umurage-subtle text-[11px] mt-0.5">Please upload content related to Rwandan culture; non-cultural content may be removed.</p>
        </div>
      </div>

      <div className="umurage-card rounded-2xl p-5 mb-5">
        <h3 className="text-umurage-cream font-semibold text-sm mb-3">Content Type</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CONTENT_TYPES.map(ct => {
            const Icon = ct.icon;
            return (
              <button
                key={ct.value}
                type="button"
                onClick={() => { setType(ct.value); setMediaFile(null); setMediaPreviewUrl(''); setValidationError(null); setFileInfo(null); }}
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

      {validationError && (
        <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3 animate-fade-in">
          <AlertCircle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-200 text-xs font-semibold">Format Notice</p>
            <p className="text-amber-100/80 text-xs mt-0.5 leading-relaxed">{validationError}</p>
          </div>
        </div>
      )}

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

          {processingStep && !compressing && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 size={18} className="text-umurage-gold animate-spin" />
              <span className="text-umurage-muted text-sm">{processingStep}</span>
            </div>
          )}

          {compressing && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Wand2 size={18} className="text-umurage-gold animate-pulse" />
              <span className="text-umurage-muted text-sm">Optimizing image...</span>
            </div>
          )}

          {!compressing && !processingStep && mediaFile ? (
            <div className="space-y-3">
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
              {mediaPreviewUrl && (type === 'document' || type === 'book') && (
                <div className="rounded-xl border border-umurage-gold/20 bg-umurage-surface/50 p-3">
                  {mediaFile.name.toLowerCase().endsWith('.pdf') ? (
                    <iframe src={mediaPreviewUrl} title="PDF preview" className="h-56 w-full rounded-lg border border-umurage-border" />
                  ) : (
                    <div className="flex items-center gap-3 rounded-lg border border-umurage-border bg-umurage-surface px-3 py-4">
                      <FileText size={20} className="text-umurage-gold" />
                      <div>
                        <p className="text-sm font-medium text-umurage-cream">Document ready for upload</p>
                        <p className="text-xs text-umurage-subtle">Preview will appear after upload in the post detail view.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-umurage-surface border border-umurage-gold/30 rounded-xl">
                <selectedType.icon size={18} className="text-umurage-gold flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-umurage-cream text-sm font-medium truncate">{mediaFile.name}</p>
                  <p className="text-umurage-subtle text-xs">{formatFileSize(mediaFile.size)} · {fileInfo?.type || mediaFile.type || 'Ready to upload'}</p>
                </div>
                <button type="button" onClick={() => { setMediaFile(null); setMediaPreviewUrl(''); setFileInfo(null); setValidationError(null); }} className="text-umurage-subtle hover:text-red-400 transition-colors p-1">
                  <X size={16} />
                </button>
              </div>
            </div>
          ) : !compressing && !processingStep ? (
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
                <p className="text-umurage-subtle text-[11px] mt-1.5 touch-manipulation">
                  Mobile-friendly tap-to-browse support is enabled for images, videos, audio, books, and PDFs.
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
            onChange={e => { const f = e.target.files?.[0]; if (f) processAndSetMedia(f, type); }}
          />
        </div>
      )}

      <div className="umurage-card rounded-2xl p-5 mb-5">
        <h3 className="text-umurage-cream font-semibold text-sm mb-3">
          Cover Thumbnail
          <span className="text-umurage-subtle font-normal text-xs ml-2">(auto-detected or upload)</span>
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
          {type !== 'story' && (
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
          )}
          {type !== 'story' && (
            <div>
              <label className="text-umurage-muted text-xs font-medium block mb-1.5">Tags (comma separated)</label>
              <input type="text" value={tags} onChange={e => setTags(e.target.value)}
                placeholder="e.g. Intore, Dance, Traditions, Kigali" className={inputClass} />
            </div>
          )}
          {type === 'story' && (
            <p className="text-umurage-subtle text-xs flex items-center gap-1.5">
              <AlertCircle size={11} /> Category, region, and tags aren't used for Stories — your title/description above becomes the story caption.
            </p>
          )}
        </div>

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

        <button
          type="submit"
          disabled={uploading || !title.trim() || (!mediaFile && type !== 'article')}
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