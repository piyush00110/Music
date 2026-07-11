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
  setCrossfadeDuration: (d: number) => void;
  toggleCrossfade: () => void;
  setPlaybackSpeed: (s: number) => void;
  toggleFavorite: (trackId: number) => void;
  isFavorite: (trackId: number) => boolean;
  audioContext: AudioContext | null;
  eqFilters: BiquadFilterNode[];
  masterGain: GainNode | null;
  analyserNode: AnalyserNode | null;
  liveSpectrum: Uint8Array;
  loudnessDb: number;
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
    playbackSpeed: 1, crossfade: s.crossfade ?? true,
    crossfadeDuration: s.crossfadeDuration ?? 3,
    showEqualizer: false, showSoundEffects: false, nowPlayingView: 'artwork',
    audioQuality: s.audioQuality || 'high', downloadFormat: 'mp3',
    equalizer: migrateEQ(s.equalizer),
    soundEffects: { reverb: 0, bassBoost: 0, surround3D: 0, vocalBoost: 0, nightMode: false, spatialAudio: false, stereoWidth: 0.5 },
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
    const timer = setTimeout(() => { resolve(); }, 10000);
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
  'Headphone': { bass32: 3, bass64: 2, bass125: 0, lowMid250: -1, mid500: -1, mid1k: 2, mid2k: 3, high4k: 4, high8k: 5, high16k: 4 },
  'Speaker': { bass32: 4, bass64: 3, bass125: 2, lowMid250: -2, mid500: -2, mid1k: 1, mid2k: 3, high4k: 4, high8k: 5, high16k: 3 },
  'HiFi': { bass32: 2, bass64: 1, bass125: 0, lowMid250: -1, mid500: 0, mid1k: 1, mid2k: 2, high4k: 3, high8k: 4, high16k: 5 },
  'Loudness': { bass32: 8, bass64: 6, bass125: 3, lowMid250: 0, mid500: -2, mid1k: 0, mid2k: 2, high4k: 4, high8k: 6, high16k: 8 },
  'Podcast': { bass32: -2, bass64: -1, bass125: 0, lowMid250: 3, mid500: 5, mid1k: 6, mid2k: 4, high4k: 2, high8k: 0, high16k: -1 },
  'Earbuds': { bass32: 5, bass64: 3, bass125: 1, lowMid250: -2, mid500: 0, mid1k: 3, mid2k: 5, high4k: 6, high8k: 5, high16k: 3 },
  'Acoustic': { bass32: 3, bass64: 2, bass125: 1, lowMid250: 0, mid500: 1, mid1k: 2, mid2k: 3, high4k: 2, high8k: 3, high16k: 4 },
  'Jazz': { bass32: 4, bass64: 3, bass125: 1, lowMid250: 2, mid500: 4, mid1k: 5, mid2k: 4, high4k: 3, high8k: 5, high16k: 6 },
  'Classical': { bass32: 3, bass64: 2, bass125: 0, lowMid250: -1, mid500: -2, mid1k: 0, mid2k: 2, high4k: 4, high8k: 5, high16k: 6 },
  'Hip-Hop': { bass32: 9, bass64: 7, bass125: 5, lowMid250: 2, mid500: -1, mid1k: -2, mid2k: 1, high4k: 3, high8k: 4, high16k: 2 },
  'R&B': { bass32: 5, bass64: 4, bass125: 3, lowMid250: 2, mid500: 3, mid1k: 4, mid2k: 3, high4k: 2, high8k: 3, high16k: 2 },
  'Electronic': { bass32: 8, bass64: 6, bass125: 2, lowMid250: -1, mid500: -3, mid1k: 0, mid2k: 2, high4k: 4, high8k: 6, high16k: 8 },
  'Metal': { bass32: 5, bass64: 4, bass125: 0, lowMid250: -2, mid500: -3, mid1k: 0, mid2k: 3, high4k: 5, high8k: 6, high16k: 4 },
  'Folk': { bass32: 2, bass64: 1, bass125: 0, lowMid250: 2, mid500: 4, mid1k: 5, mid2k: 4, high4k: 3, high8k: 2, high16k: 1 },
  'Ambient': { bass32: 4, bass64: 3, bass125: 2, lowMid250: 1, mid500: 0, mid1k: -1, mid2k: -2, high4k: 1, high8k: 3, high16k: 5 },
  'Pop': { bass32: 4, bass64: 3, bass125: 2, lowMid250: 0, mid500: 2, mid1k: 4, mid2k: 3, high4k: 2, high8k: 3, high16k: 2 },
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
  const crossfadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<PlayerState>(defaultState);
  const [audioError, setAudioError] = useState<string | null>(null);
  sRef.current = state;
  const [volume, setVolumeState] = useState(state.volume);
  const [downloading, setDownloading] = useState(false);
  const [liveSpectrum, setLiveSpectrum] = useState<Uint8Array>(new Uint8Array(64));
  const [loudnessDb, setLoudnessDb] = useState(-14);

  // ── Favorites (persisted in localStorage) ──
  const [favorites, setFavorites] = useState<Set<number>>(() => {
    try {
      const s = localStorage.getItem('aurelia-favorites');
      return s ? new Set(JSON.parse(s)) : new Set();
    } catch { return new Set(); }
  });
  const favoritesRef = useRef(favorites);
  favoritesRef.current = favorites;

  useEffect(() => {
    try { localStorage.setItem('aurelia-favorites', JSON.stringify([...favorites])); } catch {}
  }, [favorites]);

  const EQ_FREQS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  // Musical Q values: wider on lows/highs, tighter on mids for precision
  const EQ_Q = [0.7, 0.9, 1.0, 1.2, 1.4, 1.5, 1.4, 1.2, 0.9, 0.7];

  const pannerRef = useRef<StereoPannerNode | null>(null);
  const reverbGainRef = useRef<GainNode | null>(null);
  const dryGainRef = useRef<GainNode | null>(null);
  const convolverRef = useRef<ConvolverNode | null>(null);
  const nightCompRef = useRef<DynamicsCompressorNode | null>(null);
  const bassBoostFilterRef = useRef<BiquadFilterNode | null>(null);
  const vocalBoostFilterRef = useRef<BiquadFilterNode | null>(null);
  const presenceFilterRef = useRef<BiquadFilterNode | null>(null);
  const demudFilterRef = useRef<BiquadFilterNode | null>(null);
  const midGainRef = useRef<GainNode | null>(null);
  const sideGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const preGainRef = useRef<GainNode | null>(null);
  const exciterRef = useRef<WaveShaperNode | null>(null);

  // ── Professional reverb IR: multi-room with early reflections, pre-delay, and diffusion ──
  function createReverbIR(ctx: AudioContext, duration = 2.8, decay = 2.5): AudioBuffer {
    const rate = ctx.sampleRate;
    const preDelaySamples = Math.floor(rate * 0.025);
    const length = rate * duration + preDelaySamples;
    const buffer = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      const stereoOffset = ch * Math.floor(rate * 0.003);
      for (let i = 0; i < length; i++) {
        const idx = i + stereoOffset;
        if (idx < preDelaySamples) {
          data[i] = 0;
        } else {
          const t = (idx - preDelaySamples) / (length - preDelaySamples);
          let sample = 0;
          // Early reflections (discrete taps)
          const erTaps = [0.013, 0.021, 0.035, 0.051, 0.067, 0.089, 0.112];
          for (const tap of erTaps) {
            const tapIdx = preDelaySamples + Math.floor(rate * tap);
            if (idx === tapIdx) sample += (Math.random() * 2 - 1) * 0.35 * Math.pow(1 - t, 3);
          }
          // Diffuse late reverb with modulation
          const mod = 1 + 0.15 * Math.sin(2 * Math.PI * 0.8 * t);
          const lateDensity = Math.min(1, t * 4);
          sample += (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * lateDensity * 0.55 * mod;
          data[i] = sample;
        }
      }
    }
    return buffer;
  }

  // ── Init audio context: 48kHz, hi-fi chain ──
  function initAudioContext(au: HTMLAudioElement) {
    try {
      const ctx = new AudioContext({ sampleRate: 48000, latencyHint: 'playback' });
      const src = ctx.createMediaElementSource(au);

      const filters: BiquadFilterNode[] = [];
      for (let i = 0; i < EQ_FREQS.length; i++) {
        const f = ctx.createBiquadFilter();
        if (i === 0) { f.type = 'lowshelf'; f.frequency.value = EQ_FREQS[i]; }
        else if (i === EQ_FREQS.length - 1) { f.type = 'highshelf'; f.frequency.value = EQ_FREQS[i]; }
        else { f.type = 'peaking'; f.frequency.value = EQ_FREQS[i]; f.Q.value = EQ_Q[i]; }
        f.gain.value = 0;
        filters.push(f);
      }

      const bassBoost = ctx.createBiquadFilter();
      bassBoost.type = 'lowshelf';
      bassBoost.frequency.value = 80;
      bassBoost.gain.value = 0;

      const vocalBoost = ctx.createBiquadFilter();
      vocalBoost.type = 'peaking';
      vocalBoost.frequency.value = 2800;
      vocalBoost.Q.value = 1.0;
      vocalBoost.gain.value = 0;

      // Presence clarity filter (boosts articulation for earbuds/speakers)
      const presenceFilter = ctx.createBiquadFilter();
      presenceFilter.type = 'peaking';
      presenceFilter.frequency.value = 5500;
      presenceFilter.Q.value = 1.2;
      presenceFilter.gain.value = 0;

      // De-mud filter (cuts boxy frequencies that muddy vocals on earbuds)
      const demudFilter = ctx.createBiquadFilter();
      demudFilter.type = 'peaking';
      demudFilter.frequency.value = 400;
      demudFilter.Q.value = 1.5;
      demudFilter.gain.value = 0;

      const panner = ctx.createStereoPanner();
      panner.pan.value = 0;

      const splitter = ctx.createChannelSplitter(2);
      const merger = ctx.createChannelMerger(2);
      const midGain = ctx.createGain();
      const sideGain = ctx.createGain();
      midGain.gain.value = 1.0;
      sideGain.gain.value = 0.0;

      const convolver = ctx.createConvolver();
      convolver.buffer = createReverbIR(ctx, 2.5, 2.5);
      const reverbGain = ctx.createGain();
      reverbGain.gain.value = 0;
      const dryGain = ctx.createGain();
      dryGain.gain.value = 1;

      const mg = ctx.createGain();
      mg.gain.value = 1.0;

      const preGain = ctx.createGain();
      preGain.gain.value = 1.0;

      const normalizer = ctx.createDynamicsCompressor();
      normalizer.threshold.value = -14;
      normalizer.knee.value = 10;
      normalizer.ratio.value = 2;
      normalizer.attack.value = 0.03;
      normalizer.release.value = 0.25;

      const nightComp = ctx.createDynamicsCompressor();
      nightComp.threshold.value = -80;
      nightComp.knee.value = 0;
      nightComp.ratio.value = 1;
      nightComp.attack.value = 0.01;
      nightComp.release.value = 0.3;

      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -0.5;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.0005;
      limiter.release.value = 0.02;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;

      // ── Harmonic exciter (tape saturation) ──
      const exciter = ctx.createWaveShaper();
      const curveLen = ctx.sampleRate;
      const exciterCurve = new Float32Array(curveLen);
      for (let i = 0; i < curveLen; i++) {
        const x = (i / (curveLen / 2)) * 2 - 1;
        // Warm tape saturation with odd harmonics
        exciterCurve[i] = Math.tanh(x * 1.3) * 0.92 + Math.pow(Math.abs(x), 3) * 0.08 * Math.sign(x);
      }
      exciter.curve = exciterCurve;
      exciter.oversample = '4x';

      // ── Build chain ──
      src.connect(filters[0]);
      for (let i = 0; i < filters.length - 1; i++) filters[i].connect(filters[i + 1]);
      filters[filters.length - 1].connect(bassBoost);
      bassBoost.connect(vocalBoost);
      vocalBoost.connect(presenceFilter);
      presenceFilter.connect(demudFilter);
      demudFilter.connect(panner);

      panner.connect(splitter);
      splitter.connect(midGain, 0);
      splitter.connect(sideGain, 1);
      midGain.connect(merger, 0, 0);
      sideGain.connect(merger, 0, 1);

      merger.connect(convolver);
      convolver.connect(reverbGain);
      merger.connect(dryGain);

      reverbGain.connect(mg);
      dryGain.connect(mg);

      // masterGain → exciter → preGain → normalizer → nightComp → limiter → analyser → destination
      mg.connect(exciter);
      exciter.connect(preGain);
      preGain.connect(normalizer);
      normalizer.connect(nightComp);
      nightComp.connect(limiter);
      limiter.connect(analyser);
      analyser.connect(ctx.destination);

      ctxRef.current = ctx;
      sourceRef.current = src;
      eqRefs.current = filters;
      masterGainRef.current = mg;
      compressorRef.current = limiter;
      pannerRef.current = panner;
      reverbGainRef.current = reverbGain;
      dryGainRef.current = dryGain;
      convolverRef.current = convolver;
      nightCompRef.current = nightComp;
      bassBoostFilterRef.current = bassBoost;
      vocalBoostFilterRef.current = vocalBoost;
      presenceFilterRef.current = presenceFilter;
      demudFilterRef.current = demudFilter;
      midGainRef.current = midGain;
      sideGainRef.current = sideGain;
      analyserRef.current = analyser;
      preGainRef.current = preGain;
      exciterRef.current = exciter;
    } catch (e) { console.error('initAudioContext error:', e); }
  }

  function applyEQ() {
    const eq = sRef.current.equalizer;
    const gains = [eq.bass32, eq.bass64, eq.bass125, eq.lowMid250, eq.mid500,
                   eq.mid1k, eq.mid2k, eq.high4k, eq.high8k, eq.high16k];
    for (let i = 0; i < eqRefs.current.length; i++) {
      const val = Math.max(-12, Math.min(12, gains[i]));
      eqRefs.current[i].gain.setTargetAtTime(val, ctxRef.current?.currentTime || 0, 0.02);
    }
    if (eq.mode === 'headphone') {
      if (eqRefs.current[8] && gains[8] === 0) eqRefs.current[8].gain.setTargetAtTime(2, ctxRef.current?.currentTime || 0, 0.02);
    } else if (eq.mode === 'speaker') {
      if (eqRefs.current[0] && gains[0] === 0) eqRefs.current[0].gain.setTargetAtTime(3, ctxRef.current?.currentTime || 0, 0.02);
      if (eqRefs.current[8] && gains[8] === 0) eqRefs.current[8].gain.setTargetAtTime(2, ctxRef.current?.currentTime || 0, 0.02);
    }
  }

  function applySoundEffects() {
    const sfx = sRef.current.soundEffects;
    const ctx = ctxRef.current;
    if (!ctx) return;
    const t = ctx.currentTime;

    if (bassBoostFilterRef.current) {
      bassBoostFilterRef.current.gain.setTargetAtTime(sfx.bassBoost * 10, t, 0.02);
    }
    if (vocalBoostFilterRef.current) {
      vocalBoostFilterRef.current.gain.setTargetAtTime(sfx.vocalBoost * 8, t, 0.02);
    }
    if (presenceFilterRef.current) {
      // Presence boost rides with vocal boost for earbud clarity
      presenceFilterRef.current.gain.setTargetAtTime(sfx.vocalBoost * 5, t, 0.02);
    }
    if (demudFilterRef.current) {
      // Cut mud when vocal boost is active for cleaner earbuds sound
      demudFilterRef.current.gain.setTargetAtTime(sfx.vocalBoost > 0.3 ? -3 * sfx.vocalBoost : 0, t, 0.02);
    }
    if (reverbGainRef.current && dryGainRef.current) {
      const wet = sfx.reverb;
      // Equal-power crossfade for reverb wet/dry
      reverbGainRef.current.gain.setTargetAtTime(Math.sin(wet * Math.PI / 2), t, 0.03);
      dryGainRef.current.gain.setTargetAtTime(Math.cos(wet * Math.PI / 2), t, 0.03);
    }
    if (midGainRef.current && sideGainRef.current) {
      const width = sfx.stereoWidth ?? 0.5;
      // Proper M/S: at 0 = mono (mid only), at 1 = wider (boosted sides)
      const midLevel = 1.0 - width * 0.15;
      const sideLevel = 0.3 + width * 0.7;
      midGainRef.current.gain.setTargetAtTime(midLevel, t, 0.05);
      sideGainRef.current.gain.setTargetAtTime(sideLevel, t, 0.05);
    }
    if (!sfx.spatialAudio && pannerRef.current) {
      pannerRef.current.pan.setTargetAtTime(0, t, 0.05);
    }
    if (nightCompRef.current) {
      if (sfx.nightMode) {
        // Multi-band style compression: gentle limiting + volume reduction
        nightCompRef.current.threshold.setTargetAtTime(-16, t, 0.1);
        nightCompRef.current.knee.setTargetAtTime(6, t, 0.1);
        nightCompRef.current.ratio.setTargetAtTime(6, t, 0.1);
      } else {
        nightCompRef.current.threshold.setTargetAtTime(-80, t, 0.1);
        nightCompRef.current.knee.setTargetAtTime(0, t, 0.1);
        nightCompRef.current.ratio.setTargetAtTime(1, t, 0.1);
      }
    }
    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(sfx.nightMode ? 0.55 : 1.0, t, 0.05);
    }
  }

  async function requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current?.addEventListener('release', () => { wakeLockRef.current = null; });
      }
    } catch {}
  }

  function releaseWakeLock() {
    wakeLockRef.current?.release();
    wakeLockRef.current = null;
  }

  function ensureAudioContext() {
    if (ctxRef.current?.state === 'suspended') {
      ctxRef.current.resume().catch(() => {});
    }
  }

  // ── Continuous loudness measurement (EBU R128-style) ──
  const rmsAccumulatorRef = useRef({ sumSquares: 0, count: 0 });
  function startAutoGainAnalysis() {
    const analyser = analyserRef.current;
    const preGain = preGainRef.current;
    if (!analyser || !preGain) return;
    const bufLen = analyser.frequencyBinCount;
    const data = new Float32Array(bufLen);
    rmsAccumulatorRef.current = { sumSquares: 0, count: 0 };
    const measureInterval = setInterval(() => {
      if (!sRef.current.isPlaying) { clearInterval(measureInterval); return; }
      analyser.getFloatTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
      const rms = Math.sqrt(sum / data.length);
      const acc = rmsAccumulatorRef.current;
      acc.sumSquares += rms * rms;
      acc.count++;
      // After 4 seconds of measurement, apply normalization
      if (acc.count >= 8) {
        const avgRms = Math.sqrt(acc.sumSquares / acc.count);
        if (avgRms > 0.001) {
          const currentLufs = 20 * Math.log10(avgRms) + 3;
          setLoudnessDb(Math.round(currentLufs));
          const gainDb = -14 - currentLufs;
          const gainLinear = Math.pow(10, gainDb / 20);
          const clampedGain = Math.max(0.3, Math.min(2.5, gainLinear));
          if (ctxRef.current) preGain.gain.setTargetAtTime(clampedGain, ctxRef.current.currentTime, 1.0);
        }
        // Reset accumulator for next measurement window
        acc.sumSquares = 0;
        acc.count = 0;
      }
    }, 500);
  }

  // ── Spectrum visualizer loop (only when playing) ──
  useEffect(() => {
    let raf: number;
    const update = () => {
      const analyser = analyserRef.current;
      if (analyser && sRef.current.isPlaying) {
        const bufLen = analyser.frequencyBinCount;
        const data = new Uint8Array(bufLen);
        analyser.getByteFrequencyData(data);
        const step = Math.floor(bufLen / 64);
        const sampled = new Uint8Array(64);
        for (let i = 0; i < 64; i++) sampled[i] = data[i * step] || 0;
        setLiveSpectrum(sampled);
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ── Init: YouTube API + audio element ──────────────────────
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

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') ensureAudioContext();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', ensureAudioContext);

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
              onError: (e: any) => {
                if (e.data === 150 || e.data === 100) {
                  const t = sRef.current.currentTrack;
                  if (t?.youtubeId) playViaStream(t.youtubeId);
                  else { setAudioError('Playback unavailable'); setState(s => ({ ...s, isPlaying: false })); }
                }
              },
            },
          });
        } catch { ytFailedRef.current = true; }
      } else { ytFailedRef.current = true; }
    });

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', ensureAudioContext);
      ytPlayerRef.current?.destroy();
      div.remove();
      au.src = '';
      ctxRef.current?.close();
      releaseWakeLock();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    if (ytPlayerRef.current?.setVolume) ytPlayerRef.current.setVolume(volume * 100);
    setState(s => ({ ...s, volume }));
  }, [volume]);

  useEffect(() => {
    if (!sRef.current.soundEffects.spatialAudio) return;
    let raf: number;
    const animate = () => {
      const ctx = ctxRef.current;
      if (ctx && pannerRef.current && sRef.current.soundEffects.spatialAudio) {
        const panVal = Math.sin(Date.now() / 2500) * 0.12;
        pannerRef.current.pan.setTargetAtTime(panVal, ctx.currentTime, 0.1);
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [state.soundEffects.spatialAudio]);

  // Debounced localStorage save
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        const s = sRef.current;
        localStorage.setItem(LS_KEY, JSON.stringify({
          volume, shuffle: s.shuffle, repeat: s.repeat,
          audioQuality: s.audioQuality, crossfade: s.crossfade,
          crossfadeDuration: s.crossfadeDuration,
          equalizer: { ...s.equalizer }, soundEffects: { ...s.soundEffects },
          recentlyPlayed: s.recentlyPlayed,
        }));
      } catch {}
    }, 500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [volume, state.shuffle, state.repeat, state.audioQuality, state.crossfade, state.crossfadeDuration]);

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
    if (crossfadeTimerRef.current) { clearTimeout(crossfadeTimerRef.current); crossfadeTimerRef.current = null; }
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
    if (crossfadeTimerRef.current) { clearTimeout(crossfadeTimerRef.current); crossfadeTimerRef.current = null; }
    const idx = s.shuffle ? Math.floor(Math.random() * s.queue.length) : (s.queueIndex + 1) % s.queue.length;
    const t = s.queue[idx];
    if (t) doPlay(t, s.queue);
  }

  function doPrev() {
    const s = sRef.current;
    if (!s.queue.length) return;
    if (crossfadeTimerRef.current) { clearTimeout(crossfadeTimerRef.current); crossfadeTimerRef.current = null; }
    if (s.progress > 3) {
      if (streamingRef.current || useAudioSource(s.currentTrack)) { if (audioRef.current) audioRef.current.currentTime = 0; }
      else ytPlayerRef.current?.seekTo(0);
      setState(s => ({ ...s, progress: 0 })); return;
    }
    const idx = s.shuffle ? Math.floor(Math.random() * s.queue.length) : (s.queueIndex - 1 + s.queue.length) % s.queue.length;
    const t = s.queue[idx];
    if (t) doPlay(t, s.queue);
  }

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
    navigator.mediaSession.setActionHandler('seekto', (details) => { if (details.seekTime != null) seek(details.seekTime); });
    navigator.mediaSession.setActionHandler('stop', () => pause());
  }

  function fadeOutCurrent(duration: number): Promise<void> {
    return new Promise(resolve => {
      const au = audioRef.current;
      if (!au || !streamingRef.current) { resolve(); return; }
      const currentVol = sRef.current.volume;
      const steps = 20;
      const stepTime = (duration * 1000) / steps;
      let step = 0;
      const fade = setInterval(() => {
        step++;
        if (step >= steps) {
          clearInterval(fade);
          au.volume = 0;
          au.pause();
          au.volume = currentVol;
          resolve();
        } else {
          au.volume = currentVol * (1 - step / steps);
        }
      }, stepTime);
    });
  }

  async function fallbackToYouTube(track: Track, queue?: Track[]) {
    // Try YouTube search as fallback when preview fails
    try {
      const found = await findOnYouTube(track.title, track.artist.name);
      if (found) {
        track.youtubeId = found;
        // Try stream API
        try {
          const res = await fetch(`/api/stream?id=${found}`);
          const data = await res.json();
          if (data.url && !data.fallback) {
            streamingRef.current = true;
            const au = audioRef.current;
            if (au) {
              au.src = data.url;
              au.volume = sRef.current.volume;
              au.onerror = null;
              ensureAudioContext();
              au.onended = () => { streamingRef.current = false; onEnded(); };
              await au.play();
              startAutoGainAnalysis();
              setState(s => ({ ...s, currentTrack: track }));
              return;
            }
          }
        } catch {}

        // Fallback: YT IFrame
        if (playerReadyRef.current && ytPlayerRef.current) {
          try {
            ytPlayerRef.current.stopVideo();
            ytPlayerRef.current.loadVideoById(found, 0, 'default');
            audioRef.current!.src = '';
            setState(s => ({ ...s, currentTrack: track }));
            return;
          } catch {}
        }
        pendingPlayRef.current = found;
        setState(s => ({ ...s, currentTrack: track }));
        return;
      }
    } catch {}
    setAudioError('Track unavailable');
    setState(s => ({ ...s, isPlaying: false }));
  }

  async function doPlay(track: Track, q?: Track[]) {
    setAudioError(null);
    ensureAudioContext();
    requestWakeLock();
    if (crossfadeTimerRef.current) { clearTimeout(crossfadeTimerRef.current); crossfadeTimerRef.current = null; }
    if (pendingPlayTimeoutRef.current) { clearTimeout(pendingPlayTimeoutRef.current); pendingPlayTimeoutRef.current = null; }

    // ── STOP old playback FIRST to prevent "plays old song" bug ──
    if (streamingRef.current) {
      const au = audioRef.current;
      if (au) { au.pause(); au.src = ''; au.onended = null; au.onerror = null; }
      streamingRef.current = false;
    }
    if (ytPlayerRef.current) {
      try { ytPlayerRef.current.stopVideo(); } catch {}
    }
    pendingPlayRef.current = null;

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

    // ── YouTube track: try stream first (gets audio through our effects chain), fallback to IFrame ──
    if (track.youtubeId) {
      // Try stream API first for full audio processing through our chain
      streamingRef.current = false;
      try {
        const res = await fetch(`/api/stream?id=${track.youtubeId}`);
        const data = await res.json();
        if (data.url && !data.fallback) {
          streamingRef.current = true;
          const au = audioRef.current;
          if (au) {
            au.src = data.url;
            au.volume = sRef.current.volume;
            ensureAudioContext();
            au.onended = () => { streamingRef.current = false; onEnded(); };
            await au.play();
            startAutoGainAnalysis();
            return;
          }
        }
      } catch {}

      // Fallback: YouTube IFrame API
      streamingRef.current = false;
      if (playerReadyRef.current && ytPlayerRef.current) {
        try {
          ytPlayerRef.current.stopVideo();
          ytPlayerRef.current.loadVideoById(track.youtubeId, 0, 'default');
          audioRef.current!.src = '';
          if (state.audioQuality === 'high') ytPlayerRef.current.setPlaybackQuality('hd1080');
          else if (state.audioQuality === 'mid') ytPlayerRef.current.setPlaybackQuality('hd720');
          else ytPlayerRef.current.setPlaybackQuality('medium');
          return;
        } catch {}
      }
      if (ytFailedRef.current) {
        setAudioError('Playback unavailable');
        setState(s => ({ ...s, isPlaying: false }));
        return;
      }
      pendingPlayRef.current = track.youtubeId;
      // Timeout: if YT IFrame doesn't start within 8s, show error
      pendingPlayTimeoutRef.current = setTimeout(() => {
        if (pendingPlayRef.current === track.youtubeId) {
          pendingPlayRef.current = null;
          setAudioError('YouTube player unavailable. Try again.');
          setState(s => ({ ...s, isPlaying: false }));
        }
      }, 8000);
      return;
    }

    // ── No YouTube ID — try preview first (Deezer/Audius), then YouTube search ──

    // Priority 1: If track has a preview URL, play it directly (accurate match)
    if (track.preview && audioRef.current) {
      streamingRef.current = true;
      const au = audioRef.current;
      au.src = track.preview;
      au.volume = sRef.current.volume;
      ensureAudioContext();
      au.onended = () => { streamingRef.current = false; onEnded(); };
      au.onerror = () => {
        // CORS or network error — try YouTube search as fallback
        streamingRef.current = false;
        fallbackToYouTube(track, queue);
      };
      try {
        await au.play();
        startAutoGainAnalysis();
        return;
      } catch {
        // Playback failed — try YouTube search as fallback
        streamingRef.current = false;
      }
    }

    // Priority 2: Search YouTube for a matching video
    await fallbackToYouTube(track, queue);
  }

  async function playViaStream(youtubeId: string, queue?: Track[], idx?: number) {
    streamingRef.current = false;
    try {
      ytPlayerRef.current?.stopVideo();
      const res = await fetch(`/api/stream?id=${youtubeId}`);
      const data = await res.json();
      if (!data.url) throw new Error('No stream URL');
      if (data.fallback) {
        // Stream API returned YouTube URL (yt-dlp not available), try opening in new tab as last resort
        // But first, try playing via YT IFrame with the video ID
        if (playerReadyRef.current && ytPlayerRef.current) {
          try {
            ytPlayerRef.current.loadVideoById(youtubeId, 0, 'default');
            audioRef.current!.src = '';
            streamingRef.current = false;
            return;
          } catch {}
        }
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
        startAutoGainAnalysis();
      }
    } catch {
      // Stream failed, try YT IFrame as absolute last resort
      if (playerReadyRef.current && ytPlayerRef.current) {
        try {
          ytPlayerRef.current.loadVideoById(youtubeId, 0, 'default');
          audioRef.current!.src = '';
          streamingRef.current = false;
          return;
        } catch {}
      }
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

  const setAudioQuality = useCallback((q: string) => {
    setState(s => ({ ...s, audioQuality: q as any }));
    // If playing via YT IFrame, update quality immediately
    if (ytPlayerRef.current?.setPlaybackQuality && !streamingRef.current) {
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

  const toggleCrossfade = useCallback(() => setState(s => ({ ...s, crossfade: !s.crossfade })), []);
  const setCrossfadeDuration = useCallback((d: number) => setState(s => ({ ...s, crossfadeDuration: d })), []);

  const toggleFavorite = useCallback((trackId: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(trackId)) next.delete(trackId);
      else next.add(trackId);
      return next;
    });
  }, []);

  const isFavorite = useCallback((trackId: number) => {
    return favoritesRef.current.has(trackId);
  }, []);

  const setPlaybackSpeed = useCallback((speed: number) => {
    const clamped = Math.max(0.5, Math.min(2.0, speed));
    setState(s => ({ ...s, playbackSpeed: clamped }));
    if (audioRef.current) audioRef.current.playbackRate = clamped;
    if (ytPlayerRef.current?.setPlaybackRate) ytPlayerRef.current.setPlaybackRate(clamped);
  }, []);

  return (
    <PlayerContext.Provider value={{
      ...state, audioError, downloading, liveSpectrum, loudnessDb,
      play, pause, resume, next, prev, setVolume, seek,
      toggleShuffle, toggleRepeat, addToQueue, removeFromQueue, clearQueue,
      downloadCurrentTrack, setAudioQuality, setEqualizer, setSoundEffect,
      toggleCrossfade, setCrossfadeDuration, setPlaybackSpeed,
      toggleFavorite, isFavorite,
      audioContext: ctxRef.current,
      eqFilters: eqRefs.current,
      masterGain: masterGainRef.current,
      analyserNode: analyserRef.current,
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
