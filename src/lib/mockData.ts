export interface Movie {
  id: string;
  title: string;
  titleHe?: string;
  year: number;
  rating: number;
  duration: string;
  genres: string[];
  overview: string;
  poster: string;
  backdrop?: string;
  quality?: string;
  type: 'movie' | 'series';
  tmdbId?: number;
  mediaType?: string;
}

export const MOCK_MOVIES: Movie[] = [
  {
    id: '1',
    title: 'Neon Shadows',
    titleHe: 'צללי ניאון',
    year: 2024,
    rating: 8.5,
    duration: '2h 15m',
    genres: ['Action', 'Sci-Fi'],
    overview: 'In a rain-soaked metropolis where technology and crime intertwine, a lone vigilante must navigate the dark underbelly of the city to uncover a conspiracy that threatens to destroy everything.',
    poster: 'movie-1',
    backdrop: 'hero-1',
    quality: '4K DV',
    type: 'movie',
  },
  {
    id: '2',
    title: 'The Whispering Woods',
    titleHe: 'היער הלוחש',
    year: 2024,
    rating: 7.8,
    duration: '1h 52m',
    genres: ['Horror', 'Thriller'],
    overview: 'A group of friends venture into an ancient forest where mysterious lights lead them deeper into its dark heart.',
    poster: 'movie-2',
    quality: '4K HDR',
    type: 'movie',
  },
  {
    id: '3',
    title: 'Sunset Promise',
    titleHe: 'הבטחת השקיעה',
    year: 2023,
    rating: 8.1,
    duration: '2h 05m',
    genres: ['Romance', 'Drama'],
    overview: 'Two strangers meet on a remote beach and discover that love can bloom in the most unexpected places.',
    poster: 'movie-3',
    quality: '1080p',
    type: 'movie',
  },
  {
    id: '4',
    title: 'Chrome City',
    titleHe: 'עיר הכרום',
    year: 2025,
    rating: 9.0,
    duration: '2h 30m',
    genres: ['Sci-Fi', 'Action'],
    overview: 'In a futuristic megacity, a rebel hacker discovers a digital weapon that could free humanity from corporate control.',
    poster: 'movie-4',
    backdrop: 'hero-2',
    quality: '4K DV Atmos',
    type: 'series',
  },
  {
    id: '5',
    title: 'Dragon\'s Keep',
    titleHe: 'מבצר הדרקון',
    year: 2024,
    rating: 8.7,
    duration: '2h 20m',
    genres: ['Fantasy', 'Adventure'],
    overview: 'An unlikely hero must tame the last dragon to save a kingdom from an ancient evil awakening beneath the mountains.',
    poster: 'movie-5',
    quality: '4K HDR',
    type: 'series',
  },
  {
    id: '6',
    title: 'Party Crashers',
    titleHe: 'מפריעי המסיבה',
    year: 2024,
    rating: 7.2,
    duration: '1h 45m',
    genres: ['Comedy'],
    overview: 'Three best friends decide to crash every VIP party in the city, but things spiral wildly out of control.',
    poster: 'movie-6',
    quality: '1080p',
    type: 'movie',
  },
];

export const GENRES = [
  'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi',
  'Romance', 'Thriller', 'Fantasy', 'Adventure', 'Animation',
  'Documentary', 'Crime', 'Mystery', 'Family', 'War',
];
