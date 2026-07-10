import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const COBALT_API = 'https://api.cobalt.tools';
const INVIDIOUS_INSTANCES = [
  'https://vid.puffyan.us',
  'https://invidious.fdn.fr',
  'https://inv.nadeko.net',
  'https://invidious.protokoll-11.de',
];

async function tryCobalt(youtubeId: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(`${COBALT_API}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${youtubeId}`,
        audioFormat: 'best',
        isAudioOnly: true,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.url) return null;
    const audioRes = await fetch(data.url, { signal: AbortSignal.timeout(60000) });
    if (!audioRes.ok) return null;
    return await audioRes.arrayBuffer();
  } catch { return null; }
}

async function tryInvidious(youtubeId: string): Promise<ArrayBuffer | null> {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${instance}/api/v1/videos/${youtubeId}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const audio = (data.adaptiveFormats || [])
        .filter((f: any) => f.type?.startsWith('audio'))
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
      if (!audio.length) continue;
      const streamUrl = audio[0].url;
      if (!streamUrl) continue;
      const audioRes = await fetch(streamUrl, { signal: AbortSignal.timeout(60000) });
      if (!audioRes.ok) continue;
      return await audioRes.arrayBuffer();
    } catch { continue; }
  }
  return null;
}

async function tryYouTubeScrape(youtubeId: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${youtubeId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    const m = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (!m) return null;
    const data = JSON.parse(m[1]);
    const fmts = data?.streamingData?.adaptiveFormats || data?.streamingData?.formats || [];
    const audio = fmts.filter((f: any) => f.mimeType?.startsWith('audio'));
    audio.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
    const url = audio[0]?.url;
    if (!url) return null;
    const audioRes = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (!audioRes.ok) return null;
    return await audioRes.arrayBuffer();
  } catch { return null; }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const title = searchParams.get('title') || 'audio';
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const safe = title.replace(/[^\w\s-]/g, '').trim() || 'song';

  // Try cobalt API
  let buf = await tryCobalt(id);
  if (buf && buf.byteLength > 10000) {
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'audio/mp4',
        'Content-Disposition': `attachment; filename="${safe}.m4a"`,
        'Content-Length': String(buf.byteLength),
        'Cache-Control': 'no-store',
      },
    });
  }

  // Try Invidious instances
  buf = await tryInvidious(id);
  if (buf && buf.byteLength > 10000) {
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'audio/webm',
        'Content-Disposition': `attachment; filename="${safe}.webm"`,
        'Content-Length': String(buf.byteLength),
        'Cache-Control': 'no-store',
      },
    });
  }

  // Try YouTube page scrape
  buf = await tryYouTubeScrape(id);
  if (buf && buf.byteLength > 10000) {
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'audio/mp4',
        'Content-Disposition': `attachment; filename="${safe}.m4a"`,
        'Content-Length': String(buf.byteLength),
        'Cache-Control': 'no-store',
      },
    });
  }

  return NextResponse.json(
    { error: 'Download unavailable. Try again later.' },
    { status: 503 },
  );
}
