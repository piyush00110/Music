import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BROWER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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
    context: { client: { clientName: 'WEB', clientVersion: '2.20250101.00.00', hl: 'en', gl: 'US' } },
    query,
  };
  const res = await fetch('https://www.youtube.com/youtubei/v1/search?key=' + key, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': BROWER_UA,
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://www.youtube.com',
      'Referer': 'https://www.youtube.com/',
      'X-YouTube-Client-Name': '1',
      'X-YouTube-Client-Version': '2.20250101.00.00',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.error) return null;
  const sections = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
  const items: any[] = [];
  for (const section of sections) {
    for (const v of (section?.itemSectionRenderer?.contents || [])) {
      const vr = v?.videoRenderer;
      if (!vr?.videoId) continue;
      items.push({
        videoId: vr.videoId,
        title: vr.title?.runs?.[0]?.text || vr.title?.simpleText || '',
        channel: vr.ownerText?.runs?.[0]?.text || 'Unknown',
        thumbnail: vr.thumbnail?.thumbnails?.[vr.thumbnail.thumbnails.length - 1]?.url || '',
        duration: parseDuration(vr.lengthText?.simpleText || ''),
      });
    }
  }
  return items.length ? items : null;
}

// ─── YouTube via HTML scrape ────────────────────────────────────
async function searchHTML(query: string) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': BROWER_UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  const html = await res.text();
  const ytMatch = html.match(/ytInitialData\s*=\s*({.+?});/);
  if (ytMatch) {
    try {
      const data = JSON.parse(ytMatch[1]);
      const sections = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
      const items: any[] = [];
      for (const section of sections) {
        for (const v of (section?.itemSectionRenderer?.contents || [])) {
          const vr = v?.videoRenderer;
          if (!vr?.videoId) continue;
          items.push({
            videoId: vr.videoId,
            title: vr.title?.runs?.[0]?.text || vr.title?.simpleText || '',
            channel: vr.ownerText?.runs?.[0]?.text || 'Unknown',
            thumbnail: vr.thumbnail?.thumbnails?.[vr.thumbnail.thumbnails.length - 1]?.url || '',
            duration: parseDuration(vr.lengthText?.simpleText || ''),
          });
        }
      }
      if (items.length) return items;
    } catch {}
  }
  return null;
}

// ─── Audius ─────────────────────────────────────────────────────
async function searchAudius(query: string) {
  try {
    const res = await fetch(
      `https://discoveryprovider.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&limit=15`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((t: any, i: number): any => ({
      id: 5000 + i,
      title: t.title || '',
      artist: t.user?.name || 'Unknown',
      artistId: t.user?.id || i,
      duration: t.duration || 0,
      cover: t.artwork?.url_100x100?.replace('100x100', '300x300') || '',
      stream: `${t.id}`,
      source: 'audius',
    }));
  } catch { return []; }
}

// ─── Deezer ─────────────────────────────────────────────────────
async function searchDeezer(query: string) {
  try {
    const res = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=15`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((t: any, i: number): any => ({
      id: 1000 + i,
      title: t.title || '',
      artist: t.artist?.name || 'Unknown',
      artistId: t.artist?.id || i,
      duration: t.duration || 0,
      cover: t.album?.cover_medium || t.album?.cover || '',
      stream: t.preview || '',
      source: 'deezer',
    }));
  } catch { return []; }
}

// ─── GET handler ────────────────────────────────────────────────
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  const mode = url.searchParams.get('mode') || 'full';
  if (!query?.trim()) return NextResponse.json({ items: [] });

  if (mode === 'yt-only') {
    // Fast path — YouTube only, no fallbacks
    const yt = await searchYT(query).catch(() => null);
    return NextResponse.json({
      items: (yt || []).map((v: any, i: number) => ({
        id: i + 1, title: v.title, artistName: v.channel, artistId: i + 1,
        duration: v.duration, cover: v.thumbnail, stream: v.videoId,
        youtubeId: v.videoId, source: 'youtube' as const,
      })),
    });
  }

  // YouTube (2 strategies)
  let yt = await searchYT(query).catch(() => null);
  if (!yt?.length) yt = await searchHTML(query).catch(() => null);

  // Audius + Deezer (parallel)
  const [au, dz] = await Promise.all([
    searchAudius(query).catch(() => [] as any[]),
    searchDeezer(query).catch(() => [] as any[]),
  ]);

  return NextResponse.json({
    items: [
      ...(yt || []).map((v: any, i: number) => ({
        id: i + 1,
        title: v.title,
        artistName: v.channel,
        artistId: i + 1,
        duration: v.duration,
        cover: v.thumbnail,
        stream: v.videoId,
        youtubeId: v.videoId,
        source: 'youtube' as const,
      })),
      ...au,
      ...dz,
    ],
  });
}
