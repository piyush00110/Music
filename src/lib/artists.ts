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
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Arijit_Singh.jpg/330px-Arijit_Singh.jpg',
    genre: 'Bollywood',
    followers: '48.2M',
    popularSongs: ['Tum Hi Ho', 'Channa Mereya', 'Agar Tum Saath Ho'],
  },
  {
    id: 2,
    name: 'Atif Aslam',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Atif_Aslam_%28cropped%29.jpg/440px-Atif_Aslam_%28cropped%29.jpg',
    genre: 'Pop',
    followers: '32.1M',
    popularSongs: ['Dil Diyan Gallan', 'Tajdar-e-Haram', 'Woh Lamhe'],
  },
  {
    id: 3,
    name: 'Badshah',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Badshah_spotted_before_the_shoot_of_No_Filter_Neha.jpg/440px-Badshah_spotted_before_the_shoot_of_No_Filter_Neha.jpg',
    genre: 'Hip-Hop',
    followers: '28.5M',
    popularSongs: ['Garmi', 'Saturday Saturday', 'Abhi Toh Party Shuru Hui Hai'],
  },
  {
    id: 4,
    name: 'Pritam',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Pritam_Chakraborty.jpg/440px-Pritam_Chakraborty.jpg',
    genre: 'Bollywood',
    followers: '25.8M',
    popularSongs: ['Tum Mile', 'Channa Mereya', 'Gerua'],
  },
  {
    id: 5,
    name: 'Millind Gaba',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Millind_Gaba_at_the_launch_of_%27Mere_Ghar_Mere_Log%27.jpg/440px-Millind_Gaba_at_the_launch_of_%27Mere_Ghar_Mere_Log%27.jpg',
    genre: 'Pop',
    followers: '18.3M',
    popularSongs: ['Main Shair Badnaam', 'Nazar Na Lag Ja', 'Yaar Mod Do'],
  },
  {
    id: 6,
    name: 'AP Dhillon',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/AP_Dhillon_CA.jpg/500px-AP_Dhillon_CA.jpg',
    genre: 'Punjabi',
    followers: '22.1M',
    popularSongs: ['Brown Munde', 'Excuses', 'Insane'],
  },
  {
    id: 7,
    name: 'Shreya Ghoshal',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Shreya_Ghoshal_at_the_62nd_Filmfare_Awards.jpg/440px-Shreya_Ghoshal_at_the_62nd_Filmfare_Awards.jpg',
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
    cover: '',
    songs: 50,
    gradient: 'from-purple-600/40 to-pink-500/40',
  },
  {
    id: 2,
    title: 'Punjabi Party',
    description: 'High energy Punjabi bangers',
    cover: '',
    songs: 45,
    gradient: 'from-orange-600/40 to-red-500/40',
  },
  {
    id: 3,
    title: 'Romantic Hindi',
    description: 'Love songs that touch the soul',
    cover: '',
    songs: 60,
    gradient: 'from-rose-600/40 to-red-400/40',
  },
  {
    id: 4,
    title: 'Workout Bollywood',
    description: 'High tempo tracks for your gym session',
    cover: '',
    songs: 35,
    gradient: 'from-green-600/40 to-emerald-500/40',
  },
  {
    id: 5,
    title: 'Chill Vibes',
    description: 'Relax and unwind with mellow tunes',
    cover: '',
    songs: 40,
    gradient: 'from-blue-600/40 to-cyan-500/40',
  },
  {
    id: 6,
    title: '90s Nostalgia',
    description: 'Classic hits from the golden era',
    cover: '',
    songs: 55,
    gradient: 'from-amber-600/40 to-yellow-500/40',
  },
];

export const NEW_RELEASES = [
  { id: 1, title: 'Mann Mera', artist: 'Gajendra Verma', type: 'Single', cover: '' },
  { id: 2, title: 'Ishqa Ve', artist: 'Zeeshan Ali', type: 'Single', cover: '' },
  { id: 3, title: 'Majboor', artist: 'Sheheryar Rehan', type: 'Single', cover: '' },
  { id: 4, title: 'Dhurandhar', artist: 'Echo', type: 'Playlist', cover: '' },
  { id: 5, title: 'Deewaniyat', artist: 'Various Artists', type: 'Album', cover: '' },
  { id: 6, title: 'Tum Mile', artist: 'Pritam', type: 'Album', cover: '' },
];

export const MOOD_PLAYLISTS = [
  { id: 1, mood: 'Happy', icon: '😊', color: 'from-yellow-500/30 to-amber-500/30', query: 'happy bollywood songs' },
  { id: 2, mood: 'Sad', icon: '😢', color: 'from-blue-500/30 to-indigo-500/30', query: 'sad hindi songs' },
  { id: 3, mood: 'Energetic', icon: '🔥', color: 'from-red-500/30 to-orange-500/30', query: 'energetic punjabi songs' },
  { id: 4, mood: 'Romantic', icon: '❤️', color: 'from-pink-500/30 to-rose-500/30', query: 'romantic bollywood songs' },
  { id: 5, mood: 'Chill', icon: '😌', color: 'from-teal-500/30 to-cyan-500/30', query: 'chill lofi hindi' },
  { id: 6, mood: 'Party', icon: '🎉', color: 'from-purple-500/30 to-violet-500/30', query: 'party bollywood hits' },
];
