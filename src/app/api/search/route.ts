import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function parseDuration(t: string): number {
  const p = t.split(':').map(Number);
  if (p.length === 2) return p[0] * 60 + p[1];
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  return 0;
}

// ─── YouTube via InnerTube ─────────────────────────────────────
async function searchYT(query: string) {
  const key = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
  const body = {
    context: { client: { clientName: 'WEB', clientVersion: '2.20260101.00.00', hl: 'en', gl: 'US' } },
    query,
  };
  try {
    const res = await fetch('https://www.youtube.com/youtubei/v1/search?key=' + key, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': UA,
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Origin': 'https://www.youtube.com',
        'Referer': 'https://www.youtube.com/',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.error) return [];
    const sections = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    const items: any[] = [];
    for (const section of sections) {
      for (const v of (section?.itemSectionRenderer?.contents || [])) {
        const vr = v?.videoRenderer;
        if (!vr?.videoId) continue;
        const dur = parseDuration(vr.lengthText?.simpleText || '');
        if (dur < 30 || dur > 900) continue;
        items.push({
          videoId: vr.videoId,
          title: vr.title?.runs?.[0]?.text || vr.title?.simpleText || '',
          channel: vr.ownerText?.runs?.[0]?.text || 'Unknown',
          thumbnail: vr.thumbnail?.thumbnails?.[vr.thumbnail.thumbnails.length - 1]?.url || '',
          duration: dur,
        });
      }
    }
    return items;
  } catch { return []; }
}

// ─── YouTube via HTML scrape ────────────────────────────────────
async function searchHTML(query: string) {
  try {
    const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const match = html.match(/ytInitialData\s*=\s*({.+?});/);
    if (!match) return [];
    const data = JSON.parse(match[1]);
    const sections = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
    const items: any[] = [];
    for (const section of sections) {
      for (const v of (section?.itemSectionRenderer?.contents || [])) {
        const vr = v?.videoRenderer;
        if (!vr?.videoId) continue;
        const dur = parseDuration(vr.lengthText?.simpleText || '');
        if (dur < 30 || dur > 900) continue;
        items.push({
          videoId: vr.videoId,
          title: vr.title?.runs?.[0]?.text || vr.title?.simpleText || '',
          channel: vr.ownerText?.runs?.[0]?.text || 'Unknown',
          thumbnail: vr.thumbnail?.thumbnails?.[vr.thumbnail.thumbnails.length - 1]?.url || '',
          duration: dur,
        });
      }
    }
    return items;
  } catch { return []; }
}

// ─── GET handler ────────────────────────────────────────────────
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const mode = url.searchParams.get('mode') || 'full';
  if (!query?.trim()) return NextResponse.json({ items: [] });

  if (mode === 'yt-only') {
    const yt = await searchYT(query);
    return NextResponse.json({
      items: yt.map((v: any, i: number) => ({
        id: i + 1, title: v.title, artistName: v.channel, artistId: i + 1,
        duration: v.duration, cover: v.thumbnail, stream: v.videoId,
        youtubeId: v.videoId, source: 'youtube' as const,
      })),
    });
  }

  // Search YouTube with original query AND "official audio" in parallel
  const [yt1, yt2] = await Promise.all([
    searchYT(query),
    searchYT(`${query} official audio`),
  ]);

  // Merge and deduplicate by videoId
  const ytMap = new Map<string, any>();
  for (const v of [...yt1, ...yt2]) {
    if (!ytMap.has(v.videoId)) ytMap.set(v.videoId, v);
  }
  const yt = [...ytMap.values()];

  // Simple sort: YouTube results only, full songs, sorted by relevance
  const q = query.toLowerCase();
  const items = yt.map((v: any, i: number) => {
    const title = v.title.toLowerCase();
    let score = 0;
    if (title.includes(q)) score += 100;
    if (title.startsWith(q)) score += 50;
    const words = q.split(/\s+/);
    if (words.every(w => title.includes(w))) score += 30;
    return {
      id: i + 1, title: v.title, artistName: v.channel, artistId: i + 1,
      duration: v.duration, cover: v.thumbnail, stream: v.videoId,
      youtubeId: v.videoId, source: 'youtube' as const, _score: score,
    };
  }).sort((a: any, b: any) => b._score - a._score)
    .map(({ _score, ...rest }: any) => rest);

  return NextResponse.json({ items });
}
