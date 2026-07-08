const FREESOUND_API = 'https://freesound.org/apiv2';
const FS_KEY = typeof process !== 'undefined' ? process.env.FREESOUND_API_KEY || '' : '';

interface FSSound {
  id: number;
  name: string;
  username: string;
  duration: number;
  previews: { 'preview-hq-mp3': string };
  license: string;
  url: string;
}

const fsCache = new Map<string, { results: FSSound[]; expires: number }>();

function getFSCache(query: string): FSSound[] | null {
  const entry = fsCache.get(query.toLowerCase());
  if (entry && entry.expires > Date.now()) return entry.results;
  fsCache.delete(query.toLowerCase());
  return null;
}

function setFSCache(query: string, results: FSSound[]) {
  fsCache.set(query.toLowerCase(), { results, expires: Date.now() + 3600000 });
}

export async function searchFreesound(query: string, limit = 5): Promise<FSSound[]> {
  if (!FS_KEY) return [];

  const cached = getFSCache(query);
  if (cached) return cached.slice(0, limit);

  try {
    const res = await fetch(
      `${FREESOUND_API}/search/text/?query=${encodeURIComponent(query)}&fields=id,name,username,duration,previews,license,url&page_size=${limit}`,
      {
        signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Token ${FS_KEY}` },
      },
    );
    if (!res.ok) return [];
    const json = await res.json();
    const results = (json.results || []) as FSSound[];
    setFSCache(query, results);
    return results;
  } catch {
    return [];
  }
}

export function hasFreesoundKey(): boolean {
  return FS_KEY.length > 0;
}

export function getSetupMessage(): string {
  return 'To enable audio playback, get a free API key from https://freesound.org/apiv2/apply/ and add FREESOUND_API_KEY=your_key to .env.local';
}
