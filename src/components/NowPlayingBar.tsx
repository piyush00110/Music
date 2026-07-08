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
    <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-40 frosted-obsidian">
      {audioError && (
        <div className="absolute -top-5 left-0 right-0 text-center z-50">
          <span className="text-[10px] text-red-400 bg-black/80 px-3 py-1 rounded-full backdrop-blur-md border border-red-500/10">{audioError}</span>
        </div>
      )}

      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <Link href="/player" className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800 shadow-lg">
              {artSrc ? (
                <img src={artSrc} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-zinc-600">music_note</span>
                </div>
              )}
              {isPlaying && (
                <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_6px_#D4AF37] animate-pulse" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-white truncate">{currentTrack.title}</p>
              <p className="text-[11px] text-zinc-400 truncate">{currentTrack.artist.name}</p>
            </div>
          </Link>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={prev} className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 text-zinc-300">
              <span className="material-symbols-outlined text-[20px]">skip_previous</span>
            </button>
            <button onClick={() => (isPlaying ? pause() : resume())}
              className="w-10 h-10 rounded-full sunburst-btn flex items-center justify-center text-black active:scale-90 transition-all">
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <button onClick={next} className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 text-zinc-300">
              <span className="material-symbols-outlined text-[20px]">skip_next</span>
            </button>
          </div>
        </div>
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-zinc-600 tabular-nums w-6">{formatTime(progress)}</span>
            <div className="flex-1"><ProgressBar value={progress} max={duration} /></div>
            <span className="text-[9px] text-zinc-600 tabular-nums w-6 text-right">{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:flex items-center gap-4 px-6 py-2.5 max-w-screen-2xl mx-auto">
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
