'use client';

import { useEffect, useState } from 'react';
import type { Track } from '@/lib/types';
import { searchMusic, getTrending, GENRES } from '@/lib/music';
import { usePlayer } from '@/lib/PlayerContext';
import SongCard from './SongCard';

export default function Recommendations() {
  const { currentTrack } = usePlayer();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentTrack) return;
    setLoading(true);
    const genre = GENRES[Math.floor(Math.random() * GENRES.length)];
    searchMusic(`${genre.name} music mix`)
      .then(res => {
        const filtered = res.filter(t => t.id !== currentTrack.id);
        setTracks(filtered.slice(0, 6));
      })
      .catch(() => getTrending().then(c => setTracks(c.slice(0, 6))))
      .finally(() => setLoading(false));
  }, [currentTrack?.youtubeId, currentTrack?.id]);

  if (!currentTrack || tracks.length === 0) return null;

  return (
    <div className="w-full mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-[family-name:var(--font-serif)] text-[var(--text-primary)]">You Might Also Like</h3>
        {loading && <div className="w-4 h-4 rounded-full border border-[var(--accent)]/30 border-t-[var(--accent)] animate-spin" />}
      </div>
      <div className="grid gap-1">
        {tracks.map((track, i) => (
          <SongCard key={`${track.source || 'yt'}-${track.id}`} track={track} index={i} queue={tracks} />
        ))}
      </div>
    </div>
  );
}
