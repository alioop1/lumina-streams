import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { Movie } from '@/lib/mockData';

interface ContentRowProps {
  title: string;
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  isLoading?: boolean;
}

export const ContentRow = ({ title, movies, onMovieClick, isLoading }: ContentRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
  }, [movies]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
    setTimeout(checkScroll, 400);
  };

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
            className="absolute left-0 top-0 bottom-0 z-10 w-10 glass hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
        )}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3 overflow-x-auto px-4 snap-x snap-mandatory"
        >
          {movies.map((movie, i) => (
            <MovieCard
              key={`${movie.id}-${i}`}
              movie={movie}
              onClick={() => onMovieClick(movie)}
              index={i}
            />
          ))}
        </div>
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-10 w-10 glass hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        )}
      </div>
    </div>
  );
};
