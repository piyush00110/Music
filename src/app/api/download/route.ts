import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function getStreamUrlFromPage(id: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${id}`, {
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

function sendAudio(buf: ArrayBuffer, safe: string, ext: string) {
  const mime = ext === 'm4a' ? 'audio/mp4' : 'audio/mpeg';
  return new NextResponse(buf, {
    headers: {
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="${safe}.${ext}"`,
      'Content-Length': String(buf.byteLength),
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const title = searchParams.get('title') || 'audio';
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const safe = title.replace(/[^\w\s-]/g, '').trim() || 'song';
  const tmp = path.join(os.tmpdir(), `dl-${id}-${Date.now()}`);
  const videoUrl = `https://www.youtube.com/watch?v=${id}`;

  // Strategy 1: yt-dlp bestaudio m4a
  try {
    execSync(
      `yt-dlp -f "bestaudio[ext=m4a]/bestaudio" -o "${tmp}.%(ext)s" --no-playlist --no-warnings "${videoUrl}"`,
      { timeout: 120000, encoding: 'utf-8', stdio: 'pipe' },
    );
    const files = fs.readdirSync(os.tmpdir()).filter(f => f.startsWith(path.basename(tmp)));
    for (const f of files) {
      const fp = path.join(os.tmpdir(), f);
      if (fs.existsSync(fp)) {
        const buf = fs.readFileSync(fp);
        const ext = f.split('.').pop() || 'm4a';
        fs.unlinkSync(fp);
        return sendAudio(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), safe, ext);
      }
    }
  } catch {}

  // Strategy 2: yt-dlp --get-url then pipe
  try {
    const streamUrl = execSync(
      `yt-dlp -f "bestaudio[ext=m4a]/bestaudio" --get-url --no-warnings "${videoUrl}"`,
      { timeout: 30000, encoding: 'utf-8' },
    ).trim();
    if (streamUrl?.startsWith('http')) {
      const res = await fetch(streamUrl, { signal: AbortSignal.timeout(60000) });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const ext = streamUrl.includes('.m4a') || res.headers.get('content-type')?.includes('mp4') ? 'm4a' : 'mp3';
        return sendAudio(buf, safe, ext);
      }
    }
  } catch {}

  // Strategy 3: scrape YouTube page for stream URL
  const streamUrl = await getStreamUrlFromPage(id);
  if (streamUrl) {
    try {
      const res = await fetch(streamUrl, { signal: AbortSignal.timeout(60000) });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const ext = res.headers.get('content-type')?.includes('mp4') ? 'm4a' : 'mp3';
        return sendAudio(buf, safe, ext);
      }
    } catch {}
  }

  // Strategy 4: yt-dlp raw pipe
  try {
    const buf = execSync(
      `yt-dlp -f "bestaudio" -o - --no-playlist --no-warnings "${videoUrl}"`,
      { timeout: 120000, maxBuffer: 50 * 1024 * 1024 },
    );
    if (buf && buf.length > 1000) {
      return sendAudio(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), safe, 'm4a');
    }
  } catch {}

  // All strategies failed — return error JSON (NOT a redirect to YouTube)
  return NextResponse.json(
    { error: 'Download unavailable. Try again later.' },
    { status: 503 },
  );
}
