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
    ? `https://i.ytimg.com/vi/${currentTrack.youtubeId}/default.jpg`
    : currentTrack.album.cover_medium;

  return (
    <div className="fixed bottom-[52px] md:bottom-0 left-0 right-0 z-40 px-2 md:px-0">
      {audioError && (
        <div className="absolute -top-5 left-0 right-0 text-center z-50">
          <span className="text-[10px] text-red-400 bg-black/80 px-3 py-1 rounded-full backdrop-blur-md border border-red-500/10">{audioError}</span>
        </div>
      )}

      {/* Mobile — YouTube notification style */}
      <div className="md:hidden">
        <div className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(40,40,40,0.95) 0%, rgba(30,30,30,0.98) 100%)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
          }}>
          {/* Top row: icon, info, avatar, time */}
          <div className="flex items-center gap-3 px-3.5 pt-3 pb-1">
            {/* YouTube / source icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/20">
              <svg className="w-5 h-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>

            {/* Song info */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white truncate">{currentTrack.artist.name}</p>
              <p className="text-[12px] text-zinc-400 truncate mt-0.5 leading-tight">{currentTrack.title}</p>
            </div>

            {/* Album art avatar */}
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
              {artSrc ? (
                <img src={artSrc} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-zinc-500 text-sm">music_note</span>
                </div>
              )}
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between px-4 pb-2.5 pt-1">
            <div className="flex items-center gap-1">
              <button onClick={prev} className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 text-zinc-300 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[18px]">skip_previous</span>
              </button>
              <button onClick={() => (isPlaying ? pause() : resume())}
                className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all text-white hover:bg-white/10">
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <button onClick={next} className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 text-zinc-300 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[18px]">skip_next</span>
              </button>
            </div>

            <Link href="/player" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all active:scale-90">
              <span className="material-symbols-outlined text-[16px]">open_in_full</span>
            </Link>
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
      </div>

      {/* Desktop — clean glass bar */}
      <div className="hidden md:flex items-center gap-4 px-6 py-2.5 frosted-obsidian max-w-screen-2xl mx-auto">
        <Link href="/player" className="flex items-center gap-3 min-w-0 w-72 group">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800 shadow-lg group-hover:shadow-xl transition-shadow">
            {artSrc ? (
              <img src={artSrc} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-zinc-600">music_note</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate group-hover:text-[#D4AF37] transition-colors">{currentTrack.title}</p>
            <p className="text-xs text-zinc-400 truncate">{currentTrack.artist.name}</p>
          </div>
        </Link>

        <div className="flex items-center gap-5 flex-1 max-w-xl mx-auto">
          <button onClick={prev} className="text-zinc-400 hover:text-white transition-colors active:scale-90">
            <span className="material-symbols-outlined text-xl">skip_previous</span>
          </button>
          <button onClick={() => (isPlaying ? pause() : resume())}
            className="w-10 h-10 rounded-full sunburst-btn flex items-center justify-center text-black active:scale-95 transition-all">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button onClick={next} className="text-zinc-400 hover:text-white transition-colors active:scale-90">
            <span className="material-symbols-outlined text-xl">skip_next</span>
          </button>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-md">
          <span className="text-[11px] text-zinc-500 w-8 text-right tabular-nums">{formatTime(progress)}</span>
          <div className="flex-1"><ProgressBar value={progress} max={duration} /></div>
          <span className="text-[11px] text-zinc-500 w-8 tabular-nums">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center gap-2 w-28 justify-end">
          <Link href="/player" className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all text-zinc-400 hover:text-[#D4AF37]">
            <span className="material-symbols-outlined text-[18px]">open_in_full</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
