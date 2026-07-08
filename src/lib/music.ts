import type { Track } from './types';

const AUDIUS = 'https://discoveryprovider.audius.co';

// ─── YouTube (via local API proxy) ──────────────────────────────
async function searchYT(query: string): Promise<Track[]> {
  try {
    const url = `/api/youtube/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map((v: any, i: number): Track => ({
      id: i + 1,
      title: v.title || '',
      artist: { id: i + 1, name: v.channel || 'Unknown' },
      album: {
        id: i + 1, title: v.channel || '',
        cover: '', cover_small: '',
        cover_medium: v.thumbnail || '',
        cover_big: '', cover_xl: '',
      },
      duration: v.duration || 0,
      preview: v.videoId || '',
      youtubeId: v.videoId || '',
      source: 'youtube',
    }));
  } catch { return []; }
}

// ─── Audius (free, no key, CORS-friendly) ────────────────────────
async function searchAudius(query: string, limit = 15): Promise<Track[]> {
  try {
    const res = await fetch(
      `${AUDIUS}/v1/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((t: any, i: number): Track => ({
      id: 5000 + i,
      title: t.title || '',
      artist: { id: t.user?.id || i, name: t.user?.name || 'Unknown' },
      album: {
        id: t.track_id || i, title: t.album?.name || t.title || '',
        cover: t.artwork?.url_100x100?.replace('100x100', '480x480') || '',
        cover_small: t.artwork?.url_100x100 || '',
        cover_medium: t.artwork?.url_480x480 || t.artwork?.url_100x100 || '',
        cover_big: t.artwork?.url_100x100?.replace('100x100', '1000x1000') || '',
        cover_xl: t.artwork?.url_100x100?.replace('100x100', '2000x2000') || '',
      },
      duration: t.duration || 0,
      preview: `${AUDIUS}/v1/tracks/${t.id}/stream`,
      source: 'audius',
    }));
  } catch { return []; }
}

async function getAudiusTrending(): Promise<Track[]> {
  try {
    const res = await fetch(`${AUDIUS}/v1/tracks/trending?limit=20`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((t: any, i: number): Track => ({
      id: 5000 + i,
      title: t.title || '',
      artist: { id: t.user?.id || i, name: t.user?.name || 'Unknown' },
      album: {
        id: t.track_id || i, title: t.album?.name || t.title || '',
        cover: t.artwork?.url_100x100?.replace('100x100', '480x480') || '',
        cover_small: t.artwork?.url_100x100 || '',
        cover_medium: t.artwork?.url_480x480 || t.artwork?.url_100x100 || '',
        cover_big: t.artwork?.url_100x100?.replace('100x100', '1000x1000') || '',
        cover_xl: t.artwork?.url_100x100?.replace('100x100', '2000x2000') || '',
      },
      duration: t.duration || 0,
      preview: `${AUDIUS}/v1/tracks/${t.id}/stream`,
      source: 'audius',
    }));
  } catch { return []; }
}

// ─── Deezer (best-effort) ────────────────────────────────────────
async function searchDeezer(query: string): Promise<Track[]> {
  try {
    const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=15`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((t: any, i: number): Track => ({
      id: 1000 + i,
      title: t.title,
      artist: { id: t.artist?.id || i, name: t.artist?.name || 'Unknown' },
      album: {
        id: t.album?.id || i, title: t.album?.title || '',
        cover: t.album?.cover || '', cover_small: t.album?.cover_small || '',
        cover_medium: t.album?.cover_medium || '', cover_big: t.album?.cover_big || '',
        cover_xl: t.album?.cover_xl || '',
      },
      duration: t.duration || 0,
      preview: t.preview || '',
      source: 'deezer',
    }));
  } catch { return []; }
}

// ─── Ranking ─────────────────────────────────────────────────────
function rankTracks(tracks: Track[]): Track[] {
  const songMin = 30; // skip <30s shorts
  const songMax = 1200; // skip >20min playlists
  return tracks
    .filter(t => t.duration >= songMin && t.duration <= songMax)
    .sort((a, b) => {
      const aScore = (a.duration >= 120 && a.duration <= 600 ? 10 : 5) + (a.youtubeId ? 20 : (a.source === 'audius' ? 10 : 0));
      const bScore = (b.duration >= 120 && b.duration <= 600 ? 10 : 5) + (b.youtubeId ? 20 : (b.source === 'audius' ? 10 : 0));
      return bScore - aScore;
    });
}

// ─── Unified Search ─────────────────────────────────────────────
export async function searchMusic(query: string): Promise<Track[]> {
  if (!query.trim()) return [];
  const [yt, au, dz] = await Promise.all([
    searchYT(query).catch(() => [] as Track[]),
    searchAudius(query).catch(() => [] as Track[]),
    searchDeezer(query).catch(() => [] as Track[]),
  ]);

  const seen = new Set<string>();
  const all: Track[] = [];

  for (const t of rankTracks([...yt, ...au, ...dz])) {
    const key = (t.title + t.artist.name).toLowerCase().replace(/\s+/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    all.push(t);
  }

  return all;
}

// ─── YouTube search for non-YouTube tracks ───────────────────────
export async function findOnYouTube(title: string, artist: string): Promise<string | null> {
  const q = `${artist} - ${title}`;
  try {
    const tracks = await searchYT(q);
    return tracks[0]?.youtubeId || null;
  } catch { return null; }
}

// ─── Trending ────────────────────────────────────────────────────
export async function getTrending(): Promise<Track[]> {
  const [yt, au] = await Promise.all([
    searchYT('new music 2025').catch(() => [] as Track[]),
    getAudiusTrending().catch(() => [] as Track[]),
  ]);
  return rankTracks([...yt, ...au]).slice(0, 30);
}

// ─── Recommendations ─────────────────────────────────────────────
export async function getRecommendations(recentlyPlayed: Track[]): Promise<Track[]> {
  if (!recentlyPlayed.length) return getTrending();

  const played = recentlyPlayed.slice(0, 5);
  const artists = [...new Set(played.map(t => t.artist.name))].filter(Boolean);
  const titles = played.map(t => t.title.split(/[\(\[-]/)[0].trim()).filter(Boolean);

  const queries: string[] = [];
  if (artists.length) queries.push(artists.slice(0, 2).join(' '));
  if (titles.length) queries.push(titles[0]);
  queries.push('popular music');

  for (let i = 0; i < queries.length; i++) {
    try {
      const tracks = await searchMusic(queries[i]);
      const filtered = tracks.filter(t =>
        !recentlyPlayed.some(r => r.id === t.id) &&
        t.duration >= 30 && t.duration <= 1200
      );
      if (filtered.length >= 6) return filtered.slice(0, 10);
    } catch {}
  }

  return getTrending();
}

export const GENRES = [
  { id: 1, name: 'Pop' }, { id: 2, name: 'Rock' }, { id: 3, name: 'Hip-Hop' },
  { id: 4, name: 'Electronic' }, { id: 5, name: 'Jazz' }, { id: 6, name: 'Classical' },
  { id: 7, name: 'R&B' }, { id: 8, name: 'Reggae' }, { id: 9, name: 'Country' },
  { id: 10, name: 'Metal' }, { id: 11, name: 'Folk' }, { id: 12, name: 'Ambient' },
];
