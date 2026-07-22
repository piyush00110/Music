'use client';

import { usePlayer, EQ_BANDS, EQ_PRESETS } from '@/lib/PlayerContext';
import Link from 'next/link';
import { useState, useCallback, useRef, useEffect } from 'react';

function formatTime(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function DragSlider({ value, onChange, min = 0, max = 1, color = '#fc3c44', height = false }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; color?: string; height?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const pct = ((value - min) / (max - min)) * 100;

  const updateValue = useCallback((clientX: number, clientY: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = height ? 1 - ((clientY - rect.top) / rect.height) : (clientX - rect.left) / rect.width;
    onChange(min + Math.max(0, Math.min(1, ratio)) * (max - min));
  }, [min, max, onChange, height]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
      updateValue(cx, cy);
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
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
    updateValue(cx, cy);
  }, [updateValue]);

  if (height) {
    return (
      <div ref={trackRef} className="relative w-8 h-28 cursor-pointer group" onMouseDown={handleStart} onTouchStart={handleStart}>
        <div className="absolute inset-0 w-full h-full rounded-full bg-black/[0.06] overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full rounded-full transition-all" style={{ height: `${pct}%`, background: color }} />
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[var(--accent)] shadow-md transition-all"
          style={{ bottom: `calc(${pct}% - 7px)`, boxShadow: dragging ? `0 0 10px ${color}` : '0 2px 6px rgba(0,0,0,0.15)', transform: `translateX(-50%) scale(${dragging ? 1.2 : 1})` }} />
      </div>
    );
  }

  return (
    <div ref={trackRef} className="relative w-full h-5 flex items-center cursor-pointer group" onMouseDown={handleStart} onTouchStart={handleStart}>
      <div className="absolute w-full h-[3px] rounded-full bg-black/[0.08] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="absolute w-3 h-3 rounded-full bg-[var(--accent)] shadow-md transition-all"
        style={{ left: `${pct}%`, transform: `translateX(-50%) scale(${dragging ? 1.3 : 1})`, boxShadow: dragging ? `0 0 10px ${color}` : '0 2px 6px rgba(0,0,0,0.15)' }} />
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
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [localPct, setLocalPct] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [dominantColor, setDominantColor] = useState('#fc3c44');
  const [accentColor, setAccentColor] = useState('#ff5a5f');
  const [activeEqPreset, setActiveEqPreset] = useState(equalizer.preset || 'Flat');
  const progressRef = useRef<HTMLDivElement>(null);
  const lyricsScrollRef = useRef<HTMLDivElement>(null);

  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(0);
  const sleepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [lyrics] = useState([
    { time: 0, text: '\u266a' },
    { time: 5, text: 'When the sun shines, we shine together' },
    { time: 10, text: 'Told you I\'ll be here forever' },
    { time: 15, text: 'Said I\'ll always be your friend' },
    { time: 20, text: 'Took an oath, I\'ma stick it out till the end' },
    { time: 28, text: 'Now that it\'s raining more than ever' },
    { time: 33, text: 'Know that we\'ll still have each other' },
    { time: 38, text: 'You can stand under my umbrella' },
    { time: 43, text: 'You can stand under my umbrella' },
    { time: 50, text: 'Under my umbrella' },
    { time: 55, text: 'Ella, ella, eh, eh, eh' },
    { time: 62, text: 'Under my umbrella' },
    { time: 68, text: 'Ella, ella, eh, eh, eh' },
  ]);

  const currentLyricIdx = lyrics.findIndex((l, i) => {
    const next = lyrics[i + 1];
    return progress >= l.time && (!next || progress < next.time);
  });

  useEffect(() => {
    if (lyricsOpen && lyricsScrollRef.current && currentLyricIdx >= 0 && currentLyricIdx < lyrics.length) {
      const activeEl = lyricsScrollRef.current.children[currentLyricIdx] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentLyricIdx, lyricsOpen, lyrics.length]);

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

  useEffect(() => () => { if (sleepTimerRef.current) clearInterval(sleepTimerRef.current); }, []);

  const pct = duration > 0 ? (progress / duration) * 100 : 0;
  const displayPct = seeking ? localPct : pct;
  const artSrc = currentTrack?.youtubeId ? `https://i.ytimg.com/vi/${currentTrack.youtubeId}/maxresdefault.jpg` : currentTrack?.album.cover_medium;

  useEffect(() => {
    if (!artSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = 50; canvas.height = 50;
      ctx.drawImage(img, 0, 0, 50, 50);
      const data = ctx.getImageData(0, 0, 50, 50).data;
      const colors: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 16) {
        const r = Math.round(data[i] / 40) * 40;
        const g = Math.round(data[i + 1] / 40) * 40;
        const b = Math.round(data[i + 2] / 40) * 40;
        const key = `${r},${g},${b}`;
        colors[key] = (colors[key] || 0) + 1;
      }
      const sorted = Object.entries(colors).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        const [r, g, b] = sorted[0][0].split(',').map(Number);
        setDominantColor(`rgb(${r},${g},${b})`);
      }
    };
    img.src = artSrc;
  }, [artSrc]);

  const updateSeekPosition = useCallback((clientX: number) => {
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect) return;
    setLocalPct(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  const handleSeekStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setSeeking(true);
    updateSeekPosition('touches' in e ? e.touches[0].clientX : e.clientX);
    setShowTooltip(true);
  }, [updateSeekPosition]);

  const localPctRef = useRef(localPct);
  localPctRef.current = localPct;

  useEffect(() => {
    if (!seeking) return;
    const onMove = (e: MouseEvent | TouchEvent) => updateSeekPosition('touches' in e ? e.touches[0].clientX : e.clientX);
    const onEnd = () => { seek((localPctRef.current / 100) * duration); setSeeking(false); setShowTooltip(false); };
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
  }, [seeking, duration, seek, updateSeekPosition]);

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
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-surface)] flex items-center justify-center border border-[var(--border-subtle)]">
            <span className="material-symbols-outlined text-3xl text-[var(--text-tertiary)]">music_note</span>
          </div>
          <p className="text-[var(--text-secondary)] text-base mb-1 font-medium">No track playing</p>
          <p className="text-[var(--text-tertiary)] text-sm mb-5">Pick a song to get started</p>
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent)] text-white rounded-full text-sm font-semibold active:scale-95 transition-all">
            <span className="material-symbols-outlined text-lg">play_arrow</span>
            Browse Music
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden selection:bg-[var(--accent)]/30">
      {/* Background */}
      <div className="fixed inset-0 z-0 bg-[var(--bg-primary)]">
        {artSrc && (
          <div className="absolute inset-0 blur-[80px] scale-110 opacity-30" style={{ backgroundImage: `url(${artSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        )}
        <div className="absolute inset-0 bg-white/80" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-5 py-4">
        <button onClick={() => setDrawerOpen(!drawerOpen)} className="w-9 h-9 rounded-full bg-black/5 backdrop-blur-xl flex items-center justify-center active:scale-90 transition-all">
          <span className="material-symbols-outlined text-[20px] text-[var(--text-secondary)]">chevron_down</span>
        </button>
        <div className="text-center">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--text-tertiary)] font-medium">Now Playing</p>
        </div>
        <button onClick={() => setShowMenu(!showMenu)} className="w-9 h-9 rounded-full bg-black/5 backdrop-blur-xl flex items-center justify-center active:scale-90 transition-all">
          <span className="material-symbols-outlined text-[20px] text-[var(--text-secondary)]">more_horiz</span>
        </button>
      </header>

      {/* Menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setShowMenu(false)} />
          <div className="fixed top-16 right-4 z-[65] glass-card rounded-xl p-1.5 min-w-[180px] shadow-xl scale-in border border-[var(--border-subtle)]">
            <button onClick={() => { setDrawerOpen(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[var(--text-primary)] hover:bg-black/[0.04] transition-all">
              <span className="material-symbols-outlined text-[var(--accent)] text-[18px]">graphic_eq</span>
              Audio Settings
            </button>
            <button onClick={() => { setShowQueue(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[var(--text-primary)] hover:bg-black/[0.04] transition-all">
              <span className="material-symbols-outlined text-[var(--text-secondary)] text-[18px]">queue_music</span>
              Queue
            </button>
            <button onClick={() => { setLyricsOpen(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[var(--text-primary)] hover:bg-black/[0.04] transition-all">
              <span className="material-symbols-outlined text-[var(--text-secondary)] text-[18px]">lyrics</span>
              Lyrics
            </button>
            <div className="h-px bg-[var(--border-subtle)] my-1" />
            <button onClick={() => { downloadCurrentTrack(); setShowMenu(false); }} disabled={downloading} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[var(--text-primary)] hover:bg-black/[0.04] transition-all disabled:opacity-40">
              {downloading ? <div className="w-4 h-4 rounded-full border border-[var(--text-tertiary)]/30 border-t-[var(--text-secondary)] animate-spin" /> : <span className="material-symbols-outlined text-[var(--text-secondary)] text-[18px]">download</span>}
              {downloading ? 'Saving...' : 'Download'}
            </button>
          </div>
        </>
      )}

      {/* Main content */}
      <main className="relative z-30 flex flex-col flex-1 px-8 pt-16 pb-6 max-w-lg mx-auto w-full">
        {/* Album Art */}
        <div className="flex-1 flex items-center justify-center py-2">
          <div className="relative">
            <div
              className="w-[260px] h-[260px] md:w-[300px] md:h-[300px] rounded-2xl overflow-hidden shadow-2xl"
              style={{
                boxShadow: isPlaying ? `0 20px 60px rgba(0,0,0,0.15), 0 0 80px ${dominantColor}15` : '0 20px 50px rgba(0,0,0,0.12)',
                animation: isPlaying ? 'idle-breathe 4s ease-in-out infinite' : 'none',
              }}
            >
              {artSrc ? (
                <img src={artSrc} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--bg-surface)]">
                  <span className="material-symbols-outlined text-6xl text-[var(--text-tertiary)]">music_note</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Track Info */}
        <div className="flex items-end justify-between mt-5 px-1">
          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] md:text-[22px] font-bold text-[var(--text-primary)] tracking-tight truncate">{currentTrack.title}</h1>
            <p className="text-[14px] text-[var(--text-secondary)] truncate mt-0.5">{currentTrack.artist.name}</p>
          </div>
          <button onClick={() => currentTrack && toggleFavorite(currentTrack.id)} className="w-10 h-10 flex items-center justify-center active:scale-90 transition-all flex-shrink-0 ml-3">
            <span className="material-symbols-outlined text-[24px]" style={{ color: currentTrack && isFavorite(currentTrack.id) ? 'var(--accent)' : 'var(--text-secondary)', fontVariationSettings: "'FILL' 1" }}>favorite</span>
          </button>
        </div>

        {/* Progress */}
        <div className="mt-4 px-1">
          <div ref={progressRef} className="relative w-full h-1 cursor-pointer group rounded-full" onMouseDown={handleSeekStart} onTouchStart={handleSeekStart}>
            <div className="absolute inset-0 rounded-full bg-black/[0.08]" />
            <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-75" style={{ width: `${displayPct}%`, background: 'var(--accent)' }} />
            <div className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[var(--accent)] shadow-md transition-all duration-75 ${seeking ? 'scale-125 opacity-100' : 'scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100'}`} style={{ left: `${displayPct}%` }} />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-[var(--text-tertiary)] font-medium tabular-nums">
            <span className="w-10 text-left">{formatTime(progress)}</span>
            <span className="w-10 text-right">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-3 px-4">
          <button onClick={toggleShuffle} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${shuffle ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}>
            <span className="material-symbols-outlined text-[20px]">shuffle</span>
          </button>
          <div className="flex items-center gap-6">
            <button onClick={prev} className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-[30px] text-[var(--text-primary)]">skip_previous</span>
            </button>
            <button onClick={() => (isPlaying ? pause() : resume())}
              className="w-[60px] h-[60px] rounded-full flex items-center justify-center active:scale-90 transition-all bg-[var(--accent)]"
              style={{ boxShadow: isPlaying ? `0 0 30px ${dominantColor}30` : '0 4px 15px rgba(252,60,68,0.3)' }}>
              <span className="material-symbols-outlined text-[32px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{isPlaying ? 'pause' : 'play_arrow'}</span>
            </button>
            <button onClick={next} className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-[30px] text-[var(--text-primary)]">skip_next</span>
            </button>
          </div>
          <button onClick={toggleRepeat} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 relative ${repeat !== 'off' ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}>
            <span className="material-symbols-outlined text-[20px]">repeat</span>
            {repeat === 'one' && <span className="absolute -top-0.5 -right-0.5 text-[7px] font-bold text-[var(--accent)]">1</span>}
          </button>
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-center gap-6 mt-5 px-4">
          <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-1.5 text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors">
            <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
          </button>
          <button onClick={() => setShowQueue(true)} className="text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors">
            <span className="material-symbols-outlined text-[18px]">queue_music</span>
          </button>
          <button onClick={() => setLyricsOpen(true)} className="text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors">
            <span className="material-symbols-outlined text-[18px]">lyrics</span>
          </button>
          <button onClick={() => downloadCurrentTrack()} disabled={downloading} className="text-[var(--text-tertiary)] hover:text-[var(--accent)] transition-colors disabled:opacity-40">
            {downloading ? <div className="w-4 h-4 rounded-full border border-[var(--text-tertiary)]/30 border-t-[var(--accent)] animate-spin" /> : <span className="material-symbols-outlined text-[18px]">download</span>}
          </button>
        </div>
      </main>

      {/* Lyrics Overlay */}
      {lyricsOpen && (
        <div className="fixed inset-0 z-[70] bg-white/98 backdrop-blur-xl fade-in flex flex-col">
          <div className="flex items-center justify-between px-5 pt-12 pb-3">
            <div className="w-9" />
            <div className="text-center">
              <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-[0.15em]">Lyrics</p>
            </div>
            <button onClick={() => setLyricsOpen(false)} className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] text-[var(--text-secondary)]">close</span>
            </button>
          </div>
          <div ref={lyricsScrollRef} className="flex-1 overflow-y-auto px-8 pb-32 flex flex-col items-center justify-center">
            {lyrics.map((line, i) => (
              <p key={i} className={`lyrics-line text-center text-[22px] md:text-[28px] font-bold py-2 transition-all duration-300 ${i === currentLyricIdx ? 'active' : i < currentLyricIdx ? 'past' : ''}`}>
                {line.text}
              </p>
            ))}
          </div>
          {/* Mini player at bottom of lyrics */}
          <div className="fixed bottom-0 left-0 right-0 z-[75] px-5 pb-8 pt-3 bg-white/95 backdrop-blur-xl border-t border-[var(--border-subtle)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-[var(--border-subtle)]">
                {artSrc ? <img src={artSrc} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[var(--bg-surface)]" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{currentTrack.title}</p>
                <p className="text-[11px] text-[var(--text-secondary)] truncate">{currentTrack.artist.name}</p>
              </div>
              <button onClick={() => (isPlaying ? pause() : resume())} className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--text-primary)] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{isPlaying ? 'pause' : 'play_arrow'}</span>
              </button>
            </div>
            <div className="relative w-full h-[3px] rounded-full bg-black/[0.08]">
              <div className="absolute top-0 left-0 h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Queue overlay */}
      {showQueue && (
        <div className="fixed inset-0 z-[58] bg-white/98 backdrop-blur-xl fade-in flex flex-col">
          <div className="flex items-center justify-between px-5 pt-12 pb-3">
            <div>
              <h3 className="text-[15px] text-[var(--text-primary)] font-semibold">Up Next</h3>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{queue.length} tracks</p>
            </div>
            <button onClick={() => setShowQueue(false)} className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px] text-[var(--text-secondary)]">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-24 space-y-0.5">
            {queue.map((track, i) => {
              const trackSrc = track.youtubeId ? `https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg` : track.album.cover_small;
              return (
                <div key={`${track.source || 'queue'}-${track.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl transition-all"
                  style={i === queueIndex ? { backgroundColor: `rgba(252, 60, 68, 0.06)` } : {}}>
                  {trackSrc ? <img src={trackSrc} alt="" className="w-10 h-10 rounded-lg object-cover border border-[var(--border-subtle)]" /> : <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface)] flex items-center justify-center border border-[var(--border-subtle)]"><span className="material-symbols-outlined text-[var(--text-tertiary)] text-sm">music_note</span></div>}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium truncate" style={{ color: i === queueIndex ? 'var(--accent)' : 'var(--text-primary)' }}>{track.title}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)] truncate">{track.artist.name}</p>
                  </div>
                  {i === queueIndex && <span className="material-symbols-outlined text-[14px] text-[var(--accent)]">equalizer</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Audio Settings Drawer */}
      <div className={`fixed inset-0 z-[55] bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setDrawerOpen(false)} />
      <div className={`fixed bottom-0 left-0 w-full z-[56] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="glass-panel rounded-t-[20px] px-6 pt-3 pb-10 shadow-[0_-20px_60px_rgba(0,0,0,0.1)] max-h-[80vh] overflow-y-auto border-t border-[var(--border-subtle)]">
          <div className="flex flex-col items-center cursor-pointer mb-5" onClick={() => setDrawerOpen(false)}>
            <div className="w-9 h-1 bg-black/10 rounded-full" />
          </div>
          <div className="max-w-md mx-auto space-y-5">
            <h3 className="text-[17px] font-bold text-[var(--text-primary)]">Audio Settings</h3>

            {/* Volume */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.15em]">Volume</span>
                <span className="text-[11px] font-mono text-[var(--accent)]">{Math.round(volume * 100)}%</span>
              </div>
              <DragSlider value={volume} onChange={setVolume} min={0} max={1} />
            </div>

            {/* Bass Boost */}
            <div className="p-3 rounded-xl bg-black/[0.03]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] text-[var(--text-primary)] font-medium">Bass Boost</span>
                <span className="text-[10px] font-mono text-[var(--accent)]">{Math.round(soundEffects.bassBoost * 100)}%</span>
              </div>
              <DragSlider value={soundEffects.bassBoost} onChange={(v) => setSoundEffect('bassBoost', v)} min={0} max={1} />
            </div>

            {/* Vocal Clarity */}
            <div className="p-3 rounded-xl bg-black/[0.03]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] text-[var(--text-primary)] font-medium">Vocal Clarity</span>
                <span className="text-[10px] font-mono text-[var(--accent)]">{Math.round(soundEffects.vocalBoost * 100)}%</span>
              </div>
              <DragSlider value={soundEffects.vocalBoost} onChange={(v) => setSoundEffect('vocalBoost', v)} min={0} max={1} />
            </div>

            {/* Reverb */}
            <div className="p-3 rounded-xl bg-black/[0.03]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] text-[var(--text-primary)] font-medium">Reverb</span>
                <span className="text-[10px] font-mono text-[var(--accent)]">{Math.round(soundEffects.reverb * 100)}%</span>
              </div>
              <DragSlider value={soundEffects.reverb} onChange={(v) => setSoundEffect('reverb', v)} min={0} max={1} />
            </div>

            {/* Stereo Width */}
            <div className="p-3 rounded-xl bg-black/[0.03]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] text-[var(--text-primary)] font-medium">Stereo Width</span>
                <span className="text-[10px] font-mono text-[var(--accent)]">{Math.round((soundEffects.stereoWidth ?? 0.5) * 100)}%</span>
              </div>
              <DragSlider value={soundEffects.stereoWidth ?? 0.5} onChange={(v) => setSoundEffect('stereoWidth', v)} min={0} max={1} />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setSoundEffect('spatialAudio', !soundEffects.spatialAudio)} className={`p-3 rounded-xl text-[12px] font-medium transition-all ${soundEffects.spatialAudio ? 'bg-[var(--accent)] text-white' : 'bg-black/[0.03] text-[var(--text-secondary)] border border-[var(--border-subtle)]'}`}>
                Spatial Audio
              </button>
              <button onClick={() => setSoundEffect('nightMode', !soundEffects.nightMode)} className={`p-3 rounded-xl text-[12px] font-medium transition-all ${soundEffects.nightMode ? 'bg-[var(--accent)] text-white' : 'bg-black/[0.03] text-[var(--text-secondary)] border border-[var(--border-subtle)]'}`}>
                Night Mode
              </button>
            </div>

            {/* Crossfade */}
            <div className="p-3 rounded-xl bg-black/[0.03]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] text-[var(--text-primary)] font-medium">Crossfade</span>
                <button onClick={toggleCrossfade} className={`w-10 h-6 rounded-full relative transition-all ${crossfade ? 'bg-[var(--accent)]' : 'bg-black/10'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all ${crossfade ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
              </div>
              {crossfade && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-[var(--text-tertiary)]">Duration</span>
                    <span className="text-[10px] font-mono text-[var(--accent)]">{crossfadeDuration}s</span>
                  </div>
                  <DragSlider value={crossfadeDuration} onChange={setCrossfadeDuration} min={1} max={12} />
                </div>
              )}
            </div>

            {/* EQ */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.15em]">Equalizer</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">{equalizer.preset}</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 hide-scrollbar">
                {Object.keys(EQ_PRESETS).map((name) => (
                  <button key={name} onClick={() => { setEqualizer('preset', Object.keys(EQ_PRESETS).indexOf(name)); setActiveEqPreset(name); }}
                    className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${equalizer.preset === name ? 'bg-[var(--accent)] text-white' : 'bg-black/[0.05] text-[var(--text-tertiary)]'}`}>
                    {name}
                  </button>
                ))}
              </div>
              <div className="flex justify-between items-end gap-1">
                {EQ_BANDS.map((band) => {
                  const val = equalizer[band.key as keyof typeof equalizer] as number;
                  return (
                    <div key={band.key} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="text-[8px] font-mono" style={{ color: val > 0 ? 'var(--accent)' : val < 0 ? '#ff453a' : 'var(--text-tertiary)' }}>{val > 0 ? '+' : ''}{val.toFixed(0)}</div>
                      <DragSlider value={val} onChange={(v) => setEqualizer(band.key, v)} min={-12} max={12} height />
                      <span className="text-[7px] text-[var(--text-tertiary)] font-medium">{band.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stream Quality */}
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.15em] mb-2">Stream Quality</p>
              <div className="flex gap-2">
                {(['low', 'mid', 'high'] as const).map(q => (
                  <button key={q} onClick={() => setAudioQuality(q)} className={`flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all ${audioQuality === q ? 'bg-[var(--accent)] text-white' : 'bg-black/[0.05] text-[var(--text-tertiary)]'}`}>
                    {q === 'low' ? 'Normal' : q === 'mid' ? 'High' : 'Lossless'}
                  </button>
                ))}
              </div>
            </div>

            {/* Playback Speed */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.15em]">Speed</p>
                <span className="text-[11px] font-mono text-[var(--accent)]">{playbackSpeed}x</span>
              </div>
              <div className="flex gap-1.5">
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(s => (
                  <button key={s} onClick={() => setPlaybackSpeed(s)} className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${playbackSpeed === s ? 'bg-[var(--accent)] text-white' : 'bg-black/[0.05] text-[var(--text-tertiary)]'}`}>{s}x</button>
                ))}
              </div>
            </div>

            {/* Sleep Timer */}
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-[0.15em] mb-2">Sleep Timer</p>
              <div className="flex gap-1.5">
                {[15, 30, 45, 60, 90].map(m => (
                  <button key={m} onClick={() => sleepTimer === m ? cancelSleepTimer() : startSleepTimer(m)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${sleepTimer === m ? 'bg-[var(--accent)] text-white' : 'bg-black/[0.05] text-[var(--text-tertiary)]'}`}>{m}m</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
