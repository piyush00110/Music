import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// YouTube autocomplete suggestions
async function getYTSuggestions(query: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(4000) },
    );
    if (!res.ok) return [];
    const text = await res.text();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const data = JSON.parse(match[0]);
    return (data[1] || []).map((item: any[]) => item[0]).filter(Boolean).slice(0, 8);
  } catch { return []; }
}

// iTunes track suggestions (reliable, always works)
async function getTrackSuggestions(query: string): Promise<{ title: string; artist: string; cover: string }[]> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=5&country=US`,
      { signal: AbortSignal.timeout(4000) },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((t: any) => ({
      title: t.trackName || '',
      artist: t.artistName || '',
      cover: (t.artworkUrl100 || '').replace('100x100', '200x200'),
    }));
  } catch { return []; }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  if (!query?.trim() || query.length < 2) {
    return NextResponse.json({ suggestions: [], tracks: [] });
  }

  const [ytSuggestions, tracks] = await Promise.all([
    getYTSuggestions(query).catch(() => []),
    getTrackSuggestions(query).catch(() => []),
  ]);

  return NextResponse.json({ suggestions: ytSuggestions, tracks });
}
