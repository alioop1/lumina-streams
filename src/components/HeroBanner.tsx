import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Plus, Check, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useToast } from '@/hooks/use-toast';

interface HeroBannerProps {
  movies: Movie[];
  onInfoClick: (movie: Movie) => void;
}

export const HeroBanner = ({ movies, onInfoClick }: HeroBannerProps) => {
  const heroMovies = movies.filter(m => m.backdrop).slice(0, 5);
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const movie = heroMovies[current];
  const { t, lang, dir } = useLanguage();
  const { toast } = useToast();
  const watchlist = useWatchlist();
  const isRTL = dir === 'rtl';
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (heroMovies.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % heroMovies.length);
        setIsTransitioning(false);
      }, 300);
    }, 8000);
    return () => clearInterval(timerRef.current);
  }, [heroMovies.length]);

  useEffect(() => {
    if (heroMovies.length <= 1) return;
    const nextIdx = (current + 1) % heroMovies.length;
    const nextMovie = heroMovies[nextIdx];
    if (nextMovie?.backdrop || nextMovie?.poster) {
      const img = new Image();
      img.src = nextMovie.backdrop || nextMovie.poster;
    }
  }, [current, heroMovies]);

  const goTo = useCallback((idx: number) => {
    if (idx === current) return;
    clearInterval(timerRef.current);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent(idx);
      setIsTransitioning(false);
    }, 300);
  }, [current]);

  const goPrev = useCallback(() => {
    goTo((current - 1 + heroMovies.length) % heroMovies.length);
  }, [current, heroMovies.length, goTo]);

  const goNext = useCallback(() => {
    goTo((current + 1) % heroMovies.length);
  }, [current, heroMovies.length, goTo]);

  const handlePlay = useCallback(() => {
    if (movie) onInfoClick(movie);
  }, [movie, onInfoClick]);

  const handleAddToList = useCallback(() => {
    if (!movie) return;
    watchlist.toggle(movie);
    const inList = watchlist.isInList(movie.id);
    toast({
      title: inList
        ? (lang === 'he' ? '✗ הוסר מהרשימה' : '✗ Removed from list')
        : (lang === 'he' ? '✓ נוסף לרשימה' : '✓ Added to list'),
      description: lang === 'he' ? (movie.titleHe || movie.title) : movie.title,
    });
  }, [movie, lang, toast, watchlist]);

  if (!movie) return <div className="w-full h-[70vh] bg-background" />;

  const displayTitle = lang === 'he' ? (movie.titleHe || movie.title) : movie.title;
  const inWatchlist = watchlist.isInList(movie.id);

  return (
    <div className="relative w-full h-[70vh] 3xl:h-[75vh] 4k:h-[80vh] overflow-hidden" dir={dir} style={{ contain: 'layout style paint' }}>
      <div className={`absolute inset-0 transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <img
          src={movie.backdrop || movie.poster}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ contentVisibility: 'auto' }}
        />
      </div>
      <div className="absolute inset-0 gradient-fade-bottom" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background" />

      {heroMovies.length > 1 && (
        <>
          <button
            onClick={isRTL ? goNext : goPrev}
            className="absolute start-4 3xl:start-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 3xl:w-12 3xl:h-12 4k:w-14 4k:h-14 rounded-full bg-background/40 backdrop-blur flex items-center justify-center text-foreground opacity-0 hover:opacity-100 focus-visible:opacity-100 transition-opacity tv-focus"
            aria-label="Previous"
          >
            {isRTL ? <ChevronRight className="w-5 h-5 3xl:w-6 3xl:h-6" /> : <ChevronLeft className="w-5 h-5 3xl:w-6 3xl:h-6" />}
          </button>
          <button
            onClick={isRTL ? goPrev : goNext}
            className="absolute end-4 3xl:end-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 3xl:w-12 3xl:h-12 4k:w-14 4k:h-14 rounded-full bg-background/40 backdrop-blur flex items-center justify-center text-foreground opacity-0 hover:opacity-100 focus-visible:opacity-100 transition-opacity tv-focus"
            aria-label="Next"
          >
            {isRTL ? <ChevronLeft className="w-5 h-5 3xl:w-6 3xl:h-6" /> : <ChevronRight className="w-5 h-5 3xl:w-6 3xl:h-6" />}
          </button>
        </>
      )}

      <div className={`absolute bottom-0 start-0 end-0 p-8 3xl:p-12 4k:p-16 space-y-4 3xl:space-y-6 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <h1 className="font-display text-6xl 3xl:text-7xl 4k:text-8xl tv:text-9xl text-foreground text-glow">
          {displayTitle}
        </h1>
        <p className="text-sm 3xl:text-lg 4k:text-xl text-secondary-foreground max-w-lg 3xl:max-w-2xl 4k:max-w-3xl line-clamp-2">
          {movie.overview}
        </p>

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
            className={`tv-focus glass w-12 h-12 3xl:w-14 3xl:h-14 4k:w-16 4k:h-16 rounded-full flex items-center justify-center outline-none transition-colors ${
              inWatchlist ? 'text-primary bg-primary/20' : 'text-foreground'
            }`}
          >
            {inWatchlist ? (
              <Check className="w-5 h-5 3xl:w-6 3xl:h-6 4k:w-7 4k:h-7" />
            ) : (
              <Plus className="w-5 h-5 3xl:w-6 3xl:h-6 4k:w-7 4k:h-7" />
            )}
          </button>
        </div>

        {heroMovies.length > 1 && (
          <div className="flex items-center gap-2 3xl:gap-3 pt-2">
            {heroMovies.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`rounded-full transition-all duration-300 tv-focus outline-none ${
                  idx === current
                    ? 'w-8 3xl:w-10 h-2 3xl:h-2.5 bg-primary'
                    : 'w-2 3xl:w-2.5 h-2 3xl:h-2.5 bg-foreground/30 hover:bg-foreground/50'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
