import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { Movie } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsTVDevice } from '@/hooks/use-tv';

interface ContentRowProps {
  title: string;
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  isLoading?: boolean;
}

export const ContentRow = memo(({ title, movies, onMovieClick, isLoading }: ContentRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { dir } = useLanguage();
  const isTVDevice = useIsTVDevice();
  const isRTL = dir === 'rtl';

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const absScroll = Math.abs(scrollLeft);
    setCanScrollLeft(absScroll > 10);
    setCanScrollRight(absScroll + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => { checkScroll(); }, [movies, checkScroll]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    const scrollDir = isRTL
      ? (direction === 'left' ? amount : -amount)
      : (direction === 'left' ? -amount : amount);
    scrollRef.current.scrollBy({ left: scrollDir, behavior: isTVDevice ? 'auto' : 'smooth' });
    setTimeout(checkScroll, isTVDevice ? 160 : 400);
  }, [isRTL, isTVDevice, checkScroll]);

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="font-display text-2xl tracking-wide px-4 mb-3 text-foreground">{title}</h2>
        <div className="flex gap-3 px-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[140px] md:w-[180px]">
              <div className="rounded-xl aspect-[2/3] mb-2 bg-muted animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse mb-1" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!movies.length) return null;

  return (
    <div className="mb-8">
      <h2 className="font-display text-2xl tracking-wide px-4 mb-3 text-foreground">{title}</h2>
      <div className="relative group">
        {!isTVDevice && canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute start-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-background/80 to-transparent hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll left"
          >
            {isRTL ? <ChevronRight className="w-6 h-6 text-foreground" /> : <ChevronLeft className="w-6 h-6 text-foreground" />}
          </button>
        )}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3 overflow-x-auto px-4 snap-x snap-mandatory"
        >
          {movies.map((movie, i) => (
            <button
              key={`${movie.id}-${i}`}
              tabIndex={0}
              onClick={() => onMovieClick(movie)}
              className="tv-focus flex-shrink-0 rounded-xl text-start focus-card outline-none"
            >
              <MovieCard movie={movie} index={i} />
            </button>
          ))}
        </div>
        {!isTVDevice && canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute end-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-background/80 to-transparent hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Scroll right"
          >
            {isRTL ? <ChevronLeft className="w-6 h-6 text-foreground" /> : <ChevronRight className="w-6 h-6 text-foreground" />}
          </button>
        )}
      </div>
    </div>
  );
});

ContentRow.displayName = 'ContentRow';
