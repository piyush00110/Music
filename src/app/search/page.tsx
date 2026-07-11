'use client';

import { useState, useEffect, useCallback, useRef, Suspense, useMemo } from 'react';
import type { Track } from '@/lib/types';
import { searchMusic, getTrending, GENRES, getRecommendations } from '@/lib/music';
import SongCard from '@/components/SongCard';
import { usePlayer } from '@/lib/PlayerContext';
import { useSearch } from '@/lib/SearchContext';
import { useSearchParams, useRouter } from 'next/navigation';

const TRENDING_SEARCHES = [
  'Taylor Swift', 'Drake', 'The Weeknd', 'Billie Eilish', 'Bad Bunny',
  'Dua Lipa', 'Ed Sheeran', 'Post Malone', 'SZA', 'Doja Cat',
  'Kendrick Lamar', 'Olivia Rodrigo', 'Harry Styles', 'Ariana Grande',
  'Travis Scott', 'Lana Del Rey', 'Beyonce', 'Rihanna', 'Bruno Mars',
];

const MOOD_CHIPS = [
  { label: 'Chill', query: 'chill vibes relaxing music', icon: 'headphones' },
  { label: 'Workout', query: 'workout gym motivation music', icon: 'fitness_center' },
  { label: 'Party', query: 'party hits dance music', icon: 'celebration' },
  { label: 'Focus', query: 'focus study instrumental', icon: 'psychology' },
  { label: 'Sad', query: 'sad emotional songs', icon: 'mood' },
  { label: 'Happy', query: 'happy upbeat feel good songs', icon: 'sentiment_very_satisfied' },
];

type FilterType = 'all' | 'songs' | 'artists';

function SearchContent() {
  const sc = useSearch();
  const router = useRouter();
  const urlParams = useSearchParams();
  const initialQ = urlParams?.get('q') || '';
  const { recentlyPlayed, play, currentTrack, isPlaying } = usePlayer();

  // Core state
  const [query, setQuery] = useState(sc.query || initialQ || '');
  const [results, setResults] = useState<Track[]>(sc.results || []);
  const [loading, setLoading] = useState(!sc.results.length && !initialQ);
  const [error, setError] = useState('');
  const [recs, setRecs] = useState<Track[]>([]);
  const [artistTopSongs, setArtistTopSongs] = useState<Track[]>([]);
  const [artistName, setArtistName] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [suggestionTracks, setSuggestionTracks] = useState<{ title: string; artist: string; cover: string }[]>([]);

  // Voice search state
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const restored = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Check voice search support
  useEffect(() => {
    const SpeechRecognition = typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;
    setVoiceSupported(!!SpeechRecognition);
  }, []);

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

  // Recommendations
  useEffect(() => {
    if (recentlyPlayed?.length) {
      getRecommendations(recentlyPlayed).then(setRecs).catch(() => {});
    }
  }, [recentlyPlayed]);

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

  // Debounced suggestion fetch
  useEffect(() => {
    if (!query.trim() || query.length < 2 || restored.current) {
      setSuggestions([]);
      setSuggestionTracks([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
        setSuggestionTracks(data.tracks || []);
      } catch {
        setSuggestions([]);
        setSuggestionTracks([]);
      }
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Search
  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    setArtistTopSongs([]);
    setArtistName('');
    setShowSuggestions(false);
    sc.addToHistory(q);
    try {
      const tracks = await searchMusic(q);
      setResults(tracks);
      sc.setResults(tracks);
      sc.setQuery(q);
      if (tracks.length === 0) setError('No results found. Try a different search.');

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

  // Keyboard navigation in suggestions
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && selectedSuggestion >= 0) {
        const total = suggestions.length + suggestionTracks.length;
        if (selectedSuggestion < suggestions.length) {
          setQuery(suggestions[selectedSuggestion]);
          doSearch(suggestions[selectedSuggestion]);
        } else {
          const track = suggestionTracks[selectedSuggestion - suggestions.length];
          if (track) {
            setQuery(`${track.artist} ${track.title}`);
            doSearch(`${track.artist} ${track.title}`);
          }
        }
        setSelectedSuggestion(-1);
      } else if (query.trim()) {
        doSearch(query);
      }
      setShowSuggestions(false);
      return;
    }
    if (!showSuggestions) return;
    const total = suggestions.length + suggestionTracks.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestion(prev => (prev + 1) % total);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestion(prev => (prev - 1 + total) % total);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  }, [showSuggestions, suggestions, suggestionTracks, selectedSuggestion, doSearch, query]);

  // Voice search
  const startVoiceSearch = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    setVoiceListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      if (event.results[0].isFinal) {
        setVoiceListening(false);
        doSearch(transcript);
      }
    };
    recognition.onerror = () => setVoiceListening(false);
    recognition.onend = () => setVoiceListening(false);
    recognition.start();
  }, [doSearch]);

  // Filtered results
  const filteredResults = useMemo(() => {
    if (activeFilter === 'all') return results;
    if (activeFilter === 'songs') return results.filter(t => t.preview || t.youtubeId);
    if (activeFilter === 'artists') {
      const seen = new Set<string>();
      return results.filter(t => {
        const key = t.artist.name;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    return results;
  }, [results, activeFilter]);

  const uniqueArtists = useMemo(() => {
    const seen = new Set<string>();
    return results.filter(t => {
      const key = t.artist.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [results]);

  const handleGenreClick = useCallback(async (genreName: string) => {
    setQuery(genreName);
    restored.current = false;
    await doSearch(genreName);
  }, [doSearch]);

  const handleMoodClick = useCallback(async (moodQuery: string) => {
    setQuery(moodQuery);
    restored.current = false;
    await doSearch(moodQuery);
  }, [doSearch]);

  return (
    <div className="px-4 md:px-8 lg:px-12 py-6 max-w-screen-xl mx-auto slide-up">
      {/* ─── Search Input ─── */}
      <div className="relative mb-6 max-w-2xl mx-auto">
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
            setSelectedSuggestion(-1);
            setShowSuggestions(true);
          }}
          onFocus={() => query.length >= 2 && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search millions of songs..."
          className="w-full pl-11 pr-20 py-3.5 bg-white/[0.05] rounded-2xl border border-white/[0.06] text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]/40 focus:bg-white/[0.08] transition-all duration-300 text-sm gold-border-glow"
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {query && (
            <button
              onClick={() => { setQuery(''); setSuggestions([]); setSuggestionTracks([]); inputRef.current?.focus(); }}
              className="p-2 rounded-full hover:bg-white/[0.08] transition-colors"
            >
              <span className="material-symbols-outlined text-zinc-400 text-[18px]">close</span>
            </button>
          )}
          {voiceSupported && (
            <button
              onClick={startVoiceSearch}
              className={`p-2 rounded-full transition-all duration-200 ${
                voiceListening
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : 'hover:bg-white/[0.08] text-zinc-400'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {voiceListening ? 'mic' : 'mic_external_on'}
              </span>
            </button>
          )}
          <button
            onClick={() => doSearch(query)}
            className="p-2 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>

        {/* ─── Autocomplete Dropdown ─── */}
        {showSuggestions && query.length >= 2 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-2 bg-zinc-900/98 backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden z-40 max-h-[70vh] overflow-y-auto"
          >
            {/* Suggestion tracks from Deezer */}
            {suggestionTracks.length > 0 && (
              <div className="p-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest px-3 py-1.5">Tracks</p>
                {suggestionTracks.map((track, i) => (
                  <button
                    key={i}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      selectedSuggestion === i ? 'bg-[#D4AF37]/15 text-white' : 'hover:bg-white/[0.05] text-zinc-300'
                    }`}
                    onClick={() => {
                      setQuery(`${track.artist} ${track.title}`);
                      doSearch(`${track.artist} ${track.title}`);
                    }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/[0.05] overflow-hidden flex-shrink-0">
                      {track.cover ? (
                        <img src={track.cover} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-zinc-600 text-lg">music_note</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{track.title}</p>
                      <p className="text-xs text-zinc-500 truncate">{track.artist}</p>
                    </div>
                    <span className="material-symbols-outlined text-zinc-600 text-lg">arrow_outward</span>
                  </button>
                ))}
              </div>
            )}

            {/* Text suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2 border-t border-white/[0.05]">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest px-3 py-1.5">Suggestions</p>
                {suggestions.map((s, i) => {
                  const idx = suggestionTracks.length + i;
                  return (
                    <button
                      key={i}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        selectedSuggestion === idx ? 'bg-[#D4AF37]/15 text-white' : 'hover:bg-white/[0.05] text-zinc-300'
                      }`}
                      onClick={() => {
                        setQuery(s);
                        doSearch(s);
                      }}
                    >
                      <span className="material-symbols-outlined text-zinc-500 text-lg">search</span>
                      <span className="text-sm flex-1 truncate">{s}</span>
                      <span className="material-symbols-outlined text-zinc-600 text-lg">north_west</span>
                    </button>
                  );
                })}
              </div>
            )}

            {suggestionTracks.length === 0 && suggestions.length === 0 && (
              <div className="px-4 py-6 text-center text-zinc-600 text-sm">
                No suggestions
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── No Query State ─── */}
      {!query && !loading && (
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Search History */}
          {sc.searchHistory.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-[family-name:var(--font-serif)] text-white">Recent Searches</h2>
                <button
                  onClick={sc.clearHistory}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest"
                >
                  Clear all
                </button>
              </div>
              <div className="space-y-0.5 fade-in">
                {sc.searchHistory.slice(0, 8).map((term, i) => (
                  <button
                    key={`hist-${i}`}
                    onClick={() => { setQuery(term); restored.current = false; doSearch(term); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] transition-colors text-left group"
                  >
                    <span className="material-symbols-outlined text-zinc-500 text-lg group-hover:text-[#D4AF37] transition-colors">history</span>
                    <span className="text-sm text-zinc-300 flex-1 truncate">{term}</span>
                    <span
                      className="material-symbols-outlined text-zinc-600 text-base hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={e => {
                        e.stopPropagation();
                        sc.removeFromHistory(term);
                      }}
                    >
                      close
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Mood Chips */}
          <section>
            <h2 className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium mb-3">What&apos;s your mood?</h2>
            <div className="grid grid-cols-3 gap-2">
              {MOOD_CHIPS.map(mood => (
                <button
                  key={mood.label}
                  onClick={() => handleMoodClick(mood.query)}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-sm text-zinc-300 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/30 hover:text-[#D4AF37] transition-all duration-300 active:scale-95"
                >
                  <span className="material-symbols-outlined text-lg">{mood.icon}</span>
                  {mood.label}
                </button>
              ))}
            </div>
          </section>

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
            <h2 className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium mb-3">Trending Now</h2>
            <div className="flex flex-wrap gap-2">
              {TRENDING_SEARCHES.slice(0, 12).map((term, i) => (
                <button
                  key={term}
                  onClick={() => { setQuery(term); restored.current = false; doSearch(term); }}
                  className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm text-zinc-300 hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/20 hover:text-[#D4AF37] transition-all duration-300 active:scale-95 flex items-center gap-1.5"
                >
                  <span className="text-[10px] text-zinc-600 font-mono">{i + 1}</span>
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

      {/* ─── Loading ─── */}
      {loading && query && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37]/20 border-t-[#D4AF37] animate-spin" />
        </div>
      )}

      {/* ─── Error ─── */}
      {!loading && error && (
        <div className="text-center py-16 max-w-2xl mx-auto">
          <span className="material-symbols-outlined text-5xl text-zinc-700 mb-3 block">search_off</span>
          <p className="text-zinc-400 mb-1">No results found</p>
          <p className="text-xs text-zinc-600">{error}</p>
        </div>
      )}

      {/* ─── Results ─── */}
      {!loading && !error && query && results.length > 0 && (
        <section className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-[family-name:var(--font-serif)] text-white">
              Results for &ldquo;<span className="text-[#D4AF37]">{query}</span>&rdquo;
            </h2>
            <span className="text-[10px] text-zinc-600">{results.length} tracks</span>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 mb-5 p-1 bg-white/[0.03] rounded-xl border border-white/[0.05]">
            {([
              { key: 'all', label: 'All', count: results.length },
              { key: 'songs', label: 'Songs', count: results.length },
              { key: 'artists', label: 'Artists', count: uniqueArtists.length },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all duration-200 ${
                  activeFilter === tab.key
                    ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {tab.label}
                <span className={`ml-1 text-[10px] ${activeFilter === tab.key ? 'text-[#D4AF37]/70' : 'text-zinc-600'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
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
            {filteredResults.map((track, i) => (
              <SongCard key={`${track.source || 'yt'}-${track.id}`} track={track} index={i} queue={filteredResults} showIndex />
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
