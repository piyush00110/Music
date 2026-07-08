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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const title = searchParams.get('title') || 'audio';
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const safe = title.replace(/[^\w\s-]/g, '').trim() || 'song';
  const tmp = path.join(os.tmpdir(), `dl-${id}`);

  // Strategy 1: yt-dlp download best audio as m4a
  try {
    execSync(
      `yt-dlp -f bestaudio[ext=m4a] -o "${tmp}.m4a" --no-playlist "https://www.youtube.com/watch?v=${id}"`,
      { timeout: 120000, encoding: 'utf-8', stdio: 'pipe' },
    );
    if (fs.existsSync(`${tmp}.m4a`)) {
      const stat = fs.statSync(`${tmp}.m4a`);
      const buf = fs.readFileSync(`${tmp}.m4a`);
      fs.unlink(`${tmp}.m4a`, () => {});
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'audio/mp4',
          'Content-Disposition': `attachment; filename="${safe}.m4a"`,
          'Content-Length': String(stat.size),
          'Cache-Control': 'no-store',
        },
      });
    }
  } catch {}

  // Strategy 2: yt-dlp stream URL → pipe
  try {
    const streamUrl = execSync(
      `yt-dlp -f bestaudio --get-url "https://www.youtube.com/watch?v=${id}"`,
      { timeout: 15000, encoding: 'utf-8' },
    ).trim();
    if (streamUrl?.startsWith('http')) {
      const res = await fetch(streamUrl, { signal: AbortSignal.timeout(30000) });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        return new NextResponse(buf, {
          headers: {
            'Content-Type': 'audio/mp4',
            'Content-Disposition': `attachment; filename="${safe}.m4a"`,
            'Content-Length': String(buf.byteLength),
            'Cache-Control': 'no-store',
          },
        });
      }
    }
  } catch {}

  // Strategy 3: scrape YouTube page for stream URL → pipe
  const streamUrl = await getStreamUrlFromPage(id);
  if (streamUrl) {
    try {
      const res = await fetch(streamUrl, { signal: AbortSignal.timeout(30000) });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const ext = res.headers.get('content-type')?.includes('mp4') ? 'm4a' : 'mp3';
        return new NextResponse(buf, {
          headers: {
            'Content-Type': `audio/${ext === 'm4a' ? 'mp4' : 'mpeg'}`,
            'Content-Disposition': `attachment; filename="${safe}.${ext}"`,
            'Content-Length': String(buf.byteLength),
            'Cache-Control': 'no-store',
          },
        });
      }
    } catch {}
  }

  // Strategy 4: redirect to YouTube
  return NextResponse.redirect(`https://www.youtube.com/watch?v=${id}`);
}
