'use client';

import { usePlayer } from '@/lib/PlayerContext';
import Link from 'next/link';
import { useState, useCallback, useRef, useEffect } from 'react';

function formatTime(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlayerPage() {
  const {
    currentTrack, isPlaying, queue, queueIndex,
    progress, duration, volume,
    pause, resume, next, prev,
    setVolume, seek, toggleShuffle, toggleRepeat,
    shuffle, repeat, soundEffects,
    setSoundEffect, downloadCurrentTrack, downloading,
  } = usePlayer();
  const [showQueue, setShowQueue] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [localPct, setLocalPct] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const pct = duration > 0 ? (progress / duration) * 100 : 0;
  const displayPct = seeking ? localPct : pct;

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

  const handleVolumeClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
  }, [setVolume]);

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

  const artSrc = currentTrack.youtubeId
    ? `https://i.ytimg.com/vi/${currentTrack.youtubeId}/hqdefault.jpg`
    : currentTrack.album.cover_medium;

  return (
    <div className="relative min-h-screen flex flex-col bg-background overflow-hidden selection:bg-primary/30 font-body-md">
      {/* Background layers */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black/80 z-20" />
        {artSrc && (
          <div className="absolute inset-0 bg-cover bg-center z-10 opacity-40 blur-2xl scale-110" style={{ backgroundImage: `url(${artSrc})` }} />
        )}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#D4AF37]/[0.04] blur-[120px] rounded-full animate-pulse-slow z-15" />
        <div className="absolute inset-0 z-[21] pointer-events-none" style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)'
        }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-5 py-5">
        <Link href="/" className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/[0.06] flex items-center justify-center active:scale-90 transition-all hover:bg-white/10">
          <span className="material-symbols-outlined text-[22px] text-zinc-300">expand_more</span>
        </Link>
        <div className="text-[10px] tracking-[0.5em] text-zinc-400 uppercase font-medium">Now Playing</div>
        <button onClick={() => setShowMenu(!showMenu)} className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-xl border border-white/[0.06] flex items-center justify-center active:scale-90 transition-all hover:bg-white/10">
          <span className="material-symbols-outlined text-[22px] text-zinc-300">more_vert</span>
        </button>
      </header>

      {/* Menu overlay */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="fixed top-20 right-5 z-50 glass-card rounded-2xl p-2 min-w-[200px] shadow-2xl shadow-black/60 scale-in">
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
              {downloading ? (
                <div className="w-4 h-4 rounded-full border border-zinc-500/30 border-t-zinc-300 animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-zinc-400 text-lg">download</span>
              )}
              {downloading ? 'Saving...' : 'Download'}
            </button>
          </div>
        </>
      )}

      {/* Main content */}
      <main className="relative z-30 flex flex-col flex-1 px-6 md:px-10 pt-20 pb-8">
        {/* Album Art */}
        <div className="flex-1 flex items-center justify-center relative py-4">
          {/* Visualizer bars */}
          <div className="absolute inset-0 flex items-center justify-center gap-[3px] opacity-15 pointer-events-none">
            {[0.1, 0.3, 0.5, 0.2, 0.4, 0.6].map((d, i) => (
              <div key={i} className="w-[3px] bg-gradient-to-t from-[#D4AF37]/40 to-[#D4AF37] rounded-full animate-pulse-slow"
                style={{ animationDelay: `${d}s`, height: `${25 + i * 10}%` }} />
            ))}
          </div>

          <div className="w-full max-w-[260px] md:max-w-[300px] aspect-square rounded-2xl overflow-hidden relative group"
            style={{
              boxShadow: isPlaying
                ? '0 25px 60px rgba(0,0,0,0.6), 0 0 80px rgba(212,175,55,0.12)'
                : '0 20px 50px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.06)',
              border: '1px solid rgba(255,255,255,0.06)',
              animation: isPlaying ? 'album-float 6s ease-in-out infinite' : 'none',
            }}>
            {artSrc ? (
              <img src={artSrc} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-800/50">
                <span className="material-symbols-outlined text-6xl text-zinc-700">music_note</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            {isPlaying && (
              <div className="absolute bottom-3 right-3 flex items-center gap-[3px] bg-black/50 backdrop-blur-md rounded-full px-2.5 py-1.5 border border-white/[0.06]">
                {[2, 3, 2].map((h, i) => (
                  <div key={i} className="w-[3px] rounded-full bg-[#D4AF37] animate-pulse-slow" style={{ height: `${h * 4}px`, animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Track Info */}
        <div className="flex items-end justify-between mt-5">
          <div className="min-w-0 flex-1 pr-4">
            <h1 className="font-headline-md text-white tracking-tight leading-tight text-2xl md:text-3xl truncate">{currentTrack.title}</h1>
            <p className="text-[#D4AF37]/60 uppercase tracking-[0.25em] text-[11px] mt-1.5 font-bold">{currentTrack.artist.name}</p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D4AF37]/[0.08] border border-[#D4AF37]/20 mt-2">
              <span className="material-symbols-outlined text-[12px] text-[#D4AF37]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              <span className="text-[9px] font-bold text-[#D4AF37]/80 tracking-[0.1em] uppercase">Master Quality • 24-bit / 192kHz</span>
            </div>
          </div>
          <button className="w-12 h-12 rounded-full bg-white/5 border border-white/[0.06] flex items-center justify-center active:scale-90 transition-all hover:bg-white/10 flex-shrink-0">
            <span className="material-symbols-outlined text-[24px] text-[#D4AF37]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          </button>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div ref={progressRef} className="relative w-full h-1 cursor-pointer group rounded-full"
            onMouseDown={handleSeekStart} onTouchStart={handleSeekStart}>
            <div className="absolute inset-0 rounded-full bg-white/[0.06]" />
            <div className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#FFBF00] transition-all duration-100" style={{ width: `${displayPct}%` }} />
            <div className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_rgba(242,202,80,0.6)] transition-all duration-100 ${seeking ? 'scale-125 opacity-100' : 'scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100'}`}
              style={{ left: `${displayPct}%` }} />
            {showTooltip && (
              <div className="absolute -top-10 -translate-x-1/2 glass-card rounded-lg px-2.5 py-1 shadow-xl pointer-events-none scale-in"
                style={{ left: `${displayPct}%` }}>
                <span className="text-[11px] text-[#D4AF37] font-mono font-medium">{formatTime((localPct / 100) * duration)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between mt-2.5 text-[10px] text-zinc-500 tracking-[0.15em] font-medium tabular-nums">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-7">
          <button onClick={toggleShuffle}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 ${
              shuffle ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}>
            <span className="material-symbols-outlined text-[22px]">shuffle</span>
          </button>

          <div className="flex items-center gap-5">
            <button onClick={prev}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full glass-btn flex items-center justify-center active:scale-90 transition-all group hover:bg-white/[0.08] hover:border-white/[0.12]">
              <span className="material-symbols-outlined text-[28px] md:text-[30px] text-zinc-300 group-hover:text-white transition-colors">skip_previous</span>
            </button>

            <button onClick={() => (isPlaying ? pause() : resume())}
              className="w-[72px] h-[72px] md:w-20 md:h-20 rounded-full flex items-center justify-center active:scale-90 transition-all duration-300 sunburst-btn">
              <span className="material-symbols-outlined text-[40px] md:text-[44px] text-black" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            <button onClick={next}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full glass-btn flex items-center justify-center active:scale-90 transition-all group hover:bg-white/[0.08] hover:border-white/[0.12]">
              <span className="material-symbols-outlined text-[28px] md:text-[30px] text-zinc-300 group-hover:text-white transition-colors">skip_next</span>
            </button>
          </div>

          <button onClick={toggleRepeat}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 relative ${
              repeat !== 'off' ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}>
            <span className="material-symbols-outlined text-[22px]">repeat</span>
            {repeat === 'one' && <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold text-[#D4AF37]">1</span>}
          </button>
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-between mt-7">
          <button onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2.5 px-4 py-2 rounded-full glass-btn active:scale-95 transition-all duration-300 hover:bg-white/[0.08] hover:border-[#D4AF37]/20">
            <span className="material-symbols-outlined text-[18px] text-[#D4AF37]">graphic_eq</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Audio Experience</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowQueue(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-all duration-300 active:scale-90 text-zinc-400 hover:text-[#D4AF37]">
              <span className="material-symbols-outlined text-[22px]">queue_music</span>
            </button>
            <button onClick={() => downloadCurrentTrack()} disabled={downloading}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-all duration-300 active:scale-90 text-zinc-400 hover:text-[#D4AF37] disabled:opacity-40">
              {downloading ? (
                <div className="w-4 h-4 rounded-full border border-zinc-500/30 border-t-zinc-300 animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[22px]">download</span>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Drawer backdrop */}
      <div className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-500 pointer-events-none ${drawerOpen ? 'opacity-100' : 'opacity-0'}`} />

      {/* Audio Excellence Drawer */}
      <div className={`fixed bottom-0 left-0 w-full z-50 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="glass-panel rounded-t-[32px] md:rounded-t-[40px] px-6 md:px-8 pt-4 pb-10 shadow-[0_-20px_60px_rgba(0,0,0,0.5)] max-h-[85vh] overflow-y-auto">
          <div className="flex flex-col items-center cursor-pointer mb-8" onClick={() => setDrawerOpen(false)}>
            <div className="w-10 h-1 bg-white/10 rounded-full" />
          </div>
          <div className="max-w-md mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-xl md:text-2xl text-[#D4AF37]">Audio Excellence</h3>
              <span className="material-symbols-outlined text-zinc-500 text-[24px]">settings</span>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-zinc-500 text-[20px]">volume_down</span>
              <div className="flex-1 relative h-1 bg-white/[0.06] rounded-full overflow-hidden cursor-pointer"
                onClick={handleVolumeClick}>
                <div className="h-full bg-gradient-to-r from-[#D4AF37]/60 to-[#FFBF00]/60 rounded-full transition-all" style={{ width: `${volume * 100}%` }} />
              </div>
              <span className="material-symbols-outlined text-zinc-500 text-[20px]">volume_up</span>
            </div>

            {/* Spatial Audio */}
            <div className="flex items-center justify-between p-5 rounded-2xl glass-card">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/10">
                  <span className="material-symbols-outlined text-[#D4AF37] text-xl">spatial_audio</span>
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Spatial Audio Pro</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Active Immersive Rendering</p>
                </div>
              </div>
              <button onClick={() => setSoundEffect('spatialAudio', !soundEffects.spatialAudio)}
                className={`w-11 h-6 rounded-full relative flex items-center px-1.5 border transition-all duration-300 ${
                  soundEffects.spatialAudio ? 'bg-[#D4AF37]/20 border-[#D4AF37]/30' : 'bg-white/10 border-white/10'
                }`}>
                <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                  soundEffects.spatialAudio ? 'bg-[#D4AF37] ml-auto shadow-[0_0_12px_#D4AF37]' : 'bg-white/40'
                }`} />
              </button>
            </div>

            {/* EQ Visual */}
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium mb-4">Equalizer</p>
              <div className="h-40 flex justify-between items-end gap-3 px-1">
                {[
                  { label: '60Hz', h: 40 }, { label: '230Hz', h: 75 }, { label: '910Hz', h: 55 },
                  { label: '3kHz', h: 65 }, { label: '14kHz', h: 30 },
                ].map(band => (
                  <div key={band.label} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full h-28 bg-white/[0.04] rounded-full relative overflow-hidden border border-white/[0.06]">
                      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#D4AF37]/20 to-[#D4AF37]/40 rounded-full" style={{ height: `${band.h}%` }} />
                      <div className="absolute left-1/2 w-2.5 h-2.5 bg-[#D4AF37] rounded-full shadow-[0_0_8px_#D4AF37]"
                        style={{ top: `${100 - band.h}%`, transform: 'translate(-50%, -50%)' }} />
                    </div>
                    <span className="text-[8px] text-zinc-600 font-medium tracking-tight">{band.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Output */}
            <div className="flex items-center justify-center gap-3 text-zinc-600 pt-6 border-t border-white/[0.04]">
              <span className="material-symbols-outlined text-[18px]">headphones</span>
              <span className="text-[9px] uppercase tracking-[0.3em] font-medium">Aurelia Reference One • Bluetooth LE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Queue overlay */}
      {showQueue && (
        <div className="fixed inset-0 z-40 bg-[#050505]/95 backdrop-blur-2xl fade-in flex flex-col">
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
              const trackSrc = track.youtubeId ? `https://i.ytimg.com/vi/${track.youtubeId}/default.jpg` : (track.album.cover_small || track.album.cover_medium);
              return (
                <div key={`${track.source || 'queue'}-${track.id}`}
                  className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                    i === queueIndex ? 'bg-[#D4AF37]/[0.06] border border-[#D4AF37]/20' : 'hover:bg-white/[0.03] border border-transparent'
                  }`}>
                  <span className={`w-5 text-center text-[11px] font-mono ${i === queueIndex ? 'text-[#D4AF37]' : 'text-zinc-600'}`}>{i + 1}</span>
                  {trackSrc ? (
                    <img src={trackSrc} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center">
                      <span className="material-symbols-outlined text-zinc-600 text-sm">music_note</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] font-medium truncate ${i === queueIndex ? 'text-[#D4AF37]' : 'text-zinc-200'}`}>{track.title}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{track.artist.name}</p>
                  </div>
                  {i === queueIndex && (
                    <div className="flex items-center gap-1 text-[#D4AF37]">
                      <span className="material-symbols-outlined text-sm">volume_up</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes album-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
