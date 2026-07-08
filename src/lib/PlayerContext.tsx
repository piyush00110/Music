'use client';

import { createContext, useContext, useRef, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Track, PlayerState } from './types';
import { findOnYouTube } from './music';

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
  setSoundEffect: (effect: string, val: number) => void;
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
    equalizer: { bass: 50, mid: 50, treble: 50, preset: 'Normal' },
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
      console.warn('YouTube IFrame API timed out, creating player anyway');
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

// ─── Provider ───────────────────────────────────────────────────
export function PlayerProvider({ children }: { children: ReactNode }) {
  const ytPlayerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const bassRef = useRef<BiquadFilterNode | null>(null);
  const midRef = useRef<BiquadFilterNode | null>(null);
  const trebleRef = useRef<BiquadFilterNode | null>(null);
  const sRef = useRef<PlayerState>(defaultState());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ytInitRef = useRef(false);
  const playerReadyRef = useRef(false);
  const ytFailedRef = useRef(false);
  const streamingRef = useRef(false);
  const pendingPlayRef = useRef<string | null>(null);
  const [state, setState] = useState<PlayerState>(defaultState);
  const [audioError, setAudioError] = useState<string | null>(null);
  sRef.current = state;
  const [volume, setVolumeState] = useState(state.volume);
  const [downloading, setDownloading] = useState(false);

  // ── Init audio context for EQ ──────────────────────────────────
  function initAudioContext(au: HTMLAudioElement) {
    try {
      const ctx = new AudioContext();
      const src = ctx.createMediaElementSource(au);
      const bass = ctx.createBiquadFilter();
      bass.type = 'lowshelf';
      bass.frequency.value = 250;
      const mid = ctx.createBiquadFilter();
      mid.type = 'peaking';
      mid.frequency.value = 1000;
      mid.Q.value = 1;
      const treble = ctx.createBiquadFilter();
      treble.type = 'highshelf';
      treble.frequency.value = 4000;
      src.connect(bass);
      bass.connect(mid);
      mid.connect(treble);
      treble.connect(ctx.destination);
      ctxRef.current = ctx;
      sourceRef.current = src;
      bassRef.current = bass;
      midRef.current = mid;
      trebleRef.current = treble;
    } catch {}
  }

  function applyEQ() {
    const eq = sRef.current.equalizer;
    if (bassRef.current) bassRef.current.gain.value = (eq.bass - 50) / 50;
    if (midRef.current) midRef.current.gain.value = (eq.mid - 50) / 50;
    if (trebleRef.current) trebleRef.current.gain.value = (eq.treble - 50) / 50;
  }

  function applySoundEffects() {
    const sfx = sRef.current.soundEffects;
    if (bassRef.current) {
      const boost = (sfx.bassBoost || 0) / 100;
      bassRef.current.gain.value = boost;
    }
    if (trebleRef.current) {
      const boost = (sfx.vocalBoost || 0) / 100;
      trebleRef.current.gain.value = boost;
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
    audioRef.current = au;
    initAudioContext(au);

    loadYTAPI().then(() => {
      if (!div || ytInitRef.current) return;
      ytInitRef.current = true;
      const YT = window.YT;
      if (YT?.Player) {
        try {
          ytPlayerRef.current = new YT.Player(div, {
            height: '0', width: '0',
            playerVars: { autoplay: 0, controls: 0, disablekb: 1, enablejsapi: 1, fs: 0, modestbranding: 1 },
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
                // YT playback failed — try stream fallback
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
      ytPlayerRef.current?.destroy();
      div.remove();
      au.src = '';
      ctxRef.current?.close();
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
        equalizer: eq, soundEffects: sfx,
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
    }, 500);
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

  async function doPlay(track: Track, q?: Track[]) {
    setAudioError(null);
    const queue = q || [track];
    const idx = q ? q.findIndex(t => t.id === track.id) : 0;
    setState(s => {
      const rp = s.recentlyPlayed.filter(t => t.id !== track.id);
      rp.unshift(track);
      if (rp.length > 50) rp.length = 50;
      return { ...s, currentTrack: track, isPlaying: true, queue, queueIndex: idx >= 0 ? idx : 0, progress: 0, recentlyPlayed: rp };
    });
    applyEQ();
    applySoundEffects();

    // If we have a YouTube ID, play via YouTube
    if (track.youtubeId) {
      streamingRef.current = false;
      if (playerReadyRef.current && ytPlayerRef.current) {
        try {
          ytPlayerRef.current.loadVideoById(track.youtubeId, 0, 'default');
          audioRef.current!.src = '';
          if (state.audioQuality !== 'mid') {
            ytPlayerRef.current.setPlaybackQuality(state.audioQuality === 'high' ? 'hd720' : 'small');
          }
          return;
        } catch {}
      }
      // Player not ready — if YT failed, stream directly
      if (ytFailedRef.current) {
        playViaStream(track.youtubeId, queue, idx);
        return;
      }
      // Otherwise queue for when YT player becomes ready
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
      if (ctxRef.current?.state === 'suspended') ctxRef.current.resume();
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
        if (ctxRef.current?.state === 'suspended') ctxRef.current.resume();
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
  }, []);
  const resume = useCallback(() => {
    const s = sRef.current;
    if (streamingRef.current || useAudioSource(s.currentTrack)) {
      if (ctxRef.current?.state === 'suspended') ctxRef.current.resume();
      audioRef.current?.play().catch(() => {});
    } else ytPlayerRef.current?.playVideo();
    setState(s => ({ ...s, isPlaying: true }));
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
    if (t.youtubeId) {
      window.open(`/api/download?id=${t.youtubeId}&title=${encodeURIComponent(t.title)}`, '_blank');
      return;
    }
    if (!t.preview) return;
    setDownloading(true);
    try {
      const res = await fetch(t.preview, { signal: AbortSignal.timeout(30000) });
      const blob = await res.blob();
      const fn = `${t.title.replace(/[^\w\s]/g, '').trim() || 'audio'}.mp3`;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fn;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { window.open(t.preview, '_blank'); }
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

  const setEqualizer = useCallback((band: string, val: number) => {
    setState(s => ({ ...s, equalizer: { ...s.equalizer, [band]: val } }));
    applyEQ();
  }, []);

  const setSoundEffect = useCallback((effect: string, val: number) => {
    setState(s => ({ ...s, soundEffects: { ...s.soundEffects, [effect]: val } }));
    applySoundEffects();
  }, []);

  return (
    <PlayerContext.Provider value={{
      ...state, audioError, downloading,
      play, pause, resume, next, prev, setVolume, seek,
      toggleShuffle, toggleRepeat, addToQueue, removeFromQueue, clearQueue,
      downloadCurrentTrack, setAudioQuality, setEqualizer, setSoundEffect,
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
