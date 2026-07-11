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
        <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 py-6 max-w-screen-xl mx-auto slide-up">
      {/* Header with profile */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FFBF00] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
            <span className="material-symbols-outlined text-black text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Your Library</h1>
            {items.length > 0 && (
              <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 uppercase tracking-[0.15em]">{items.length} tracks saved</p>
            )}
          </div>
        </div>
        <button onClick={() => router.push('/search')} className="w-9 h-9 rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] flex items-center justify-center transition-all active:scale-90 border border-[var(--border-subtle)]">
          <span className="material-symbols-outlined text-[20px] text-[#D4AF37]">add</span>
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['playlists', 'artists'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-300 active:scale-95 border ${
              tab === t
                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]'
                : 'bg-transparent text-[var(--text-primary)] border-[var(--border-medium)] hover:border-[var(--text-secondary)]'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Recents section */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Recents</h2>
          <button onClick={() => router.push('/search')} className="text-[10px] text-zinc-400 hover:text-white transition-colors uppercase tracking-wider font-medium">
            Show all
          </button>
        </div>

        {tab === 'playlists' ? (
          <div className="space-y-1">
            {/* Liked Songs */}
            <div onClick={() => { if (items.length > 0) play(items[0].track, items.map(it => it.track)); }} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer group">
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500/40 to-blue-500/40 flex items-center justify-center relative">
                <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold text-[var(--text-primary)] truncate">Liked Songs</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="material-symbols-outlined text-[#1DB954] text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_circle_down</span>
                  <p className="text-[12px] text-[var(--text-secondary)]">Playlist • {items.length} songs</p>
                </div>
              </div>
            </div>

            {/* Recently played tracks */}
            {recentlyPlayed.slice(0, 5).map((track, i) => (
              <div key={`recent-lib-${track.id}`} onClick={() => play(track, recentlyPlayed)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer group">
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
                  <p className="text-[14px] font-medium text-[var(--text-primary)] truncate">{track.title}</p>
                  <p className="text-[12px] text-[var(--text-secondary)] truncate mt-0.5">Single • {track.artist.name}</p>
                </div>
              </div>
            ))}

            {/* Library items */}
            {items.map((item) => (
              <div key={item.track.id} onClick={() => play(item.track, items.map(it => it.track))} className="group relative flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer">
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
                  <p className="text-[14px] font-medium text-[var(--text-primary)] truncate">{item.track.title}</p>
                  <p className="text-[12px] text-[var(--text-secondary)] truncate mt-0.5">Playlist • {item.track.artist.name}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeItem(item.track.id); }}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 active:scale-90 z-10"
                >
                  <span className="material-symbols-outlined text-[14px] text-red-400">close</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {/* Artists */}
            {TOP_ARTISTS.slice(0, 6).map((artist) => (
              <a
                key={artist.id}
                href={`/search?q=${encodeURIComponent(artist.name)}`}
                onClick={e => { e.preventDefault(); router.push(`/search?q=${encodeURIComponent(artist.name)}`); }}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.04] transition-all cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-zinc-800 shadow-md">
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
                  <p className="text-[14px] font-medium text-[var(--text-primary)] truncate group-hover:text-[#D4AF37] transition-colors">{artist.name}</p>
                  <p className="text-[12px] text-[var(--text-secondary)] truncate mt-0.5">Artist</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Add actions */}
      <section className="space-y-2">
        <button onClick={() => router.push('/search?q=artists')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-all active:scale-[0.99]">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-surface-hover)] flex items-center justify-center">
            <span className="material-symbols-outlined text-xl text-[var(--text-primary)]">add</span>
          </div>
          <span className="text-[14px] font-medium text-[var(--text-primary)]">Add artists</span>
        </button>
        <button onClick={() => router.push('/search?q=podcasts')} className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-hover)] transition-all active:scale-[0.99]">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-surface-hover)] flex items-center justify-center">
            <span className="material-symbols-outlined text-xl text-[var(--text-primary)]">add</span>
          </div>
          <span className="text-[14px] font-medium text-[var(--text-primary)]">Add podcasts</span>
        </button>
      </section>
    </div>
  );
}
