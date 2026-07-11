import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// YouTube autocomplete suggestions
async function getYTSuggestions(query: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(3000),
      }
    );
    if (!res.ok) return [];
    const text = await res.text();
    // Response is JSONP: window.google.ac.h(["query",[["suggestion1",...],...]])
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const data = JSON.parse(match[0]);
    // data[1] is array of [suggestion, ...] tuples
    return (data[1] || []).map((item: any[]) => item[0]).filter(Boolean).slice(0, 8);
  } catch {
    return [];
  }
}

// Deezer search suggestions (quick artist/track names)
async function getDeezerSuggestions(query: string): Promise<{ title: string; artist: string; cover: string }[]> {
  try {
    const res = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=5`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((t: any) => ({
      title: t.title || '',
      artist: t.artist?.name || '',
      cover: t.album?.cover_small || '',
    }));
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  if (!query?.trim() || query.length < 2) {
    return NextResponse.json({ suggestions: [], tracks: [] });
  }

  const [ytSuggestions, deezerResults] = await Promise.all([
    getYTSuggestions(query).catch(() => []),
    getDeezerSuggestions(query).catch(() => []),
  ]);

  return NextResponse.json({
    suggestions: ytSuggestions,
    tracks: deezerResults,
  });
}
