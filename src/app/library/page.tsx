'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Track } from '@/lib/types';
import SongCard from '@/components/SongCard';
import { usePlayer } from '@/lib/PlayerContext';
import { TOP_ARTISTS } from '@/lib/artists';

interface LibraryItem {
  track: Track;
  addedAt: number;
}

const LS_LIBRARY = 'aurelia-library';

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [tab, setTab] = useState<'playlists' | 'artists'>('playlists');
  const [loading, setLoading] = useState(true);
  const { play, recentlyPlayed } = usePlayer();
  const router = useRouter();

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_LIBRARY);
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setLoading(false);
  }, []);

  const removeItem = (trackId: number) => {
    const updated = items.filter(i => i.track.id !== trackId);
    setItems(updated);
    try { localStorage.setItem(LS_LIBRARY, JSON.stringify(updated)); } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)]/20 border-t-[var(--accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 py-4 max-w-screen-xl mx-auto slide-up">
      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(['playlists', 'artists'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-200 active:scale-95 ${
              tab === t
                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                : 'bg-white/[0.06] text-[var(--text-secondary)]'
            }`}
          >
            {t === 'playlists' ? 'Playlists' : 'Artists'}
          </button>
        ))}
      </div>

      {/* Content */}
      <section>
        {tab === 'playlists' ? (
          <div className="space-y-0">
            {/* Liked Songs */}
            <div onClick={() => { if (items.length > 0) play(items[0].track, items.map(it => it.track)); }}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-all cursor-pointer">
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500/40 to-blue-500/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-[var(--text-primary)] truncate">Liked Songs</p>
                <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
                  Playlist • {items.length} songs
                </p>
              </div>
            </div>

            {/* Recently played */}
            {recentlyPlayed.slice(0, 5).map((track) => (
              <div key={`recent-lib-${track.id}`} onClick={() => play(track, recentlyPlayed)}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-all cursor-pointer">
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
                  {track.album.cover_medium || track.youtubeId ? (
                    <img
                      src={track.album.cover_medium || (track.youtubeId ? `https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg` : '')}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-zinc-600 text-lg">music_note</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-[var(--text-primary)] truncate">{track.title}</p>
                  <p className="text-[13px] text-[var(--text-secondary)] truncate mt-0.5">{track.artist.name}</p>
                </div>
              </div>
            ))}

            {/* Library items */}
            {items.map((item) => (
              <div key={item.track.id} onClick={() => play(item.track, items.map(it => it.track))}
                className="group relative flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-all cursor-pointer">
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
                  {item.track.album.cover_medium || item.track.youtubeId ? (
                    <img
                      src={item.track.album.cover_medium || (item.track.youtubeId ? `https://i.ytimg.com/vi/${item.track.youtubeId}/hqdefault.jpg` : '')}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-zinc-600 text-lg">music_note</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-[var(--text-primary)] truncate">{item.track.title}</p>
                  <p className="text-[13px] text-[var(--text-secondary)] truncate mt-0.5">{item.track.artist.name}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeItem(item.track.id); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 active:scale-90"
                >
                  <span className="material-symbols-outlined text-[16px] text-[var(--accent)]">close</span>
                </button>
              </div>
            ))}

            {items.length === 0 && recentlyPlayed.length === 0 && (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-5xl text-[var(--text-tertiary)] mb-3 block">library_music</span>
                <p className="text-[var(--text-secondary)] text-[15px]">Your library is empty</p>
                <p className="text-[var(--text-tertiary)] text-[13px] mt-1">Search and add songs to build your library</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-0">
            {TOP_ARTISTS.slice(0, 8).map((artist) => (
              <a
                key={artist.id}
                href={`/search?q=${encodeURIComponent(artist.name)}`}
                onClick={e => { e.preventDefault(); router.push(`/search?q=${encodeURIComponent(artist.name)}`); }}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-all cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800">
                  <img
                    src={artist.image}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56"><rect width="56" height="56" fill="%23333"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="%23999" font-size="20" font-family="sans-serif">${artist.name.charAt(0)}</text></svg>`)}`;
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-[var(--text-primary)] truncate">{artist.name}</p>
                  <p className="text-[13px] text-[var(--text-secondary)] truncate mt-0.5">Artist</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
