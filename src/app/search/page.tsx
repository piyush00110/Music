'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import type { Track } from '@/lib/types';
import { searchMusic, getTrending, GENRES, getRecommendations } from '@/lib/music';
import SongCard from '@/components/SongCard';
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
  const [artistTopSongs, setArtistTopSongs] = useState<Track[]>([]);
  const [artistName, setArtistName] = useState('');
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
    if (restored.current) { restored.current = false; return; }
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
    setArtistTopSongs([]);
    setArtistName('');
    try {
      const tracks = await searchMusic(q);
      setResults(tracks);
      sc.setResults(tracks);
      sc.setQuery(q);
      if (tracks.length === 0) setError('No results found. Try a different search.');

      // Detect top artist from results and fetch their top songs
      if (tracks.length >= 3) {
        const artistCounts: Record<string, number> = {};
        tracks.forEach(t => {
          const name = t.artist.name;
          if (name && name !== 'Unknown') {
            artistCounts[name] = (artistCounts[name] || 0) + 1;
          }
        });
        const topArtist = Object.entries(artistCounts).sort((a, b) => b[1] - a[1])[0];
        if (topArtist && topArtist[1] >= 2) {
          setArtistName(topArtist[0]);
          const topSongs = await searchMusic(`${topArtist[0]} official`);
          const filtered = topSongs.filter(t => t.artist.name === topArtist[0] && !tracks.some(r => r.id === t.id));
          setArtistTopSongs(filtered.slice(0, 5));
        }
      }
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
    <div className="px-4 md:px-8 lg:px-12 py-6 max-w-screen-xl mx-auto slide-up">
      {/* Search input */}
      <div className="relative mb-6 max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-zinc-500 text-[20px]">search</span>
        </div>
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); restored.current = false; }}
          placeholder="Search millions of songs..."
          className="w-full pl-11 pr-12 py-3.5 bg-white/[0.05] rounded-2xl border border-white/[0.06] text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]/40 focus:bg-white/[0.08] transition-all duration-300 text-sm gold-border-glow"
        />
      </div>

      {/* No query state */}
      {!query && !loading && (
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Recently played */}
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

          {/* Recommendations */}
          {recs.length > 0 && (
            <section>
              <h2 className="text-sm font-[family-name:var(--font-serif)] text-white mb-3">Recommended For You</h2>
              <div className="space-y-0.5 fade-in">
                {recs.slice(0, 5).map((track, i) => (
                  <SongCard key={`rec-${i}`} track={track} index={i} queue={recs} showIndex={false} />
                ))}
              </div>
            </section>
          )}

          {/* Popular searches */}
          <section>
            <h2 className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium mb-3">Popular Searches</h2>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map(term => (
                <button
                  key={term}
                  onClick={() => { setQuery(term); restored.current = false; doSearch(term); }}
                  className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm text-zinc-300 hover:bg-white/[0.08] hover:border-[#D4AF37]/20 transition-all duration-300 active:scale-95"
                >
                  {term}
                </button>
              ))}
            </div>
          </section>

          {/* Genre chips */}
          <section>
            <h2 className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium mb-3">Browse Genres</h2>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(genre => (
                <button
                  key={genre.id}
                  onClick={() => handleGenreClick(genre.name)}
                  className="px-4 py-2 rounded-full border border-white/[0.06] text-sm text-zinc-400 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 hover:text-[#D4AF37] transition-all duration-300 active:scale-95"
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </section>

          {/* Trending */}
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
          <p className="text-zinc-400 mb-1">No results found</p>
          <p className="text-xs text-zinc-600">{error}</p>
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

          {/* Artist top songs suggestion */}
          {artistTopSongs.length > 0 && (
            <div className="mb-6 p-4 rounded-2xl bg-white/[0.03] border border-[#D4AF37]/15">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[#D4AF37] text-lg">person</span>
                <h3 className="text-sm font-bold text-white">More by <span className="text-[#D4AF37]">{artistName}</span></h3>
              </div>
              <div className="space-y-0.5">
                {artistTopSongs.map((track, i) => (
                  <SongCard key={`artist-${track.id}`} track={track} index={i} queue={artistTopSongs} showIndex={false} />
                ))}
              </div>
            </div>
          )}

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
