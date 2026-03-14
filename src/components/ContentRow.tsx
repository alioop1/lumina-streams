import { useRef, memo, useEffect, useState, useCallback } from 'react';
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

// Safe area padding to prevent poster clipping near sidebar zone
const SAFE_AREA = 'ps-16 pe-6 3xl:ps-20 3xl:pe-8 4k:ps-24 4k:pe-10';

export const ContentRow = memo(({ title, movies, onMovieClick, isLoading, rowId }: ContentRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const absScroll = Math.abs(scrollLeft);
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollStart(absScroll > 10);
    setCanScrollEnd(absScroll < maxScroll - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, [movies, checkScroll]);

  const scroll = useCallback((direction: 'start' | 'end') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    const delta = direction === 'end' ? scrollAmount : -scrollAmount;
    el.scrollBy({ left: isRTL ? -delta : delta, behavior: 'smooth' });
  }, [isRTL]);

  if (isLoading) {
    return (
      <div className={`mb-6 3xl:mb-8 4k:mb-10 ${SAFE_AREA}`}>
        <h2 className="font-display text-xl 3xl:text-2xl 4k:text-3xl tracking-wide mb-3 text-foreground">{title}</h2>
        <div className="flex gap-3 3xl:gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[140px] 3xl:w-[170px] 4k:w-[190px]">
              <div className="rounded-lg aspect-[2/3] mb-2 bg-muted skeleton-pulse" />
              <div className="h-3.5 bg-muted rounded skeleton-pulse mb-1" />
              <div className="h-3 bg-muted rounded skeleton-pulse w-2/3" />
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
    <div className="mb-4 3xl:mb-6 4k:mb-8 relative group/row">
      <h2 className={`font-display text-xl 3xl:text-2xl 4k:text-3xl tracking-wide ${SAFE_AREA} mb-2 3xl:mb-3 text-foreground`}>{title}</h2>
      
      {canScrollStart && (
        <button
          onClick={() => scroll('start')}
          className="absolute start-2 top-1/2 z-20 w-9 h-9 3xl:w-11 3xl:h-11 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 transition-opacity tv-focus"
          aria-label="Scroll back"
        >
          <StartArrow className="w-4 h-4 3xl:w-5 3xl:h-5" />
        </button>
      )}
      {canScrollEnd && (
        <button
          onClick={() => scroll('end')}
          className="absolute end-2 top-1/2 z-20 w-9 h-9 3xl:w-11 3xl:h-11 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 transition-opacity tv-focus"
          aria-label="Scroll forward"
        >
          <EndArrow className="w-4 h-4 3xl:w-5 3xl:h-5" />
        </button>
      )}

      <div
        data-nav-row={rowId}
        ref={scrollRef}
        className={`flex gap-3 3xl:gap-4 overflow-x-auto ${SAFE_AREA} pt-1 pb-3 snap-x snap-mandatory scroll-smooth scrollbar-hide`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {movies.map((movie, i) => (
          <button
            key={`${movie.id}-${i}`}
            onClick={() => onMovieClick(movie)}
            className="tv-focus flex-shrink-0 rounded-lg text-start focus-card outline-none snap-start"
          >
            <MovieCard movie={movie} index={i} />
          </button>
        ))}
      </div>
    </div>
  );
});

ContentRow.displayName = 'ContentRow';
