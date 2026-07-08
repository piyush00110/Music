import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BROWER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const INNERTUBE_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';

function parseDuration(t: string): number {
  const p = t.split(':').map(Number);
  if (p.length === 2) return p[0] * 60 + p[1];
  if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
  return 0;
}

// ─── Strategy 1: YouTube InnerTube API ──────────────────────────
async function searchInnerTube(query: string) {
  const body = {
    context: { client: { clientName: 'WEB', clientVersion: '2.20250101.00.00', hl: 'en', gl: 'US' } },
    query,
  };
  const res = await fetch('https://www.youtube.com/youtubei/v1/search?key=' + INNERTUBE_KEY, {
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
  const rawContents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
  const items: any[] = [];
  for (const section of rawContents) {
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

// ─── Strategy 2: YouTube Data API v3 ────────────────────────────
async function searchYouTubeAPI(query: string) {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  if (!apiKey) return null;
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20&key=${apiKey}`,
    { signal: AbortSignal.timeout(8000) },
  );
  if (!res.ok) return null;
  const data = await res.json();
  return (data.items || []).map((v: any) => ({
    videoId: v.id?.videoId || '',
    title: v.snippet?.title || '',
    channel: v.snippet?.channelTitle || 'Unknown',
    thumbnail: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || '',
    duration: 0,
  }));
}

// ─── Strategy 3: Direct HTML scrape ─────────────────────────────
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

  const items: any[] = [];
  let m: RegExpExecArray | null;

  // Parse videoRenderer blocks from the HTML
  const vrRegex = /\{\"videoRenderer\":\{[^}]+(?:\{[^}]*\}[^}]*)*\}/g;
  while ((m = vrRegex.exec(html)) !== null) {
    try {
      const block = JSON.parse(m[0]).videoRenderer;
      if (!block?.videoId) continue;
      const title = block.title?.runs?.[0]?.text || block.title?.simpleText || '';
      const channel = block.ownerText?.runs?.[0]?.text || block.shortBylineText?.runs?.[0]?.text || '';
      const thumb = block.thumbnail?.thumbnails;
      const thumbnail = thumb?.[thumb.length - 1]?.url || '';
      const duration = parseDuration(block.lengthText?.simpleText || block.lengthText?.runs?.[0]?.text || '');
      items.push({ videoId: block.videoId, title, channel, thumbnail, duration });
    } catch {}
  }

  if (items.length >= 3) return items.slice(0, 25);

  // Try ytInitialData approach
  const ytMatch = html.match(/ytInitialData\s*=\s*({.+?});/);
  if (ytMatch) {
    try {
      const data = JSON.parse(ytMatch[1]);
      const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
      const parsed: any[] = [];
      for (const section of contents) {
        for (const v of (section?.itemSectionRenderer?.contents || [])) {
          const vr = v?.videoRenderer;
          if (!vr?.videoId) continue;
          parsed.push({
            videoId: vr.videoId,
            title: vr.title?.runs?.[0]?.text || vr.title?.simpleText || '',
            channel: vr.ownerText?.runs?.[0]?.text || 'Unknown',
            thumbnail: vr.thumbnail?.thumbnails?.[vr.thumbnail.thumbnails.length - 1]?.url || '',
            duration: parseDuration(vr.lengthText?.simpleText || ''),
          });
        }
      }
      if (parsed.length) return parsed;
    } catch {}
  }

  return items.length ? items : null;
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q');
  if (!query?.trim()) return NextResponse.json({ items: [] });

  let items = await searchInnerTube(query).catch(() => null);
  if (items?.length) return NextResponse.json({ items });

  items = await searchYouTubeAPI(query).catch(() => null);
  if (items?.length) return NextResponse.json({ items });

  items = await searchHTML(query).catch(() => null);
  return NextResponse.json({ items: items || [] });
}
