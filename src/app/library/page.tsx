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
  const { isPlaying } = usePlayer();

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

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-16 py-8 max-w-screen-2xl mx-auto slide-up">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-[family-name:var(--font-serif)] text-white">Your Library</h1>
        {items.length > 0 && (
          <div className="glass-panel px-4 py-1.5 rounded-full">
            <span className="text-xs text-[#D4AF37] font-medium">{items.length} tracks</span>
          </div>
        )}
      </div>

      <div className="flex gap-1 mb-6 p-1 bg-white/[0.04] rounded-xl w-fit">
        {(['songs', 'favorites'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all active:scale-95 ${
              tab === t
                ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-20 glass-panel rounded-2xl max-w-lg mx-auto">
          <svg className="w-20 h-20 mx-auto text-zinc-700 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377" />
          </svg>
          <p className="text-zinc-400 mb-2 text-lg font-[family-name:var(--font-serif)]">Your library is empty</p>
          <p className="text-sm text-zinc-600 mb-6">Search and add songs to start building your collection</p>
          <a
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-black rounded-full text-sm font-semibold hover:bg-[#E0BF4A] transition-all shadow-lg shadow-[#D4AF37]/20 gold-glow-btn"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            Browse Music
          </a>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid gap-1 fade-in">
          {items.map((item, i) => (
            <div key={item.track.id} className="group relative glass-card rounded-xl p-1">
              <SongCard track={item.track} index={i} queue={items.map(it => it.track)} showIndex />
              <div className="absolute right-14 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-zinc-600 bg-black/40 px-2 py-0.5 rounded-full">{formatTimeAgo(item.addedAt)}</span>
              </div>
              <button
                onClick={() => removeItem(item.track.id)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                title="Remove from library"
              >
                <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
