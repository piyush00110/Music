'use client';

import type { Track } from '@/lib/types';
import { usePlayer } from '@/lib/PlayerContext';
import { useState, memo } from 'react';
import { downloadFile, getTrackDownloadUrl, getSafeFilename, saveToStorage, showToast } from '@/lib/download';

interface Props {
  track: Track;
  index?: number;
  queue?: Track[];
  showIndex?: boolean;
}

export default memo(function SongCard({ track, index, queue, showIndex }: Props) {
  const { play, currentTrack, isPlaying, pause, resume, addToQueue } = usePlayer();
  const isCurrentTrack = currentTrack?.id === track.id;
  const [dl, setDl] = useState(false);

  const downloadTrack = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!track.youtubeId && !track.preview) return;
    setDl(true);
    try {
      // Save to Supabase Storage first
      if (track.youtubeId) {
        showToast('Saving to library...', 'success');
        const url = await saveToStorage(track);
        if (url) {
          showToast('Saved to your library!', 'success');
        }
      }
      // Then download locally
      const dlUrl = getTrackDownloadUrl(track);
      if (dlUrl) {
        const ext = track.youtubeId ? 'm4a' : (track.preview?.includes('mp4') ? 'm4a' : 'mp3');
        const filename = getSafeFilename(track.title, ext);
        await downloadFile(dlUrl, filename);
      }
    } catch {
      // Fallback: just download locally
      const dlUrl = getTrackDownloadUrl(track);
      if (dlUrl) {
        const ext = track.youtubeId ? 'm4a' : (track.preview?.includes('mp4') ? 'm4a' : 'mp3');
        const filename = getSafeFilename(track.title, ext);
        await downloadFile(dlUrl, filename);
      }
    }
    setDl(false);
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handlePlay = () => {
    if (isCurrentTrack) {
      if (isPlaying) pause();
      else resume();
    } else {
      play(track, queue);
    }
  };

  const artSrc = track.album.cover_medium || (track.youtubeId ? `https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg` : null);

  return (
    <div
      onClick={handlePlay}
      className={`
        group flex items-center gap-2.5 p-2 md:p-2.5 rounded-xl cursor-pointer
        transition-all duration-200 active:scale-[0.98]
        ${isCurrentTrack
          ? 'active-track-glow'
          : 'hover:bg-[var(--bg-surface-hover)] border border-transparent'
        }
      `}
    >
      {showIndex && (
        <span className={`w-5 text-center text-xs font-mono flex-shrink-0 ${isCurrentTrack ? 'text-[var(--accent)]' : 'text-zinc-600'}`}>
          {(index ?? 0) + 1}
        </span>
      )}

      <div className="w-11 h-11 md:w-12 md:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--bg-surface)] shadow-md">
        {artSrc ? (
          <img src={artSrc} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-zinc-600 text-lg">music_note</span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className={`text-[13px] md:text-sm font-medium truncate transition-colors ${isCurrentTrack ? 'text-[var(--accent)]' : 'text-[var(--text-primary)] group-hover:text-[var(--accent)]'}`}>
          {track.title}
        </p>
        <p className="text-[11px] md:text-xs text-[var(--text-secondary)] truncate mt-0.5">{track.artist.name}</p>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-[11px] text-zinc-600 tabular-nums mr-1">{formatDuration(track.duration)}</span>
        <button
          onClick={(e) => { e.stopPropagation(); addToQueue(track); }}
          className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 active:scale-90"
          title="Add to queue"
        >
          <span className="material-symbols-outlined text-[14px] text-zinc-400">queue_music</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handlePlay(); }}
          className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 active:scale-90"
        >
          <span className="material-symbols-outlined text-[14px] text-zinc-400">
            {isCurrentTrack && isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>
        <button
          onClick={downloadTrack}
          disabled={dl}
          className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 active:scale-90 disabled:opacity-50"
          title="Download"
        >
          {dl ? (
            <div className="w-3 h-3 rounded-full border border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-[14px] text-zinc-400">download</span>
          )}
        </button>
      </div>
    </div>
  );
});
