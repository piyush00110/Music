'use client';
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Track } from './types';

interface SearchState {
  query: string;
  results: Track[];
  loading: boolean;
  setQuery: (q: string) => void;
  setResults: (r: Track[]) => void;
  setLoading: (l: boolean) => void;
}

const SearchContext = createContext<SearchState | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  return (
    <SearchContext.Provider value={{ query, results, loading, setQuery, setResults, setLoading }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const c = useContext(SearchContext);
  if (!c) throw new Error('useSearch must be used within SearchProvider');
  return c;
}
