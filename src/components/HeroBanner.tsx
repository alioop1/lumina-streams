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
    <div className="relative w-full h-[70vh] overflow-hidden" dir={dir} style={{ contain: 'layout style paint' }}>
      <img
        src={movie.backdrop || movie.poster}
        alt={movie.title}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ contentVisibility: 'auto' }}
      />
      <div className="absolute inset-0 gradient-fade-bottom" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background" />

      <div className="absolute bottom-0 start-0 end-0 p-8 space-y-4">
        <h1 className="font-display text-6xl text-foreground text-glow">
          {displayTitle}
        </h1>
        <p className="text-sm text-secondary-foreground max-w-lg line-clamp-2">
          {movie.overview}
        </p>

        {/* Hero buttons row */}
        <div data-nav-row="hero-actions" className="flex items-center gap-3">
          <button
            onClick={handlePlay}
            className="tv-focus flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-3 rounded-lg glow-red outline-none"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{t('play')}</span>
          </button>
          <button
            onClick={() => onInfoClick(movie)}
            className="tv-focus flex items-center gap-2 glass px-8 py-3 rounded-lg text-foreground outline-none"
          >
            <Info className="w-5 h-5" />
            <span>{t('details')}</span>
          </button>
          <button
            onClick={handleAddToList}
            className="tv-focus glass w-12 h-12 rounded-full flex items-center justify-center text-foreground outline-none"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
