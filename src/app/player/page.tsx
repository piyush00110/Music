'use client';

import { usePlayer } from '@/lib/PlayerContext';
import Equalizer from '@/components/Equalizer';
import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';

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
    downloadCurrentTrack, downloading,
    setSoundEffect,
  } = usePlayer();
  const [showQueue, setShowQueue] = useState(false);
  const [showEq, setShowEq] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [liked, setLiked] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [showSleepPicker, setShowSleepPicker] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [eqBands, setEqBands] = useState([40, 75, 55, 65, 30]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const startSleepTimer = useCallback((minutes: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSleepTimer(minutes);
    timerRef.current = setTimeout(() => {
      pause();
      setSleepTimer(null);
      timerRef.current = null;
    }, minutes * 60000);
    setShowSleepPicker(false);
  }, [pause]);

  const cancelSleepTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSleepTimer(null);
    timerRef.current = null;
  }, []);

  const pct = duration > 0 ? (progress / duration) * 100 : 0;
  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => seek(Number(e.target.value)), [seek]);

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
  const albumTitle = currentTrack.album?.title || 'Unknown Album';

  return (
    <div className="relative h-screen flex flex-col bg-background overflow-hidden selection:bg-primary/30">

      {/* Background layers */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black/80 z-20" />
        <div className="fixed inset-0 z-10 pointer-events-none opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }} />
        {artSrc && (
          <div className="absolute inset-0 bg-cover bg-center z-10 opacity-40" style={{ backgroundImage: `url(${artSrc})` }} />
        )}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full h-full bg-primary/5 blur-[120px] rounded-full animate-pulse-slow z-15" />
      </div>

      {/* Header */}
      <header className="relative z-30 flex items-center justify-between px-6 pt-12 md:pt-14 pb-2">
        <Link href="/" className="active:scale-95 duration-200 text-on-surface/80 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[30px]">expand_more</span>
        </Link>
        <div className="flex items-center gap-2">
          {sleepTimer && (
            <button onClick={cancelSleepTimer} className="px-3 py-1.5 rounded-full bg-primary/20 text-primary text-[10px] font-medium flex items-center gap-1 hover:bg-primary/30 transition-all">
              <span className="material-symbols-outlined text-sm">timer</span>
              {sleepTimer}m
            </button>
          )}
          <span className="font-headline-md text-[11px] tracking-[0.5em] text-primary/70 uppercase font-bold">Now Playing</span>
        </div>
        <button onClick={() => setShowMenu(!showMenu)} className="active:scale-95 duration-200 text-on-surface/80 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[30px]">more_vert</span>
        </button>
      </header>

      {/* Menu */}
      {showMenu && (
        <div className="fixed top-24 right-6 z-50 bg-zinc-900/95 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-2 min-w-[200px] shadow-2xl fade-in">
          <button onClick={() => { setDrawerOpen(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all">
            <span className="material-symbols-outlined text-primary">graphic_eq</span>
            Audio Experience
          </button>
          <button onClick={() => { setShowSleepPicker(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all">
            <span className="material-symbols-outlined text-zinc-400">bedtime</span>
            Sleep Timer
          </button>
          <div className="h-px bg-white/[0.04] my-1" />
          <button onClick={() => { downloadCurrentTrack(); setShowMenu(false); }} disabled={downloading} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all disabled:opacity-40">
            {downloading ? (
              <div className="w-5 h-5 rounded-full border border-zinc-500/30 border-t-zinc-300 animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-zinc-400">download</span>
            )}
            {downloading ? 'Saving...' : 'Download'}
          </button>
        </div>
      )}

      {/* Sleep timer picker */}
      {showSleepPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm fade-in">
          <div className="bg-zinc-900 border border-white/[0.06] rounded-2xl p-6 w-[280px] shadow-2xl">
            <h3 className="text-sm text-zinc-300 font-medium mb-4">Set Sleep Timer</h3>
            <div className="space-y-1">
              {[15, 30, 45, 60, 90].map(min => (
                <button key={min} onClick={() => startSleepTimer(min)} className="w-full px-4 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all text-left">
                  {min} minutes
                </button>
              ))}
              <button onClick={() => { setShowSleepPicker(false); startSleepTimer(5); }} className="w-full px-4 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-white/[0.06] transition-all text-left">
                End of track
              </button>
            </div>
            <button onClick={() => setShowSleepPicker(false)} className="w-full mt-3 px-4 py-2.5 rounded-xl text-sm text-zinc-500 hover:bg-white/[0.04] transition-all">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* EQ panel */}
      {showEq && (
        <div className="relative z-30 px-6 mb-2 fade-in">
          <div className="bg-zinc-900/90 backdrop-blur-2xl border border-white/[0.06] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Equalizer</h3>
              <button onClick={() => setShowEq(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <Equalizer />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="relative z-30 flex-1 flex flex-col px-6 pb-4">
        {/* Album Art & Visualizer */}
        <div className="flex-1 flex items-center justify-center relative py-4">
          <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20 pointer-events-none">
            {[0.1, 0.3, 0.5, 0.2, 0.4, 0.6].map((d, i) => (
              <div key={i} className="viz-bar w-1 bg-primary rounded-full" style={{ animationDelay: `${d}s`, height: `${30 + i * 10}%` }} />
            ))}
          </div>
          <div className="w-full max-w-[280px] md:max-w-sm aspect-square rounded-xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] shadow-primary/10 ring-1 ring-primary/10 relative group">
            {artSrc ? (
              <img src={artSrc} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                <span className="material-symbols-outlined text-6xl text-zinc-700">music_note</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Info Section */}
        <div className="flex items-end justify-between mt-1">
          <div className="flex flex-col flex-1 pr-4 min-w-0">
            <h1 className="font-headline-md text-on-background tracking-tight leading-tight text-xl md:text-2xl truncate">{currentTrack.title}</h1>
            <p className="font-metadata text-primary/60 uppercase tracking-[0.25em] text-[11px] mt-2 font-medium">{currentTrack.artist.name}</p>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/20 w-fit mt-2">
              <span className="material-symbols-outlined text-[14px] text-primary fill-icon">workspace_premium</span>
              <span className="text-[9px] font-bold text-primary tracking-[0.1em] uppercase">Master Quality</span>
            </div>
          </div>
          <button onClick={() => setLiked(!liked)} className={`text-primary/40 hover:text-primary active:scale-90 transition-all duration-300 ${liked ? 'text-primary' : ''}`}>
            <span className={`material-symbols-outlined text-[34px] ${liked ? 'fill-icon' : ''}`}>favorite</span>
          </button>
        </div>

        {/* Progress */}
        <div className="mt-4 md:mt-5">
          <div className="relative w-full h-1">
            <div className="absolute inset-0 rounded-full bg-white/[0.06]" />
            <div className="absolute top-0 left-0 h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
            <input type="range" min={0} max={duration || 1} value={progress} onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
          <div className="flex justify-between mt-2 md:mt-3 font-metadata text-[10px] text-on-surface-variant/40 tracking-[0.2em] font-medium">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-6 md:mt-7">
          <button onClick={toggleShuffle} className={`transition-colors ${shuffle ? 'text-primary' : 'text-on-surface-variant/50 hover:text-primary'}`}>
            <span className="material-symbols-outlined text-[24px]">shuffle</span>
          </button>
          <div className="flex items-center gap-4 md:gap-6">
            <button onClick={prev} className="w-12 h-12 md:w-14 md:h-14 rounded-full glass-btn flex items-center justify-center active:scale-95 transition-transform group">
              <span className="material-symbols-outlined text-[28px] md:text-[32px] text-on-surface/80 group-hover:text-primary">skip_previous</span>
            </button>
            <button onClick={() => (isPlaying ? pause() : resume())}
              className="rounded-full bg-primary flex items-center justify-center shadow-[0_0_40px_rgba(242,202,80,0.3)] hover:shadow-[0_0_50px_rgba(242,202,80,0.4)] active:scale-90 transition-all w-16 h-16 md:w-20 md:h-20">
              <span className="material-symbols-outlined text-on-primary fill-icon text-[36px] md:text-[48px]">{isPlaying ? 'pause' : 'play_arrow'}</span>
            </button>
            <button onClick={next} className="w-12 h-12 md:w-14 md:h-14 rounded-full glass-btn flex items-center justify-center active:scale-95 transition-transform group">
              <span className="material-symbols-outlined text-[28px] md:text-[32px] text-on-surface/80 group-hover:text-primary">skip_next</span>
            </button>
          </div>
          <button onClick={toggleRepeat} className={`transition-colors relative ${repeat !== 'off' ? 'text-primary' : 'text-on-surface-variant/50 hover:text-primary'}`}>
            <span className="material-symbols-outlined text-[24px]">repeat</span>
            {repeat === 'one' && <span className="absolute -top-1 -right-1 text-[9px] font-bold text-primary">1</span>}
          </button>
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-between mt-6 md:mt-7">
          <button onClick={() => setDrawerOpen(!drawerOpen)}
            className="flex items-center gap-3 px-4 py-2 rounded-full border border-white/5 bg-white/5 active:opacity-60 transition-all hover:bg-white/10">
            <span className="material-symbols-outlined text-[20px] text-primary/80">graphic_eq</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Audio Experience</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowQueue(!showQueue)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors">
              <span className="material-symbols-outlined text-[26px] text-on-surface-variant/60 hover:text-primary">queue_music</span>
            </button>
            <button onClick={() => downloadCurrentTrack()} disabled={downloading} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors disabled:opacity-40">
              {downloading ? (
                <div className="w-5 h-5 rounded-full border border-zinc-500/30 border-t-zinc-300 animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[26px] text-on-surface-variant/60 hover:text-primary">download</span>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Audio Experience Drawer */}
      <div className={`fixed bottom-0 left-0 w-full z-50 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="glass-panel rounded-t-[40px] px-6 md:px-8 pt-4 pb-12 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-primary/10 max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col items-center cursor-pointer mb-8" onClick={() => setDrawerOpen(false)}>
            <div className="w-16 h-1 bg-primary/20 rounded-full hover:bg-primary/40 transition-colors" />
          </div>
          <div className="max-w-md mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-xl md:text-2xl text-primary">Audio Excellence</h3>
              <button onClick={() => setShowEq(true)} className="text-primary/40 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[28px]">settings</span>
              </button>
            </div>

            {/* Spatial Audio */}
            <div className="flex items-center justify-between bg-white/5 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/10">
              <div className="flex items-center gap-4 md:gap-5">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-2xl">spatial_audio</span>
                </div>
                <div>
                  <p className="text-sm text-on-surface font-semibold">Spatial Audio Pro</p>
                  <p className="text-[10px] text-on-surface-variant/50 uppercase tracking-widest mt-0.5">Immersive 3D Sound</p>
                </div>
              </div>
              <button onClick={() => setSoundEffect('spatialAudio', !soundEffects.spatialAudio)}
                className={`w-12 h-6 rounded-full relative flex items-center px-1.5 transition-all border ${soundEffects.spatialAudio ? 'bg-primary/20 border-primary/30' : 'bg-white/10 border-white/10'}`}>
                <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${soundEffects.spatialAudio ? 'bg-primary shadow-[0_0_15px_#f2ca50] ml-auto' : 'bg-white/40'}`} />
              </button>
            </div>

            {/* 5-Band EQ Visual */}
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-[0.25em] text-on-surface-variant/40 font-bold">Equalizer</p>
              <div className="h-40 md:h-44 flex justify-between items-end px-1 gap-3 md:gap-4">
                {[
                  { label: '60Hz', value: eqBands[0], idx: 0 },
                  { label: '230Hz', value: eqBands[1], idx: 1 },
                  { label: '910Hz', value: eqBands[2], idx: 2 },
                  { label: '3kHz', value: eqBands[3], idx: 3 },
                  { label: '14kHz', value: eqBands[4], idx: 4 },
                ].map(band => (
                  <div key={band.label} className="flex-1 flex flex-col items-center gap-2 md:gap-3 h-full justify-end">
                    <div className="w-full h-28 md:h-32 bg-white/5 rounded-full relative overflow-hidden border border-white/10 cursor-pointer"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pct = 100 - ((e.clientY - rect.top) / rect.height) * 100;
                        const val = Math.max(0, Math.min(100, Math.round(pct)));
                        const newBands = [...eqBands];
                        newBands[band.idx] = val;
                        setEqBands(newBands);
                      }}>
                      <div className="absolute bottom-0 left-0 w-full bg-primary/30 transition-all duration-150" style={{ height: `${band.value}%` }} />
                      <div className="absolute w-2.5 h-2.5 md:w-3 md:h-3 bg-primary rounded-full shadow-[0_0_10px_#f2ca50] left-1/2 -translate-x-1/2 transition-all duration-150" style={{ bottom: `${band.value}%`, transform: `translate(-50%, 50%)` }} />
                    </div>
                    <span className="text-[8px] md:text-[9px] text-on-surface-variant/40 font-bold tracking-tighter">{band.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Output details */}
            <div className="flex items-center justify-center gap-3 md:gap-4 text-on-surface-variant/40 pt-6 border-t border-white/5">
              <span className="material-symbols-outlined text-[18px] md:text-[20px]">headphones</span>
              <span className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-medium">Hi-Fi Audio · Studio Reference</span>
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
            <button onClick={() => setShowQueue(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
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

      <style jsx>{`
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
        .viz-bar {
          animation: bar-grow 1.2s ease-in-out infinite;
        }
        @keyframes bar-grow {
          0%, 100% { height: 15%; }
          50% { height: 80%; }
        }
      `}</style>
    </div>
  );
}
