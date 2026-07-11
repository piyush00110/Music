import type { Track } from './types';

const AUDIUS = 'https://discoveryprovider.audius.co';

function trackFromItem(v: any, i: number): Track {
  const base = {
    id: v.id || i,
    title: v.title || '',
    artist: { id: v.artistId || i, name: v.artistName || v.artist || 'Unknown' },
    album: { id: i, title: '', cover: '', cover_small: '', cover_medium: '', cover_big: '', cover_xl: '' },
    duration: v.duration || 0,
    preview: '',
    source: (v.source || 'youtube') as Track['source'],
  };

  if (v.source === 'youtube') {
    const vid = v.videoId || v.stream || '';
    const thumb = v.cover || (vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : '');
    base.album.title = v.channel || 'YouTube';
    base.album.cover_medium = thumb;
    base.album.cover = thumb;
    base.album.cover_small = thumb;
    base.preview = v.stream || vid || '';
    return { ...base, youtubeId: vid };
  }

  if (v.source === 'audius') {
    const cover = v.cover || '';
    base.album.title = v.title || '';
    base.album.cover = cover;
    base.album.cover_small = cover;
    base.album.cover_medium = cover;
    base.preview = `${AUDIUS}/v1/tracks/${v.stream}/stream`;
    return base;
  }

  if (v.source === 'deezer') {
    const cover = v.cover || '';
    base.album.title = '';
    base.album.cover = cover;
    base.album.cover_small = cover;
    base.album.cover_medium = cover;
    base.preview = v.stream || '';
    return base;
  }

  return base;
}

// ─── Unified Search (server-side) ──────────────────────────────
export async function searchMusic(query: string): Promise<Track[]> {
  if (!query.trim()) return [];

  const url = `/api/search?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return [];
    const data = await res.json();
    const seen = new Set<string>();
    const all: Track[] = [];
    for (const v of (data.items || [])) {
      const track = trackFromItem(v, all.length + 1);
      // Better dedup: normalize title and artist for comparison
      const normalTitle = track.title.toLowerCase().replace(/[\s\-_.,!?'"()[\]{}:;/\\|@#$%^&*+=~`]/g, '').replace(/official.*|video.*|audio.*|lyric.*|hd.*|4k.*/gi, '');
      const normalArtist = track.artist.name.toLowerCase().replace(/[\s\-_.,!?'"()[\]{}:;/\\|@#$%^&*+=~`]/g, '');
      const key = `${normalTitle}|||${normalArtist}`;
      if (seen.has(key)) continue;
      // Also skip if title is very different length (likely wrong match)
      if (normalTitle.length < 3) continue;
      seen.add(key);
      all.push(track);
    }
    return all;
  } catch {
    return [];
  }
}

// ─── Trending ───────────────────────────────────────────────────
export async function getTrending(): Promise<Track[]> {
  const all: Track[] = [];
  try {
    const res = await fetch(`${AUDIUS}/v1/tracks/trending?limit=25`, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      for (const t of (data.data || []).slice(0, 25)) {
        const i = all.length + 1;
        const cover = t.artwork?.url_480x480 || t.artwork?.url_1000x1000 || t.artwork?.url_150x150 || '';
        all.push({
          id: 5000 + i,
          title: t.title || '',
          artist: { id: t.user?.id || i, name: t.user?.name || 'Unknown' },
          album: { id: i, title: t.title || '', cover, cover_small: cover || '', cover_medium: cover || '', cover_big: '', cover_xl: '' },
          duration: t.duration || 0,
          preview: `${AUDIUS}/v1/tracks/${t.id}/stream`,
          source: 'audius',
        });
      }
    }
  } catch {}

  const queries = ['popular music 2026', 'top hits 2026', 'trending songs', 'viral songs', 'new songs 2026'];
  const ytResults = await Promise.all(
    queries.map(q => fetch(`/api/search?q=${encodeURIComponent(q)}&mode=yt-only`, { signal: AbortSignal.timeout(8000) })
      .then(r => r.ok ? r.json() : { items: [] })
      .catch(() => ({ items: [] }))),
  );
  for (const data of ytResults) {
    for (const v of (data.items || [])) {
      if (all.length >= 40) break;
      const track = trackFromItem(v, all.length + 1);
      if (!all.some(a => a.youtubeId && a.youtubeId === track.youtubeId)) all.push(track);
    }
  }

  return all.slice(0, 40);
}

// ─── Recommendations ────────────────────────────────────────────
export async function getRecommendations(recentlyPlayed: Track[]): Promise<Track[]> {
  if (!recentlyPlayed.length) return getTrending();
  const played = recentlyPlayed.slice(0, 5);
  const artists = [...new Set(played.map(t => t.artist.name))].filter(Boolean);
  const titles = played.map(t => t.title.split(/[\(\[-]/)[0].trim()).filter(Boolean);

  const queries: string[] = [];
  if (artists.length) queries.push(artists.slice(0, 2).join(' '));
  if (titles.length) queries.push(titles[0]);
  queries.push('popular music');

  for (const q of queries) {
    try {
      const tracks = await searchMusic(q);
      const filtered = tracks.filter(t => !recentlyPlayed.some(r => r.id === t.id));
      if (filtered.length >= 6) return filtered.slice(0, 10);
    } catch {}
  }
  return getTrending();
}

// ─── YouTube search for non-YouTube tracks ───────────────────────
export async function findOnYouTube(title: string, artist: string): Promise<string | null> {
  // Try multiple search strategies for best match
  const cleanTitle = title.replace(/\(.*?\)|\[.*?\]| Official.*| HD.*| 4K.*/gi, '').trim();
  const cleanArtist = artist.replace(/Official.*|Topic|VEVO/gi, '').trim();
  
  // Strategy 1: "artist - title" (most accurate for music)
  const tracks1 = await searchMusic(`${cleanArtist} - ${cleanTitle}`);
  const match1 = tracks1.find(t => t.source === 'youtube' && t.youtubeId);
  if (match1?.youtubeId) return match1.youtubeId;

  // Strategy 2: Just the title (if artist search fails)
  const tracks2 = await searchMusic(cleanTitle);
  const match2 = tracks2.find(t => t.source === 'youtube' && t.youtubeId);
  if (match2?.youtubeId) return match2.youtubeId;

  // Strategy 3: "title official audio"
  const tracks3 = await searchMusic(`${cleanTitle} official audio`);
  const match3 = tracks3.find(t => t.source === 'youtube' && t.youtubeId);
  if (match3?.youtubeId) return match3.youtubeId;

  return null;
}

export const GENRES = [
  { id: 1, name: 'Pop' }, { id: 2, name: 'Rock' }, { id: 3, name: 'Hip-Hop' },
  { id: 4, name: 'Electronic' }, { id: 5, name: 'Jazz' }, { id: 6, name: 'Classical' },
  { id: 7, name: 'R&B' }, { id: 8, name: 'Reggae' }, { id: 9, name: 'Country' },
  { id: 10, name: 'Metal' }, { id: 11, name: 'Folk' }, { id: 12, name: 'Ambient' },
];
