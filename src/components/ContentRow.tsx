import { useRef, memo, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { Movie } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';

interface ContentRowProps {
  title: string;
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  isLoading?: boolean;
  rowId: string;
}

export const ContentRow = memo(({ title, movies, onMovieClick, isLoading, rowId }: ContentRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(false);

  // Check scroll position for arrow indicators
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const absScroll = Math.abs(scrollLeft);
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollStart(absScroll > 10);
    setCanScrollEnd(absScroll < maxScroll - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, [movies]);

  const scroll = (direction: 'start' | 'end') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    const delta = direction === 'end' ? scrollAmount : -scrollAmount;
    el.scrollBy({ left: isRTL ? -delta : delta, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="mb-8 3xl:mb-12 4k:mb-16">
        <h2 className="font-display text-2xl 3xl:text-3xl 4k:text-4xl tracking-wide px-6 3xl:px-10 4k:px-14 mb-3 3xl:mb-5 text-foreground">{title}</h2>
        <div className="flex gap-4 3xl:gap-6 4k:gap-8 px-6 3xl:px-10 4k:px-14">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[200px] 3xl:w-[260px] 4k:w-[320px]">
              <div className="rounded-xl 4k:rounded-2xl aspect-[2/3] mb-2 bg-muted animate-pulse" />
              <div className="h-4 3xl:h-5 bg-muted rounded animate-pulse mb-1" />
              <div className="h-3 3xl:h-4 bg-muted rounded animate-pulse w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!movies.length) return null;

  const StartArrow = isRTL ? ChevronRight : ChevronLeft;
  const EndArrow = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="mb-8 3xl:mb-12 4k:mb-16 relative group/row">
      <h2 className="font-display text-2xl 3xl:text-3xl 4k:text-4xl tracking-wide px-6 3xl:px-10 4k:px-14 mb-3 3xl:mb-5 text-foreground">{title}</h2>
      
      {/* Scroll arrows — visible on hover/focus */}
      {canScrollStart && (
        <button
          onClick={() => scroll('start')}
          className="absolute start-0 top-1/2 z-20 w-10 h-10 3xl:w-12 3xl:h-12 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground opacity-0 group-hover/row:opacity-100 transition-opacity tv-focus"
          aria-label="Scroll back"
        >
          <StartArrow className="w-5 h-5 3xl:w-6 3xl:h-6" />
        </button>
      )}
      {canScrollEnd && (
        <button
          onClick={() => scroll('end')}
          className="absolute end-0 top-1/2 z-20 w-10 h-10 3xl:w-12 3xl:h-12 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground opacity-0 group-hover/row:opacity-100 transition-opacity tv-focus"
          aria-label="Scroll forward"
        >
          <EndArrow className="w-5 h-5 3xl:w-6 3xl:h-6" />
        </button>
      )}

      <div
        data-nav-row={rowId}
        ref={scrollRef}
        className="flex gap-4 3xl:gap-6 4k:gap-8 overflow-x-auto px-6 3xl:px-10 4k:px-14 pt-3 pb-4 snap-x snap-mandatory scroll-smooth"
        style={{ contain: 'layout', WebkitOverflowScrolling: 'touch' }}
      >
        {movies.map((movie, i) => (
          <button
            key={`${movie.id}-${i}`}
            onClick={() => onMovieClick(movie)}
            className="tv-focus flex-shrink-0 rounded-xl 4k:rounded-2xl text-start focus-card outline-none snap-start"
          >
            <MovieCard movie={movie} index={i} />
          </button>
        ))}
      </div>
    </div>
  );
});

ContentRow.displayName = 'ContentRow';
