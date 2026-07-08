'use client';

import { useEffect, useState } from 'react';
import type { Track } from '@/lib/types';
import { getTrending, GENRES } from '@/lib/music';
import SongCard from '@/components/SongCard';
import EnhancedVisualizer from '@/components/EnhancedVisualizer';
import { usePlayer } from '@/lib/PlayerContext';

export default function HomePage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { play, isPlaying } = usePlayer();

  useEffect(() => {
    async function load() {
      try {
        const trending = await getTrending();
        setTracks(trending);
      } catch (err) {
        console.error('Failed to load:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] pt-20">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/10 animate-pulse" />
            <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-[#D4AF37] animate-spin" />
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-transparent animate-pulse" />
          </div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.25em]">Loading music library</p>
        </div>
      </div>
    );
  }

  const popularGenres = GENRES.slice(0, 6);

  return (
    <div className="px-4 md:px-16 py-6 max-w-screen-2xl mx-auto slide-up">
      {/* Hero */}
      <section className="relative mb-14 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-900 via-[#0f0f0f] to-zinc-900 border border-white/[0.06] p-8 md:p-14 min-h-[400px] flex items-center gold-border-glow">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#D4AF37]/10 blur-[120px] rounded-full animate-pulse-slow" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]/80 font-medium">YouTube Music</span>
            <span className="w-px h-3 bg-white/[0.08]" />
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Millions of Songs</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-[family-name:var(--font-serif)] text-white leading-tight mb-3">
            Infinite
            <br />
            <span className="bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#D4AF37] bg-clip-text text-transparent">Sound</span>
          </h1>
          <p className="text-zinc-400 max-w-xl text-sm md:text-base leading-relaxed mb-8">
            Search and play any song from YouTube&apos;s vast library. No account needed, no limits.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => tracks[0] && play(tracks[0], tracks)}
              className="px-8 py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#FFD700] text-black rounded-full text-sm font-semibold hover:shadow-xl hover:shadow-[#D4AF37]/40 transition-all inline-flex items-center gap-2 gold-glow-btn active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              Start Listening
            </button>
          </div>
        </div>
      </section>

      {/* Genres */}
      {popularGenres.length > 0 && (
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-[family-name:var(--font-serif)] text-white">Explore Genres</h2>
              <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-[0.15em]">Find your vibe</p>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar">
            {popularGenres.map(genre => (
              <a
                key={genre.id}
                href={`/search?q=${genre.name}`}
                onClick={e => { e.preventDefault(); window.location.href = `/search?q=${genre.name}`; }}
                className="flex-shrink-0 w-36 h-44 rounded-2xl overflow-hidden relative group cursor-pointer bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/[0.06] hover:border-[#D4AF37]/40 transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white text-sm font-medium">{genre.name}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-[family-name:var(--font-serif)] text-white">Trending Now</h2>
            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-[0.15em]">From YouTube</p>
          </div>
        </div>
        <div className="grid gap-0.5 fade-in">
          {tracks.map((track, i) => (
            <SongCard key={`${track.source || 'yt'}-${track.id}`} track={track} index={i} queue={tracks} showIndex />
          ))}
        </div>
      </section>
    </div>
  );
}
