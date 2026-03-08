import { useState, useEffect } from 'react';
import { Play, Plus, Info } from 'lucide-react';
import { Movie } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';

interface HeroBannerProps {
  movies: Movie[];
  onInfoClick: (movie: Movie) => void;
}

export const HeroBanner = ({ movies, onInfoClick }: HeroBannerProps) => {
  const heroMovies = movies.filter(m => m.backdrop).slice(0, 5);
  const [current, setCurrent] = useState(0);
  const movie = heroMovies[current];
  const { t, lang } = useLanguage();

  useEffect(() => {
    if (heroMovies.length === 0) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % heroMovies.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [heroMovies.length]);

  if (!movie) return <div className="w-full h-[70vh] bg-background" />;

  const displayTitle = lang === 'he' ? (movie.titleHe || movie.title) : movie.title;

  return (
    <div className="relative w-full h-[70vh] md:h-[80vh]" dir={dir}>
      <img
        src={movie.backdrop || movie.poster}
        alt={movie.title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 gradient-fade-bottom" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background" />

      <div className="absolute bottom-0 start-0 end-0 p-6 md:p-12 space-y-4">
        <h1 className="font-display text-5xl md:text-7xl text-foreground text-glow animate-fade-in">
          {displayTitle}
        </h1>
        <p className="text-sm md:text-base text-secondary-foreground max-w-lg line-clamp-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
          {movie.overview}
        </p>
        <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg transition-all glow-red tv-focus" tabIndex={0}>
            <Play className="w-5 h-5 fill-current" />
            <span>{t('play')}</span>
          </button>
          <button
            onClick={() => onInfoClick(movie)}
            className="flex items-center gap-2 glass hover:bg-accent px-6 py-3 rounded-lg transition-all text-foreground tv-focus"
            tabIndex={0}
          >
            <Info className="w-5 h-5" />
            <span>{t('details')}</span>
          </button>
          <button className="glass hover:bg-accent w-12 h-12 rounded-full flex items-center justify-center transition-all text-foreground tv-focus" tabIndex={0}>
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 pt-2">
          {heroMovies.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              tabIndex={0}
              className={`h-1 rounded-full transition-all duration-300 tv-focus ${
                i === current ? 'w-8 bg-primary' : 'w-4 bg-muted-foreground/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
