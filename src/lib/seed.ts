import { getDb } from './db';

interface SeedTrack {
  title: string;
  artist: string;
  album: string;
  duration: number;
  audio_url: string;
  genre: string;
  cover_url?: string;
  year?: number;
  bpm?: number;
}

const ROYALTY_FREE_TRACKS: SeedTrack[] = [
  { title: 'Midnight Jazz', artist: 'Nicolas Folmer', album: 'Midnight Jazz', duration: 320, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', genre: 'Jazz', cover_url: '', year: 2020 },
  { title: 'Summer Vibes', artist: 'Tropical House', album: 'Beach Days', duration: 245, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', genre: 'Electronic', cover_url: '', year: 2023 },
  { title: 'LoFi Study', artist: 'Chill LoFi', album: 'Study Beats', duration: 180, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', genre: 'Electronic', cover_url: '', year: 2024 },
  { title: 'Classical Piano', artist: 'Mozart Ensemble', album: 'Piano Masterpieces', duration: 420, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', genre: 'Classical', cover_url: '', year: 2020 },
  { title: 'Electronic Dance', artist: 'SynthWave', album: 'Night Drive', duration: 280, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', genre: 'Electronic', cover_url: '', year: 2023 },
  { title: 'Acoustic Covers', artist: 'Folk Stories', album: 'Campfire Sessions', duration: 300, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', genre: 'Folk', cover_url: '', year: 2022 },
  { title: 'World Music', artist: 'Global Rhythms', album: 'Wanderlust', duration: 350, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', genre: 'World', cover_url: '', year: 2023 },
  { title: 'Ambient', artist: 'Space Drone', album: 'Deep Relaxation', duration: 600, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', genre: 'Ambient', cover_url: '', year: 2024 },
  { title: 'Smooth Saxophone', artist: 'Late Night Jazz', album: 'Midnight Sessions', duration: 275, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', genre: 'Jazz', cover_url: '', year: 2022 },
  { title: 'Hip Hop Beat', artist: 'Urban Flow', album: 'Street Poetry', duration: 210, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', genre: 'Hip-Hop', cover_url: '', year: 2023 },
  { title: 'Rock Anthem', artist: 'Electric Souls', album: 'Revolution', duration: 265, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', genre: 'Rock', cover_url: '', year: 2022 },
  { title: 'Blues Guitar', artist: 'Delta Kings', album: 'Mississippi Nights', duration: 340, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', genre: 'Blues', cover_url: '', year: 2021 },
  { title: 'Reggae Sunshine', artist: 'Island Breeze', album: 'Tropical Days', duration: 290, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3', genre: 'Reggae', cover_url: '', year: 2023 },
  { title: 'R&B Slow Jam', artist: 'Silk Voice', album: 'Midnight Love', duration: 310, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3', genre: 'R&B', cover_url: '', year: 2024 },
  { title: 'Metal Thunder', artist: 'Iron Storm', album: 'Warrior Path', duration: 360, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3', genre: 'Metal', cover_url: '', year: 2022 },
  { title: 'Folk Ballad', artist: 'Mountain Echo', album: 'Valley Songs', duration: 285, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3', genre: 'Folk', cover_url: '', year: 2023 },
  { title: 'Soul Groove', artist: 'Funky Brothers', album: 'Get Down', duration: 255, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3', genre: 'Soul', cover_url: '', year: 2024 },
  { title: 'Country Road', artist: 'Nashville Stars', album: 'Open Fields', duration: 230, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-18.mp3', genre: 'Country', cover_url: '', year: 2022 },
  { title: 'Latin Heat', artist: 'Salsa Fuego', album: 'Fiesta', duration: 295, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-19.mp3', genre: 'Latin', cover_url: '', year: 2023 },
  { title: 'Indie Dream', artist: 'Cloud Chaser', album: 'Daydream', duration: 240, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-20.mp3', genre: 'Indie', cover_url: '', year: 2024 },
  { title: 'Piano Sunset', artist: 'Ivory Keys', album: 'Golden Hour', duration: 310, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', genre: 'Classical', cover_url: '', year: 2023 },
  { title: 'Deep House', artist: 'Neon Bass', album: 'Underground', duration: 265, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', genre: 'Electronic', cover_url: '', year: 2024 },
  { title: 'Jazz Fusion', artist: 'The Improvisors', album: 'Live at Blue Note', duration: 480, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', genre: 'Jazz', cover_url: '', year: 2022 },
  { title: 'Techno Beat', artist: 'Berlin Pulse', album: 'Club Night', duration: 340, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', genre: 'Electronic', cover_url: '', year: 2024 },
  { title: 'Trap Queen', artist: '808 Mafia', album: 'Beat Tape Vol.1', duration: 200, audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', genre: 'Hip-Hop', cover_url: '', year: 2023 },
];

export function seedDatabase() {
  const db = getDb();

  const existingCount = db.prepare('SELECT COUNT(*) as c FROM tracks').get() as { c: number };
  if (existingCount.c > 0) {
    console.log(`Database already has ${existingCount.c} tracks, skipping seed`);
    return;
  }

  const insertArtist = db.prepare('INSERT OR IGNORE INTO artists (name) VALUES (?)');
  const insertAlbum = db.prepare('INSERT OR IGNORE INTO albums (title, artist_id, cover_url, year) VALUES (?, ?, ?, ?)');
  const insertTrack = db.prepare('INSERT INTO tracks (title, artist_id, album_id, duration, audio_url, genre) VALUES (?, ?, ?, ?, ?, ?)');
  const getArtist = db.prepare('SELECT id FROM artists WHERE name = ?');
  const getAlbum = db.prepare('SELECT id FROM albums WHERE title = ? AND artist_id = ?');

  const transaction = db.transaction(() => {
    for (const t of ROYALTY_FREE_TRACKS) {
      insertArtist.run(t.artist);
      const artist = getArtist.get(t.artist) as { id: number };

      insertAlbum.run(t.album, artist.id, t.cover_url || '', t.year || 0);
      const album = getAlbum.get(t.album, artist.id) as { id: number };

      insertTrack.run(t.title, artist.id, album.id, t.duration, t.audio_url, t.genre);
    }
  });

  transaction();
  console.log(`Seeded ${ROYALTY_FREE_TRACKS.length} tracks`);
}

if (require.main === module) {
  seedDatabase();
  console.log('Seed complete');
}
