'use client';

import { useState, useEffect } from 'react';
import type { Track } from '@/lib/types';
import SongCard from '@/components/SongCard';
import { usePlayer } from '@/lib/PlayerContext';

interface LibraryItem {
  track: Track;
  addedAt: number;
}

const LS_LIBRARY = 'aurelia-library';

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [tab, setTab] = useState<'songs' | 'favorites'>('songs');
  const [loading, setLoading] = useState(true);

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
    localStorage.setItem(LS_LIBRARY, JSON.stringify(updated));
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-[family-name:var(--font-serif)] text-white">Your Library</h1>
          {items.length > 0 && (
            <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-[0.15em]">{items.length} tracks saved</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-white/[0.04] rounded-xl w-fit border border-white/[0.04]">
        {(['songs', 'favorites'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-300 active:scale-95 ${
              tab === t
                ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="text-center py-20 glass-card rounded-2xl max-w-lg mx-auto">
          <span className="material-symbols-outlined text-5xl text-zinc-700 mb-4 block">library_music</span>
          <p className="text-zinc-300 mb-2 text-lg font-[family-name:var(--font-serif)]">Your library is empty</p>
          <p className="text-sm text-zinc-500 mb-6">Search and add songs to build your collection</p>
          <a
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-black rounded-full text-sm font-semibold hover:bg-[#E0BF4A] transition-all shadow-lg shadow-[#D4AF37]/20 gold-glow-btn active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">search</span>
            Browse Music
          </a>
        </div>
      )}

      {/* Track list */}
      {items.length > 0 && (
        <div className="space-y-0.5 fade-in">
          {items.map((item, i) => (
            <div key={item.track.id} className="group relative rounded-xl">
              <SongCard track={item.track} index={i} queue={items.map(it => it.track)} showIndex />
              <button
                onClick={() => removeItem(item.track.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 active:scale-90 z-10"
                title="Remove"
              >
                <span className="material-symbols-outlined text-[14px] text-red-400">close</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
