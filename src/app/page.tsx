'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Track } from '@/lib/types';
import { getTrending, GENRES } from '@/lib/music';
import SongCard from '@/components/SongCard';
import { usePlayer } from '@/lib/PlayerContext';
import { TOP_ARTISTS, FEATURED_PLAYLISTS, MOOD_PLAYLISTS } from '@/lib/artists';

const GENRE_COLORS: Record<string, string> = {
  'Pop': 'from-[#ff2d55] to-[#ff6b8a]',
  'Hip-Hop': 'from-[#ff9f0a] to-[#ffb340]',
  'Rock': 'from-[#ff453a] to-[#ff6961]',
  'Electronic': 'from-[#0a84ff] to-[#5ac8fa]',
  'R&B': 'from-[#bf5af2] to-[#da8fff]',
  'Classical': 'from-[#30d158] to-[#63e6be]',
  'Jazz': 'from-[#ffd60a] to-[#ffcc00]',
  'Country': 'from-[#ff9f0a] to-[#ff6b00]',
  'Metal': 'from-[#8e8e93] to-[#636366]',
  'Folk': 'from-[#ac8e68] to-[#c4a57b]',
  'Ambient': 'from-[#64d2ff] to-[#40c8e0]',
  'Reggae': 'from-[#30d158] to-[#00c7be]',
};

function QuickPicksGrid({ tracks, play }: { tracks: Track[]; play: (t: Track, q: Track[]) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {tracks.slice(0, 6).map((track) => (
        <button
          key={`quick-${track.id}`}
          onClick={() => play(track, tracks)}
          className="flex items-center gap-3 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] rounded-xl overflow-hidden transition-all active:scale-[0.98] group text-left shadow-sm border border-[var(--border-subtle)]"
        >
          <div className="w-14 h-14 flex-shrink-0 relative overflow-hidden rounded-l-xl">
            {(track.album.cover_medium || track.youtubeId) ? (
              <img
                src={track.album.cover_medium || `https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg`}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-[var(--bg-surface-hover)] flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--text-tertiary)] text-lg">music_note</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pr-3">
            <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{track.title}</p>
            <p className="text-[11px] text-[var(--text-secondary)] truncate">{track.artist.name}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 mr-3 transition-all">
            <span className="material-symbols-outlined text-[var(--accent)] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { play, recentlyPlayed } = usePlayer();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const trending = await getTrending();
        setTracks(trending);
      } catch {} finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border border-[var(--accent)]/20" />
            <div className="absolute inset-1 rounded-full border border-transparent border-t-[var(--accent)] animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
    return 'Good Evening';
  })();

  const recentTracks = recentlyPlayed.slice(0, 8);

  return (
    <div className="px-4 md:px-8 lg:px-12 py-4 max-w-screen-xl mx-auto page-transition">
      {/* Header */}
      <section className="mb-8 slide-up">
        <h1 className="text-[28px] md:text-[34px] font-bold text-[var(--text-primary)] tracking-tight">{greeting}</h1>
      </section>

      {/* Top Picks - Quick Grid (Apple Music style 2-col) */}
      <section className="mb-8">
        <h2 className="text-[20px] font-bold text-[var(--text-primary)] mb-4">Top Picks</h2>
        <QuickPicksGrid tracks={tracks} play={play} />
      </section>

      {/* Recently Played - Horizontal scroll */}
      {recentTracks.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[20px] font-bold text-[var(--text-primary)]">Recently Played</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 hide-scrollbar">
            {recentTracks.map((track) => (
              <div
                key={`recent-${track.id}`}
                onClick={() => play(track, recentTracks)}
                className="flex-shrink-0 w-[140px] md:w-[160px] rounded-xl overflow-hidden bg-[var(--bg-surface)] cursor-pointer group playlist-card shadow-sm border border-[var(--border-subtle)]"
              >
                <div className="relative w-full aspect-square overflow-hidden">
                  {(track.album.cover_medium || track.youtubeId) ? (
                    <img
                      src={track.album.cover_medium || `https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg`}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--bg-surface-hover)] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[var(--text-tertiary)] text-3xl">music_note</span>
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); play(track, recentTracks); }}
                    className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-lg playlist-play-btn"
                  >
                    <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </button>
                </div>
                <div className="p-2.5">
                  <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">{track.title}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5">{track.artist.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Made for You - Playlist cards */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-bold text-[var(--text-primary)]">Made for You</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 hide-scrollbar">
          {FEATURED_PLAYLISTS.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => router.push(`/search?q=${encodeURIComponent(playlist.title)}`)}
              className="flex-shrink-0 w-[160px] md:w-[180px] rounded-xl overflow-hidden bg-[var(--bg-surface)] cursor-pointer group playlist-card shadow-sm border border-[var(--border-subtle)]"
            >
              <div className={`relative w-full aspect-square bg-gradient-to-br ${playlist.gradient} overflow-hidden`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/20 text-5xl">playlist_play</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/search?q=${encodeURIComponent(playlist.title)}`); }}
                  className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center shadow-lg playlist-play-btn"
                >
                  <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                </button>
              </div>
              <div className="p-2.5">
                <p className="text-[12px] font-bold text-[var(--text-primary)] truncate">{playlist.title}</p>
                <p className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5">{playlist.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Browse by Mood */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-bold text-[var(--text-primary)]">Browse by Mood</h2>
        </div>
        <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 hide-scrollbar">
          {MOOD_PLAYLISTS.map((mood) => (
            <a
              key={mood.id}
              href={`/search?q=${encodeURIComponent(mood.query)}`}
              onClick={(e) => { e.preventDefault(); router.push(`/search?q=${encodeURIComponent(mood.query)}`); }}
              className={`flex-shrink-0 w-[110px] md:w-[130px] h-[130px] md:h-[140px] rounded-xl overflow-hidden relative group cursor-pointer bg-gradient-to-br ${mood.color} border border-black/[0.06] hover:border-black/[0.12] transition-all active:scale-[0.97] card-hover`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute top-3 left-3 text-2xl">{mood.icon}</div>
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white text-[13px] font-bold">{mood.mood}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Popular Artists */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-bold text-[var(--text-primary)]">Popular Artists</h2>
        </div>
        <div className="flex gap-5 overflow-x-auto pb-3 -mx-4 px-4 hide-scrollbar">
          {TOP_ARTISTS.map((artist) => (
            <a
              key={artist.id}
              href={`/search?q=${encodeURIComponent(artist.name)}`}
              onClick={(e) => { e.preventDefault(); router.push(`/search?q=${encodeURIComponent(artist.name)}`); }}
              className="flex-shrink-0 flex flex-col items-center gap-2 group cursor-pointer"
            >
              <div className="relative w-[80px] h-[80px] md:w-[100px] md:h-[100px] rounded-full overflow-hidden artist-circle shadow-md bg-[var(--bg-surface)]">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (img.dataset.fallback) return;
                    img.dataset.fallback = '1';
                    img.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="#f2f2f7"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#fc3c44" font-size="32" font-weight="bold" font-family="sans-serif">${artist.name.charAt(0)}</text></svg>`)}`;
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100 shadow-lg">
                    <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate max-w-[80px]">{artist.name}</p>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Artist</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Genres */}
      <section className="mb-8">
        <h2 className="text-[20px] font-bold text-[var(--text-primary)] mb-4">Browse by Genre</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 stagger-children">
          {GENRES.slice(0, 8).map((genre) => (
            <a
              key={genre.id}
              href={`/search?q=${genre.name}`}
              onClick={(e) => { e.preventDefault(); router.push(`/search?q=${genre.name}`); }}
              className={`h-[80px] md:h-[100px] rounded-xl overflow-hidden relative group cursor-pointer bg-gradient-to-br ${GENRE_COLORS[genre.name] || 'from-zinc-300 to-zinc-400'} border border-black/[0.06] hover:border-black/[0.12] transition-all active:scale-[0.97] card-hover`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white text-[14px] font-bold">{genre.name}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Trending Now */}
      <section className="mb-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-bold text-[var(--text-primary)]">Trending Now</h2>
        </div>
        <div className="space-y-0.5">
          {tracks.map((track, i) => (
            <SongCard key={`${track.source || 'yt'}-${track.id}`} track={track} index={i} queue={tracks} showIndex />
          ))}
        </div>
      </section>
    </div>
  );
}
