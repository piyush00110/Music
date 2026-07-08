import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

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
      // Redirect directly to the audio stream for download
      return NextResponse.redirect(streamUrl, 302);
    }
  } catch {}

  // Fallback: redirect to YouTube page
  return NextResponse.redirect(`https://www.youtube.com/watch?v=${id}`);
}
