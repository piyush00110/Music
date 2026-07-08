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
  const [showEq, setShowEq] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [localPct, setLocalPct] = useState(0);
  const [albumHover, setAlbumHover] = useState(false);
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

  const handleVolumeWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setVolume(Math.max(0, Math.min(1, volume + delta)));
  }, [volume, setVolume]);

  if (!currentTrack) {
    return (
      <div className="flex items-center justify-center h-screen px-4 bg-background">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-white/5 flex items-center justify-center ring-1 ring-white/[0.06]">
            <span className="material-symbols-outlined text-4xl text-zinc-600">music_note</span>
          </div>
          <p className="text-zinc-300 text-lg mb-1 font-medium">No track playing</p>
          <p className="text-zinc-600 text-sm mb-6">Pick a song to get started</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black rounded-full text-sm font-semibold hover:opacity-90 transition-all active:scale-95 shadow-lg">
            <span className="material-symbols-outlined text-lg">play_arrow</span>
            Browse Music
          </Link>
        </div>
      </div>
    );
  }

  const useYtThumb = !!currentTrack.youtubeId;
  const artSrc = useYtThumb ? `https://i.ytimg.com/vi/${currentTrack.youtubeId}/hqdefault.jpg` : currentTrack.album.cover_medium;

  return (
    <div className="relative h-screen flex flex-col bg-background overflow-hidden selection:bg-primary/30 font-body-md min-h-screen">
      <style jsx>{`
        .film-grain {
          position: fixed;
          inset: 0;
          z-index: 5;
          pointer-events: none;
          opacity: 0.04;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        .gold-glow {
          box-shadow: 0 0 30px rgba(242, 202, 80, 0.15);
        }
        .gold-glow-strong {
          box-shadow: 0 0 60px rgba(242, 202, 80, 0.25), 0 0 120px rgba(242, 202, 80, 0.1);
        }
        .master-glow {
          box-shadow: 0 0 15px rgba(242, 202, 80, 0.4);
        }
        .glass-btn {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(242, 202, 80, 0.15);
        }
        .glass-panel {
          background: rgba(19, 19, 19, 0.4);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 0.5px solid rgba(212, 175, 55, 0.2);
        }
        .light-pulse {
          animation: pulse-light 8s ease-in-out infinite;
        }
        @keyframes pulse-light {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        .viz-bar {
          animation: bar-grow 1.2s ease-in-out infinite;
        }
        @keyframes bar-grow {
          0%, 100% { height: 15%; }
          50% { height: 80%; }
        }
        .album-float {
          animation: album-float 6s ease-in-out infinite;
        }
        @keyframes album-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .album-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .eq-bar {
          animation: eq-bounce 1.5s ease-in-out infinite;
        }
        @keyframes eq-bounce {
          0%, 100% { height: 20%; }
          50% { height: 90%; }
        }
        input[type="range"]::-webkit-slider-runnable-track {
          height: 3px;
          border-radius: 4px;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          background: #f2ca50;
          border-radius: 50%;
          margin-top: -5.5px;
          box-shadow: 0 0 15px rgba(242, 202, 80, 0.8);
          border: 2px solid #131313;
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          background: #f2ca50;
          border-radius: 50%;
          box-shadow: 0 0 15px rgba(242, 202, 80, 0.8);
          border: 2px solid #131313;
        }
        .tooltip-appear {
          animation: tooltip-in 0.2s ease-out;
        }
        @keyframes tooltip-in {
          from { opacity: 0; transform: translateY(8px) scale(0.9); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .drawer-backdrop {
          transition: opacity 0.5s ease;
        }
        .eq-band {
          transition: height 0.15s ease-out;
        }
      `}</style>

      {/* Visual Depth Layers */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black/80 z-20" />
        <div className="film-grain" />
        {artSrc && (
          <div className="absolute inset-0 bg-cover bg-center z-10 opacity-60 blur-sm scale-110" style={{ backgroundImage: `url(${artSrc})` }} />
        )}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full h-full bg-primary/5 blur-[120px] rounded-full light-pulse z-15" />
        <div className="absolute inset-0 z-21 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)'
        }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-6 py-6">
        <Link href="/" className="active:scale-95 duration-200 text-on-surface/80 hover:text-primary transition-all hover:drop-shadow-[0_0_8px_rgba(242,202,80,0.3)]">
          <span className="material-symbols-outlined text-[30px]">expand_more</span>
        </Link>
        <div className="font-headline-md text-[11px] tracking-[0.5em] text-primary/70 uppercase font-bold">Now Playing</div>
        <button onClick={() => setShowMenu(!showMenu)} className="active:scale-95 duration-200 text-on-surface/80 hover:text-primary transition-all hover:drop-shadow-[0_0_8px_rgba(242,202,80,0.3)]">
          <span className="material-symbols-outlined text-[30px]">more_vert</span>
        </button>
      </header>

      {/* Menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="fixed top-20 right-4 z-50 bg-zinc-900/95 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-2 min-w-[200px] shadow-2xl shadow-black/40 fade-in">
            <button onClick={() => { setShowEq(!showEq); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all active:scale-[0.98]">
              <span className="material-symbols-outlined text-primary/80">tune</span>
              Equalizer
            </button>
            <button onClick={() => { setShowQueue(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all active:scale-[0.98]">
              <span className="material-symbols-outlined text-zinc-400">queue_music</span>
              Queue
            </button>
            <div className="h-px bg-white/[0.04] my-1" />
            <button onClick={() => { downloadCurrentTrack(); setShowMenu(false); }} disabled={downloading} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all disabled:opacity-40 active:scale-[0.98]">
              {downloading ? (
                <div className="w-5 h-5 rounded-full border border-zinc-500/30 border-t-zinc-300 animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-zinc-400">download</span>
              )}
              {downloading ? 'Saving...' : 'Download'}
            </button>
          </div>
        </>
      )}

      {/* EQ panel */}
      {showEq && (
        <div className="fixed top-24 left-0 right-0 z-40 px-4 fade-in">
          <div className="bg-zinc-900/95 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-4 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Equalizer</h3>
              <button onClick={() => setShowEq(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all active:scale-90">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="h-24 md:h-32 flex items-end justify-between gap-1 px-1">
              {[1,2,3,4,5,6,7,8,9,10].map(i => (
                <div key={i} className="eq-bar flex-1 bg-gradient-to-t from-primary/20 to-primary/40 rounded-t-sm" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="relative z-30 flex flex-col flex-1 pb-12 px-8 pt-20">
        {/* Album Art & Visualizer Container */}
        <div className="flex-1 flex items-center justify-center relative py-6">
          {/* Live Frequency Visualizer behind art */}
          <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20 pointer-events-none">
            <div className="viz-bar w-1 bg-primary rounded-full" style={{ animationDelay: '0.1s', height: '30%' }} />
            <div className="viz-bar w-1 bg-primary rounded-full" style={{ animationDelay: '0.3s', height: '50%' }} />
            <div className="viz-bar w-1 bg-primary rounded-full" style={{ animationDelay: '0.5s', height: '80%' }} />
            <div className="viz-bar w-1 bg-primary rounded-full" style={{ animationDelay: '0.2s', height: '40%' }} />
            <div className="viz-bar w-1 bg-primary rounded-full" style={{ animationDelay: '0.4s', height: '60%' }} />
            <div className="viz-bar w-1 bg-primary rounded-full" style={{ animationDelay: '0.6s', height: '30%' }} />
          </div>

          {/* Album Art */}
          <div
            className={`w-full aspect-square rounded-xl overflow-hidden relative group max-w-[280px] album-float transition-all duration-500 ${albumHover ? 'gold-glow-strong scale-[1.02]' : 'gold-glow'}`}
            onMouseEnter={() => setAlbumHover(true)}
            onMouseLeave={() => setAlbumHover(false)}
            style={{
              border: '1px solid rgba(242, 202, 80, 0.1)',
              boxShadow: isPlaying ? '0 20px 60px rgba(0,0,0,0.5), 0 0 80px rgba(242,202,80,0.15)' : '0 20px 50px rgba(0,0,0,0.5), 0 0 40px rgba(242,202,80,0.1)',
            }}
          >
            {artSrc ? (
              <img src={artSrc} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                <span className="material-symbols-outlined text-6xl text-zinc-700">music_note</span>
              </div>
            )}
            {/* Shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent album-shimmer pointer-events-none" />
            {/* Bottom fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
            {/* Playing indicator */}
            {isPlaying && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-md rounded-full px-2 py-1">
                <div className="w-1 h-2 bg-primary rounded-full animate-pulse" />
                <div className="w-1 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                <div className="w-1 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="flex items-end justify-between mt-4">
          <div className="flex flex-col flex-1 pr-4">
            <h1 className="font-headline-md text-on-background tracking-tight leading-tight text-2xl truncate">{currentTrack.title}</h1>
            <p className="font-metadata text-primary/60 uppercase tracking-[0.25em] text-[11px] mt-2 font-bold">{currentTrack.artist.name}</p>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/20 w-fit master-glow mt-2">
              <span className="material-symbols-outlined text-[14px] text-primary fill-icon">workspace_premium</span>
              <span className="text-[9px] font-bold text-primary tracking-[0.1em] uppercase">Master Quality • 24-bit / 192kHz</span>
            </div>
          </div>
          <button className="text-primary hover:text-primary active:scale-90 transition-all duration-300 hover:drop-shadow-[0_0_12px_rgba(242,202,80,0.5)]">
            <span className="material-symbols-outlined text-[34px] fill-icon">favorite</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div ref={progressRef} className="relative w-full h-1 cursor-pointer group"
            onMouseDown={handleSeekStart} onTouchStart={handleSeekStart}>
            <div className="absolute inset-0 rounded-full bg-white/[0.06]" />
            <div className="absolute top-0 left-0 h-full rounded-full bg-primary transition-all duration-100" style={{ width: `${displayPct}%` }} />
            {/* Thumb */}
            <div className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-primary border-2 border-[#131313] shadow-[0_0_15px_rgba(242,202,80,0.8)] transition-all duration-100 ${seeking ? 'scale-125 opacity-100' : 'scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100'}`}
              style={{ left: `${displayPct}%` }} />
            {/* Tooltip */}
            {showTooltip && (
              <div className="tooltip-appear absolute -top-10 -translate-x-1/2 bg-zinc-900/95 backdrop-blur-md border border-white/[0.08] rounded-lg px-2.5 py-1 shadow-xl pointer-events-none"
                style={{ left: `${displayPct}%` }}>
                <span className="text-[11px] text-primary font-mono font-medium">{formatTime((localPct / 100) * duration)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between mt-3 font-metadata text-[10px] text-on-surface-variant/40 tracking-[0.2em] font-medium">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls with Glassmorphism */}
        <div className="flex items-center justify-between mt-8">
          <button onClick={toggleShuffle} className={`transition-all duration-300 active:scale-90 ${shuffle ? 'text-primary drop-shadow-[0_0_8px_rgba(242,202,80,0.4)]' : 'text-on-surface-variant/50 hover:text-primary hover:drop-shadow-[0_0_8px_rgba(242,202,80,0.3)]'}`}>
            <span className="material-symbols-outlined text-[24px]">shuffle</span>
          </button>
          <div className="flex items-center gap-6">
            <button onClick={prev} className="w-14 h-14 rounded-full glass-btn flex items-center justify-center active:scale-90 transition-all duration-300 group hover:bg-white/[0.06] hover:border-primary/30">
              <span className="material-symbols-outlined text-[32px] text-on-surface/80 group-hover:text-primary group-hover:drop-shadow-[0_0_8px_rgba(242,202,80,0.3)] transition-all duration-300">skip_previous</span>
            </button>
            <button onClick={() => (isPlaying ? pause() : resume())}
              className="rounded-full bg-primary flex items-center justify-center active:scale-90 transition-all duration-300 w-20 h-20"
              style={{
                boxShadow: isPlaying
                  ? '0 0 50px rgba(242,202,80,0.4), 0 0 100px rgba(242,202,80,0.15)'
                  : '0 0 40px rgba(242,202,80,0.3)',
              }}>
              <span className="material-symbols-outlined text-on-primary fill-icon text-[48px]">{isPlaying ? 'pause' : 'play_arrow'}</span>
            </button>
            <button onClick={next} className="w-14 h-14 rounded-full glass-btn flex items-center justify-center active:scale-90 transition-all duration-300 group hover:bg-white/[0.06] hover:border-primary/30">
              <span className="material-symbols-outlined text-[32px] text-on-surface/80 group-hover:text-primary group-hover:drop-shadow-[0_0_8px_rgba(242,202,80,0.3)] transition-all duration-300">skip_next</span>
            </button>
          </div>
          <button onClick={toggleRepeat} className={`transition-all duration-300 active:scale-90 relative ${repeat !== 'off' ? 'text-primary drop-shadow-[0_0_8px_rgba(242,202,80,0.4)]' : 'text-on-surface-variant/50 hover:text-primary hover:drop-shadow-[0_0_8px_rgba(242,202,80,0.3)]'}`}>
            <span className="material-symbols-outlined text-[24px]">repeat</span>
            {repeat === 'one' && <span className="absolute -top-1 -right-1 text-[9px] font-bold text-primary">1</span>}
          </button>
        </div>

        {/* Bottom Secondary Actions */}
        <div className="flex items-center justify-between text-on-surface-variant/60 mt-8">
          <button onClick={() => setDrawerOpen(!drawerOpen)}
            className="flex items-center gap-3 px-4 py-2 rounded-full border border-white/5 bg-white/5 active:scale-95 transition-all duration-300 hover:bg-white/10 hover:border-primary/20 hover:shadow-[0_0_20px_rgba(242,202,80,0.1)]">
            <span className="material-symbols-outlined text-[20px] text-primary/80">graphic_eq</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Audio Experience</span>
          </button>
          <button onClick={() => setShowQueue(true)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-all duration-300 hover:text-primary active:scale-90">
            <span className="material-symbols-outlined text-[26px]">queue_music</span>
          </button>
        </div>
      </main>

      {/* Drawer Backdrop */}
      <div className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-500 drawer-backdrop pointer-events-none ${drawerOpen ? 'opacity-100' : 'opacity-0'}`} />

      {/* Audio Excellence Drawer */}
      <div className={`fixed bottom-0 left-0 w-full z-50 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="glass-panel rounded-t-[40px] px-8 pt-4 pb-12 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-primary/10 max-h-[85vh] overflow-y-auto">
          <div className="flex flex-col items-center cursor-pointer mb-10" onClick={() => setDrawerOpen(false)}>
            <div className="w-16 h-1 bg-primary/20 rounded-full hover:bg-primary/40 transition-colors" />
          </div>
          <div className="max-w-md mx-auto space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-2xl text-primary">Audio Excellence</h3>
              <button onClick={() => { setShowEq(true); setDrawerOpen(false); }} className="text-primary/40 hover:text-primary transition-colors active:scale-90 hover:drop-shadow-[0_0_8px_rgba(242,202,80,0.3)]">
                <span className="material-symbols-outlined text-[28px]">settings</span>
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3" onWheel={handleVolumeWheel}>
              <span className="material-symbols-outlined text-zinc-500">volume_down</span>
              <div className="flex-1 relative h-1 bg-white/[0.06] rounded-full overflow-hidden cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
                }}>
                <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${volume * 100}%` }} />
              </div>
              <span className="material-symbols-outlined text-zinc-500">volume_up</span>
            </div>

            {/* Spatial Audio */}
            <div className="flex items-center justify-between bg-white/5 p-6 rounded-3xl border border-white/10 glass-btn hover:bg-white/[0.07] transition-all duration-300">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">spatial_audio</span>
                </div>
                <div>
                  <p className="font-label-sm text-sm text-on-surface font-semibold">Spatial Audio Pro</p>
                  <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-widest mt-0.5">Active Immersive Rendering</p>
                </div>
              </div>
              <button onClick={() => setSoundEffect('spatialAudio', !soundEffects.spatialAudio)}
                className={`w-12 h-6 rounded-full relative flex items-center px-1.5 border transition-all duration-300 ${soundEffects.spatialAudio ? 'bg-primary/20 border-primary/30 shadow-[0_0_15px_rgba(242,202,80,0.2)]' : 'bg-white/10 border-white/10'}`}>
                <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${soundEffects.spatialAudio ? 'bg-primary ml-auto shadow-[0_0_15px_#f2ca50]' : 'bg-white/40'}`} />
              </button>
            </div>

            {/* Enhanced EQ Visual */}
            <div className="h-48 flex flex-col">
              <div className="flex justify-between items-end flex-grow px-2 gap-4">
                {[
                  { label: '60Hz', height: 40 },
                  { label: '230Hz', height: 75 },
                  { label: '910Hz', height: 55 },
                  { label: '3kHz', height: 65 },
                  { label: '14kHz', height: 30 },
                ].map(band => (
                  <div key={band.label} className="flex-1 flex flex-col items-center gap-3">
                    <div className="w-full h-32 bg-white/5 rounded-full relative overflow-hidden border border-white/10">
                      <div className="absolute bottom-0 left-0 w-full bg-primary/30" style={{ height: `${band.height}%` }} />
                      <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_#f2ca50] z-10"
                        style={{ top: `${100 - band.height}%`, transform: 'translate(-50%, -50%)' }} />
                    </div>
                    <span className="text-[9px] text-on-surface-variant/40 font-bold tracking-tighter">{band.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Output Details */}
            <div className="flex items-center justify-center gap-4 text-on-surface-variant/40 pt-8 border-t border-white/5">
              <span className="material-symbols-outlined text-[20px]">headphones</span>
              <span className="text-[10px] uppercase tracking-[0.3em] font-medium">Aurelia Reference One • Bluetooth LE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Queue overlay */}
      {showQueue && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-2xl fade-in flex flex-col">
          <div className="flex items-center justify-between px-6 pt-12 pb-2">
            <div>
              <h3 className="text-sm text-zinc-400 uppercase tracking-wider font-medium">Up Next</h3>
              <p className="text-xs text-zinc-600 mt-0.5">{queue.length} tracks</p>
            </div>
            <button onClick={() => setShowQueue(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-90">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-0.5">
            {queue.map((track, i) => (
              <div key={`${track.source || 'queue'}-${track.id}`}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${i === queueIndex ? 'bg-white/[0.06] ring-1 ring-primary/20' : 'hover:bg-white/[0.03]'}`}>
                <span className="w-6 text-center text-xs text-zinc-600 font-mono">{i + 1}</span>
                {(() => {
                  const src = track.youtubeId ? `https://i.ytimg.com/vi/${track.youtubeId}/default.jpg` : (track.album.cover_small || track.album.cover_medium);
                  return src ? (
                    <img src={src} alt="" className="w-10 h-10 rounded-lg object-cover ring-1 ring-white/[0.04]" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                      <span className="material-symbols-outlined text-zinc-600">music_note</span>
                    </div>
                  );
                })()}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${i === queueIndex ? 'text-white' : 'text-zinc-300'}`}>{track.title}</p>
                  <p className="text-xs text-zinc-600 truncate">{track.artist.name}</p>
                </div>
                {i === queueIndex && (
                  <div className="flex items-center gap-1.5 text-primary">
                    <span className="material-symbols-outlined text-sm">volume_up</span>
                    <span className="text-[9px] font-medium uppercase tracking-wider">Now</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
