'use client';

import type { Track } from '@/lib/types';
import { usePlayer } from '@/lib/PlayerContext';
import { useState } from 'react';

interface Props {
  track: Track;
  index?: number;
  queue?: Track[];
  showIndex?: boolean;
}

export default function SongCard({ track, index, queue, showIndex }: Props) {
  const { play, currentTrack, isPlaying, pause, resume, addToQueue } = usePlayer();
  const isCurrentTrack = currentTrack?.id === track.id;
  const [dl, setDl] = useState(false);

  function triggerDownload(url: string, filename: string) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const downloadTrack = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (track.youtubeId) {
      setDl(true);
      triggerDownload(
        `/api/download?id=${track.youtubeId}&title=${encodeURIComponent(track.title)}`,
        `${track.title.replace(/[^\w\s]/g, '').trim() || 'song'}.m4a`,
      );
      setTimeout(() => setDl(false), 5000);
      return;
    }
    const url = track.preview;
    if (!url) return;
    setDl(true);
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      const blob = await res.blob();
      const ext = blob.type.includes('mp4') ? 'm4a' : 'mp3';
      const objUrl = URL.createObjectURL(blob);
      triggerDownload(objUrl, `${track.title.replace(/[^\w\s]/g, '').trim() || 'audio'}.${ext}`);
      setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
    } catch { window.open(url, '_blank'); }
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

  return (
    <div
      onClick={handlePlay}
      className={`
        group flex items-center gap-2 md:gap-3 p-2 rounded-xl cursor-pointer
        transition-all duration-200 active:scale-[0.98]
        ${isCurrentTrack
          ? 'active-track-glow'
          : 'hover:bg-white/[0.04] border border-transparent'
        }
      `}
    >
      {showIndex && (
        <span className="w-5 md:w-6 text-center text-xs text-zinc-500 font-mono flex-shrink-0">{index! + 1}</span>
      )}

      <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-zinc-700 to-zinc-900 album-hover">
        {track.album.cover_medium || track.youtubeId ? (
          <img
            src={track.album.cover_medium || `https://i.ytimg.com/vi/${track.youtubeId}/default.jpg`}
            alt={track.album.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377" />
            </svg>
          </div>
        )}
        <div className="play-overlay absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#D4AF37]/90 flex items-center justify-center gold-glow-btn">
            {isCurrentTrack && isPlaying ? (
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-black" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-black ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className={`text-xs md:text-sm font-medium truncate ${isCurrentTrack ? 'text-[#D4AF37]' : 'text-white'}`}>
          {track.title}
        </p>
        <p className="text-[10px] md:text-xs text-zinc-400 truncate mt-0.5">{track.artist.name}</p>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <span className="text-[10px] md:text-xs text-zinc-500 tabular-nums">{formatDuration(track.duration)}</span>
        <button
          onClick={(e) => { e.stopPropagation(); addToQueue(track); }}
          className="w-7 h-7 md:w-7 md:h-7 rounded-full bg-white/5 hover:bg-[#D4AF37]/20 flex items-center justify-center transition-all md:opacity-0 md:group-hover:opacity-100 active:scale-90"
          title="Add to queue"
        >
          <svg className="w-3 h-3 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handlePlay(); }}
          className="w-8 h-8 md:w-8 md:h-8 rounded-full bg-white/5 hover:bg-[#D4AF37]/20 flex items-center justify-center transition-all md:opacity-0 md:group-hover:opacity-100 active:scale-90"
        >
          <svg className="w-3.5 h-3.5 text-[#D4AF37]" viewBox="0 0 24 24" fill="currentColor">
            {isCurrentTrack && isPlaying ? (
              <><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></>
            ) : (
              <path d="M8 5v14l11-7z" />
            )}
          </svg>
        </button>
        <button
          onClick={downloadTrack}
          disabled={dl}
          className="w-7 h-7 md:w-7 md:h-7 rounded-full bg-white/5 hover:bg-[#D4AF37]/20 flex items-center justify-center transition-all md:opacity-0 md:group-hover:opacity-100 active:scale-90 disabled:opacity-50"
          title="Download"
        >
          {dl ? (
            <div className="w-3 h-3 rounded-full border border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
          ) : (
            <svg className="w-3 h-3 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
