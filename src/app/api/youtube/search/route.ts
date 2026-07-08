import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// @ts-expect-error
import yts from 'yt-search';

async function searchYouTubeAPI(query: string) {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  if (!apiKey) return null;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20&key=${apiKey}`;
  const res = await fetch(url);
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

async function searchDirect(query: string) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) return null;
  const html = await res.text();
  const match = html.match(/ytInitialData\s*=\s*({.+?});\s*<\/script>/);
  if (!match) return null;
  const data = JSON.parse(match[1]);
  const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
  const items: any[] = [];
  for (const section of contents) {
    const videos = section?.itemSectionRenderer?.contents || [];
    for (const v of videos) {
      const vr = v?.videoRenderer;
      if (!vr) continue;
      items.push({
        videoId: vr.videoId || '',
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  if (!query?.trim()) return NextResponse.json({ items: [] });

  // Try 3 strategies in order
  let items = await searchYouTubeAPI(query);
  if (!items) items = await searchYtSearch(query).catch(() => null);
  if (!items) items = await searchDirect(query).catch(() => null);

  return NextResponse.json({ items: items || [] });
}
