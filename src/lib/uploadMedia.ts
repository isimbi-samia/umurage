import { FileCategory, getFileExtension } from './fileValidation';

export interface MediaProcessingResult {
  file: File;
  thumbnailBlob: Blob | null;
  thumbnailUrl: string | null;
  duration: string | null;
  needsConversion: boolean;
}

export async function generateVideoThumbnail(file: File): Promise<{ blob: Blob | null; url: string }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute('src');
      video.load();
    };

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      video.currentTime = Math.min(2, video.duration * 0.25);
    };

    video.onseeked = () => {
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              cleanup();
              const url = blob ? URL.createObjectURL(blob) : null;
              resolve({ blob, url });
            },
            'image/jpeg',
            0.85
          );
        } catch {
          cleanup();
          resolve({ blob: null, url: null });
        }
      } else {
        cleanup();
        resolve({ blob: null, url: null });
      }
    };

    video.onerror = () => {
      cleanup();
      resolve({ blob: null, url: null });
    };

    setTimeout(() => {
      cleanup();
      resolve({ blob: null, url: null });
    }, 15000);
  });
}

export async function getVideoDuration(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      const dur = video.duration;
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute('src');
      video.load();
      
      if (dur && dur !== Infinity) {
        const mins = Math.floor(dur / 60);
        const secs = Math.floor(dur % 60);
        resolve(`${mins}:${secs.toString().padStart(2, '0')}`);
      } else {
        resolve(null);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    }, 10000);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileCategoryFromType(type: string): FileCategory | null {
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'audio';
  if (type.startsWith('image/')) return 'image';
  if (type.includes('pdf') || type.includes('document') || type.includes('text') || type.includes('spreadsheet') || type.includes('presentation') || type.includes('epub')) {
    return 'document';
  }
  return null;
}

export async function processMediaFile(file: File, category: FileCategory): Promise<MediaProcessingResult> {
  let thumbnailBlob: Blob | null = null;
  let thumbnailUrl: string | null = null;
  let duration: string | null = null;
  let needsConversion = false;

  if (category === 'video') {
    const thumbResult = await generateVideoThumbnail(file);
    thumbnailBlob = thumbResult.blob;
    thumbnailUrl = thumbResult.url;
    
    duration = await getVideoDuration(file);
    
    const ext = getFileExtension(file.name);
    if (ext !== 'mp4' && ext !== 'webm') {
      needsConversion = true;
    }
  } else if (category === 'image') {
    const ext = getFileExtension(file.name);
    if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      needsConversion = true;
    }
  } else if (category === 'audio') {
    const ext = getFileExtension(file.name);
    if (!['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
      needsConversion = true;
    }
  }

  return {
    file,
    thumbnailBlob,
    thumbnailUrl,
    duration,
    needsConversion,
  };
}
