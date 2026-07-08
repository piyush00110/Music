'use client';

import { usePlayer } from '@/lib/PlayerContext';
import ProgressBar from './ProgressBar';
import Link from 'next/link';

export default function NowPlayingBar() {
  const { currentTrack, isPlaying, pause, resume, next, prev, progress, duration, audioError, downloadCurrentTrack, downloading } = usePlayer();

  if (!currentTrack) return null;

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 frosted-obsidian bg-black/60">
      {audioError && (
        <div className="absolute -top-5 left-0 right-0 text-center">
          <span className="text-[10px] text-red-400 bg-black/80 px-2 py-0.5 rounded-full backdrop-blur">{audioError}</span>
        </div>
      )}
      {/* Mobile layout */}
      <div className="md:hidden flex items-center gap-2 px-3 py-2">
        <Link href="/player" className="flex items-center gap-2 min-w-0 flex-1">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
            {currentTrack.album.cover_medium ? (
              <img src={currentTrack.album.cover_medium} alt="" className="w-full h-full object-cover" />
            ) : currentTrack.youtubeId ? (
              <img src={`https://i.ytimg.com/vi/${currentTrack.youtubeId}/default.jpg`} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-lg text-zinc-500">music_note</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate max-w-[120px]">{currentTrack.title}</p>
            <p className="text-[10px] text-zinc-400 truncate max-w-[120px]">{currentTrack.artist.name}</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={prev} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center active:scale-90" title="Previous">
            <span className="material-symbols-outlined text-lg text-zinc-300">skip_previous</span>
          </button>
          <button onClick={() => (isPlaying ? pause() : resume())}
            className="w-9 h-9 rounded-full sunburst-btn flex items-center justify-center text-on-primary active:scale-90"
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button onClick={next} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center active:scale-90" title="Next">
            <span className="material-symbols-outlined text-lg text-zinc-300">skip_next</span>
          </button>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex items-center gap-4 px-8 py-3 max-w-screen-2xl mx-auto">
        <Link href="/player" className="flex items-center gap-3 min-w-0 flex-1 md:flex-none md:w-72 group">
          <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-900 album-hover">
            {currentTrack.album.cover_medium ? (
              <img src={currentTrack.album.cover_medium} alt={currentTrack.album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : currentTrack.youtubeId ? (
              <img src={`https://i.ytimg.com/vi/${currentTrack.youtubeId}/default.jpg`} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-lg text-zinc-500">music_note</span>
              </div>
            )}
            <div className="play-overlay absolute inset-0 bg-black/30 flex items-center justify-center backdrop-blur-[1px]">
              <span className="material-symbols-outlined text-white text-lg">play_arrow</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{currentTrack.title}</p>
            <p className="text-xs text-zinc-400 truncate">{currentTrack.artist.name}</p>
          </div>
        </Link>

        <div className="flex items-center gap-4 flex-1 max-w-xl mx-auto">
          <button onClick={prev} className="text-zinc-400 hover:text-primary transition-colors active:scale-90">
            <span className="material-symbols-outlined text-xl">skip_previous</span>
          </button>
          <button onClick={() => (isPlaying ? pause() : resume())}
            className="w-10 h-10 rounded-full sunburst-btn flex items-center justify-center text-on-primary active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button onClick={next} className="text-zinc-400 hover:text-primary transition-colors active:scale-90">
            <span className="material-symbols-outlined text-xl">skip_next</span>
          </button>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-md">
          <span className="text-xs text-zinc-500 w-8 text-right tabular-nums">{formatTime(progress)}</span>
          <div className="flex-1"><ProgressBar value={progress} max={duration} /></div>
          <span className="text-xs text-zinc-500 w-8 tabular-nums">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center gap-3 w-32 justify-end">
          {currentTrack.youtubeId && (
            <a href={`https://www.youtube.com/watch?v=${currentTrack.youtubeId}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-zinc-500 hover:text-primary transition-colors" title="Open in YouTube">YouTube</a>
          )}
          <button onClick={() => downloadCurrentTrack()} disabled={downloading} className="text-zinc-400 hover:text-primary transition-colors disabled:opacity-50" title="Download">
            {downloading ? (
              <div className="w-4 h-4 rounded-full border border-primary/30 border-t-primary animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-lg">download</span>
            )}
          </button>
          <Link href="/player" className="text-zinc-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-lg">music_note</span>
          </Link>
        </div>
      </div>

      {/* Mobile progress bar */}
      <div className="md:hidden px-3 pb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-zinc-600 tabular-nums w-6">{formatTime(progress)}</span>
          <div className="flex-1"><ProgressBar value={progress} max={duration} /></div>
          <span className="text-[9px] text-zinc-600 tabular-nums w-6 text-right">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}
