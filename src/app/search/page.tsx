'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import type { Track } from '@/lib/types';
import { searchMusic, getTrending } from '@/lib/music';
import SongCard from '@/components/SongCard';
import { usePlayer } from '@/lib/PlayerContext';
import { useSearch } from '@/lib/SearchContext';
import { useSearchParams } from 'next/navigation';

const TRENDING_SEARCHES = [
  'Taylor Swift', 'Drake', 'The Weeknd', 'Billie Eilish', 'Bad Bunny',
  'Dua Lipa', 'Ed Sheeran', 'Post Malone', 'SZA', 'Doja Cat',
  'Kendrick Lamar', 'Olivia Rodrigo', 'Harry Styles', 'Ariana Grande',
];

function SearchContent() {
  const sc = useSearch();
  const urlParams = useSearchParams();
  const initialQ = urlParams?.get('q') || '';
  const { recentlyPlayed } = usePlayer();

  const [query, setQuery] = useState(sc.query || initialQ || '');
  const [results, setResults] = useState<Track[]>(sc.results || []);
  const [loading, setLoading] = useState(!sc.results.length && !initialQ);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const restored = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Restore state
  useEffect(() => {
    if (initialQ) {
      setQuery(initialQ);
      doSearch(initialQ);
      return;
    }
    if (sc.results.length) {
      setResults(sc.results);
      setQuery(sc.query || '');
      restored.current = true;
      setLoading(false);
    } else {
      setLoading(true);
      getTrending().then(t => { setResults(t); setLoading(false); }).catch(() => setLoading(false));
    }
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced suggest fetch
  useEffect(() => {
    if (!query.trim() || query.length < 2 || restored.current) {
      setSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch {
        setSuggestions([]);
      }
    }, 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    setShowSuggestions(false);
    restored.current = true;
    sc.addToHistory(q);
    try {
      const tracks = await searchMusic(q);
      setResults(tracks);
      sc.setResults(tracks);
      sc.setQuery(q);
      if (tracks.length === 0) setError('No results found.');
    } catch {
      setError('Search failed. Try again.');
    } finally {
      setLoading(false);
    }
  }, [sc]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) doSearch(query);
      setShowSuggestions(false);
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [query, doSearch]);

  return (
    <div className="px-4 md:px-8 lg:px-12 py-6 max-w-screen-xl mx-auto slide-up">
      {/* Search Input */}
      <div className="relative mb-6 max-w-2xl mx-auto" ref={suggestionsRef}>
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-zinc-500 text-[20px]">search</span>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            restored.current = false;
            setShowSuggestions(true);
          }}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search songs, artists..."
          className="w-full pl-11 pr-16 py-3.5 bg-white/[0.05] rounded-2xl border border-white/[0.06] text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]/40 focus:bg-white/[0.08] transition-all duration-300 text-sm gold-border-glow"
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {query && (
            <button
              onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}
              className="p-2 rounded-full hover:bg-white/[0.08] transition-colors"
            >
              <span className="material-symbols-outlined text-zinc-400 text-[18px]">close</span>
            </button>
          )}
          <button
            onClick={() => { if (query.trim()) doSearch(query); }}
            className="p-2 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && !restored.current && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/98 backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden z-40">
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.05] transition-colors"
                onClick={() => { setQuery(s); doSearch(s); }}
              >
                <span className="material-symbols-outlined text-zinc-500 text-lg">search</span>
                <span className="text-sm text-zinc-300">{s}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* No Query State */}
      {!query && !loading && (
        <div className="max-w-2xl mx-auto space-y-8">
          {sc.searchHistory.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-[family-name:var(--font-serif)] text-white">Recent Searches</h2>
                <button onClick={sc.clearHistory} className="text-[10px] text-zinc-500 hover:text-zinc-300 uppercase tracking-widest">Clear all</button>
              </div>
              <div className="space-y-0.5 fade-in">
                {sc.searchHistory.slice(0, 8).map((term, i) => (
                  <button
                    key={`hist-${i}`}
                    onClick={() => { setQuery(term); doSearch(term); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors text-left group"
                  >
                    <span className="material-symbols-outlined text-zinc-500 text-lg group-hover:text-[#D4AF37] transition-colors">history</span>
                    <span className="text-sm text-zinc-300 flex-1 truncate">{term}</span>
                    <span
                      className="material-symbols-outlined text-zinc-600 text-base opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={e => { e.stopPropagation(); sc.removeFromHistory(term); }}
                    >close</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {recentlyPlayed?.length > 0 && (
            <section>
              <h2 className="text-sm font-[family-name:var(--font-serif)] text-white mb-3">Recently Played</h2>
              <div className="space-y-0.5 fade-in">
                {recentlyPlayed.slice(0, 5).map((track, i) => (
                  <SongCard key={`hist-${i}`} track={track} index={i} queue={recentlyPlayed} showIndex={false} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium mb-3">Trending Now</h2>
            <div className="flex flex-wrap gap-2">
              {TRENDING_SEARCHES.map((term, i) => (
                <button
                  key={term}
                  onClick={() => { setQuery(term); doSearch(term); }}
                  className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm text-zinc-300 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/20 hover:text-[#D4AF37] transition-all duration-300 active:scale-95 flex items-center gap-1.5"
                >
                  <span className="text-[10px] text-zinc-600 font-mono">{i + 1}</span>
                  {term}
                </button>
              ))}
            </div>
          </section>

          {results.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-[family-name:var(--font-serif)] text-white">Trending Music</h2>
                <span className="text-[10px] text-zinc-600">{results.length} tracks</span>
              </div>
              <div className="space-y-0.5 fade-in">
                {results.map((track, i) => (
                  <SongCard key={`${track.source || 'yt'}-${track.id}`} track={track} index={i} queue={results} showIndex />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && query && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-center py-16 max-w-2xl mx-auto">
          <span className="material-symbols-outlined text-5xl text-zinc-700 mb-3 block">search_off</span>
          <p className="text-zinc-400 mb-1">{error}</p>
        </div>
      )}

      {/* Results */}
      {!loading && !error && query && results.length > 0 && (
        <section className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-[family-name:var(--font-serif)] text-white">
              Results for &ldquo;<span className="text-[#D4AF37]">{query}</span>&rdquo;
            </h2>
            <span className="text-[10px] text-zinc-600">{results.length} tracks</span>
          </div>
          <div className="space-y-0.5 fade-in">
            {results.map((track, i) => (
              <SongCard key={`${track.source || 'yt'}-${track.id}`} track={track} index={i} queue={results} showIndex />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
