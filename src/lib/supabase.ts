import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let serverClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (serverClient) return serverClient;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local');
  }
  serverClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return serverClient;
}

export function getSupabaseAnon(): SupabaseClient | null {
  if (anonClient) return anonClient;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return anonClient;
}

export const SONGS_BUCKET = 'songs';

export async function ensureSongsBucket(): Promise<void> {
  const supabase = getSupabaseServer();
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === SONGS_BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(SONGS_BUCKET, {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: ['audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/flac'],
    });
  }
}

export function getSongStoragePath(title: string, youtubeId: string, ext: string = 'm4a'): string {
  const safe = title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
  return `${youtubeId}_${safe}.${ext}`;
}

export async function uploadSongToStorage(
  audioBuffer: ArrayBuffer,
  title: string,
  youtubeId: string,
  ext: string = 'm4a',
  mime: string = 'audio/mp4',
): Promise<{ path: string; publicUrl: string } | null> {
  try {
    const supabase = getSupabaseServer();
    await ensureSongsBucket();
    const path = getSongStoragePath(title, youtubeId, ext);
    const { error } = await supabase.storage
      .from(SONGS_BUCKET)
      .upload(path, audioBuffer, {
        contentType: mime,
        upsert: true,
      });
    if (error) {
      console.error('Upload error:', error.message);
      return null;
    }
    const { data } = supabase.storage.from(SONGS_BUCKET).getPublicUrl(path);
    return { path, publicUrl: data.publicUrl };
  } catch (err) {
    console.error('Storage upload failed:', err);
    return null;
  }
}

export async function getSongFromStorage(
  youtubeId: string,
  title: string,
): Promise<string | null> {
  try {
    const supabase = getSupabaseServer();
    const safe = title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
    const prefix = `${youtubeId}_${safe}`;
    const { data: files } = await supabase.storage.from(SONGS_BUCKET).list('', {
      search: prefix,
      limit: 1,
    });
    if (!files?.length) return null;
    const filePath = files[0].name;
    const { data } = supabase.storage.from(SONGS_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
  } catch {
    return null;
  }
}
