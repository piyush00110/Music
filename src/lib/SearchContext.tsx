'use client';
import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { Track } from './types';

const LS_HISTORY = 'aurelia-search-history';
const MAX_HISTORY = 15;

interface SearchState {
  query: string;
  results: Track[];
  loading: boolean;
  searchHistory: string[];
  setQuery: (q: string) => void;
  setResults: (r: Track[]) => void;
  setLoading: (l: boolean) => void;
  addToHistory: (q: string) => void;
  removeFromHistory: (q: string) => void;
  clearHistory: () => void;
}

const SearchContext = createContext<SearchState | null>(null);

function loadHistory(): string[] {
  try {
    const s = localStorage.getItem(LS_HISTORY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const historyLoaded = useRef(false);

  useEffect(() => {
    if (!historyLoaded.current) {
      setSearchHistory(loadHistory());
      historyLoaded.current = true;
    }
  }, []);

  const addToHistory = useCallback((q: string) => {
    if (!q.trim()) return;
    setSearchHistory(prev => {
      const next = [q, ...prev.filter(h => h.toLowerCase() !== q.toLowerCase())].slice(0, MAX_HISTORY);
      try { localStorage.setItem(LS_HISTORY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeFromHistory = useCallback((q: string) => {
    setSearchHistory(prev => {
      const next = prev.filter(h => h !== q);
      try { localStorage.setItem(LS_HISTORY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    try { localStorage.removeItem(LS_HISTORY); } catch {}
  }, []);

  return (
    <SearchContext.Provider value={{ query, results, loading, searchHistory, setQuery, setResults, setLoading, addToHistory, removeFromHistory, clearHistory }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const c = useContext(SearchContext);
  if (!c) throw new Error('useSearch must be used within SearchProvider');
  return c;
}
