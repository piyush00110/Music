'use client';

import { usePlayer } from '@/lib/PlayerContext';
import Link from 'next/link';

export default function NowPlayingBar() {
  const { currentTrack, isPlaying, pause, resume, next, progress, duration } = usePlayer();

  if (!currentTrack) return null;

  const artSrc = currentTrack.youtubeId
    ? `https://i.ytimg.com/vi/${currentTrack.youtubeId}/hqdefault.jpg`
    : currentTrack.album.cover_medium;

  return (
    <div className="fixed bottom-[56px] md:bottom-0 left-0 right-0 z-40 px-2 md:px-0">
      <Link href="/player" className="md:hidden block"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) {
            e.preventDefault();
          }
        }}>
        <div className="glass-panel rounded-xl mx-1 overflow-hidden shadow-sm border border-[var(--border-subtle)]">
          {/* Progress indicator */}
          <div className="h-[2px] w-full bg-black/[0.06]">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-300"
              style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
            />
          </div>

          <div className="flex items-center gap-3 px-3 py-2.5">
            {/* Album art */}
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--bg-surface)]">
              {artSrc ? (
                <img src={artSrc} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[var(--text-tertiary)] text-sm">music_note</span>
                </div>
              )}
            </div>

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">
                {currentTrack.title}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                {currentTrack.artist.name}
              </p>
            </div>

            {/* Play/Pause */}
            <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); isPlaying ? pause() : resume(); }}
              className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all text-[var(--text-primary)]">
              <span className="material-symbols-outlined text-[24px]"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            {/* Next */}
            <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); next(); }}
              className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90 text-[var(--text-secondary)]">
              <span className="material-symbols-outlined text-[20px]">skip_next</span>
            </button>
          </div>
        </div>
      </Link>

      {/* Desktop bar */}
      <Link href="/player" className="hidden md:flex items-center gap-4 px-6 py-2 glass-panel border-t border-[var(--border-subtle)] max-w-screen-2xl mx-auto"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) {
            e.preventDefault();
          }
        }}>
        <div className="flex items-center gap-3 min-w-0 w-72">
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--bg-surface)]">
            {artSrc ? (
              <img src={artSrc} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--text-tertiary)]">music_note</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
              {currentTrack.title}
            </p>
            <p className="text-xs text-[var(--text-secondary)] truncate">{currentTrack.artist.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-5 flex-1 max-w-xl mx-auto">
          <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors active:scale-90">
            <span className="material-symbols-outlined text-xl">skip_previous</span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); isPlaying ? pause() : resume(); }}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--text-primary)] active:scale-95 transition-all shadow-sm">
            <span className="material-symbols-outlined text-2xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); next(); }}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors active:scale-90">
            <span className="material-symbols-outlined text-xl">skip_next</span>
          </button>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-md">
          <span className="text-[11px] text-[var(--text-tertiary)] w-8 text-right tabular-nums">
            {Math.floor(progress / 60)}:{Math.floor(progress % 60).toString().padStart(2, '0')}
          </span>
          <div className="flex-1 h-1 bg-black/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--text-primary)] rounded-full transition-all duration-300"
              style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
            />
          </div>
          <span className="text-[11px] text-[var(--text-tertiary)] w-8 tabular-nums">
            {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </Link>
    </div>
  );
}
