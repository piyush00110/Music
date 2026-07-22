import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// Strategy 1: YouTube page scrape - get adaptive audio format URL
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
    const fmts = data?.streamingData?.adaptiveFormats || [];
    const audio = fmts
      .filter((f: any) => f.mimeType?.startsWith('audio'))
      .sort((a: any, b: any) => {
        const aBr = parseInt(String(a.bitrate || a.averageBitrate || 0));
        const bBr = parseInt(String(b.bitrate || b.averageBitrate || 0));
        return bBr - aBr;
      });
    if (audio[0]?.url) return audio[0].url;
    // Some formats use signatureCipher instead of direct URL
    if (audio[0]?.signatureCipher) return null;
    return null;
  } catch { return null; }
}

// Strategy 2: Invidious instances
async function getInvidiousAudioUrl(videoId: string): Promise<string | null> {
  const instances = ['https://vid.puffyan.us', 'https://invidious.fdn.fr', 'https://inv.nadeko.net'];
  for (const inst of instances) {
    try {
      const res = await fetch(`${inst}/api/v1/videos/${videoId}`, { signal: AbortSignal.timeout(8000) });
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

// Strategy 3: Cobalt API
async function getCobaltAudioUrl(videoId: string): Promise<string | null> {
  const hosts = ['https://api.cobalt.tools', 'https://co.wuk.sh'];
  for (const host of hosts) {
    try {
      const res = await fetch(`${host}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${videoId}`,
          audioFormat: 'best',
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
  if (!id) return NextResponse.json({ error: 'Missing video id' }, { status: 400 });

  // Validate YouTube video ID format
  if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) {
    return NextResponse.json({ error: 'Invalid video id' }, { status: 400 });
  }

  // Try all strategies in parallel for fastest result
  const [ytUrl, invUrl, cobUrl] = await Promise.all([
    getYouTubeAudioUrl(id),
    getInvidiousAudioUrl(id),
    getCobaltAudioUrl(id),
  ]);

  // Return the first working URL
  const url = ytUrl || invUrl || cobUrl;
  if (url) {
    return NextResponse.json({ url });
  }

  // Last resort: return YouTube watch URL for YT IFrame fallback
  return NextResponse.json({ url: `https://www.youtube.com/watch?v=${id}`, fallback: true });
}
