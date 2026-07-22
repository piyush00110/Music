import { NextResponse } from 'next/server';
import { uploadSongToStorage, getSongFromStorage } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

async function getHighestQualityAudio(videoId: string): Promise<{ buffer: ArrayBuffer; ext: string; mime: string } | null> {
  // Strategy 1: YouTube page scrape (highest bitrate adaptive format)
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    const m = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (m) {
      const data = JSON.parse(m[1]);
      const fmts = data?.streamingData?.adaptiveFormats || [];
      const audio = fmts
        .filter((f: any) => f.mimeType?.startsWith('audio'))
        .sort((a: any, b: any) => {
          const aBr = parseInt(String(a.bitrate || a.averageBitrate || 0));
          const bBr = parseInt(String(b.bitrate || b.averageBitrate || 0));
          return bBr - aBr;
        });
      if (audio[0]?.url) {
        const audioRes = await fetch(audio[0].url, {
          signal: AbortSignal.timeout(120000),
          headers: { 'User-Agent': UA },
        });
        if (audioRes.ok) {
          const buf = await audioRes.arrayBuffer();
          if (buf.byteLength > 10000) {
            const ct = audioRes.headers.get('content-type') || '';
            let ext = 'm4a', mime = 'audio/mp4';
            if (ct.includes('webm')) { ext = 'webm'; mime = 'audio/webm'; }
            else if (ct.includes('mpeg')) { ext = 'mp3'; mime = 'audio/mpeg'; }
            return { buffer: buf, ext, mime };
          }
        }
      }
    }
  } catch {}

  // Strategy 2: yt-dlp via execSync (server-side, highest quality)
  try {
    const { execSync } = await import('child_process');
    const streamUrl = execSync(
      `yt-dlp -f "bestaudio[acodec=opus][abr>=320]/bestaudio[acodec=opus]/bestaudio[acodec=m4a][abr>=256]/bestaudio[acodec=m4a]/bestaudio" --get-url "https://www.youtube.com/watch?v=${videoId}"`,
      { timeout: 15000, encoding: 'utf-8' },
    ).trim();
    if (streamUrl?.startsWith('http')) {
      const audioRes = await fetch(streamUrl, {
        signal: AbortSignal.timeout(120000),
        headers: { 'User-Agent': UA },
      });
      if (audioRes.ok) {
        const buf = await audioRes.arrayBuffer();
        if (buf.byteLength > 10000) {
          const ct = audioRes.headers.get('content-type') || '';
          let ext = 'm4a', mime = 'audio/mp4';
          if (ct.includes('webm')) { ext = 'webm'; mime = 'audio/webm'; }
          else if (ct.includes('mpeg')) { ext = 'mp3'; mime = 'audio/mpeg'; }
          return { buffer: buf, ext, mime };
        }
      }
    }
  } catch {}

  // Strategy 3: Invidious instances
  const instances = ['https://vid.puffyan.us', 'https://invidious.fdn.fr', 'https://inv.nadeko.net'];
  for (const inst of instances) {
    try {
      const res = await fetch(`${inst}/api/v1/videos/${videoId}`, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const data = await res.json();
      const audio = (data.adaptiveFormats || [])
        .filter((f: any) => f.type?.startsWith('audio'))
        .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
      if (audio[0]?.url) {
        const audioRes = await fetch(audio[0].url, { signal: AbortSignal.timeout(120000), headers: { 'User-Agent': UA } });
        if (audioRes.ok) {
          const buf = await audioRes.arrayBuffer();
          if (buf.byteLength > 10000) {
            const ct = audioRes.headers.get('content-type') || '';
            let ext = 'm4a', mime = 'audio/mp4';
            if (ct.includes('webm')) { ext = 'webm'; mime = 'audio/webm'; }
            else if (ct.includes('mpeg')) { ext = 'mp3'; mime = 'audio/mpeg'; }
            return { buffer: buf, ext, mime };
          }
        }
      }
    } catch { continue; }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { youtubeId, title } = body;
    if (!youtubeId || !title) {
      return NextResponse.json({ error: 'Missing youtubeId or title' }, { status: 400 });
    }

    // Validate youtubeId format to prevent command injection
    if (!/^[a-zA-Z0-9_-]{11}$/.test(youtubeId)) {
      return NextResponse.json({ error: 'Invalid youtubeId format' }, { status: 400 });
    }

    // Validate title length
    const safeTitle = title.slice(0, 200);

    // Check if song already exists in storage
    const existingUrl = await getSongFromStorage(youtubeId, safeTitle);
    if (existingUrl) {
      return NextResponse.json({ url: existingUrl, cached: true });
    }

    // Download highest quality audio
    const audio = await getHighestQualityAudio(youtubeId);
    if (!audio) {
      return NextResponse.json({ error: 'Could not download audio' }, { status: 503 });
    }

    // Check file size limit (50MB)
    if (audio.buffer.byteLength > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 413 });
    }

    // Upload to Supabase Storage
    const result = await uploadSongToStorage(audio.buffer, safeTitle, youtubeId, audio.ext, audio.mime);
    if (!result) {
      return NextResponse.json({ error: 'Failed to save to storage' }, { status: 500 });
    }

    return NextResponse.json({ url: result.publicUrl, path: result.path, cached: false });
  } catch (err) {
    console.error('Save to storage error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
