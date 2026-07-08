'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import type { Track } from '@/lib/types';
import { searchMusic, getTrending, GENRES, getRecommendations } from '@/lib/music';
import SongCard from '@/components/SongCard';
import EnhancedVisualizer from '@/components/EnhancedVisualizer';
import { usePlayer } from '@/lib/PlayerContext';
import { useSearch } from '@/lib/SearchContext';
import { useSearchParams } from 'next/navigation';

const POPULAR_SEARCHES = [
  'Top hits 2025', 'Chill vibes', 'Workout music', 'Classical piano',
  'Jazz relaxing', 'Electronic dance', 'Acoustic covers', 'LoFi beats',
];

function SearchContent() {
  const sc = useSearch();
  const urlParams = useSearchParams();
  const initialQ = urlParams?.get('q') || '';
  const [query, setQuery] = useState(sc.query || initialQ || '');
  const [results, setResults] = useState<Track[]>(sc.results || []);
  const [loading, setLoading] = useState(!sc.results.length && !initialQ);
  const [error, setError] = useState('');
  const [recs, setRecs] = useState<Track[]>([]);
  const { isPlaying, recentlyPlayed } = usePlayer();
  const restored = useRef(false);

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
    if (restored.current) {
      restored.current = false;
      return;
    }
    if (!query.trim()) return;
    const timer = setTimeout(() => doSearch(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (recentlyPlayed?.length) {
      getRecommendations(recentlyPlayed).then(setRecs).catch(() => {});
    }
  }, [recentlyPlayed]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    try {
      const tracks = await searchMusic(q);
      setResults(tracks);
      sc.setResults(tracks);
      sc.setQuery(q);
      if (tracks.length === 0) setError('No results found. Try a different search.');
    } catch {
      setError('Search failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [sc]);

  const handleGenreClick = useCallback(async (genreName: string) => {
    setQuery(genreName);
    restored.current = false;
    await doSearch(genreName);
  }, [doSearch]);

  return (
    <div className="px-4 md:px-16 py-8 max-w-screen-2xl mx-auto slide-up">
      <div className="relative mb-6 max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); restored.current = false; }}
          placeholder="Search millions of songs on YouTube..."
          className="w-full pl-12 pr-12 py-4 bg-white/[0.06] rounded-2xl border border-white/[0.08] text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]/50 focus:bg-white/[0.08] transition-all text-sm gold-border-glow"
        />
      </div>

      {query && (
        <div className="max-w-2xl mx-auto mb-6">
          <EnhancedVisualizer isPlaying={isPlaying && results.length > 0} barCount={32} height={32} />
        </div>
      )}

      {!query && !loading && (
        <>
          {recs.length > 0 && (
            <section className="mb-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-[family-name:var(--font-serif)] text-white">Recommended For You</h2>
                <span className="text-xs text-zinc-500">{recs.length} tracks</span>
              </div>
              <div className="grid gap-1 fade-in">
                {recs.map((track, i) => (
                  <SongCard key={`rec-${i}`} track={track} index={i} queue={recs} showIndex />
                ))}
              </div>
            </section>
          )}
          {recentlyPlayed?.length > 0 && (
            <section className="mb-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-[family-name:var(--font-serif)] text-white">Recently Played</h2>
                <span className="text-xs text-zinc-500">{recentlyPlayed.length} tracks</span>
              </div>
              <div className="grid gap-1 fade-in">
                {recentlyPlayed.map((track, i) => (
                  <SongCard key={`hist-${i}`} track={track} index={i} queue={recentlyPlayed} showIndex={false} />
                ))}
              </div>
            </section>
          )}
          <section className="mb-8 max-w-2xl mx-auto">
            <h2 className="text-sm font-[family-name:var(--font-serif)] text-white mb-3 uppercase tracking-wider">Popular Searches</h2>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map(term => (
                <button
                  key={term}
                  onClick={() => { setQuery(term); restored.current = false; doSearch(term); }}
                  className="px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] text-sm text-zinc-300 hover:bg-white/[0.1] hover:border-[#D4AF37]/30 transition-all active:scale-95"
                >
                  {term}
                </button>
              ))}
            </div>
          </section>
          <section className="mb-6 max-w-2xl mx-auto">
            <h2 className="text-sm font-[family-name:var(--font-serif)] text-white mb-3 uppercase tracking-wider">Browse Genres</h2>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(genre => (
                <button
                  key={genre.id}
                  onClick={() => handleGenreClick(genre.name)}
                  className="px-5 py-2.5 rounded-full border border-white/[0.06] text-sm text-zinc-400 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/40 hover:text-[#D4AF37] transition-all active:scale-95"
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </section>
          {results.length > 0 && (
            <section className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-[family-name:var(--font-serif)] text-white">Trending Music</h2>
                <span className="text-xs text-zinc-500">{results.length} tracks</span>
              </div>
              <div className="grid gap-1 fade-in">
                {results.map((track, i) => (
                  <SongCard key={`${track.source || 'yt'}-${track.id}`} track={track} index={i} queue={results} showIndex />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {loading && query && (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-16 max-w-2xl mx-auto">
          <svg className="w-16 h-16 mx-auto text-zinc-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <p className="text-zinc-400 mb-1">No results found</p>
          <p className="text-xs text-zinc-600">{error}</p>
        </div>
      )}

      {!loading && !error && query && results.length > 0 && (
        <section className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-[family-name:var(--font-serif)] text-white">
              Results for &ldquo;<span className="text-[#D4AF37]">{query}</span>&rdquo;
            </h2>
            <span className="text-xs text-zinc-500">{results.length} tracks</span>
          </div>
          <div className="grid gap-1 fade-in">
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
        <div className="w-10 h-10 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
