export interface Track {
  id: number;
  title: string;
  artist: { id: number; name: string };
  album: { id: number; title: string; cover: string; cover_small: string; cover_medium: string; cover_big: string; cover_xl: string };
  duration: number;
  preview: string;
  youtubeId?: string;
  source?: 'youtube' | 'audius' | 'deezer' | 'itunes';
}

export type AudioQuality = 'low' | 'mid' | 'high';

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  queue: Track[];
  queueIndex: number;
  volume: number;
  progress: number;
  duration: number;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  playbackSpeed: number;
  crossfade: boolean;
  showEqualizer: boolean;
  showSoundEffects: boolean;
  nowPlayingView: 'artwork' | 'lyrics';
  audioQuality: AudioQuality;
  downloadFormat: 'mp3' | 'wav' | 'aac';
  equalizer: {
    bass32: number; bass64: number; bass125: number; lowMid250: number; mid500: number;
    mid1k: number; mid2k: number; high4k: number; high8k: number; high16k: number;
    preset: string; mode: 'normal' | 'headphone' | 'speaker';
  };
  soundEffects: { reverb: number; bassBoost: number; surround3D: number; vocalBoost: number; nightMode: boolean };
  recentlyPlayed: Track[];
}
