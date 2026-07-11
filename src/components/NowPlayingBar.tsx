'use client';

import { usePlayer } from '@/lib/PlayerContext';
import ProgressBar from './ProgressBar';
import Link from 'next/link';

export default function NowPlayingBar() {
  const { currentTrack, isPlaying, pause, resume, next, prev, progress, duration, audioError } = usePlayer();

  if (!currentTrack) return null;

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const artSrc = currentTrack.youtubeId
    ? `https://i.ytimg.com/vi/${currentTrack.youtubeId}/hqdefault.jpg`
    : currentTrack.album.cover_medium;

  return (
    <div className="fixed bottom-[52px] md:bottom-0 left-0 right-0 z-40 px-2 md:px-0">
      <style jsx global>{`
        @keyframes npb-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
        }
        @keyframes npb-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(212,175,55,0.15); }
          50% { box-shadow: 0 0 20px rgba(212,175,55,0.35); }
        }
        @keyframes npb-bars {
          0%, 100% { transform: scaleY(0.35); }
          50% { transform: scaleY(1); }
        }
        @keyframes npb-ring-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {audioError && (
        <div className="absolute -top-5 left-0 right-0 text-center z-50">
          <span className="text-[10px] text-red-400 bg-black/80 px-3 py-1 rounded-full backdrop-blur-md border border-red-500/10">{audioError}</span>
        </div>
      )}

      {/* Mobile — tap anywhere to open player, buttons stop propagation */}
      <Link href="/player" className="md:hidden block"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) {
            e.preventDefault();
          }
        }}>
        <div className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(40,40,40,0.95) 0%, rgba(30,30,30,0.98) 100%)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: isPlaying ? '1px solid rgba(212,175,55,0.2)' : '1px solid rgba(255,255,255,0.08)',
            boxShadow: isPlaying
              ? '0 8px 32px rgba(0,0,0,0.4), 0 0 24px rgba(212,175,55,0.12)'
              : '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
            transition: 'border-color 0.5s, box-shadow 0.5s',
          }}>
          {/* Playing indicator line */}
          <div className="absolute top-0 left-0 right-0 h-[2px]"
            style={{
              background: isPlaying ? 'linear-gradient(90deg, transparent, #D4AF37, #FFBF00, #D4AF37, transparent)' : 'transparent',
              opacity: isPlaying ? 1 : 0,
              transition: 'opacity 0.5s',
            }} />

          <div className="flex items-center gap-3 px-3.5 pt-3 pb-1">
            {/* Album art with playing effect */}
            <div className="relative flex-shrink-0">
              {/* Glow behind art - always showing */}
              <div className="absolute -inset-1 rounded-xl opacity-60"
                style={{
                  background: 'radial-gradient(circle, rgba(212,175,55,0.25) 0%, transparent 70%)',
                  animation: 'npb-glow 2.5s ease-in-out infinite',
                  opacity: isPlaying ? 0.6 : 0.3,
                }} />
              <div className="w-10 h-10 rounded-xl overflow-hidden relative"
                style={{
                  animation: isPlaying ? 'npb-pulse 3s ease-in-out infinite' : 'idle-breathe 4s ease-in-out infinite',
                  boxShadow: isPlaying ? '0 0 12px rgba(212,175,55,0.2)' : '0 0 6px rgba(212,175,55,0.1)',
                }}>
                {artSrc ? (
                  <img src={artSrc} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-zinc-500 text-sm">music_note</span>
                  </div>
                )}
                {/* Spinning ring overlay - always spinning */}
                <div className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    border: '1.5px solid rgba(212,175,55,0.15)',
                    borderTop: '1.5px solid rgba(212,175,55,0.6)',
                    animation: `npb-ring-spin ${isPlaying ? '2s' : '8s'} linear infinite`,
                  }} />
              </div>
              {/* Mini equalizer bars on art - always showing */}
              <div className="absolute bottom-1 right-1 flex items-end gap-[2px] bg-black/50 backdrop-blur-sm rounded-sm px-1 py-0.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-[2px] rounded-full bg-[#D4AF37]"
                    style={{
                      height: '8px',
                      transformOrigin: 'bottom',
                      animation: isPlaying
                        ? `npb-bars ${0.4 + i * 0.15}s ease-in-out infinite ${i * 0.1}s`
                        : `idle-breathe ${2 + i * 0.5}s ease-in-out infinite ${i * 0.3}s`,
                    }} />
                ))}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate" style={isPlaying ? { color: '#D4AF37' } : {}}>
                {currentTrack.artist.name}
              </p>
              <p className="text-[12px] text-zinc-400 truncate mt-0.5 leading-tight">{currentTrack.title}</p>
            </div>

            {/* Play/Pause with effect */}
            <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); isPlaying ? pause() : resume(); }}
              className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all"
              style={{
                background: isPlaying ? 'linear-gradient(135deg, #D4AF37, #FFBF00)' : 'rgba(255,255,255,0.1)',
                boxShadow: isPlaying ? '0 0 16px rgba(212,175,55,0.3)' : 'none',
              }}>
              <span className="material-symbols-outlined text-[20px] transition-all"
                style={{
                  fontVariationSettings: "'FILL' 1",
                  color: isPlaying ? '#000' : '#fff',
                }}>
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between px-4 pb-2.5 pt-1">
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); prev(); }}
                className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 text-zinc-300 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[18px]">skip_previous</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); isPlaying ? pause() : resume(); }}
                className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all text-white hover:bg-white/10">
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); next(); }}
                className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 text-zinc-300 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[18px]">skip_next</span>
              </button>
            </div>

            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400">
              <span className="material-symbols-outlined text-[16px]">open_in_full</span>
            </div>
          </div>

          {/* Progress bar at bottom */}
          <div className="px-3.5 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-zinc-500 tabular-nums w-6">{formatTime(progress)}</span>
              <div className="flex-1"><ProgressBar value={progress} max={duration} /></div>
              <span className="text-[9px] text-zinc-500 tabular-nums w-6 text-right">{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Desktop — clean glass bar, whole bar clickable */}
      <Link href="/player" className="hidden md:flex items-center gap-4 px-6 py-2.5 frosted-obsidian max-w-screen-2xl mx-auto"
        style={{
          borderTop: isPlaying ? '1px solid rgba(212,175,55,0.15)' : undefined,
        }}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) {
            e.preventDefault();
          }
        }}>
        <div className="flex items-center gap-3 min-w-0 w-72 group">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800 shadow-lg group-hover:shadow-xl transition-shadow">
            {artSrc ? (
              <img src={artSrc} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                style={{ animation: isPlaying ? 'npb-pulse 4s ease-in-out infinite' : 'idle-breathe 5s ease-in-out infinite' }} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-zinc-600">music_note</span>
              </div>
            )}
            {/* Playing indicator on desktop art - always showing */}
            <div className="absolute inset-0 rounded-lg pointer-events-none"
              style={{ border: `1px solid ${isPlaying ? 'rgba(212,175,55,0.25)' : 'rgba(212,175,55,0.1)'}` }} />
            <div className="absolute bottom-1 right-1 flex items-end gap-[2px] bg-black/50 backdrop-blur-sm rounded-sm px-1 py-0.5">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-[2px] rounded-full bg-[#D4AF37]"
                  style={{
                    height: '8px',
                    transformOrigin: 'bottom',
                    animation: isPlaying
                      ? `npb-bars ${0.4 + i * 0.15}s ease-in-out infinite ${i * 0.1}s`
                      : `idle-breathe ${2 + i * 0.5}s ease-in-out infinite ${i * 0.3}s`,
                  }} />
              ))}
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate group-hover:text-[#D4AF37] transition-colors"
              style={isPlaying ? { color: '#D4AF37' } : {}}>
              {currentTrack.title}
            </p>
            <p className="text-xs text-zinc-400 truncate">{currentTrack.artist.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-5 flex-1 max-w-xl mx-auto">
          <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); prev(); }}
            className="text-zinc-400 hover:text-white transition-colors active:scale-90">
            <span className="material-symbols-outlined text-xl">skip_previous</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); isPlaying ? pause() : resume(); }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-black active:scale-95 transition-all"
            style={{
              background: isPlaying ? 'radial-gradient(circle, #f2ca50 0%, #d4af37 100%)' : 'rgba(255,255,255,0.1)',
              boxShadow: isPlaying ? '0 0 25px rgba(242,202,80,0.35), 0 0 50px rgba(242,202,80,0.1)' : 'none',
              animation: 'npb-glow 2s ease-in-out infinite',
            }}>
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); next(); }}
            className="text-zinc-400 hover:text-white transition-colors active:scale-90">
            <span className="material-symbols-outlined text-xl">skip_next</span>
          </button>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-md">
          <span className="text-[11px] text-zinc-500 w-8 text-right tabular-nums">{formatTime(progress)}</span>
          <div className="flex-1"><ProgressBar value={progress} max={duration} /></div>
          <span className="text-[11px] text-zinc-500 w-8 tabular-nums">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center gap-2 w-28 justify-end">
          <div className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-zinc-400 hover:text-[#D4AF37]">
            <span className="material-symbols-outlined text-[18px]">open_in_full</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
