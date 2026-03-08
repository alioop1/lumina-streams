import hero1 from '@/assets/hero-1.jpg';
import hero2 from '@/assets/hero-2.jpg';
import movie1 from '@/assets/movie-1.jpg';
import movie2 from '@/assets/movie-2.jpg';
import movie3 from '@/assets/movie-3.jpg';
import movie4 from '@/assets/movie-4.jpg';
import movie5 from '@/assets/movie-5.jpg';
import movie6 from '@/assets/movie-6.jpg';

const imageMap: Record<string, string> = {
  'hero-1': hero1,
  'hero-2': hero2,
  'movie-1': movie1,
  'movie-2': movie2,
  'movie-3': movie3,
  'movie-4': movie4,
  'movie-5': movie5,
  'movie-6': movie6,
};

export const getImage = (key: string): string => imageMap[key] || '';
