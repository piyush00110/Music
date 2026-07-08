'use client';

import { useEffect, useState } from 'react';
import type { Track } from '@/lib/types';
import { getTrending, GENRES } from '@/lib/music';
import SongCard from '@/components/SongCard';
import { usePlayer } from '@/lib/PlayerContext';

const GENRE_COLORS: Record<string, string> = {
  'Pop': 'from-pink-500/20 to-rose-600/20',
  'Hip Hop': 'from-amber-500/20 to-orange-600/20',
  'Rock': 'from-red-500/20 to-red-700/20',
  'Electronic': 'from-cyan-500/20 to-blue-600/20',
  'R&B': 'from-purple-500/20 to-violet-600/20',
  'Classical': 'from-emerald-500/20 to-teal-600/20',
  'Jazz': 'from-yellow-500/20 to-amber-600/20',
  'LoFi': 'from-indigo-500/20 to-blue-600/20',
  'Country': 'from-orange-500/20 to-red-600/20',
  'Latin': 'from-green-500/20 to-emerald-600/20',
};

export default function HomePage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { play } = usePlayer();

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
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border border-[#D4AF37]/10" />
            <div className="absolute inset-1 rounded-full border border-transparent border-t-[#D4AF37] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#D4AF37]/40 text-xl">graphic_eq</span>
            </div>
          </div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.25em]">Loading</p>
        </div>
      </div>
    );
  }

  const popularGenres = GENRES.slice(0, 8);

  return (
    <div className="px-4 md:px-8 lg:px-12 py-5 max-w-screen-xl mx-auto slide-up">
      {/* Hero */}
      <section className="relative mb-8 md:mb-12 rounded-2xl md:rounded-3xl overflow-hidden min-h-[260px] md:min-h-[380px] flex items-center glass-card">
        {/* Background glow */}
        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-[#D4AF37]/[0.07] blur-[100px] rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-[#D4AF37]/[0.04] blur-[80px] rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

        <div className="relative z-10 p-6 md:p-12 max-w-2xl">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]/80 font-medium">Aurelia Music</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-[family-name:var(--font-serif)] text-white leading-[0.95] mb-4">
            Discover
            <span className="block mt-1">
              <span className="gold-gradient-text">Infinite Sound</span>
            </span>
          </h1>

          <p className="text-zinc-400 text-sm md:text-base leading-relaxed mb-8 max-w-md">
            Search and play any song from YouTube&apos;s vast library. Premium audio experience, zero limits.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => tracks[0] && play(tracks[0], tracks)}
              className="px-7 py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#FFBF00] text-black rounded-full text-sm font-semibold hover:shadow-xl hover:shadow-[#D4AF37]/30 transition-all duration-300 inline-flex items-center gap-2.5 gold-glow-btn active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">play_arrow</span>
              Start Listening
            </button>
          </div>
        </div>
      </section>

      {/* Genres */}
      {popularGenres.length > 0 && (
        <section className="mb-8 md:mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg md:text-xl font-[family-name:var(--font-serif)] text-white">Explore Genres</h2>
              <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-[0.15em]">Find your vibe</p>
            </div>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-3 -mx-4 px-4 hide-scrollbar">
            {popularGenres.map(genre => (
              <a
                key={genre.id}
                href={`/search?q=${genre.name}`}
                onClick={e => { e.preventDefault(); window.location.href = `/search?q=${genre.name}`; }}
                className={`flex-shrink-0 w-32 md:w-40 h-28 md:h-36 rounded-xl overflow-hidden relative group cursor-pointer bg-gradient-to-br ${GENRE_COLORS[genre.name] || 'from-zinc-700/40 to-zinc-800/40'} border border-white/[0.06] hover:border-[#D4AF37]/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white text-sm font-medium">{genre.name}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg md:text-xl font-[family-name:var(--font-serif)] text-white">Trending Now</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-[0.15em]">From YouTube</p>
          </div>
          <span className="text-[10px] text-zinc-600">{tracks.length} tracks</span>
        </div>
        <div className="space-y-0.5 fade-in">
          {tracks.map((track, i) => (
            <SongCard key={`${track.source || 'yt'}-${track.id}`} track={track} index={i} queue={tracks} showIndex />
          ))}
        </div>
      </section>
    </div>
  );
}
