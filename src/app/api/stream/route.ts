import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing video id' }, { status: 400 });
  }

  try {
    const url = `https://www.youtube.com/watch?v=${id}`;
    const streamUrl = execSync(
      `yt-dlp -f bestaudio --get-url "${url}"`,
      { timeout: 15000, encoding: 'utf-8' },
    ).trim();

    if (streamUrl && streamUrl.startsWith('http')) {
      return NextResponse.json({ url: streamUrl });
    }
  } catch {}

  return NextResponse.json({ error: 'Stream not available' }, { status: 502 });
}
