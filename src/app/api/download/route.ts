import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
  } catch { console.error('dl m4a fail'); }

  // Strategy 2: yt-dlp bestaudio (any format) to m4a
  try {
    execSync(
      `yt-dlp -f bestaudio -o "${tmp}.m4a" --no-playlist "https://www.youtube.com/watch?v=${id}"`,
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
  } catch { console.error('dl audio fail'); }

  // Strategy 3: get stream URL via yt-dlp → pipe as download
  try {
    const url = execSync(
      `yt-dlp -f bestaudio --get-url "https://www.youtube.com/watch?v=${id}"`,
      { timeout: 15000, encoding: 'utf-8' },
    ).trim();
    if (url?.startsWith('http')) {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
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
  } catch { console.error('dl stream fail'); }

  // Strategy 4: redirect to YouTube
  return NextResponse.redirect(`https://www.youtube.com/watch?v=${id}`);
}
