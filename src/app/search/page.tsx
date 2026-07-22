'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import type { Track } from '@/lib/types';
import { searchMusic, getTrending } from '@/lib/music';
import SongCard from '@/components/SongCard';
import { usePlayer } from '@/lib/PlayerContext';
import { useSearch } from '@/lib/SearchContext';
import { useSearchParams } from 'next/navigation';

const CATEGORIES = [
  { label: 'Charts', icon: 'trending_up', color: '#fc3c44' },
  { label: 'Moods', icon: 'mood', color: '#ff2d55' },
  { label: 'Genres', icon: 'library_music', color: '#0a84ff' },
  { label: 'New', icon: 'new_releases', color: '#30d158' },
  { label: 'Videos', icon: 'play_circle', color: '#ff9f0a' },
  { label: 'Live Radio', icon: 'radio', color: '#bf5af2' },
];

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
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const restored = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
    <div className="px-4 md:px-8 lg:px-12 py-4 max-w-screen-xl mx-auto slide-up">
      {/* Search Input */}
      <div className="relative mb-5 max-w-2xl mx-auto" ref={suggestionsRef}>
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-[var(--text-tertiary)] text-[20px]">search</span>
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
          onFocus={() => { setIsFocused(true); query.length >= 2 && setShowSuggestions(true); }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Search"
          className="w-full pl-10 pr-10 py-2.5 bg-white/[0.06] rounded-xl text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:bg-white/[0.1] transition-all duration-200 text-[15px]"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}
            className="absolute inset-y-0 right-3 flex items-center"
          >
            <span className="material-symbols-outlined text-[var(--text-tertiary)] text-[18px]">close</span>
          </button>
        )}

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && !restored.current && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-40 glass-panel shadow-lg">
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.06] transition-colors"
                onClick={() => { setQuery(s); doSearch(s); }}
              >
                <span className="material-symbols-outlined text-[var(--text-tertiary)] text-lg">search</span>
                <span className="text-[14px] text-[var(--text-secondary)]">{s}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Browse Categories - Show when no search */}
      {!query && !loading && (
        <div className="space-y-6">
          {/* Categories Grid */}
          <section>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  className="relative overflow-hidden rounded-xl p-4 h-24 flex items-end glass-card"
                  style={{
                    background: `linear-gradient(135deg, ${cat.color}22 0%, ${cat.color}08 100%)`,
                  }}
                >
                  <span className="material-symbols-outlined text-3xl absolute top-3 right-3 opacity-30"
                    style={{ color: cat.color }}>
                    {cat.icon}
                  </span>
                  <span className="text-[14px] font-semibold text-[var(--text-primary)] relative z-10">
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Recent Searches */}
          {sc.searchHistory.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">Recent Searches</h2>
                <button onClick={sc.clearHistory} className="text-[12px] text-[var(--accent)]">Clear</button>
              </div>
              <div className="space-y-0">
                {sc.searchHistory.slice(0, 5).map((term, i) => (
                  <button
                    key={`hist-${i}`}
                    onClick={() => { setQuery(term); doSearch(term); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-[var(--text-tertiary)] text-lg">history</span>
                    <span className="text-[14px] text-[var(--text-secondary)] flex-1 truncate">{term}</span>
                    <span
                      className="material-symbols-outlined text-[var(--text-tertiary)] text-base"
                      onClick={e => { e.stopPropagation(); sc.removeFromHistory(term); }}
                    >close</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Trending */}
          <section>
            <h2 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">Trending Searches</h2>
            <div className="flex flex-wrap gap-2">
              {TRENDING_SEARCHES.map((term) => (
                <button
                  key={term}
                  onClick={() => { setQuery(term); doSearch(term); }}
                  className="px-4 py-2 rounded-full bg-white/[0.06] text-[13px] text-[var(--text-secondary)] hover:bg-white/[0.1] transition-colors active:scale-95"
                >
                  {term}
                </button>
              ))}
            </div>
          </section>

          {/* Recently Played */}
          {recentlyPlayed?.length > 0 && (
            <section>
              <h2 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">Recently Played</h2>
              <div className="space-y-0">
                {recentlyPlayed.slice(0, 5).map((track, i) => (
                  <SongCard key={`hist-${i}`} track={track} index={i} queue={recentlyPlayed} showIndex={false} />
                ))}
              </div>
            </section>
          )}

          {/* Trending Music */}
          {results.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">Top Charts</h2>
                <span className="text-[11px] text-[var(--text-tertiary)]">{results.length} songs</span>
              </div>
              <div className="space-y-0">
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
          <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)]/20 border-t-[var(--accent)] animate-spin" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-center py-16 max-w-2xl mx-auto">
          <span className="material-symbols-outlined text-5xl text-[var(--text-tertiary)] mb-3 block">search_off</span>
          <p className="text-[var(--text-secondary)]">{error}</p>
        </div>
      )}

      {/* Results */}
      {!loading && !error && query && results.length > 0 && (
        <section className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">
              Results for &ldquo;<span className="text-[var(--accent)]">{query}</span>&rdquo;
            </h2>
            <span className="text-[11px] text-[var(--text-tertiary)]">{results.length} songs</span>
          </div>
          <div className="space-y-0">
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
        <div className="w-6 h-6 rounded-full border-2 border-[var(--accent)]/20 border-t-[var(--accent)] animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
