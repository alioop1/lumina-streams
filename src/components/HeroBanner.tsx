import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Plus, Check, Info, ChevronLeft, ChevronRight, Star } from 'lucide-react';
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

  // Preload next image
  useEffect(() => {
    if (heroMovies.length <= 1) return;
    const nextMovie = heroMovies[(current + 1) % heroMovies.length];
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
    <div className="relative w-full h-[70vh] 3xl:h-[75vh] 4k:h-[80vh] overflow-hidden" dir={dir}>
      {/* Background image — full cover */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 will-change-[opacity] ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
      >
        <img
          src={movie.backdrop || movie.poster}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-transparent" style={{ width: '60%' }} />

      {/* Navigation arrows */}
      {heroMovies.length > 1 && (
        <>
          <button
            onClick={isRTL ? goNext : goPrev}
            className="absolute start-4 3xl:start-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 3xl:w-12 3xl:h-12 rounded-full bg-background/40 backdrop-blur flex items-center justify-center text-foreground opacity-0 hover:opacity-100 focus-visible:opacity-100 transition-opacity tv-focus"
            aria-label="Previous"
          >
            {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          <button
            onClick={isRTL ? goPrev : goNext}
            className="absolute end-4 3xl:end-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 3xl:w-12 3xl:h-12 rounded-full bg-background/40 backdrop-blur flex items-center justify-center text-foreground opacity-0 hover:opacity-100 focus-visible:opacity-100 transition-opacity tv-focus"
            aria-label="Next"
          >
            {isRTL ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </>
      )}

      {/* Content overlay */}
      <div className={`absolute bottom-0 start-0 end-0 p-8 3xl:p-12 4k:p-16 space-y-3 3xl:space-y-5 transition-opacity duration-300 will-change-[opacity] ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <h1 className="font-display text-5xl 3xl:text-6xl 4k:text-7xl tv:text-8xl text-foreground drop-shadow-lg">
          {displayTitle}
        </h1>

        {/* Metadata badges */}
        <div className="flex items-center gap-2 3xl:gap-3 flex-wrap">
          {movie.year && (
            <span className="px-2.5 py-1 3xl:px-3 3xl:py-1.5 rounded-md bg-foreground/10 backdrop-blur-sm text-xs 3xl:text-sm font-medium text-foreground/80 uppercase tracking-wider">
              {movie.year}
            </span>
          )}
          {movie.rating > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 3xl:px-3 3xl:py-1.5 rounded-md bg-foreground/10 backdrop-blur-sm text-xs 3xl:text-sm font-medium text-foreground/80">
              <Star className="w-3 h-3 3xl:w-3.5 3xl:h-3.5 text-primary fill-primary" />
              {movie.rating.toFixed(1)}
            </span>
          )}
          {movie.genres?.[0] && (
            <span className="px-2.5 py-1 3xl:px-3 3xl:py-1.5 rounded-md bg-foreground/10 backdrop-blur-sm text-xs 3xl:text-sm font-medium text-foreground/80 uppercase tracking-wider">
              {movie.genres[0]}
            </span>
          )}
          {movie.duration && (
            <span className="px-2.5 py-1 3xl:px-3 3xl:py-1.5 rounded-md bg-foreground/10 backdrop-blur-sm text-xs 3xl:text-sm font-medium text-foreground/80 uppercase tracking-wider">
              {movie.duration}
            </span>
          )}
          {movie.quality && (
            <span className="px-2.5 py-1 3xl:px-3 3xl:py-1.5 rounded-md bg-primary/20 backdrop-blur-sm text-xs 3xl:text-sm font-bold text-primary uppercase tracking-wider">
              {movie.quality}
            </span>
          )}
        </div>

        {/* Full overview — no line-clamp */}
        <p className="text-sm 3xl:text-base 4k:text-lg text-foreground/70 max-w-xl 3xl:max-w-2xl 4k:max-w-3xl leading-relaxed">
          {movie.overview}
        </p>

        {/* Action buttons */}
        <div data-nav-row="hero-actions" className="flex items-center gap-3 3xl:gap-4">
          <button
            onClick={handlePlay}
            className="tv-focus flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-3 3xl:px-10 3xl:py-4 rounded-lg glow-red outline-none 3xl:text-lg"
          >
            <Play className="w-5 h-5 3xl:w-6 3xl:h-6 fill-current" />
            <span>{t('play')}</span>
          </button>
          <button
            onClick={() => onInfoClick(movie)}
            className="tv-focus flex items-center gap-2 glass px-8 py-3 3xl:px-10 3xl:py-4 rounded-lg text-foreground outline-none 3xl:text-lg"
          >
            <Info className="w-5 h-5 3xl:w-6 3xl:h-6" />
            <span>{t('details')}</span>
          </button>
          <button
            onClick={handleAddToList}
            className={`tv-focus glass w-12 h-12 3xl:w-14 3xl:h-14 rounded-full flex items-center justify-center outline-none transition-colors ${
              inWatchlist ? 'text-primary bg-primary/20' : 'text-foreground'
            }`}
          >
            {inWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>

        {/* Slide indicators */}
        {heroMovies.length > 1 && (
          <div className="flex items-center gap-2 pt-1">
            {heroMovies.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`rounded-full transition-all duration-300 tv-focus outline-none ${
                  idx === current
                    ? 'w-8 3xl:w-10 h-2 bg-primary'
                    : 'w-2 h-2 bg-foreground/30 hover:bg-foreground/50'
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
