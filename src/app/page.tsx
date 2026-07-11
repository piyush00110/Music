'use client';

import { useEffect, useState } from 'react';
import type { Track } from '@/lib/types';
import { getTrending, GENRES } from '@/lib/music';
import SongCard from '@/components/SongCard';
import { usePlayer } from '@/lib/PlayerContext';
import { TOP_ARTISTS, FEATURED_PLAYLISTS, MOOD_PLAYLISTS } from '@/lib/artists';

const GENRE_COLORS: Record<string, string> = {
  'Pop': 'from-pink-500/30 to-rose-600/30',
  'Hip Hop': 'from-amber-500/30 to-orange-600/30',
  'Rock': 'from-red-500/30 to-red-700/30',
  'Electronic': 'from-cyan-500/30 to-blue-600/30',
  'R&B': 'from-purple-500/30 to-violet-600/30',
  'Classical': 'from-emerald-500/30 to-teal-600/30',
  'Jazz': 'from-yellow-500/30 to-amber-600/30',
  'LoFi': 'from-indigo-500/30 to-blue-600/30',
  'Country': 'from-orange-500/30 to-red-600/30',
  'Latin': 'from-green-500/30 to-emerald-600/30',
  'Punjabi': 'from-orange-500/30 to-yellow-500/30',
  'Bollywood': 'from-rose-500/30 to-pink-600/30',
};

// Genre images removed — using gradient cards instead (no broken external URLs)

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

  const popularGenres = GENRES.slice(0, 12);

  return (
    <div className="px-4 md:px-8 lg:px-12 py-5 max-w-screen-xl mx-auto">
      {/* Hero - Spotify-style greeting */}
      <section className="relative mb-8 md:mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFBF00] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
            <span className="material-symbols-outlined text-black text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Good Evening</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-[0.15em]">What do you want to listen to?</p>
          </div>
        </div>

        {/* Quick picks - 2x3 grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 stagger-children">
          {tracks.slice(0, 6).map((track, i) => (
            <button
              key={`quick-${track.id}`}
              onClick={() => play(track, tracks)}
              className="flex items-center gap-3 bg-white/[0.06] hover:bg-white/[0.1] rounded-lg overflow-hidden transition-all duration-300 active:scale-[0.98] group text-left"
            >
              <div className="w-12 h-12 flex-shrink-0 relative overflow-hidden">
                {(track.album.cover_medium || track.youtubeId) ? (
                  <img
                    src={track.album.cover_medium || `https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg`}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (track.youtubeId && !img.src.includes('hqdefault')) {
                        img.src = `https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg`;
                      } else {
                        img.style.display = 'none';
                        const parent = img.parentElement;
                        if (parent && !parent.querySelector('.fallback-icon')) {
                          const div = document.createElement('div');
                          div.className = 'fallback-icon w-full h-full bg-zinc-700 flex items-center justify-center absolute inset-0';
                          div.innerHTML = '<span class="material-symbols-outlined text-zinc-500 text-sm">music_note</span>';
                          parent.appendChild(div);
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-zinc-500 text-sm">music_note</span>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-[12px] font-semibold text-white truncate">{track.title}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Mood Playlists */}
      <section className="mb-8 md:mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-white">Browse by Mood</h2>
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-3 -mx-4 px-4 hide-scrollbar scroll-smooth-x">
          {MOOD_PLAYLISTS.map((mood, i) => (
            <a
              key={mood.id}
              href={`/search?q=${encodeURIComponent(mood.query)}`}
              onClick={e => { e.preventDefault(); window.location.href = `/search?q=${encodeURIComponent(mood.query)}`; }}
              className={`flex-shrink-0 w-28 md:w-32 h-36 md:h-40 rounded-xl overflow-hidden relative group cursor-pointer bg-gradient-to-br ${mood.color} border border-white/[0.06] hover:border-white/[0.15] transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] card-hover`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-3 left-3 text-2xl">{mood.icon}</div>
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white text-sm font-bold">{mood.mood}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Top Artists - Circular */}
      <section className="mb-8 md:mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-white">Popular Artists</h2>
          <button className="text-[10px] text-zinc-400 hover:text-white transition-colors uppercase tracking-wider font-medium">
            Show all
          </button>
        </div>
        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-3 -mx-4 px-4 hide-scrollbar scroll-smooth-x">
          {TOP_ARTISTS.map((artist, i) => (
            <a
              key={artist.id}
              href={`/search?q=${encodeURIComponent(artist.name)}`}
              onClick={e => { e.preventDefault(); window.location.href = `/search?q=${encodeURIComponent(artist.name)}`; }}
              className="flex-shrink-0 flex flex-col items-center gap-2.5 group cursor-pointer"
            >
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden artist-circle shadow-lg shadow-black/30">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="%23333"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="32" font-family="sans-serif">${artist.name.charAt(0)}</text></svg>`)}`;
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100 shadow-lg shadow-[#D4AF37]/30">
                    <span className="material-symbols-outlined text-black text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[12px] md:text-[13px] font-semibold text-white group-hover:text-[#D4AF37] transition-colors truncate max-w-[80px] md:max-w-[96px]">{artist.name}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Artist</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Featured Playlists - Horizontal scroll cards */}
      <section className="mb-8 md:mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-white">Made for You</h2>
          <button className="text-[10px] text-zinc-400 hover:text-white transition-colors uppercase tracking-wider font-medium">
            Show all
          </button>
        </div>
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3 -mx-4 px-4 hide-scrollbar scroll-smooth-x">
          {FEATURED_PLAYLISTS.map((playlist, i) => (
            <div
              key={playlist.id}
              className="flex-shrink-0 w-40 md:w-44 playlist-card rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] cursor-pointer group"
            >
              <div className={`relative w-full aspect-square bg-gradient-to-br ${playlist.gradient} overflow-hidden`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/20 text-5xl">playlist_play</span>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                <button className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-xl shadow-[#D4AF37]/30 playlist-play-btn group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-black text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                </button>
              </div>
              <div className="p-3">
                <p className="text-[13px] font-bold text-white truncate">{playlist.title}</p>
                <p className="text-[11px] text-zinc-400 truncate mt-1">{playlist.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Genres - Colorful chips */}
      {popularGenres.length > 0 && (
        <section className="mb-8 md:mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-white">Explore Genres</h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 stagger-children">
            {popularGenres.map(genre => (
              <a
                key={genre.id}
                href={`/search?q=${genre.name}`}
                onClick={e => { e.preventDefault(); window.location.href = `/search?q=${genre.name}`; }}
                className={`h-20 md:h-24 rounded-xl overflow-hidden relative group cursor-pointer bg-gradient-to-br ${GENRE_COLORS[genre.name] || 'from-zinc-700/40 to-zinc-800/40'} border border-white/[0.06] hover:border-white/[0.15] transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] card-hover`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5">
                  <p className="text-white text-[12px] md:text-sm font-bold">{genre.name}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Recently Played / Recents */}
      <section className="mb-8 md:mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-white">Recents</h2>
          <button className="text-[10px] text-zinc-400 hover:text-white transition-colors uppercase tracking-wider font-medium">
            Show all
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 stagger-children">
          {tracks.slice(0, 8).map((track, i) => (
            <div
              key={`recent-${track.id}`}
              onClick={() => play(track, tracks)}
              className="group rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] cursor-pointer playlist-card"
            >
              <div className="relative w-full aspect-square overflow-hidden">
                {(track.album.cover_medium || track.youtubeId) ? (
                  <img
                    src={track.album.cover_medium || `https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg`}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (track.youtubeId && !img.src.includes('hqdefault')) {
                        img.src = `https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg`;
                      } else {
                        img.style.display = 'none';
                        const parent = img.parentElement;
                        if (parent && !parent.querySelector('.fallback-icon')) {
                          const div = document.createElement('div');
                          div.className = 'fallback-icon w-full h-full bg-zinc-800 flex items-center justify-center absolute inset-0';
                          div.innerHTML = '<span class="material-symbols-outlined text-zinc-600 text-3xl">music_note</span>';
                          parent.appendChild(div);
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-zinc-600 text-3xl">music_note</span>
                  </div>
                )}
                <button className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-xl shadow-[#D4AF37]/30 playlist-play-btn group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-black text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                </button>
              </div>
              <div className="p-3">
                <p className="text-[13px] font-bold text-white truncate">{track.title}</p>
                <p className="text-[11px] text-zinc-400 truncate mt-1">{track.artist.name}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Now */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white">Trending Now</h2>
            <p className="text-[10px] text-zinc-500 mt-0.5 uppercase tracking-[0.15em]">From YouTube & Audius</p>
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
