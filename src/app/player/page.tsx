'use client';

import { usePlayer, EQ_BANDS, EQ_PRESETS } from '@/lib/PlayerContext';
import Link from 'next/link';
import { useState, useCallback, useRef, useEffect } from 'react';

function formatTime(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function extractColors(imgSrc: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(['#D4AF37']); return; }
      canvas.width = 50;
      canvas.height = 50;
      ctx.drawImage(img, 0, 0, 50, 50);
      const data = ctx.getImageData(0, 0, 50, 50).data;
      const colors: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 16) {
        const r = Math.round(data[i] / 32) * 32;
        const g = Math.round(data[i + 1] / 32) * 32;
        const b = Math.round(data[i + 2] / 32) * 32;
        const key = `${r},${g},${b}`;
        colors[key] = (colors[key] || 0) + 1;
      }
      const sorted = Object.entries(colors).sort((a, b) => b[1] - a[1]);
      const result = sorted.slice(0, 3).map(([k]) => {
        const [r, g, b] = k.split(',').map(Number);
        return `rgb(${r},${g},${b})`;
      });
      resolve(result.length ? result : ['#D4AF37']);
    };
    img.onerror = () => resolve(['#D4AF37']);
    img.src = imgSrc;
  });
}

// ── Draggable Slider Component ────────────────────────────────
function DragSlider({ value, onChange, min = 0, max = 1, color = '#D4AF37', height = false, label }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; color?: string; height?: boolean; label?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const pct = ((value - min) / (max - min)) * 100;

  const updateValue = useCallback((clientX: number, clientY: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    let ratio: number;
    if (height) {
      ratio = 1 - ((clientY - rect.top) / rect.height);
    } else {
      ratio = (clientX - rect.left) / rect.width;
    }
    const val = min + Math.max(0, Math.min(1, ratio)) * (max - min);
    onChange(val);
  }, [min, max, onChange, height]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      updateValue(clientX, clientY);
    };
    const onEnd = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchend', onEnd);
    };
  }, [dragging, updateValue]);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    updateValue(clientX, clientY);
  }, [updateValue]);

  if (height) {
    return (
      <div ref={trackRef} className="relative w-8 h-32 cursor-pointer group" onMouseDown={handleStart} onTouchStart={handleStart}>
        <div className="absolute inset-0 w-full h-full rounded-full bg-white/[0.06] overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full rounded-full transition-all"
            style={{ height: `${pct}%`, background: `linear-gradient(to top, ${color}60, ${color})` }} />
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-lg transition-all"
          style={{
            bottom: `calc(${pct}% - 8px)`,
            boxShadow: dragging ? `0 0 12px ${color}` : '0 2px 8px rgba(0,0,0,0.4)',
            transform: `translateX(-50%) scale(${dragging ? 1.2 : 1})`,
          }} />
      </div>
    );
  }

  return (
    <div ref={trackRef} className="relative w-full h-6 flex items-center cursor-pointer group" onMouseDown={handleStart} onTouchStart={handleStart}>
      <div className="absolute w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
      </div>
      <div className="absolute w-3.5 h-3.5 rounded-full bg-white shadow-lg transition-all"
        style={{
          left: `${pct}%`,
          transform: `translateX(-50%) scale(${dragging ? 1.25 : 1})`,
          boxShadow: dragging ? `0 0 12px ${color}` : '0 2px 8px rgba(0,0,0,0.4)',
        }} />
    </div>
  );
}

export default function PlayerPage() {
  const {
    currentTrack, isPlaying, queue, queueIndex,
    progress, duration, volume, audioQuality, playbackSpeed,
    pause, resume, next, prev,
    setVolume, seek, toggleShuffle, toggleRepeat,
    shuffle, repeat, soundEffects, equalizer,
    setSoundEffect, setEqualizer, setAudioQuality,
    downloadCurrentTrack, downloading, audioError,
    liveSpectrum, loudnessDb, crossfade, crossfadeDuration,
    toggleCrossfade, setCrossfadeDuration, setPlaybackSpeed,
    toggleFavorite, isFavorite,
  } = usePlayer();
  const [showQueue, setShowQueue] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [localPct, setLocalPct] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [dominantColor, setDominantColor] = useState('#D4AF37');
  const [accentColor, setAccentColor] = useState('#FFBF00');
  const [activeEqPreset, setActiveEqPreset] = useState(equalizer.preset || 'Flat');
  const progressRef = useRef<HTMLDivElement>(null);

  // Sleep timer
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(0);
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSleepTimer = useCallback((minutes: number) => {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    const endTime = Date.now() + minutes * 60 * 1000;
    setSleepTimer(minutes);
    setSleepTimerRemaining(minutes * 60);
    sleepTimerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setSleepTimerRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(sleepTimerRef.current!);
        pause();
        setSleepTimer(null);
        setSleepTimerRemaining(0);
      }
    }, 1000);
  }, [pause]);

  const cancelSleepTimer = useCallback(() => {
    if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
    setSleepTimer(null);
    setSleepTimerRemaining(0);
  }, []);

  useEffect(() => {
    return () => { if (sleepTimerRef.current) clearInterval(sleepTimerRef.current); };
  }, []);

  const pct = duration > 0 ? (progress / duration) * 100 : 0;
  const displayPct = seeking ? localPct : pct;

  const artSrc = currentTrack?.youtubeId
    ? `https://i.ytimg.com/vi/${currentTrack.youtubeId}/hqdefault.jpg`
    : currentTrack?.album.cover_medium;

  useEffect(() => {
    if (!artSrc) return;
    extractColors(artSrc).then(colors => {
      setDominantColor(colors[0] || '#D4AF37');
      setAccentColor(colors[1] || colors[0] || '#FFBF00');
    });
  }, [artSrc]);

  const updateSeekPosition = useCallback((clientX: number) => {
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((clientX - rect.left) / rect.width) * 100;
    setLocalPct(Math.max(0, Math.min(100, x)));
  }, []);

  const handleSeekStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setSeeking(true);
    updateSeekPosition(clientX);
    setShowTooltip(true);
  }, [updateSeekPosition]);

  const localPctRef = useRef(localPct);
  localPctRef.current = localPct;

  useEffect(() => {
    if (!seeking) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      updateSeekPosition(clientX);
    };
    const onEnd = () => {
      seek((localPctRef.current / 100) * duration);
      setSeeking(false);
      setShowTooltip(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchend', onEnd);
    };
  }, [seeking, duration, seek, updateSeekPosition]);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case 'ArrowUp': e.preventDefault(); setVolume(Math.min(1, volume + 0.05)); break;
        case 'ArrowDown': e.preventDefault(); setVolume(Math.max(0, volume - 0.05)); break;
        case ' ': e.preventDefault(); isPlaying ? pause() : resume(); break;
        case 'ArrowRight': e.preventDefault(); next(); break;
        case 'ArrowLeft': e.preventDefault(); prev(); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPlaying, pause, resume, next, prev, setVolume, volume]);

  if (!currentTrack) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="text-center scale-in">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl glass-card flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-zinc-600">music_note</span>
          </div>
          <p className="text-zinc-300 text-lg mb-1 font-medium">No track playing</p>
          <p className="text-zinc-500 text-sm mb-6">Pick a song to get started</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#FFBF00] text-black rounded-full text-sm font-semibold hover:shadow-xl hover:shadow-[#D4AF37]/30 transition-all duration-300 active:scale-95 gold-glow-btn">
            <span className="material-symbols-outlined text-lg">play_arrow</span>
            Browse Music
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-black overflow-hidden selection:bg-primary/30 font-body-md">
      <style jsx>{`
        @keyframes wave-slow { 0% { transform: translateX(0) scaleY(1); } 50% { transform: translateX(-25%) scaleY(1.3); } 100% { transform: translateX(-50%) scaleY(1); } }
        @keyframes wave-slow-2 { 0% { transform: translateX(0) scaleY(1); } 50% { transform: translateX(25%) scaleY(0.7); } 100% { transform: translateX(50%) scaleY(1); } }
        @keyframes glow-pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }
        @keyframes ring-spin { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes ring-spin-reverse { from { transform: translate(-50%, -50%) rotate(360deg); } to { transform: translate(-50%, -50%) rotate(0deg); } }
        @keyframes vinyl-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bokeh-float { 0%, 100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.3; } 25% { transform: translateY(-20px) translateX(10px) scale(1.1); opacity: 0.5; } 50% { transform: translateY(-10px) translateX(-5px) scale(0.9); opacity: 0.4; } 75% { transform: translateY(-25px) translateX(-10px) scale(1.05); opacity: 0.35; } }
        @keyframes spectrum-bar { 0%, 100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }
        @keyframes breathe-ring { 0%, 100% { transform: scale(1); opacity: 0.15; } 50% { transform: scale(1.05); opacity: 0.3; } }
        @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes shimmer-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>

      {/* === BACKGROUND LAYERS === */}
      <div className="fixed inset-0 z-0 bg-black">
        {artSrc && (
          <div className="absolute inset-0 opacity-40 blur-3xl scale-125"
            style={{ backgroundImage: `url(${artSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        )}
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ background: `linear-gradient(135deg, ${dominantColor}15, transparent 40%, ${accentColor}10, transparent 70%, ${dominantColor}08)`, backgroundSize: '400% 400%', animation: 'gradient-shift 8s ease infinite' }} />
        <div className="absolute bottom-0 left-0 w-[200%] h-40 opacity-[0.06] pointer-events-none"
          style={{ background: `repeating-linear-gradient(90deg, transparent, transparent 40px, ${dominantColor} 40px, ${dominantColor} 42px)`, animation: 'wave-slow 12s ease-in-out infinite' }} />
        <div className="absolute bottom-10 left-0 w-[200%] h-32 opacity-[0.04] pointer-events-none"
          style={{ background: `repeating-linear-gradient(90deg, transparent, transparent 60px, ${accentColor} 60px, ${accentColor} 61px)`, animation: 'wave-slow-2 16s ease-in-out infinite' }} />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${dominantColor}20 0%, transparent 70%)`, opacity: 0.3, animation: 'glow-pulse 3s ease-in-out infinite', filter: 'blur(80px)' }} />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="absolute rounded-full pointer-events-none"
            style={{ width: `${6 + (i % 3) * 4}px`, height: `${6 + (i % 3) * 4}px`, backgroundColor: i % 2 === 0 ? `${dominantColor}40` : `${accentColor}30`, top: `${15 + (i * 11) % 70}%`, left: `${10 + (i * 13) % 80}%`, animation: `bokeh-float ${isPlaying ? (4 + (i % 3) * 2) : (8 + (i % 3) * 3)}s ease-in-out infinite ${i * 0.5}s`, filter: 'blur(2px)', opacity: isPlaying ? 1 : 0.5 }} />
        ))}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)' }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-5 py-5">
        <Link href="/" className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/[0.06] flex items-center justify-center active:scale-90 transition-all hover:bg-white/10">
          <span className="material-symbols-outlined text-[22px] text-zinc-300">expand_more</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="flex items-end gap-[2px] h-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="w-[2px] rounded-full bg-[#D4AF37] eq-bar" style={{ height: isPlaying ? undefined : '4px', animationPlayState: isPlaying ? 'running' : 'paused' }} />
            ))}
          </div>
          <div className="text-[10px] tracking-[0.5em] text-zinc-400 uppercase font-medium">Now Playing</div>
        </div>
        <button onClick={() => setShowMenu(!showMenu)} className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/[0.06] flex items-center justify-center active:scale-90 transition-all hover:bg-white/10">
          <span className="material-symbols-outlined text-[22px] text-zinc-300">more_vert</span>
        </button>
      </header>

      {/* Menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setShowMenu(false)} />
          <div className="fixed top-20 right-5 z-[60] glass-card rounded-2xl p-2 min-w-[200px] shadow-2xl shadow-black/60 scale-in">
            <button onClick={() => { setDrawerOpen(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all active:scale-[0.98]">
              <span className="material-symbols-outlined text-[#D4AF37] text-lg">graphic_eq</span>
              Audio Experience
            </button>
            <button onClick={() => { setShowQueue(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all active:scale-[0.98]">
              <span className="material-symbols-outlined text-zinc-400 text-lg">queue_music</span>
              Queue
            </button>
            <div className="h-px bg-white/[0.04] my-1" />
            <button onClick={() => { downloadCurrentTrack(); setShowMenu(false); }} disabled={downloading} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all disabled:opacity-40 active:scale-[0.98]">
              {downloading ? <div className="w-4 h-4 rounded-full border border-zinc-500/30 border-t-zinc-300 animate-spin" /> : <span className="material-symbols-outlined text-zinc-400 text-lg">download</span>}
              {downloading ? 'Saving...' : 'Download'}
            </button>
          </div>
        </>
      )}

      {/* Main content */}
      <main className="relative z-30 flex flex-col flex-1 px-6 md:px-10 pt-20 pb-8">
        {/* Album Art */}
        <div className="flex-1 flex items-center justify-center relative py-4">
          <>
            <div className="absolute w-[300px] md:w-[340px] h-[300px] md:h-[340px] rounded-full pointer-events-none"
              style={{ border: `2px solid ${dominantColor}15`, borderTop: `2px solid ${dominantColor}60`, borderRight: `2px solid ${dominantColor}20`, animation: `ring-spin ${isPlaying ? '4s' : '20s'} linear infinite`, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
            <div className="absolute w-[320px] md:w-[360px] h-[320px] md:h-[360px] rounded-full pointer-events-none"
              style={{ border: `1px solid ${accentColor}10`, borderBottom: `1px solid ${accentColor}40`, animation: `ring-spin-reverse ${isPlaying ? '6s' : '25s'} linear infinite`, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
            <div className="absolute w-[280px] md:w-[320px] h-[280px] md:h-[320px] rounded-full pointer-events-none"
              style={{ border: `3px solid ${dominantColor}25`, animation: 'breathe-ring 3s ease-in-out infinite', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
          </>
          <div className="absolute pointer-events-none"
            style={{ width: '260px', height: '260px', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: isPlaying ? 0.15 : 0.08, transition: 'opacity 0.5s' }}>
            <div className="w-full h-full rounded-full"
              style={{ background: `conic-gradient(from 0deg, ${dominantColor}40, #111 20%, ${dominantColor}20 40%, #0a0a0a 60%, ${dominantColor}30 80%, #111 100%)`, animation: `vinyl-spin ${isPlaying ? '4s' : '20s'} linear infinite`, boxShadow: `inset 0 0 40px rgba(0,0,0,0.8), 0 0 30px ${dominantColor}10` }}>
              <div className="absolute inset-[15%] rounded-full border border-white/5" />
              <div className="absolute inset-[25%] rounded-full border border-white/5" />
              <div className="absolute inset-[35%] rounded-full border border-white/5" />
              <div className="absolute inset-[38%] rounded-full" style={{ background: `radial-gradient(circle, ${dominantColor}60, ${dominantColor}30)`, boxShadow: `inset 0 0 10px ${dominantColor}40` }} />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center gap-[3px] pointer-events-none">
            {[0.1, 0.3, 0.5, 0.2, 0.4, 0.6, 0.15, 0.35].map((d, i) => (
              <div key={i} className="w-[3px] rounded-full transition-all duration-500"
                style={{ height: isPlaying ? `${30 + (i % 4) * 15}%` : `${10 + (i % 3) * 5}%`, background: `linear-gradient(to top, ${dominantColor}30, ${dominantColor})`, opacity: isPlaying ? 0.25 : 0.12, animation: `spectrum-bar 1.2s ease-in-out ${d}s infinite` }} />
            ))}
          </div>
          <div className="relative">
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[80%] h-16 rounded-full pointer-events-none"
              style={{ background: dominantColor, filter: 'blur(40px)', opacity: isPlaying ? 0.25 : 0.15, animation: 'glow-pulse 3s ease-in-out infinite' }} />
            <div className="w-[240px] h-[240px] md:w-[280px] md:h-[280px] rounded-2xl overflow-hidden relative group"
              style={{ boxShadow: isPlaying ? `0 25px 60px rgba(0,0,0,0.6), 0 0 80px ${dominantColor}25` : '0 20px 50px rgba(0,0,0,0.5)', border: `1px solid ${isPlaying ? dominantColor + '30' : 'rgba(255,255,255,0.06)'}` }}>
              {artSrc ? <img src={artSrc} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-zinc-800/50"><span className="material-symbols-outlined text-6xl text-zinc-700">music_note</span></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                <div className="absolute inset-0 -translate-x-full" style={{ background: `linear-gradient(90deg, transparent, ${dominantColor}08, transparent)`, animation: 'shimmer-slide 3s ease-in-out infinite' }} />
              </div>
              {isPlaying && (
                <div className="absolute bottom-3 right-3 flex items-center gap-[3px] bg-black/50 backdrop-blur-md rounded-full px-2.5 py-1.5 border border-white/[0.06]">
                  {[2, 3, 2].map((h, i) => <div key={i} className="w-[3px] rounded-full animate-pulse-slow" style={{ height: `${h * 4}px`, backgroundColor: dominantColor, animationDelay: `${i * 0.15}s` }} />)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Spectrum - Real-time frequency data */}
        <div className="flex items-end justify-center gap-[2px] h-8 mb-2 pointer-events-none">
          {(liveSpectrum.length > 0 ? Array.from(liveSpectrum) : Array.from({ length: 64 }, () => 0)).slice(0, 32).map((val, i) => {
            const height = isPlaying ? (val / 255) * 100 : 15 + (i % 4) * 8;
            const opacity = isPlaying ? 0.6 + val / 255 * 0.4 : 0.2;
            return (
              <div key={i} className="w-[2px] rounded-full origin-bottom transition-all"
                style={{
                  height: `${Math.max(3, height)}%`,
                  backgroundColor: i < 10 ? dominantColor : i < 22 ? `${dominantColor}80` : `${dominantColor}40`,
                  opacity,
                  transition: isPlaying ? 'height 0.08s ease-out' : 'height 0.3s ease',
                }} />
            );
          })}
        </div>

        {/* Track Info */}
        <div className="flex items-end justify-between mt-5">
          <div className="min-w-0 flex-1 pr-4">
            <h1 className="font-headline-md text-white tracking-tight leading-tight text-2xl md:text-3xl truncate">{currentTrack.title}</h1>
            <p className="uppercase tracking-[0.25em] text-[11px] mt-1.5 font-bold" style={{ color: `${dominantColor}99` }}>{currentTrack.artist.name}</p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mt-2"
              style={{ backgroundColor: `${dominantColor}12`, border: `1px solid ${dominantColor}30` }}>
              <span className="material-symbols-outlined text-[12px]" style={{ color: dominantColor, fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              <span className="text-[9px] font-bold tracking-[0.1em] uppercase" style={{ color: `${dominantColor}CC` }}>HiFi • Stream Quality</span>
            </div>
          </div>
          <button onClick={() => currentTrack && toggleFavorite(currentTrack.id)} className="w-12 h-12 rounded-full bg-white/5 border border-white/[0.06] flex items-center justify-center active:scale-90 transition-all hover:bg-white/10 flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]" style={{ color: currentTrack && isFavorite(currentTrack.id) ? '#ef4444' : dominantColor, fontVariationSettings: "'FILL' 1" }}>favorite</span>
          </button>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div ref={progressRef} className="relative w-full h-1 cursor-pointer group rounded-full"
            onMouseDown={handleSeekStart} onTouchStart={handleSeekStart}>
            <div className="absolute inset-0 rounded-full bg-white/[0.06]" />
            <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-100"
              style={{ width: `${displayPct}%`, background: `linear-gradient(90deg, ${dominantColor}, ${accentColor})` }} />
            <div className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)] transition-all duration-100 ${seeking ? 'scale-125 opacity-100' : 'scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100'}`}
              style={{ left: `${displayPct}%` }} />
            {showTooltip && (
              <div className="absolute -top-10 -translate-x-1/2 glass-card rounded-lg px-2.5 py-1 shadow-xl pointer-events-none scale-in"
                style={{ left: `${displayPct}%` }}>
                <span className="text-[11px] font-mono font-medium" style={{ color: dominantColor }}>{formatTime((localPct / 100) * duration)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between mt-2.5 text-[10px] text-zinc-500 tracking-[0.15em] font-medium tabular-nums">
            <span>{formatTime(progress)}</span><span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-7">
          <button onClick={toggleShuffle} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 ${shuffle ? 'bg-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`} style={shuffle ? { color: dominantColor } : undefined}>
            <span className="material-symbols-outlined text-[22px]">shuffle</span>
          </button>
          <div className="flex items-center gap-5">
            <button onClick={prev} className="w-12 h-12 md:w-14 md:h-14 rounded-full glass-btn flex items-center justify-center active:scale-90 transition-all group hover:bg-white/[0.08] hover:border-white/[0.12]">
              <span className="material-symbols-outlined text-[28px] md:text-[30px] text-zinc-300 group-hover:text-white transition-colors">skip_previous</span>
            </button>
            <button onClick={() => (isPlaying ? pause() : resume())}
              className="w-[72px] h-[72px] md:w-20 md:h-20 rounded-full flex items-center justify-center active:scale-90 transition-all duration-300"
              style={{ background: `radial-gradient(circle, ${dominantColor} 0%, ${dominantColor}CC 100%)`, boxShadow: isPlaying ? `0 0 40px ${dominantColor}60, 0 0 80px ${dominantColor}20` : `0 0 25px ${dominantColor}40` }}>
              <span className="material-symbols-outlined text-[40px] md:text-[44px] text-black" style={{ fontVariationSettings: "'FILL' 1" }}>{isPlaying ? 'pause' : 'play_arrow'}</span>
            </button>
            <button onClick={next} className="w-12 h-12 md:w-14 md:h-14 rounded-full glass-btn flex items-center justify-center active:scale-90 transition-all group hover:bg-white/[0.08] hover:border-white/[0.12]">
              <span className="material-symbols-outlined text-[28px] md:text-[30px] text-zinc-300 group-hover:text-white transition-colors">skip_next</span>
            </button>
          </div>
          <button onClick={toggleRepeat} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 relative ${repeat !== 'off' ? 'bg-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`} style={repeat !== 'off' ? { color: dominantColor } : undefined}>
            <span className="material-symbols-outlined text-[22px]">repeat</span>
            {repeat === 'one' && <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold" style={{ color: dominantColor }}>1</span>}
          </button>
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-between mt-7">
          <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-2.5 px-4 py-2 rounded-full glass-btn active:scale-95 transition-all duration-300 hover:bg-white/[0.08]" style={{ borderColor: `${dominantColor}20` }}>
            <span className="material-symbols-outlined text-[18px]" style={{ color: dominantColor }}>graphic_eq</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Audio Experience</span>
          </button>
          <div className="flex items-center gap-2">
            {/* Sleep Timer */}
            {sleepTimer ? (
              <button onClick={cancelSleepTimer} className="flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-300 active:scale-90"
                style={{ backgroundColor: `${dominantColor}15`, border: `1px solid ${dominantColor}30` }}>
                <span className="material-symbols-outlined text-[16px] animate-pulse" style={{ color: dominantColor, fontVariationSettings: "'FILL' 1" }}>bedtime</span>
                <span className="text-[10px] font-mono font-bold" style={{ color: dominantColor }}>
                  {Math.floor(sleepTimerRemaining / 60)}:{(sleepTimerRemaining % 60).toString().padStart(2, '0')}
                </span>
              </button>
            ) : (
              <button onClick={() => startSleepTimer(30)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-all duration-300 active:scale-90 text-zinc-400 hover:text-white group relative">
                <span className="material-symbols-outlined text-[22px] group-hover:text-[#D4AF37] transition-colors">bedtime</span>
              </button>
            )}
            <button onClick={() => setShowQueue(true)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-all duration-300 active:scale-90 text-zinc-400 hover:text-white">
              <span className="material-symbols-outlined text-[22px]">queue_music</span>
            </button>
            <button onClick={() => downloadCurrentTrack()} disabled={downloading} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-all duration-300 active:scale-90 text-zinc-400 hover:text-white disabled:opacity-40">
              {downloading ? <div className="w-4 h-4 rounded-full border border-zinc-500/30 border-t-zinc-300 animate-spin" /> : <span className="material-symbols-outlined text-[22px]">download</span>}
            </button>
          </div>
        </div>

        {/* Sleep Timer Picker */}
        {sleepTimer === null && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-[9px] text-zinc-600 uppercase tracking-[0.2em]">Sleep in:</span>
            {[15, 30, 45, 60, 90].map(m => (
              <button key={m} onClick={() => startSleepTimer(m)}
                className="px-2.5 py-1 rounded-full text-[9px] font-bold border border-white/10 text-zinc-500 hover:border-white/20 hover:text-white transition-all active:scale-95">
                {m}m
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Drawer backdrop */}
      <div className={`fixed inset-0 z-[50] bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setDrawerOpen(false)} />

      {/* Audio Excellence Drawer */}
      <div className={`fixed bottom-0 left-0 w-full z-[55] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="glass-panel rounded-t-[32px] md:rounded-t-[40px] px-6 md:px-8 pt-4 pb-10 shadow-[0_-20px_60px_rgba(0,0,0,0.5)] max-h-[85vh] overflow-y-auto">
          <div className="flex flex-col items-center cursor-pointer mb-6" onClick={() => setDrawerOpen(false)}>
            <div className="w-10 h-1 bg-white/10 rounded-full" />
          </div>
          <div className="max-w-md mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-xl md:text-2xl" style={{ color: dominantColor }}>Audio Experience</h3>
              <span className="material-symbols-outlined text-zinc-500 text-[24px]">settings</span>
            </div>

            {/* Volume - DRAGGABLE */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium">Volume</span>
                <span className="text-[11px] font-mono" style={{ color: dominantColor }}>{Math.round(volume * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-zinc-500 text-[20px]">volume_down</span>
                <div className="flex-1">
                  <DragSlider value={volume} onChange={setVolume} min={0} max={1} color={dominantColor} />
                </div>
                <span className="material-symbols-outlined text-zinc-500 text-[20px]">volume_up</span>
              </div>
            </div>

            {/* Sound Effects Panel */}
            <div className="space-y-3">
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium">Sound Effects</p>

              {/* Bass Boost */}
              <div className="p-4 rounded-2xl glass-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg" style={{ color: dominantColor }}>bass_3</span>
                    <span className="text-[12px] text-white font-medium">Bass Boost</span>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: dominantColor }}>{Math.round(soundEffects.bassBoost * 100)}%</span>
                </div>
                <DragSlider value={soundEffects.bassBoost} onChange={(v) => setSoundEffect('bassBoost', v)} min={0} max={1} color={dominantColor} />
              </div>

              {/* Vocal Boost */}
              <div className="p-4 rounded-2xl glass-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg" style={{ color: dominantColor }}>record_voice_over</span>
                    <span className="text-[12px] text-white font-medium">Vocal Clarity</span>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: dominantColor }}>{Math.round(soundEffects.vocalBoost * 100)}%</span>
                </div>
                <DragSlider value={soundEffects.vocalBoost} onChange={(v) => setSoundEffect('vocalBoost', v)} min={0} max={1} color={dominantColor} />
              </div>

              {/* Reverb */}
              <div className="p-4 rounded-2xl glass-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg" style={{ color: dominantColor }}>surround_sound</span>
                    <span className="text-[12px] text-white font-medium">Reverb</span>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: dominantColor }}>{Math.round(soundEffects.reverb * 100)}%</span>
                </div>
                <DragSlider value={soundEffects.reverb} onChange={(v) => setSoundEffect('reverb', v)} min={0} max={1} color={dominantColor} />
              </div>

              {/* Spatial Audio + Night Mode row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Spatial Audio */}
                <div className="p-4 rounded-2xl glass-card">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="material-symbols-outlined text-lg" style={{ color: dominantColor }}>spatial_audio</span>
                    <span className="text-[12px] text-white font-medium">Spatial</span>
                  </div>
                  <button onClick={() => setSoundEffect('spatialAudio', !soundEffects.spatialAudio)}
                    className="w-full h-8 rounded-full relative flex items-center px-1.5 border transition-all duration-300"
                    style={{ backgroundColor: soundEffects.spatialAudio ? dominantColor : 'rgba(255,255,255,0.1)', borderColor: soundEffects.spatialAudio ? dominantColor : 'rgba(255,255,255,0.1)' }}>
                    <div className="w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
                      style={{ marginLeft: soundEffects.spatialAudio ? 'auto' : '0' }} />
                  </button>
                </div>

                {/* Night Mode */}
                <div className="p-4 rounded-2xl glass-card">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="material-symbols-outlined text-lg" style={{ color: dominantColor }}>nightlight</span>
                    <span className="text-[12px] text-white font-medium">Night</span>
                  </div>
                  <button onClick={() => setSoundEffect('nightMode', !soundEffects.nightMode)}
                    className="w-full h-8 rounded-full relative flex items-center px-1.5 border transition-all duration-300"
                    style={{ backgroundColor: soundEffects.nightMode ? dominantColor : 'rgba(255,255,255,0.1)', borderColor: soundEffects.nightMode ? dominantColor : 'rgba(255,255,255,0.1)' }}>
                    <div className="w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
                      style={{ marginLeft: soundEffects.nightMode ? 'auto' : '0' }} />
                  </button>
                </div>
              </div>

              {/* Stereo Width */}
              <div className="p-4 rounded-2xl glass-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg" style={{ color: dominantColor }}>swap_horiz</span>
                    <span className="text-[12px] text-white font-medium">Stereo Width</span>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: dominantColor }}>{Math.round((soundEffects.stereoWidth ?? 0.5) * 100)}%</span>
                </div>
                <DragSlider value={soundEffects.stereoWidth ?? 0.5} onChange={(v) => setSoundEffect('stereoWidth', v)} min={0} max={1} color={dominantColor} />
              </div>

              {/* Crossfade */}
              <div className="p-4 rounded-2xl glass-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg" style={{ color: dominantColor }}>blur_on</span>
                    <span className="text-[12px] text-white font-medium">Crossfade</span>
                  </div>
                  <button onClick={toggleCrossfade}
                    className="w-10 h-6 rounded-full relative flex items-center px-1 border transition-all duration-300"
                    style={{ backgroundColor: crossfade ? dominantColor : 'rgba(255,255,255,0.1)', borderColor: crossfade ? dominantColor : 'rgba(255,255,255,0.1)' }}>
                    <div className="w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300"
                      style={{ marginLeft: crossfade ? 'auto' : '0' }} />
                  </button>
                </div>
                {crossfade && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] text-zinc-500">Duration</span>
                      <span className="text-[10px] font-mono" style={{ color: dominantColor }}>{crossfadeDuration}s</span>
                    </div>
                    <DragSlider value={crossfadeDuration} onChange={setCrossfadeDuration} min={1} max={12} color={dominantColor} />
                  </div>
                )}
              </div>
            </div>

            {/* 10-Band Equalizer - FULLY INTERACTIVE */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium">Equalizer</p>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ backgroundColor: `${dominantColor}15`, color: dominantColor }}>{equalizer.preset}</span>
              </div>

              {/* Preset Buttons */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 hide-scrollbar">
                {Object.keys(EQ_PRESETS).map((name) => (
                  <button key={name} onClick={() => {
                    const idx = Object.keys(EQ_PRESETS).indexOf(name);
                    setEqualizer('preset', idx);
                    setActiveEqPreset(name);
                  }}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-semibold border transition-all duration-200 ${
                      equalizer.preset === name ? 'text-black' : 'text-zinc-400 border-white/10 hover:border-white/20'
                    }`}
                    style={equalizer.preset === name ? { backgroundColor: dominantColor, borderColor: dominantColor } : {}}>
                    {name}
                  </button>
                ))}
              </div>

              {/* EQ Sliders */}
              <div className="flex justify-between items-end gap-1.5 px-1">
                {EQ_BANDS.map((band) => {
                  const val = equalizer[band.key as keyof typeof equalizer] as number;
                  return (
                    <div key={band.key} className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-[9px] font-mono tabular-nums" style={{ color: val > 0 ? dominantColor : val < 0 ? '#ef4444' : 'rgb(113,113,122)' }}>
                        {val > 0 ? '+' : ''}{val.toFixed(0)}
                      </div>
                      <DragSlider value={val} onChange={(v) => setEqualizer(band.key, v)} min={-12} max={12} color={dominantColor} height />
                      <span className="text-[7px] text-zinc-600 font-medium tracking-tight">{band.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Audio Quality */}
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium mb-3">Stream Quality</p>
              <div className="flex gap-2">
                {(['low', 'mid', 'high'] as const).map(q => (
                  <button key={q} onClick={() => setAudioQuality(q)}
                    className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider border transition-all duration-200 ${
                      audioQuality === q ? 'text-black border-transparent' : 'text-zinc-400 border-white/10 hover:border-white/20'
                    }`}
                    style={audioQuality === q ? { backgroundColor: dominantColor } : {}}>
                    {q === 'low' ? 'Normal' : q === 'mid' ? 'High' : 'Lossless'}
                  </button>
                ))}
              </div>
            </div>

            {/* Playback Speed */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium">Playback Speed</p>
                <span className="text-[11px] font-mono" style={{ color: dominantColor }}>{playbackSpeed}x</span>
              </div>
              <div className="flex gap-2">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(s => (
                  <button key={s} onClick={() => setPlaybackSpeed(s)}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all duration-200 ${
                      playbackSpeed === s ? 'text-black border-transparent' : 'text-zinc-400 border-white/10 hover:border-white/20'
                    }`}
                    style={playbackSpeed === s ? { backgroundColor: dominantColor } : {}}>
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-3 pt-4 border-t border-white/[0.04]">
              <div className="flex items-center justify-center gap-3 text-zinc-600">
                <span className="material-symbols-outlined text-[18px]">headphones</span>
                <span className="text-[9px] uppercase tracking-[0.3em] font-medium">Aurelia HiFi 48kHz • Active</span>
              </div>
              {isPlaying && (
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Loudness</span>
                    <span className="text-[11px] font-mono font-bold" style={{ color: loudnessDb > -8 ? '#ef4444' : loudnessDb > -18 ? dominantColor : '#3b82f6' }}>
                      {loudnessDb} LUFS
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Source</span>
                    <span className="text-[11px] font-mono font-bold" style={{ color: '#10b981' }}>
                      Opus
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Queue overlay */}
      {showQueue && (
        <div className="fixed inset-0 z-[55] bg-black/95 backdrop-blur-2xl fade-in flex flex-col">
          <div className="flex items-center justify-between px-5 pt-12 pb-3">
            <div>
              <h3 className="text-sm text-zinc-300 font-[family-name:var(--font-serif)]">Up Next</h3>
              <p className="text-[10px] text-zinc-600 mt-0.5">{queue.length} tracks</p>
            </div>
            <button onClick={() => setShowQueue(false)} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-90 border border-white/[0.06]">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-0.5">
            {queue.map((track, i) => {
              const trackSrc = track.youtubeId ? `https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg` : (track.album.cover_small || track.album.cover_medium);
              return (
                <div key={`${track.source || 'queue'}-${track.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl transition-all border border-transparent"
                  style={i === queueIndex ? { backgroundColor: `${dominantColor}0D`, borderColor: `${dominantColor}25` } : {}} >
                  <span className="w-5 text-center text-[11px] font-mono" style={{ color: i === queueIndex ? dominantColor : 'rgb(113,113,122)' }}>{i + 1}</span>
                  {trackSrc ? <img src={trackSrc} alt="" className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center"><span className="material-symbols-outlined text-zinc-600 text-sm">music_note</span></div>}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium truncate" style={{ color: i === queueIndex ? dominantColor : 'rgb(228,228,231)' }}>{track.title}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{track.artist.name}</p>
                  </div>
                  {i === queueIndex && <span className="material-symbols-outlined text-sm" style={{ color: dominantColor }}>volume_up</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
