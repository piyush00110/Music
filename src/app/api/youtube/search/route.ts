import { NextResponse } from 'next/server';

// @ts-expect-error - yt-search has no types
import yts from 'yt-search';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || !query.trim()) {
    return NextResponse.json({ items: [] });
  }

  // Try official YouTube Data API if key is available
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  if (apiKey) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20&key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const items = (data.items || []).map((v: any) => ({
          videoId: v.id?.videoId || '',
          title: v.snippet?.title || '',
          channel: v.snippet?.channelTitle || 'Unknown',
          thumbnail: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || '',
          duration: 0,
        }));
        return NextResponse.json({ items });
      }
    } catch {}
  }

  // Fall back to yt-search (no key needed)
  try {
    const result = await yts(query.trim());
    const items = (result.videos || []).slice(0, 20).map((v: any) => ({
      videoId: v.videoId || '',
      title: v.title || '',
      channel: v.author?.name || v.author?.channelTitle || 'Unknown',
      thumbnail: v.thumbnail || '',
      duration: v.duration?.seconds || v.seconds || 0,
    }));
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ items: [], error: String(e) }, { status: 500 });
  }
}
