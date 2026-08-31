import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RefreshCw, Upload, Image as ImageIcon, X, Loader2, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadMediaToStorage } from '@/lib/uploadMedia';
import { toast } from 'sonner';

interface AudioRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DEFAULT_ARTWORK = [
  'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1516307365426-bea591f05011?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1547153760-18fc86324498?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
];

export const AudioRecorderModal: React.FC<AudioRecorderModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);

  // Metadata states
  const [title, setTitle] = useState('');
  const [storyteller, setStoryteller] = useState('');
  const [description, setDescription] = useState('');
  const [region, setRegion] = useState('Southern Province');
  const [topic, setTopic] = useState('Oral History');
  const [language, setLanguage] = useState('Kinyarwanda');
  const [visibility, setVisibility] = useState<'public' | 'restricted' | 'private'>('restricted');
  const [hasConsent, setHasConsent] = useState(false);
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>(DEFAULT_ARTWORK[0]);
  const [customThumbnailFile, setCustomThumbnailFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopMediaStream = () => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => track.stop());
      activeStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      stopMediaStream();
    };
  }, [audioUrl]);

  if (!isOpen) return null;

  const startTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const requestAndStartRecording = async () => {
    setPermissionError(null);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionError('Microphone audio recording is not supported by your browser. Please try Chrome, Firefox, Edge, or Safari.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      activeStreamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stopMediaStream();
      };

      mediaRecorder.start(1000);
      setRecordingState('recording');
      setTimerSeconds(0);
      startTimer();
    } catch (err: any) {
      console.error('Microphone access error:', err);
      stopMediaStream();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Microphone permission denied. Please allow microphone access in your browser settings to record oral history.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionError('No microphone detected on your device. Please plug in a microphone and try again.');
      } else {
        setPermissionError(`Microphone error: ${err.message || 'Unable to access audio recording device.'}`);
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      stopTimer();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      startTimer();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (recordingState === 'recording' || recordingState === 'paused')) {
      mediaRecorderRef.current.stop();
      setRecordingState('stopped');
      stopTimer();
      stopMediaStream();
    }
  };

  const resetRecording = () => {
    stopTimer();
    stopMediaStream();
    setRecordingState('idle');
    setTimerSeconds(0);
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
  };

  const handleClose = () => {
    resetRecording();
    onClose();
  };

  const togglePreviewPlayback = () => {
    if (!previewAudioRef.current || !audioUrl) return;
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

  const handleUploadAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be signed in to upload oral history recordings.');
      return;
    }
    if (!audioBlob) {
      toast.error('Please record audio before submitting.');
      return;
    }
    if (!title.trim()) {
      toast.error('Please provide a title for the recording.');
      return;
    }
    if (!hasConsent) {
      toast.error('Please confirm cultural & personal consent before publishing.');
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload audio file to Supabase audio bucket
      const audioFileName = `oral_history_${user.id}_${Date.now()}.webm`;
      const audioFile = new File([audioBlob], audioFileName, { type: 'audio/webm' });
      const audioUploadRes = await uploadMediaToStorage(audioFile, 'audio', user.id, 'oral_histories');

      // 2. Upload thumbnail if custom, else use selectedThumbnail
      let finalThumbnailUrl = selectedThumbnail;
      if (customThumbnailFile) {
        const thumbRes = await uploadMediaToStorage(customThumbnailFile, 'image', user.id, 'thumbnails');
        finalThumbnailUrl = thumbRes.url;
      }

      // 3. Insert record into heritage_recordings
      const durationStr = formatTimer(timerSeconds);
      const { data: insertedRec, error: dbError } = await supabase
        .from('heritage_recordings')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          audio_url: audioUploadRes.url,
          duration: durationStr,
          storyteller_name: storyteller.trim() || user.user_metadata?.full_name || 'Elder Storyteller',
          elder_name: storyteller.trim() || undefined,
          region,
          language,
          category: topic,
          media_type: 'audio',
          tags: [topic.toLowerCase(), 'oral-history'],
        })
        .select('id')
        .single();

      if (dbError) throw dbError;

      // 4. Also create a post for public/restricted discovery if visibility is public or restricted
      await supabase.from('posts').insert({
        user_id: user.id,
        type: 'audio',
        title: title.trim(),
        description: description.trim(),
        media_url: audioUploadRes.url,
        thumbnail_url: finalThumbnailUrl,
        duration: durationStr,
        category: topic,
        region,
        published: visibility === 'public',
      });

      // 5. Asynchronous Gemini Transcription & Cultural Analysis
      // Check audio size (8MB limit for inline Base64 transport)
      if (audioBlob.size <= 8 * 1024 * 1024) {
        try {
          const audioBase64 = await blobToBase64(audioBlob);
          const { data: aiData, error: aiError } = await supabase.functions.invoke('transcribe-heritage', {
            body: {
              title: title.trim(),
              description: description.trim(),
              category: topic,
              language,
              elder_name: storyteller.trim(),
              audio_base64: audioBase64,
              audio_mime: 'audio/webm',
            },
          });

          if (!aiError && aiData && aiData.status === 'success') {
            await supabase
              .from('heritage_recordings')
              .update({
                transcript: aiData.transcript || null,
                ai_translation: aiData.translation || null,
                tags: Array.isArray(aiData.tags) && aiData.tags.length > 0 ? aiData.tags : [topic.toLowerCase(), 'oral-history'],
              })
              .eq('id', insertedRec.id)
              .eq('user_id', user.id);
          }
        } catch (aiErr) {
          console.warn('AI transcription notice:', aiErr);
          // Recording is already safely saved in DB!
        }
      } else {
        toast.info('Recording saved! Audio file exceeds 8MB inline size limit for automated AI transcription.');
      }

      toast.success('Oral History recording successfully preserved!');
      resetRecording();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Recording upload error:', err);
      toast.error(err.message || 'Failed to save recording. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#18110a] border border-[#5c3c1e] p-6 z-10 animate-fade-in text-umurage-cream">
        <button onClick={handleClose} className="absolute top-4 right-4 text-umurage-subtle hover:text-umurage-cream">
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-700/50 flex items-center justify-center">
            <Mic size={20} className="text-purple-400" />
          </div>
          <div>
            <h2 className="font-cinzel text-xl text-umurage-gold font-bold">Record & Preserve Oral History</h2>
            <p className="text-umurage-muted text-xs">Record elder narratives, ancient folklore, and community traditions.</p>
          </div>
        </div>

        {/* Permission Error */}
        {permissionError && (
          <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-800/50 flex items-start gap-3 text-red-200 text-sm">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Microphone Access Needed</p>
              <p className="text-xs leading-relaxed text-red-300">{permissionError}</p>
            </div>
          </div>
        )}

        {/* Recording Studio Section */}
        <div className="mb-6 p-5 rounded-2xl bg-[#22160d] border border-[#4a2e16] text-center">
          <div className="text-3xl font-mono font-bold text-umurage-gold mb-3">{formatTimer(timerSeconds)}</div>

          {recordingState === 'idle' && (
            <button
              onClick={requestAndStartRecording}
              className="btn-gold px-6 py-3 rounded-full flex items-center gap-2 mx-auto font-semibold shadow-lg hover:scale-105 transition-transform"
            >
              <Mic size={18} />
              Start Recording
            </button>
          )}

          {recordingState === 'recording' && (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={pauseRecording}
                className="w-12 h-12 rounded-full bg-amber-900/50 border border-amber-700/60 text-amber-300 flex items-center justify-center hover:bg-amber-800/60 transition-colors"
              >
                <Pause size={20} />
              </button>
              <button
                onClick={stopRecording}
                className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-500 transition-colors animate-pulse"
              >
                <Square size={22} />
              </button>
            </div>
          )}

          {recordingState === 'paused' && (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={resumeRecording}
                className="w-12 h-12 rounded-full bg-green-900/50 border border-green-700/60 text-green-300 flex items-center justify-center hover:bg-green-800/60 transition-colors"
              >
                <Play size={20} />
              </button>
              <button
                onClick={stopRecording}
                className="w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg hover:bg-red-500 transition-colors"
              >
                <Square size={22} />
              </button>
            </div>
          )}

          {recordingState === 'stopped' && audioUrl && (
            <div className="space-y-3">
              <audio
                ref={previewAudioRef}
                src={audioUrl}
                onEnded={() => setIsPlayingPreview(false)}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={togglePreviewPlayback}
                  className="btn-gold px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold"
                >
                  {isPlayingPreview ? <Pause size={16} /> : <Play size={16} />}
                  {isPlayingPreview ? 'Pause Preview' : 'Listen Preview'}
                </button>
                <button
                  onClick={resetRecording}
                  className="px-4 py-2.5 rounded-xl border border-umurage-border text-umurage-muted hover:text-umurage-cream text-sm flex items-center gap-1.5"
                >
                  <RefreshCw size={14} /> Re-record
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Metadata Form */}
        <form onSubmit={handleUploadAndSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-umurage-muted block mb-1">Recording Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Royal Inyambo Traditions of Nyanza"
                className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3.5 py-2.5 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-umurage-muted block mb-1">Storyteller / Elder Name</label>
              <input
                type="text"
                value={storyteller}
                onChange={(e) => setStoryteller(e.target.value)}
                placeholder="e.g. Elder Nyirabageni Vestine"
                className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3.5 py-2.5 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-umurage-muted block mb-1">Description & Cultural Background</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the story, history, rituals, or clan origin..."
              rows={3}
              className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3.5 py-2.5 text-sm text-umurage-cream placeholder-umurage-subtle focus:outline-none focus:border-umurage-gold/60 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-umurage-muted block mb-1">Region / Location</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-xs text-umurage-cream"
              >
                <option value="Southern Province">Southern Province (Nyanza/Huye)</option>
                <option value="Northern Province">Northern Province (Musanze/Gicumbi)</option>
                <option value="Eastern Province">Eastern Province (Gatsibo/Rwamagana)</option>
                <option value="Western Province">Western Province (Rubavu/Karongi)</option>
                <option value="Kigali City">Kigali City</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-umurage-muted block mb-1">Cultural Topic</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-xs text-umurage-cream"
              >
                <option value="Oral History">Oral History</option>
                <option value="Royal Court">Royal Court</option>
                <option value="Traditions">Traditions</option>
                <option value="Music">Music & Chants</option>
                <option value="Folklore">Folklore & Myths</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-umurage-muted block mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-[#24170e] border border-[#4a2e16] rounded-xl px-3 py-2 text-xs text-umurage-cream"
              >
                <option value="Kinyarwanda">Kinyarwanda</option>
                <option value="English">English</option>
                <option value="French">French</option>
              </select>
            </div>
          </div>

          {/* Thumbnail Selection */}
          <div>
            <label className="text-xs font-semibold text-umurage-muted block mb-2">Choose Audio Thumbnail Cover</label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {DEFAULT_ARTWORK.map((imgUrl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setSelectedThumbnail(imgUrl);
                    setCustomThumbnailFile(null);
                  }}
                  className={`relative rounded-lg overflow-hidden border-2 h-16 transition-all ${
                    selectedThumbnail === imgUrl && !customThumbnailFile ? 'border-umurage-gold scale-95' : 'border-transparent opacity-60'
                  }`}
                >
                  <img src={imgUrl} alt={`Thumbnail ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-xs font-semibold text-umurage-gold flex items-center gap-1.5 hover:underline">
                <ImageIcon size={14} /> Upload Custom Cover
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCustomThumbnailFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {customThumbnailFile && (
                <span className="text-[11px] text-green-400 truncate">Selected: {customThumbnailFile.name}</span>
              )}
            </div>
          </div>

          {/* Privacy & Cultural Consent */}
          <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/30 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-purple-300 font-semibold">
              <Shield size={14} /> Cultural Privacy & Permission Rules
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'restricted', label: 'Restricted (Community Only)' },
                { key: 'public', label: 'Public' },
                { key: 'private', label: 'Private (Vault Only)' },
              ].map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setVisibility(v.key as any)}
                  className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all ${
                    visibility === v.key
                      ? 'bg-purple-900/40 text-purple-200 border-purple-600'
                      : 'bg-black/30 border-purple-900/40 text-umurage-subtle'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={hasConsent}
                onChange={(e) => setHasConsent(e.target.checked)}
                className="rounded border-purple-800 text-umurage-gold focus:ring-0"
              />
              <span className="text-umurage-cream text-[11px]">
                I confirm that I have explicit consent from the storyteller/elder to preserve this audio recording on Umurage Hub.
              </span>
            </label>
          </div>

          {/* Submit Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-umurage-border rounded-xl text-sm text-umurage-muted hover:text-umurage-cream"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !audioBlob || !hasConsent}
              className="flex-1 btn-gold py-3 text-sm flex items-center justify-center gap-2 font-bold disabled:opacity-50"
            >
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Upload & Preserve
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
