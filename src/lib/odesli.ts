const ODESLI_API = 'https://api.song.link/v1-alpha.1/links';

export interface OdesliLinks {
  linksByPlatform: Record<string, { url: string; entityUniqueId: string }>;
  entityUniqueId: string;
  pageUrl: string;
}

export async function getSongLinks(url: string): Promise<OdesliLinks | null> {
  try {
    const res = await fetch(`/api/proxy?url=${encodeURIComponent(`${ODESLI_API}?url=${encodeURIComponent(url)}&userCountry=US`)}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const PLATFORM_NAMES: Record<string, string> = {
  spotify: 'Spotify',
  youtube: 'YouTube',
  appleMusic: 'Apple Music',
  deezer: 'Deezer',
  soundcloud: 'SoundCloud',
  tidal: 'Tidal',
  amazonMusic: 'Amazon Music',
  pandora: 'Pandora',
  yandex: 'Yandex Music',
  anghami: 'Anghami',
};
