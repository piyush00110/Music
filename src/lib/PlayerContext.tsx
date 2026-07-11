'use client';

import { createContext, useContext, useRef, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Track, PlayerState } from './types';
import { findOnYouTube } from './music';
import { downloadFile, getTrackDownloadUrl, getSafeFilename } from './download';

interface PlayerContextType extends PlayerState {
  play: (track: Track, queue?: Track[]) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  setVolume: (v: number) => void;
  seek: (t: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  downloadCurrentTrack: () => Promise<void>;
  downloading: boolean;
  audioError: string | null;
  setAudioQuality: (q: string) => void;
  setEqualizer: (band: string, val: number) => void;
  setSoundEffect: (effect: string, val: number | boolean) => void;
  audioContext: AudioContext | null;
  eqFilters: BiquadFilterNode[];
  masterGain: GainNode | null;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

declare global {
  interface Window { YT: any; onYouTubeIframeAPIReady: (() => void) | null; }
}

const LS_KEY = 'aurelia-player-state';

function loadSavedState(): Partial<PlayerState> {
  if (typeof window === 'undefined') return {};
  try { const s = localStorage.getItem(LS_KEY); if (s) return JSON.parse(s); } catch {}
  return {};
}

function migrateEQ(eq: any): PlayerState['equalizer'] {
  if (!eq || typeof eq !== 'object') {
    return { bass32: 0, bass64: 0, bass125: 0, lowMid250: 0, mid500: 0, mid1k: 0, mid2k: 0, high4k: 0, high8k: 0, high16k: 0, preset: 'Flat', mode: 'normal' };
  }
  if ('bass' in eq && !('bass32' in eq)) {
    const b = (eq.bass - 50) * 0.48;
    const m = (eq.mid - 50) * 0.48;
    const t = (eq.treble - 50) * 0.48;
    return { bass32: b, bass64: b, bass125: b * 0.5, lowMid250: m * 0.3, mid500: m, mid1k: m, mid2k: m * 0.3, high4k: t * 0.5, high8k: t, high16k: t, preset: eq.preset || 'Flat', mode: eq.mode || 'normal' };
  }
  return {
    bass32: eq.bass32 ?? 0, bass64: eq.bass64 ?? 0, bass125: eq.bass125 ?? 0,
    lowMid250: eq.lowMid250 ?? 0, mid500: eq.mid500 ?? 0, mid1k: eq.mid1k ?? 0,
    mid2k: eq.mid2k ?? 0, high4k: eq.high4k ?? 0, high8k: eq.high8k ?? 0,
    high16k: eq.high16k ?? 0, preset: eq.preset || 'Flat', mode: eq.mode || 'normal',
  };
}

function defaultState(): PlayerState {
  const s = loadSavedState();
  return {
    currentTrack: null, isPlaying: false, queue: [], queueIndex: -1,
    volume: s.volume ?? 0.7, progress: 0, duration: 0,
    shuffle: s.shuffle ?? false, repeat: s.repeat ?? 'off',
    recentlyPlayed: [],
    playbackSpeed: 1, crossfade: false,
    showEqualizer: false, showSoundEffects: false, nowPlayingView: 'artwork',
    audioQuality: s.audioQuality || 'high', downloadFormat: 'mp3',
    equalizer: migrateEQ(s.equalizer),
    soundEffects: { reverb: 0, bassBoost: 0, surround3D: 0, vocalBoost: 0, nightMode: false },
  };
}

function useAudioSource(t: Track | null): boolean {
  return !!t?.preview && !t?.youtubeId;
}

// ─── YouTube IFrame API loader ──────────────────────────────────
let ytLoading: Promise<void> | null = null;
function loadYTAPI(): Promise<void> {
  if (ytLoading) return ytLoading;
  if (typeof window === 'undefined') return Promise.resolve();
  ytLoading = new Promise<void>(resolve => {
    if (window.YT?.Player) { resolve(); return; }
    const timer = setTimeout(() => {
      console.warn('YouTube IFrame API timed out');
      resolve();
    }, 10000);
    window.onYouTubeIframeAPIReady = () => { clearTimeout(timer); resolve(); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.onerror = () => { clearTimeout(timer); resolve(); };
    document.head.appendChild(s);
  });
  return ytLoading;
}

// ─── EQ Band definitions ───────────────────────────────────────
export const EQ_BANDS = [
  { key: 'bass32', freq: 32, label: '32Hz', type: 'lowshelf' as BiquadFilterType },
  { key: 'bass64', freq: 64, label: '64Hz', type: 'peaking' as BiquadFilterType },
  { key: 'bass125', freq: 125, label: '125Hz', type: 'peaking' as BiquadFilterType },
  { key: 'lowMid250', freq: 250, label: '250Hz', type: 'peaking' as BiquadFilterType },
  { key: 'mid500', freq: 500, label: '500Hz', type: 'peaking' as BiquadFilterType },
  { key: 'mid1k', freq: 1000, label: '1kHz', type: 'peaking' as BiquadFilterType },
  { key: 'mid2k', freq: 2000, label: '2kHz', type: 'peaking' as BiquadFilterType },
  { key: 'high4k', freq: 4000, label: '4kHz', type: 'peaking' as BiquadFilterType },
  { key: 'high8k', freq: 8000, label: '8kHz', type: 'peaking' as BiquadFilterType },
  { key: 'high16k', freq: 16000, label: '16kHz', type: 'highshelf' as BiquadFilterType },
];

export const EQ_PRESETS: Record<string, Partial<PlayerState['equalizer']>> = {
  'Flat': { bass32: 0, bass64: 0, bass125: 0, lowMid250: 0, mid500: 0, mid1k: 0, mid2k: 0, high4k: 0, high8k: 0, high16k: 0 },
  'Bass Boost': { bass32: 10, bass64: 8, bass125: 5, lowMid250: 2, mid500: 0, mid1k: 0, mid2k: 0, high4k: 0, high8k: 0, high16k: 0 },
  'Treble Boost': { bass32: 0, bass64: 0, bass125: 0, lowMid250: 0, mid500: 0, mid1k: 0, mid2k: 2, high4k: 5, high8k: 8, high16k: 10 },
  'Vocal': { bass32: -3, bass64: -2, bass125: 0, lowMid250: 3, mid500: 6, mid1k: 7, mid2k: 4, high4k: 1, high8k: 0, high16k: 0 },
  'Warm': { bass32: 6, bass64: 5, bass125: 4, lowMid250: 2, mid500: 0, mid1k: -1, mid2k: -3, high4k: 0, high8k: 2, high16k: 1 },
  'Club': { bass32: 5, bass64: 4, bass125: 3, lowMid250: 1, mid500: 0, mid1k: 0, mid2k: 1, high4k: 3, high8k: 4, high16k: 0 },
  'Headphone': { bass32: 3, bass64: 2, bass125: 0, lowMid250: 0, mid500: -1, mid1k: 0, mid2k: 1, high4k: 3, high8k: 4, high16k: 3 },
  'Speaker': { bass32: 6, bass64: 5, bass125: 4, lowMid250: 1, mid500: -1, mid1k: -2, mid2k: 0, high4k: 3, high8k: 4, high16k: 0 },
};

// ─── Provider ───────────────────────────────────────────────────
export function PlayerProvider({ children }: { children: ReactNode }) {
  const ytPlayerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const eqRefs = useRef<BiquadFilterNode[]>([]);
  const masterGainRef = useRef<GainNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);
  const sRef = useRef<PlayerState>(defaultState());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ytInitRef = useRef(false);
  const playerReadyRef = useRef(false);
  const ytFailedRef = useRef(false);
  const streamingRef = useRef(false);
  const pendingPlayRef = useRef<string | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [state, setState] = useState<PlayerState>(defaultState);
  const [audioError, setAudioError] = useState<string | null>(null);
  sRef.current = state;
  const [volume, setVolumeState] = useState(state.volume);
  const [downloading, setDownloading] = useState(false);

  // ── EQ Frequencies ──────────────────────────────────────────
  const EQ_FREQS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

  // ── Init audio context for 10-band EQ + effects ────────────
  function initAudioContext(au: HTMLAudioElement) {
    try {
      const ctx = new AudioContext();
      const src = ctx.createMediaElementSource(au);

      // 10-band peaking EQ
      const filters: BiquadFilterNode[] = [];
      for (let i = 0; i < EQ_FREQS.length; i++) {
        const f = ctx.createBiquadFilter();
        if (i === 0) { f.type = 'lowshelf'; f.frequency.value = EQ_FREQS[i]; }
        else if (i === EQ_FREQS.length - 1) { f.type = 'highshelf'; f.frequency.value = EQ_FREQS[i]; }
        else { f.type = 'peaking'; f.frequency.value = EQ_FREQS[i]; f.Q.value = 1.2; }
        f.gain.value = 0;
        filters.push(f);
      }

      // Master gain for volume control
      const mg = ctx.createGain();
      mg.gain.value = 1.0;

      // Compressor/limiter to prevent clipping and normalize loudness
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -10;
      comp.knee.value = 8;
      comp.ratio.value = 3;
      comp.attack.value = 0.005;
      comp.release.value = 0.25;

      // Loudness normalization via analyser for volume leveling
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      // Build chain: src → eq[0] → ... → eq[9] → masterGain → compressor → analyser → destination
      src.connect(filters[0]);
      for (let i = 0; i < filters.length - 1; i++) filters[i].connect(filters[i + 1]);
      filters[filters.length - 1].connect(mg);
      mg.connect(comp);
      comp.connect(analyser);
      analyser.connect(ctx.destination);

      ctxRef.current = ctx;
      sourceRef.current = src;
      eqRefs.current = filters;
      masterGainRef.current = mg;
      compressorRef.current = comp;
    } catch (e) { console.error('initAudioContext error:', e); }
  }

  // ── Apply EQ gains to filters ───────────────────────────────
  function applyEQ() {
    const eq = sRef.current.equalizer;
    const gains = [eq.bass32, eq.bass64, eq.bass125, eq.lowMid250, eq.mid500,
                   eq.mid1k, eq.mid2k, eq.high4k, eq.high8k, eq.high16k];
    for (let i = 0; i < eqRefs.current.length; i++) {
      const val = Math.max(-12, Math.min(12, gains[i]));
      eqRefs.current[i].gain.setTargetAtTime(val, ctxRef.current?.currentTime || 0, 0.02);
    }
    // Apply mode presets
    if (eq.mode === 'headphone') {
      if (eqRefs.current[8] && gains[8] === 0) eqRefs.current[8].gain.setTargetAtTime(2, ctxRef.current?.currentTime || 0, 0.02);
    } else if (eq.mode === 'speaker') {
      if (eqRefs.current[0] && gains[0] === 0) eqRefs.current[0].gain.setTargetAtTime(3, ctxRef.current?.currentTime || 0, 0.02);
      if (eqRefs.current[8] && gains[8] === 0) eqRefs.current[8].gain.setTargetAtTime(2, ctxRef.current?.currentTime || 0, 0.02);
    }
  }

  // ── Apply sound effects ─────────────────────────────────────
  function applySoundEffects() {
    const sfx = sRef.current.soundEffects;
    const ctx = ctxRef.current;
    if (!ctx) return;

    // Bass boost: boost low shelf filter
    if (eqRefs.current[0]) {
      const bassVal = sfx.bassBoost * 8;
      eqRefs.current[0].gain.setTargetAtTime(bassVal, ctx.currentTime, 0.02);
    }

    // Vocal boost: boost mid frequencies for clearer vocals
    if (eqRefs.current[4] && eqRefs.current[5]) {
      const vocalVal = sfx.vocalBoost * 4;
      eqRefs.current[4].gain.setTargetAtTime(vocalVal, ctx.currentTime, 0.02);
      eqRefs.current[5].gain.setTargetAtTime(vocalVal, ctx.currentTime, 0.02);
    }
  }

  // ── Acquire Wake Lock for background playback ───────────────
  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current?.addEventListener('release', () => {
          wakeLockRef.current = null;
        });
      }
    } catch {}
  }

  function releaseWakeLock() {
    wakeLockRef.current?.release();
    wakeLockRef.current = null;
  }

  // ── Resume AudioContext if suspended ────────────────────────
  function ensureAudioContext() {
    if (ctxRef.current?.state === 'suspended') {
      ctxRef.current.resume().catch(() => {});
    }
  }

  // ── Init YouTube player + audio element ──────────────────────
  useEffect(() => {
    const div = document.createElement('div');
    div.id = 'yt-box';
    div.style.display = 'none';
    document.body.appendChild(div);
    containerRef.current = div;

    const au = new Audio();
    au.volume = state.volume;
    au.crossOrigin = 'anonymous';
    audioRef.current = au;
    initAudioContext(au);

    // Handle visibility change to keep audio playing
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        ensureAudioContext();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Handle page blur/focus
    const onBlur = () => { ensureAudioContext(); };
    window.addEventListener('blur', onBlur);

    loadYTAPI().then(() => {
      if (!div || ytInitRef.current) return;
      ytInitRef.current = true;
      const YT = window.YT;
      if (YT?.Player) {
        try {
          ytPlayerRef.current = new YT.Player(div, {
            height: '0', width: '0',
            playerVars: { autoplay: 0, controls: 0, disablekb: 1, enablejsapi: 1, fs: 0, modestbranding: 1, origin: window.location.origin },
            events: {
              onReady: () => {
                playerReadyRef.current = true;
                if (ytPlayerRef.current?.setVolume) ytPlayerRef.current.setVolume(state.volume * 100);
                if (pendingPlayRef.current) {
                  ytPlayerRef.current.loadVideoById(pendingPlayRef.current, 0, 'default');
                  pendingPlayRef.current = null;
                }
              },
              onStateChange: (e: any) => {
                if (e.data === YT.PlayerState.PLAYING) {
                  setState(s => ({ ...s, isPlaying: true, duration: ytPlayerRef.current?.getDuration?.() || s.duration }));
                } else if (e.data === YT.PlayerState.PAUSED) {
                  setState(s => ({ ...s, isPlaying: false }));
                } else if (e.data === YT.PlayerState.ENDED) { onEnded(); }
              },
              onError: () => {
                const t = sRef.current.currentTrack;
                if (t?.youtubeId) {
                  playViaStream(t.youtubeId);
                } else {
                  setAudioError('Playback unavailable');
                  setState(s => ({ ...s, isPlaying: false }));
                }
              },
            },
          });
        } catch { ytFailedRef.current = true; }
      } else {
        ytFailedRef.current = true;
      }
    });

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      ytPlayerRef.current?.destroy();
      div.remove();
      au.src = '';
      ctxRef.current?.close();
      releaseWakeLock();
    };
  }, []);

  // ── Volume sync ──────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    if (ytPlayerRef.current?.setVolume) ytPlayerRef.current.setVolume(volume * 100);
    setState(s => ({ ...s, volume }));
  }, [volume]);

  // ── Save state ───────────────────────────────────────────────
  useEffect(() => {
    try {
      const eq = sRef.current.equalizer;
      const sfx = sRef.current.soundEffects;
      localStorage.setItem(LS_KEY, JSON.stringify({
        volume, shuffle: state.shuffle, repeat: state.repeat,
        audioQuality: state.audioQuality,
        equalizer: { ...eq }, soundEffects: { ...sfx },
        recentlyPlayed: sRef.current.recentlyPlayed,
      }));
    } catch {}
  }, [volume, state.shuffle, state.repeat, state.audioQuality, state.equalizer, state.soundEffects]);

  // ── Progress tick ────────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      const s = sRef.current;
      if (!s.isPlaying || !s.currentTrack) return;
      if (streamingRef.current || useAudioSource(s.currentTrack)) {
        if (audioRef.current) setState(prev => ({ ...prev, progress: audioRef.current!.currentTime }));
      } else {
        try { if (ytPlayerRef.current?.getCurrentTime) setState(prev => ({ ...prev, progress: ytPlayerRef.current.getCurrentTime() })); } catch {}
      }
    }, 250);
    return () => clearInterval(iv);
  }, []);

  function onEnded() {
    const s = sRef.current;
    if (s.repeat === 'one') {
      if (streamingRef.current || useAudioSource(s.currentTrack)) {
        if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); }
      } else {
        ytPlayerRef.current?.seekTo(0); ytPlayerRef.current?.playVideo();
      }
    } else if (s.repeat === 'all' || s.queueIndex < s.queue.length - 1) { doNext(); }
    else setState(prev => ({ ...prev, isPlaying: false, progress: 0 }));
  }

  function doNext() {
    const s = sRef.current;
    if (!s.queue.length) return;
    const idx = s.shuffle ? Math.floor(Math.random() * s.queue.length) : (s.queueIndex + 1) % s.queue.length;
    const t = s.queue[idx];
    if (t) doPlay(t, s.queue);
  }

  function doPrev() {
    const s = sRef.current;
    if (!s.queue.length) return;
    if (s.progress > 3) {
      if (streamingRef.current || useAudioSource(s.currentTrack)) { if (audioRef.current) audioRef.current.currentTime = 0; }
      else ytPlayerRef.current?.seekTo(0);
      setState(s => ({ ...s, progress: 0 })); return;
    }
    const idx = s.shuffle ? Math.floor(Math.random() * s.queue.length) : (s.queueIndex - 1 + s.queue.length) % s.queue.length;
    const t = s.queue[idx];
    if (t) doPlay(t, s.queue);
  }

  // ── Media Session API for background playback ──────────────────
  function updateMediaSession(track: Track) {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const artwork = [
      { src: track.album.cover_medium || track.album.cover_small || '', sizes: '512x512', type: 'image/jpeg' },
    ];
    if (track.youtubeId) {
      artwork.push({ src: `https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg`, sizes: '512x512', type: 'image/jpeg' });
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist.name,
      album: track.album.title || '',
      artwork: artwork.filter(a => a.src),
    });
    navigator.mediaSession.setActionHandler('play', () => resume());
    navigator.mediaSession.setActionHandler('pause', () => pause());
    navigator.mediaSession.setActionHandler('previoustrack', () => prev());
    navigator.mediaSession.setActionHandler('nexttrack', () => next());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime != null) seek(details.seekTime);
    });
    navigator.mediaSession.setActionHandler('stop', () => pause());
  }

  async function doPlay(track: Track, q?: Track[]) {
    setAudioError(null);
    ensureAudioContext();
    requestWakeLock();
    const queue = q || [track];
    const idx = q ? q.findIndex(t => t.id === track.id) : 0;
    setState(s => {
      const rp = s.recentlyPlayed.filter(t => t.id !== track.id);
      rp.unshift(track);
      if (rp.length > 50) rp.length = 50;
      return { ...s, currentTrack: track, isPlaying: true, queue, queueIndex: idx >= 0 ? idx : 0, progress: 0, recentlyPlayed: rp };
    });
    updateMediaSession(track);
    applyEQ();
    applySoundEffects();

    // If we have a YouTube ID, play via YouTube
    if (track.youtubeId) {
      streamingRef.current = false;
      if (playerReadyRef.current && ytPlayerRef.current) {
        try {
          ytPlayerRef.current.loadVideoById(track.youtubeId, 0, 'hd720');
          audioRef.current!.src = '';
          if (state.audioQuality === 'high') {
            ytPlayerRef.current.setPlaybackQuality('hd1080');
          } else if (state.audioQuality === 'mid') {
            ytPlayerRef.current.setPlaybackQuality('hd720');
          } else {
            ytPlayerRef.current.setPlaybackQuality('medium');
          }
          return;
        } catch {}
      }
      if (ytFailedRef.current) {
        playViaStream(track.youtubeId, queue, idx);
        return;
      }
      pendingPlayRef.current = track.youtubeId;
      return;
    }

    // No YouTube ID — search YouTube
    setAudioError('Loading...');
    try {
      const found = await findOnYouTube(track.title, track.artist.name);
      if (found) {
        track.youtubeId = found;
        streamingRef.current = false;
        if (playerReadyRef.current && ytPlayerRef.current) {
          try {
            ytPlayerRef.current.loadVideoById(found, 0, 'default');
            audioRef.current!.src = '';
            return;
          } catch {}
        }
        if (ytFailedRef.current) {
          playViaStream(found, queue, idx);
          return;
        }
        pendingPlayRef.current = found;
        return;
      }
    } catch {}

    // Last resort: direct audio preview
    if (track.preview && audioRef.current) {
      ytPlayerRef.current?.stopVideo();
      audioRef.current.src = track.preview;
      audioRef.current.volume = volume;
      ensureAudioContext();
      try {
        await audioRef.current.play();
        return;
      } catch {}
    }

    setAudioError('Not available');
    setState(s => ({ ...s, isPlaying: false }));
  }

  async function playViaStream(youtubeId: string, queue?: Track[], idx?: number) {
    streamingRef.current = false;
    try {
      ytPlayerRef.current?.stopVideo();
      const res = await fetch(`/api/stream?id=${youtubeId}`);
      const data = await res.json();
      if (!data.url) throw new Error('No stream URL');
      if (data.fallback) {
        window.open(data.url, '_blank');
        setAudioError('Opening in YouTube...');
        setState(s => ({ ...s, isPlaying: false }));
        return;
      }
      streamingRef.current = true;
      const au = audioRef.current;
      if (au) {
        au.src = data.url;
        au.volume = sRef.current.volume;
        ensureAudioContext();
        au.onended = () => { streamingRef.current = false; onEnded(); };
        await au.play();
      }
    } catch {
      setAudioError('Stream unavailable');
      setState(s => ({ ...s, isPlaying: false }));
    }
  }

  const play = useCallback((track: Track, queue?: Track[]) => doPlay(track, queue), []);
  const pause = useCallback(() => {
    const s = sRef.current;
    if (streamingRef.current || useAudioSource(s.currentTrack)) audioRef.current?.pause();
    else ytPlayerRef.current?.pauseVideo();
    setState(s => ({ ...s, isPlaying: false }));
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
  }, []);
  const resume = useCallback(() => {
    const s = sRef.current;
    ensureAudioContext();
    if (streamingRef.current || useAudioSource(s.currentTrack)) {
      audioRef.current?.play().catch(() => {});
    } else ytPlayerRef.current?.playVideo();
    setState(s => ({ ...s, isPlaying: true }));
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
  }, []);
  const next = useCallback(() => doNext(), []);
  const prev = useCallback(() => doPrev(), []);
  const setVolume = useCallback((v: number) => setVolumeState(Math.max(0, Math.min(1, v))), []);
  const seek = useCallback((t: number) => {
    const s = sRef.current;
    if (streamingRef.current || useAudioSource(s.currentTrack)) { if (audioRef.current) audioRef.current.currentTime = t; }
    else ytPlayerRef.current?.seekTo(t);
    setState(s => ({ ...s, progress: t }));
  }, []);

  const toggleShuffle = useCallback(() => setState(s => ({ ...s, shuffle: !s.shuffle })), []);
  const toggleRepeat = useCallback(() => setState(s => {
    const modes: PlayerState['repeat'][] = ['off', 'all', 'one'];
    return { ...s, repeat: modes[(modes.indexOf(s.repeat) + 1) % modes.length] };
  }), []);

  const addToQueue = useCallback((t: Track) => setState(s => ({ ...s, queue: [...s.queue, t] })), []);
  const removeFromQueue = useCallback((i: number) => setState(s => {
    const q = s.queue.filter((_, idx) => idx !== i);
    return { ...s, queue: q, queueIndex: i < s.queueIndex ? s.queueIndex - 1 : s.queueIndex === i ? -1 : s.queueIndex };
  }), []);
  const clearQueue = useCallback(() => setState(s => ({ ...s, queue: [], queueIndex: -1 })), []);

  // ── Download ──────────────────────────────────────────────────
  const downloadCurrentTrack = useCallback(async () => {
    const t = sRef.current.currentTrack;
    if (!t) return;
    setDownloading(true);
    const url = getTrackDownloadUrl(t);
    if (url) {
      const ext = t.youtubeId ? 'm4a' : (t.preview?.includes('mp4') ? 'm4a' : 'mp3');
      const filename = getSafeFilename(t.title, ext);
      await downloadFile(url, filename);
    }
    setDownloading(false);
  }, []);

  // ── Quality & Effects ─────────────────────────────────────────
  const setAudioQuality = useCallback((q: string) => {
    setState(s => ({ ...s, audioQuality: q as any }));
    if (ytPlayerRef.current?.setPlaybackQuality) {
      const map: Record<string, string> = { low: 'small', mid: 'medium', high: 'hd720' };
      ytPlayerRef.current.setPlaybackQuality(map[q] || 'medium');
    }
  }, []);

  const setEqualizer = useCallback((bandOrMode: string, val: number) => {
    if (bandOrMode === 'mode') {
      const modes: Array<'normal' | 'headphone' | 'speaker'> = ['normal', 'headphone', 'speaker'];
      setState(s => ({ ...s, equalizer: { ...s.equalizer, mode: modes[val] || 'normal' } }));
      setTimeout(applyEQ, 50);
      return;
    }
    if (bandOrMode === 'preset') {
      const PRESET_NAMES = Object.keys(EQ_PRESETS);
      const name = PRESET_NAMES[val] || 'Flat';
      const p = EQ_PRESETS[name] || EQ_PRESETS['Flat'];
      setState(s => ({ ...s, equalizer: { ...s.equalizer, ...p, preset: name } }));
      setTimeout(applyEQ, 50);
      return;
    }
    setState(s => ({ ...s, equalizer: { ...s.equalizer, [bandOrMode]: Math.max(-12, Math.min(12, val)) } }));
    setTimeout(applyEQ, 50);
  }, []);

  const setSoundEffect = useCallback((effect: string, val: number | boolean) => {
    setState(s => ({ ...s, soundEffects: { ...s.soundEffects, [effect]: val } }));
    setTimeout(applySoundEffects, 50);
  }, []);

  return (
    <PlayerContext.Provider value={{
      ...state, audioError, downloading,
      play, pause, resume, next, prev, setVolume, seek,
      toggleShuffle, toggleRepeat, addToQueue, removeFromQueue, clearQueue,
      downloadCurrentTrack, setAudioQuality, setEqualizer, setSoundEffect,
      audioContext: ctxRef.current,
      eqFilters: eqRefs.current,
      masterGain: masterGainRef.current,
    } as PlayerContextType}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const c = useContext(PlayerContext);
  if (!c) throw new Error('usePlayer must be used within PlayerProvider');
  return c;
}
