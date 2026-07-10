import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Get audio stream URL from YouTube page scrape
async function getYouTubeAudioUrl(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    const m = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (!m) return null;
    const data = JSON.parse(m[1]);
    const fmts = data?.streamingData?.adaptiveFormats || data?.streamingData?.formats || [];
    const audio = fmts.filter((f: any) => f.mimeType?.startsWith('audio'));
    audio.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
    return audio[0]?.url || null;
  } catch { return null; }
}

// Get audio stream URL from Invidious
async function getInvidiousAudioUrl(videoId: string): Promise<string | null> {
  const instances = [
    'https://vid.puffyan.us',
    'https://invidious.fdn.fr',
    'https://inv.nadeko.net',
  ];
  for (const inst of instances) {
    try {
      const res = await fetch(`${inst}/api/v1/videos/${videoId}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const audio = (data.adaptiveFormats || [])
        .filter((f: any) => f.type?.startsWith('audio'))
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
      if (audio[0]?.url) return audio[0].url;
    } catch { continue; }
  }
  return null;
}

// Get audio stream URL from cobalt
async function getCobaltAudioUrl(videoId: string): Promise<string | null> {
  const hosts = ['https://api.cobalt.tools', 'https://co.wuk.sh'];
  for (const host of hosts) {
    try {
      const res = await fetch(`${host}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${videoId}`,
          audioFormat: 'mp3',
          isAudioOnly: true,
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.url) return data.url;
    } catch { continue; }
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const title = searchParams.get('title') || 'audio';
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const safe = title.replace(/[^\w\s-]/g, '').trim() || 'song';

  // Try all sources in parallel for speed
  const [ytUrl, invUrl, cobUrl] = await Promise.all([
    getYouTubeAudioUrl(id),
    getInvidiousAudioUrl(id),
    getCobaltAudioUrl(id),
  ]);

  // Use whichever worked, try to fetch and return the audio
  const urls = [ytUrl, invUrl, cobUrl].filter(Boolean) as string[];

  for (const streamUrl of urls) {
    try {
      const audioRes = await fetch(streamUrl, {
        signal: AbortSignal.timeout(60000),
        headers: { 'User-Agent': UA },
      });
      if (!audioRes.ok) continue;
      const buf = await audioRes.arrayBuffer();
      if (buf.byteLength < 10000) continue;

      const ct = audioRes.headers.get('content-type') || '';
      let ext = 'm4a';
      let mime = 'audio/mp4';
      if (ct.includes('webm')) { ext = 'webm'; mime = 'audio/webm'; }
      else if (ct.includes('mpeg')) { ext = 'mp3'; mime = 'audio/mpeg'; }

      return new NextResponse(buf, {
        headers: {
          'Content-Type': mime,
          'Content-Disposition': `attachment; filename="${safe}.${ext}"`,
          'Content-Length': String(buf.byteLength),
          'Cache-Control': 'no-store',
        },
      });
    } catch { continue; }
  }

  return NextResponse.json(
    { error: 'Download unavailable. Try again later.' },
    { status: 503 },
  );
}
