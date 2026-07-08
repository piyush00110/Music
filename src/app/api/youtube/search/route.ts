import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// @ts-expect-error
import yts from 'yt-search';

const INNERTUBE_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';

async function searchInnerTube(query: string) {
  const body = {
    context: { client: { clientName: 'WEB', clientVersion: '2.20250101.00.00', hl: 'en', gl: 'US' } },
    query,
  };
  const res = await fetch('https://www.youtube.com/youtubei/v1/search?key=' + INNERTUBE_KEY, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://www.youtube.com',
      'Referer': 'https://www.youtube.com/',
      'X-YouTube-Client-Name': '1',
      'X-YouTube-Client-Version': '2.20250101.00.00',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) { console.error('InnerTube HTTP', res.status); return null; }
  const data = await res.json();
  if (data.error) { console.error('InnerTube error', JSON.stringify(data.error)); return null; }
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
        thumbnail: vr.thumbnail?.thumbnails?.[0]?.url || '',
        duration: (() => {
          const t = vr.lengthText?.simpleText || '';
          const p = t.split(':').map(Number);
          return p.length === 2 ? p[0] * 60 + p[1] : p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : 0;
        })(),
      });
    }
  }
  return items.length ? items : null;
}

async function searchYouTubeAPI(query: string) {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  if (!apiKey) return null;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20&key=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
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

async function searchYtSearch(query: string) {
  const result = await yts(query.trim());
  return (result.videos || []).slice(0, 20).map((v: any) => ({
    videoId: v.videoId || '',
    title: v.title || '',
    channel: v.author?.name || v.author?.channelTitle || 'Unknown',
    thumbnail: v.thumbnail || '',
    duration: v.duration?.seconds || v.seconds || 0,
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  if (!query?.trim()) return NextResponse.json({ items: [] });

  let items = await searchInnerTube(query).catch(() => null);
  if (!items) items = await searchYouTubeAPI(query).catch(() => null);
  if (!items) items = await searchYtSearch(query).catch(() => null);

  return NextResponse.json({ items: items || [] });
}
