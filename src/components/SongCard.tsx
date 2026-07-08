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

  const artSrc = track.album.cover_medium || (track.youtubeId ? `https://i.ytimg.com/vi/${track.youtubeId}/default.jpg` : null);

  return (
    <div
      onClick={handlePlay}
      className={`
        group flex items-center gap-2.5 p-2 md:p-2.5 rounded-xl cursor-pointer
        transition-all duration-200 active:scale-[0.98]
        ${isCurrentTrack
          ? 'active-track-glow'
          : 'hover:bg-white/[0.04] border border-transparent'
        }
      `}
    >
      {showIndex && (
        <span className={`w-5 text-center text-xs font-mono flex-shrink-0 ${isCurrentTrack ? 'text-[#D4AF37]' : 'text-zinc-600'}`}>
          {index! + 1}
        </span>
      )}

      <div className="relative w-11 h-11 md:w-12 md:h-12 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800/50 shadow-md">
        {artSrc ? (
          <img src={artSrc} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-zinc-600 text-lg">music_note</span>
          </div>
        )}
        <div className="play-overlay absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="w-8 h-8 rounded-full bg-[#D4AF37]/90 flex items-center justify-center shadow-lg shadow-[#D4AF37]/30">
            {isCurrentTrack && isPlaying ? (
              <span className="material-symbols-outlined text-black text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>pause</span>
            ) : (
              <span className="material-symbols-outlined text-black text-lg ml-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            )}
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className={`text-[13px] md:text-sm font-medium truncate transition-colors ${isCurrentTrack ? 'text-[#D4AF37]' : 'text-white group-hover:text-[#D4AF37]'}`}>
          {track.title}
        </p>
        <p className="text-[11px] md:text-xs text-zinc-400 truncate mt-0.5">{track.artist.name}</p>
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
            <div className="w-3 h-3 rounded-full border border-[#D4AF37]/30 border-t-[#D4AF37] animate-spin" />
          ) : (
            <span className="material-symbols-outlined text-[14px] text-zinc-400">download</span>
          )}
        </button>
      </div>
    </div>
  );
}
