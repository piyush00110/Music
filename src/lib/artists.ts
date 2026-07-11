export interface Artist {
  id: number;
  name: string;
  image: string;
  genre: string;
  followers: string;
  popularSongs: string[];
}

export interface Playlist {
  id: number;
  title: string;
  description: string;
  cover: string;
  songs: number;
  gradient: string;
}

export const TOP_ARTISTS: Artist[] = [
  {
    id: 1,
    name: 'Arijit Singh',
    image: 'https://i.scdn.co/image/ab6761610000e5ebe6a440c76e75f462c5f89dca',
    genre: 'Bollywood',
    followers: '48.2M',
    popularSongs: ['Tum Hi Ho', 'Channa Mereya', 'Agar Tum Saath Ho'],
  },
  {
    id: 2,
    name: 'Atif Aslam',
    image: 'https://i.scdn.co/image/ab6761610000e5eb8b3d7b0b4c57e4b3e5c5b5a5',
    genre: 'Pop',
    followers: '32.1M',
    popularSongs: ['Dil Diyan Gallan', 'Tajdar-e-Haram', 'Woh Lamhe'],
  },
  {
    id: 3,
    name: 'Badshah',
    image: 'https://i.scdn.co/image/ab6761610000e5eba4b87d5b1b5b1b5b1b5b1b5b',
    genre: 'Hip-Hop',
    followers: '28.5M',
    popularSongs: ['Garmi', 'Saturday Saturday', 'Abhi Toh Party Shuru Hui Hai'],
  },
  {
    id: 4,
    name: 'Pritam',
    image: 'https://i.scdn.co/image/ab6761610000e5eb15f4c6a2e3f2e3f2e3f2e3f2',
    genre: 'Bollywood',
    followers: '25.8M',
    popularSongs: ['Tum Mile', 'Channa Mereya', 'Gerua'],
  },
  {
    id: 5,
    name: 'Millind Gaba',
    image: 'https://i.scdn.co/image/ab6761610000e5ebd9f3e3e3e3e3e3e3e3e3e3e3',
    genre: 'Pop',
    followers: '18.3M',
    popularSongs: ['Main Shair Badnaam', 'Nazar Na Lag Ja', 'Yaar Mod Do'],
  },
  {
    id: 6,
    name: 'AP Dhillon',
    image: 'https://i.scdn.co/image/ab6761610000e5ebf5f5f5f5f5f5f5f5f5f5f5f5',
    genre: 'Punjabi',
    followers: '22.1M',
    popularSongs: ['Brown Munde', 'Excuses', 'Insane'],
  },
  {
    id: 7,
    name: 'Arijit Singh',
    image: 'https://i.scdn.co/image/ab6761610000e5ebe6a440c76e75f462c5f89dca',
    genre: 'Bollywood',
    followers: '48.2M',
    popularSongs: ['Tum Hi Ho', 'Channa Mereya', 'Agar Tum Saath Ho'],
  },
  {
    id: 8,
    name: 'Shreya Ghoshal',
    image: 'https://i.scdn.co/image/ab6761610000e5ebc4e0e3e3e3e3e3e3e3e3e3e3',
    genre: 'Bollywood',
    followers: '35.6M',
    popularSongs: ['Sun Raha Hai', 'Manwa Laage', 'Deewani Mastani'],
  },
];

export const FEATURED_PLAYLISTS: Playlist[] = [
  {
    id: 1,
    title: 'Bollywood Butter',
    description: 'Smooth Hindi hits for every mood',
    cover: 'https://i.scdn.co/image/ab67706f00000002ca4a5f27e7f1f2e3e3e3e3e3',
    songs: 50,
    gradient: 'from-purple-600/40 to-pink-500/40',
  },
  {
    id: 2,
    title: 'Punjabi Party',
    description: 'High energy Punjabi bangers',
    cover: 'https://i.scdn.co/image/ab67706f00000002ca4a5f27e7f1f2e3e3e3e3e3',
    songs: 45,
    gradient: 'from-orange-600/40 to-red-500/40',
  },
  {
    id: 3,
    title: 'Romantic Hindi',
    description: 'Love songs that touch the soul',
    cover: 'https://i.scdn.co/image/ab67706f00000002ca4a5f27e7f1f2e3e3e3e3e3',
    songs: 60,
    gradient: 'from-rose-600/40 to-red-400/40',
  },
  {
    id: 4,
    title: 'Workout Bollywood',
    description: 'High tempo tracks for your gym session',
    cover: 'https://i.scdn.co/image/ab67706f00000002ca4a5f27e7f1f2e3e3e3e3e3',
    songs: 35,
    gradient: 'from-green-600/40 to-emerald-500/40',
  },
  {
    id: 5,
    title: 'Chill Vibes',
    description: 'Relax and unwind with mellow tunes',
    cover: 'https://i.scdn.co/image/ab67706f00000002ca4a5f27e7f1f2e3e3e3e3e3',
    songs: 40,
    gradient: 'from-blue-600/40 to-cyan-500/40',
  },
  {
    id: 6,
    title: '90s Nostalgia',
    description: 'Classic hits from the golden era',
    cover: 'https://i.scdn.co/image/ab67706f00000002ca4a5f27e7f1f2e3e3e3e3e3',
    songs: 55,
    gradient: 'from-amber-600/40 to-yellow-500/40',
  },
];

export const NEW_RELEASES = [
  { id: 1, title: 'Mann Mera', artist: 'Gajendra Verma', type: 'Single', cover: 'https://i.scdn.co/image/ab67616d0000b273ce6c3e4e3b0b1b5b1b5b1b5b' },
  { id: 2, title: 'Ishqa Ve', artist: 'Zeeshan Ali', type: 'Single', cover: 'https://i.scdn.co/image/ab67616d0000b273ce6c3e4e3b0b1b5b1b5b1b5b' },
  { id: 3, title: 'Majboor', artist: 'Sheheryar Rehan', type: 'Single', cover: 'https://i.scdn.co/image/ab67616d0000b273ce6c3e4e3b0b1b5b1b5b1b5b' },
  { id: 4, title: 'Dhurandhar', artist: 'Echo', type: 'Playlist', cover: 'https://i.scdn.co/image/ab67616d0000b273ce6c3e4e3b0b1b5b1b5b1b5b' },
  { id: 5, title: 'Deewaniyat', artist: 'Various Artists', type: 'Album', cover: 'https://i.scdn.co/image/ab67616d0000b273ce6c3e4e3b0b1b5b1b5b1b5b' },
  { id: 6, title: 'Tum Mile', artist: 'Pritam', type: 'Album', cover: 'https://i.scdn.co/image/ab67616d0000b273ce6c3e4e3b0b1b5b1b5b1b5b' },
];

export const MOOD_PLAYLISTS = [
  { id: 1, mood: 'Happy', icon: '😊', color: 'from-yellow-500/30 to-amber-500/30', query: 'happy bollywood songs' },
  { id: 2, mood: 'Sad', icon: '😢', color: 'from-blue-500/30 to-indigo-500/30', query: 'sad hindi songs' },
  { id: 3, mood: 'Energetic', icon: '🔥', color: 'from-red-500/30 to-orange-500/30', query: 'energetic punjabi songs' },
  { id: 4, mood: 'Romantic', icon: '❤️', color: 'from-pink-500/30 to-rose-500/30', query: 'romantic bollywood songs' },
  { id: 5, mood: 'Chill', icon: '😌', color: 'from-teal-500/30 to-cyan-500/30', query: 'chill lofi hindi' },
  { id: 6, mood: 'Party', icon: '🎉', color: 'from-purple-500/30 to-violet-500/30', query: 'party bollywood hits' },
];
