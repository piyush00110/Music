import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing video id' }, { status: 400 });

  try {
    const streamUrl = execSync(
      `yt-dlp -f "bestaudio[acodec=opus]/bestaudio[acodec=m4a]/bestaudio" --get-url "https://www.youtube.com/watch?v=${id}"`,
      { timeout: 15000, encoding: 'utf-8' },
    ).trim();
    if (streamUrl?.startsWith('http')) return NextResponse.json({ url: streamUrl });
  } catch {}

  return NextResponse.json({ url: `https://www.youtube.com/watch?v=${id}`, fallback: true });
}
