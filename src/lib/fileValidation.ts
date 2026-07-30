export type FileCategory = 'video' | 'image' | 'audio' | 'document' | 'book' | 'article' | 'story';

export interface FileValidationResult {
  valid: boolean;
  category: FileCategory | null;
  mimeType: string | null;
  extension: string | null;
  sizeMB: number;
  error: string | null;
  needsConversion: boolean;
}

export interface FileTypeConfig {
  category: FileCategory;
  mimeTypes: string[];
  extensions: string[];
  signatures: number[][];
  maxMB: number;
  description: string;
}

export const FILE_TYPE_CONFIGS: FileTypeConfig[] = [
  {
    category: 'video',
    mimeTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v', 'video/x-msvideo', 'video/x-matroska', 'video/avi', 'video/mkv'],
    extensions: ['mp4', 'mov', 'webm', 'm4v', 'avi', 'mkv', 'flv', 'wmv', 'mpeg', 'mpg'],
    signatures: [
      [0x00, 0x00, 0x00], // ftyp box
      [0x66, 0x74, 0x79, 0x70], // ftyp
    ],
    maxMB: 500,
    description: 'Videos (MP4, MOV, WebM, AVI, MKV)',
  },
  {
    category: 'audio',
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm', 'audio/x-wav', 'audio/flac', 'audio/aac'],
    extensions: ['mp3', 'wav', 'ogg', 'm4a', 'webm', 'flac', 'aac', 'wma'],
    signatures: [
      [0xFF, 0xFB], // MP3
      [0xFF, 0xF3], // MP3
      [0xFF, 0xF2], // MP3
      [0x49, 0x44, 0x33], // ID3
      [0x52, 0x49, 0x46, 0x46], // RIFF (WAV)
      [0x4F, 0x67, 0x67, 0x53], // OGG
    ],
    maxMB: 30,
    description: 'Audio files (MP3, WAV, OGG, M4A, FLAC)',
  },
  {
    category: 'image',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif', 'image/bmp'],
    extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif', 'bmp', 'ico', 'tiff', 'tif'],
    signatures: [
      [0xFF, 0xD8, 0xFF], // JPEG
      [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], // PNG
      [0x47, 0x49, 0x46, 0x38], // GIF
      [0x52, 0x49, 0x46, 0x46], // RIFF (WebP)
      [0x3C, 0x3F, 0x78, 0x6D, 0x6C], // SVG XML declaration
    ],
    maxMB: 10,
    description: 'Images (JPG, PNG, WebP, GIF, SVG)',
  },
  {
    category: 'document',
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/html',
      'application/rtf',
      'application/epub+zip',
    ],
    extensions: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'rtf', 'html', 'htm', 'epub', 'odt', 'ods', 'odp'],
    signatures: [
      [0x25, 0x50, 0x44, 0x46], // PDF
      [0x50, 0x4B, 0x03, 0x04], // ZIP (DOCX/XLSX/PPTX)
      [0xD0, 0xCF, 0x11, 0xE0], // Old Office (DOC/XLS/PPT)
    ],
    maxMB: 200,
    description: 'Documents (PDF, Word, PowerPoint, Excel, Text)',
  },
  {
    category: 'book',
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/epub+zip',
      'application/rtf',
      'text/plain',
      'text/html',
    ],
    extensions: ['pdf', 'doc', 'docx', 'epub', 'rtf', 'txt', 'html', 'htm', 'odt'],
    signatures: [
      [0x25, 0x50, 0x44, 0x46], // PDF
      [0x50, 0x4B, 0x03, 0x04], // EPUB/ZIP
      [0xD0, 0xCF, 0x11, 0xE0], // Old formats
    ],
    maxMB: 200,
    description: 'Books and long-form documents',
  },
];

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export function getFileNameWithoutExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.slice(0, -1).join('.') : filename;
}

export function detectCategoryFromMime(mimeType: string): FileCategory | null {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf' || mimeType.startsWith('application/vnd.openxmlformats') || mimeType.startsWith('application/vnd.ms-') || mimeType.startsWith('text/') || mimeType === 'application/rtf' || mimeType === 'application/epub+zip') {
    return 'document';
  }
  return null;
}

export function detectCategoryFromExtension(ext: string): FileCategory | null {
  const videoExts = ['mp4', 'mov', 'webm', 'm4v', 'avi', 'mkv', 'flv', 'wmv', 'mpeg', 'mpg'];
  const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma'];
  const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif', 'bmp', 'ico', 'tiff', 'tif'];
  const docExts = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'rtf', 'html', 'htm', 'epub', 'odt', 'ods', 'odp'];
  const bookExts = ['pdf', 'doc', 'docx', 'epub', 'rtf', 'txt', 'html', 'htm', 'odt'];

  if (videoExts.includes(ext)) return 'video';
  if (audioExts.includes(ext)) return 'audio';
  if (imageExts.includes(ext)) return 'image';
  if (docExts.includes(ext)) return 'document';
  if (bookExts.includes(ext)) return 'book';
  return null;
}

async function readFileSignature(file: File, byteCount: number = 16): Promise<number[]> {
  const slice = file.slice(0, byteCount);
  const buffer = await slice.arrayBuffer();
  return Array.from(new Uint8Array(buffer));
}

function matchesSignature(signature: number[], fileSig: number[]): boolean {
  if (fileSig.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (signature[i] !== 0xFF && signature[i] !== fileSig[i]) return false;
  }
  return true;
}

function findConfigForCategory(category: FileCategory): FileTypeConfig | undefined {
  return FILE_TYPE_CONFIGS.find(c => c.category === category);
}

export async function validateUploadFile(
  file: File,
  expectedCategory: FileCategory,
  customMaxMB?: number
): Promise<FileValidationResult> {
  const ext = getFileExtension(file.name);
  const sizeMB = file.size / (1024 * 1024);
  const mimeType = file.type || 'application/octet-stream';
  
  const config = findConfigForCategory(expectedCategory);
  if (!config) {
    return {
      valid: false,
      category: null,
      mimeType,
      extension: ext,
      sizeMB,
      error: `Unsupported content category: ${expectedCategory}`,
      needsConversion: false,
    };
  }

  const maxMB = customMaxMB ?? config.maxMB;
  if (maxMB > 0 && sizeMB > maxMB) {
    return {
      valid: false,
      category: expectedCategory,
      mimeType,
      extension: ext,
      sizeMB,
      error: `File is too large (${sizeMB.toFixed(1)}MB). Maximum size for ${config.description} is ${maxMB}MB.`,
      needsConversion: false,
    };
  }

  const extAccepted = config.extensions.includes(ext) || (expectedCategory === 'article' && ext === '');
  if (!extAccepted && ext) {
    return {
      valid: false,
      category: expectedCategory,
      mimeType,
      extension: ext,
      sizeMB,
      error: `File extension ".${ext}" is not supported for ${config.description}. Allowed extensions: ${config.extensions.join(', ')}`,
      needsConversion: false,
    };
  }

  const mimeAccepted = config.mimeTypes.includes(mimeType) || mimeType === 'application/octet-stream';
  if (!mimeAccepted && !extAccepted) {
    return {
      valid: false,
      category: expectedCategory,
      mimeType,
      extension: ext,
      sizeMB,
      error: `File type "${mimeType}" is not supported for ${config.description}.`,
      needsConversion: false,
    };
  }

  let needsConversion = false;
  if (expectedCategory === 'video') {
    const movAccepted = config.extensions.includes('mov') && mimeType === 'video/quicktime';
    const allowed = config.mimeTypes.includes(mimeType) || movAccepted;
    if (!allowed && ext !== 'mov') {
      needsConversion = true;
    }
  }

  let signatureValid = true;
  let signatureError: string | null = null;
  if (config.signatures.length > 0 && ext) {
    try {
      const fileSig = await readFileSignature(file, 16);
      const matched = config.signatures.some(sig => matchesSignature(sig, fileSig));
      if (!matched) {
        if (ext === 'mov' || ext === 'mkv' || ext === 'flv' || ext === 'wmv') {
          signatureValid = false;
          signatureError = `This file does not appear to be a valid ${ext.toUpperCase()} file. The file contents do not match the expected format.`;
        } else if (expectedCategory === 'document' && ext === 'pdf') {
          signatureValid = false;
          signatureError = 'This file does not appear to be a valid PDF document.';
        } else if (expectedCategory === 'image' && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
          signatureValid = false;
          signatureError = `This file does not appear to be a valid ${ext.toUpperCase()} image.`;
        }
      }
    } catch {
      // Signature read failed, continue with MIME/ext validation only
    }
  }

  const error = signatureError || (mimeType === 'application/octet-stream' && extAccepted 
    ? null 
    : !mimeAccepted && !needsConversion 
      ? `File type "${mimeType}" may be incorrect for this format. We will still attempt to process it.`
      : null);

  return {
    valid: signatureValid && (mimeAccepted || extAccepted || expectedCategory === 'article'),
    category: expectedCategory,
    mimeType,
    extension: ext,
    sizeMB,
    error: signatureError,
    needsConversion: !!signatureError && !signatureValid ? false : needsConversion,
  };
}

export async function detectFileCategory(file: File): Promise<{ category: FileCategory; mimeType: string; extension: string } | null> {
  const ext = getFileExtension(file.name);
  const mimeType = file.type || 'application/octet-stream';

  const fromMime = detectCategoryFromMime(mimeType);
  if (fromMime) return { category: fromMime, mimeType, extension: ext };

  const fromExt = detectCategoryFromExtension(ext);
  if (fromExt) return { category: fromExt, mimeType, extension: ext };

  try {
    const sig = await readFileSignature(file, 16);
    if (matchesSignature([0xFF, 0xD8, 0xFF], sig)) return { category: 'image', mimeType: 'image/jpeg', extension: ext };
    if (matchesSignature([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], sig)) return { category: 'image', mimeType: 'image/png', extension: ext };
    if (matchesSignature([0x47, 0x49, 0x46, 0x38], sig)) return { category: 'image', mimeType: 'image/gif', extension: ext };
    if (matchesSignature([0x25, 0x50, 0x44, 0x46], sig)) return { category: 'document', mimeType: 'application/pdf', extension: ext };
    if (matchesSignature([0x50, 0x4B, 0x03, 0x04], sig)) return { category: 'document', mimeType: 'application/zip', extension: ext || 'zip' };
    if (matchesSignature([0xFF, 0xFB], sig) || matchesSignature([0xFF, 0xF3], sig) || matchesSignature([0xFF, 0xF2], sig) || matchesSignature([0x49, 0x44, 0x33], sig)) {
      return { category: 'audio', mimeType: 'audio/mpeg', extension: ext || 'mp3' };
    }
    if (matchesSignature([0x52, 0x49, 0x46, 0x46], sig)) {
      if (ext === 'webp') return { category: 'image', mimeType: 'image/webp', extension: ext };
      return { category: 'audio', mimeType: 'audio/wav', extension: ext || 'wav' };
    }
    if (matchesSignature([0x4F, 0x67, 0x67, 0x53], sig)) return { category: 'audio', mimeType: 'audio/ogg', extension: ext || 'ogg' };
    if (matchesSignature([0x1A, 0x45, 0xDF, 0xA3], sig)) return { category: 'video', mimeType: 'video/webm', extension: ext || 'webm' };
    if (matchesSignature([0x00, 0x00, 0x00], sig.slice(0, 3))) {
      if (ext === 'mov') return { category: 'video', mimeType: 'video/quicktime', extension: ext };
      if (ext === 'mp4' || ext === 'm4v') return { category: 'video', mimeType: 'video/mp4', extension: ext };
    }
  } catch {
    // Ignore detection errors
  }

  return null;
}

export function getUserFriendlyValidationMessage(result: FileValidationResult, filename: string): string {
  if (result.valid && !result.error && !result.needsConversion) {
    return '';
  }
  if (result.needsConversion) {
    return `This video format is supported but needs conversion to ensure universal playback. Processing your video automatically...`;
  }
  if (result.error) {
    if (result.error.includes('incorrect') || result.error.includes('does not appear to be valid')) {
      return `${result.error} Please check the file and try again, or try a different file.`;
    }
    if (result.error.includes('too large')) {
      return `${result.error} Try compressing your file or splitting it into smaller parts.`;
    }
    if (result.error.includes('extension') || result.error.includes('not supported')) {
      return `${result.error} Supported formats for this content type: ${findConfigForCategory(result.category!)?.extensions.join(', ')}`;
    }
    return result.error;
  }
  return '';
}
