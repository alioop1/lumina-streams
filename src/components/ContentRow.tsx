import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { Movie } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';

interface ContentRowProps {
  title: string;
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  isLoading?: boolean;
}

export const ContentRow = ({ title, movies, onMovieClick, isLoading }: ContentRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { dir } = useLanguage();
  const isRTL = dir === 'rtl';

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const absScroll = Math.abs(scrollLeft);
    setCanScrollLeft(absScroll > 10);
    setCanScrollRight(absScroll + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
  }, [movies]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    const scrollDir = isRTL
      ? (direction === 'left' ? amount : -amount)
      : (direction === 'left' ? -amount : amount);
    scrollRef.current.scrollBy({ left: scrollDir, behavior: 'smooth' });
    setTimeout(checkScroll, 400);
  };

  // D-pad navigation within row
  const handleCardKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    const nextKey = isRTL ? 'ArrowLeft' : 'ArrowRight';
    const prevKey = isRTL ? 'ArrowRight' : 'ArrowLeft';

    switch (e.key) {
      case nextKey:
        e.preventDefault();
        e.stopPropagation();
        if (index < movies.length - 1) {
          cardRefs.current[index + 1]?.focus();
          cardRefs.current[index + 1]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
        break;
      case prevKey:
        e.preventDefault();
        e.stopPropagation();
        if (index > 0) {
          cardRefs.current[index - 1]?.focus();
          cardRefs.current[index - 1]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onMovieClick(movies[index]);
        break;
    }
  }, [isRTL, movies, onMovieClick]);

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="font-display text-2xl tracking-wide px-4 mb-3 text-foreground">{title}</h2>
        <div className="flex gap-3 px-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[140px] md:w-[180px]">
              <div className="rounded-lg aspect-[2/3] mb-2 bg-muted animate-pulse" />
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
      <h2 className="font-display text-2xl tracking-wide px-4 mb-3 text-foreground">
        {title}
      </h2>
      <div className="relative group">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute start-0 top-0 bottom-0 z-10 w-10 glass hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity tv-focus"
          >
            {isRTL ? <ChevronRight className="w-5 h-5 text-foreground" /> : <ChevronLeft className="w-5 h-5 text-foreground" />}
          </button>
        )}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3 overflow-x-auto px-4 snap-x snap-mandatory"
        >
          {movies.map((movie, i) => (
            <div
              key={`${movie.id}-${i}`}
              ref={el => { cardRefs.current[i] = el as any; }}
              tabIndex={0}
              onKeyDown={e => handleCardKeyDown(e, i)}
              className="tv-focus flex-shrink-0 rounded-lg"
            >
              <MovieCard
                movie={movie}
                onClick={() => onMovieClick(movie)}
                index={i}
              />
            </div>
          ))}
        </div>
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute end-0 top-0 bottom-0 z-10 w-10 glass hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity tv-focus"
          >
            {isRTL ? <ChevronLeft className="w-5 h-5 text-foreground" /> : <ChevronRight className="w-5 h-5 text-foreground" />}
          </button>
        )}
      </div>
    </div>
  );
};
