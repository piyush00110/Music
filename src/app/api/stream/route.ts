import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getStreamUrlYtdl(videoId: string): Promise<string | null> {
  try {
    const ytdl = await import('@distube/ytdl-core');
    const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`, {
      requestOptions: { headers: { 'Accept-Language': 'en' } },
    });
    const format = ytdl.chooseFormat(info.formats, { quality: 'lowestaudio', filter: 'audioonly' });
    return format?.url || null;
  } catch { return null; }
}

async function getStreamUrlDlp(videoId: string): Promise<string | null> {
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const streamUrl = execSync(
      `yt-dlp -f bestaudio --get-url "${url}"`,
      { timeout: 15000, encoding: 'utf-8' },
    ).trim();
    if (streamUrl?.startsWith('http')) return streamUrl;
  } catch {}
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing video id' }, { status: 400 });

  let url = await getStreamUrlYtdl(id);
  if (!url) url = await getStreamUrlDlp(id);

  if (url) return NextResponse.json({ url });
  return NextResponse.json({ error: 'Stream not available' }, { status: 502 });
}
