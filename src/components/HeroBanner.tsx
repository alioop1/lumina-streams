import { useState, useEffect, useCallback } from 'react';
import { Play, Plus, Info } from 'lucide-react';
import { Movie } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface HeroBannerProps {
  movies: Movie[];
  onInfoClick: (movie: Movie) => void;
}

export const HeroBanner = ({ movies, onInfoClick }: HeroBannerProps) => {
  const heroMovies = movies.filter(m => m.backdrop).slice(0, 5);
  const [current, setCurrent] = useState(0);
  const movie = heroMovies[current];
  const { t, lang, dir } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    if (heroMovies.length === 0) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % heroMovies.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [heroMovies.length]);

  const handlePlay = useCallback(() => {
    if (movie) onInfoClick(movie);
  }, [movie, onInfoClick]);

  const handleAddToList = useCallback(() => {
    if (movie) {
      toast({
        title: lang === 'he' ? '✓ נוסף לרשימה' : '✓ Added to list',
        description: lang === 'he' ? (movie.titleHe || movie.title) : movie.title,
      });
    }
  }, [movie, lang, toast]);

  if (!movie) return <div className="w-full h-[70vh] bg-background" />;

  const displayTitle = lang === 'he' ? (movie.titleHe || movie.title) : movie.title;

  return (
    <div className="relative w-full h-[70vh] 3xl:h-[75vh] 4k:h-[80vh] overflow-hidden" dir={dir} style={{ contain: 'layout style paint' }}>
      <img
        src={movie.backdrop || movie.poster}
        alt={movie.title}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ contentVisibility: 'auto' }}
      />
      <div className="absolute inset-0 gradient-fade-bottom" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background" />

      <div className="absolute bottom-0 start-0 end-0 p-8 3xl:p-12 4k:p-16 space-y-4 3xl:space-y-6">
        <h1 className="font-display text-6xl 3xl:text-7xl 4k:text-8xl tv:text-9xl text-foreground text-glow">
          {displayTitle}
        </h1>
        <p className="text-sm 3xl:text-lg 4k:text-xl text-secondary-foreground max-w-lg 3xl:max-w-2xl 4k:max-w-3xl line-clamp-2">
          {movie.overview}
        </p>

        {/* Hero buttons row */}
        <div data-nav-row="hero-actions" className="flex items-center gap-3 3xl:gap-4 4k:gap-5">
          <button
            onClick={handlePlay}
            className="tv-focus flex items-center gap-2 3xl:gap-3 bg-primary text-primary-foreground font-semibold px-8 py-3 3xl:px-10 3xl:py-4 4k:px-12 4k:py-5 rounded-lg 3xl:rounded-xl glow-red outline-none 3xl:text-lg 4k:text-xl"
          >
            <Play className="w-5 h-5 3xl:w-6 3xl:h-6 4k:w-7 4k:h-7 fill-current" />
            <span>{t('play')}</span>
          </button>
          <button
            onClick={() => onInfoClick(movie)}
            className="tv-focus flex items-center gap-2 3xl:gap-3 glass px-8 py-3 3xl:px-10 3xl:py-4 4k:px-12 4k:py-5 rounded-lg 3xl:rounded-xl text-foreground outline-none 3xl:text-lg 4k:text-xl"
          >
            <Info className="w-5 h-5 3xl:w-6 3xl:h-6 4k:w-7 4k:h-7" />
            <span>{t('details')}</span>
          </button>
          <button
            onClick={handleAddToList}
            className="tv-focus glass w-12 h-12 3xl:w-14 3xl:h-14 4k:w-16 4k:h-16 rounded-full flex items-center justify-center text-foreground outline-none"
          >
            <Plus className="w-5 h-5 3xl:w-6 3xl:h-6 4k:w-7 4k:h-7" />
          </button>
        </div>
      </div>
    </div>
  );
};
