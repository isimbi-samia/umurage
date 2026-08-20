import { CulturalSound } from '@/data/culturalSounds';
import { RwandanCulturalMusic } from '@/data/rwandaCulturalMusic';

export interface SoundMeta {
  id?: string;
  title: string;
  artist: string;
  url: string;
  muteOriginalAudio?: boolean;
}

export function formatSoundMetaTag(sound: CulturalSound | RwandanCulturalMusic | SoundMeta, muteOriginalAudio: boolean = false): string {
  const audioUrl = (sound as RwandanCulturalMusic).audio_url || (sound as CulturalSound).audio_url || (sound as SoundMeta).url;
  const meta: SoundMeta = {
    id: sound.id,
    title: sound.title,
    artist: sound.artist,
    url: audioUrl,
    muteOriginalAudio,
  };
  return `__sound:${JSON.stringify(meta)}`;
}

export function extractSoundFromTags(tags: string[] | undefined): { sound: SoundMeta | null; cleanTags: string[] } {
  if (!tags || tags.length === 0) return { sound: null, cleanTags: [] };
  let sound: SoundMeta | null = null;
  const cleanTags: string[] = [];

  for (const tag of tags) {
    if (tag.startsWith('__sound:')) {
      try {
        const jsonStr = tag.replace('__sound:', '');
        sound = JSON.parse(jsonStr);
      } catch {
        // Ignore JSON parse errors
      }
    } else {
      cleanTags.push(tag);
    }
  }

  return { sound, cleanTags };
}

export function formatStoryCaptionWithSound(caption: string | undefined | null, sound: CulturalSound | RwandanCulturalMusic | SoundMeta | null, muteOriginalAudio: boolean = false): string {
  const baseCaption = (caption || '').trim();
  if (!sound) return baseCaption;

  const audioUrl = (sound as RwandanCulturalMusic).audio_url || (sound as CulturalSound).audio_url || (sound as SoundMeta).url;
  const meta: SoundMeta = {
    id: sound.id,
    title: sound.title,
    artist: sound.artist,
    url: audioUrl,
    muteOriginalAudio,
  };

  return `${baseCaption} __sound:${JSON.stringify(meta)}`.trim();
}

export function extractSoundFromCaption(rawCaption: string | undefined | null): { cleanCaption: string; sound: SoundMeta | null } {
  if (!rawCaption) return { cleanCaption: '', sound: null };

  const match = rawCaption.match(/__sound:(\{.*\})/);
  if (!match) return { cleanCaption: rawCaption, sound: null };

  let sound: SoundMeta | null = null;
  try {
    sound = JSON.parse(match[1]);
  } catch {
    // Ignore JSON parse errors
  }

  const cleanCaption = rawCaption.replace(/__sound:\{.*\}/, '').trim();
  return { cleanCaption, sound };
}
