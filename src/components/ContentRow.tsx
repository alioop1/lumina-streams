import { useRef, memo } from 'react';
import { MovieCard } from './MovieCard';
import { Movie } from '@/lib/mockData';

interface ContentRowProps {
  title: string;
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  isLoading?: boolean;
  rowId: string; // Unique row identifier for navigation
}

export const ContentRow = memo(({ title, movies, onMovieClick, isLoading, rowId }: ContentRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="mb-8">
        <h2 className="font-display text-2xl tracking-wide px-6 mb-3 text-foreground">{title}</h2>
        <div className="flex gap-4 px-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[200px]">
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
      <h2 className="font-display text-2xl tracking-wide px-6 mb-3 text-foreground">{title}</h2>
      {/* data-nav-row marks this as a navigable row */}
      <div
        data-nav-row={rowId}
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto px-6"
      >
        {movies.map((movie, i) => (
          <button
            key={`${movie.id}-${i}`}
            onClick={() => onMovieClick(movie)}
            className="tv-focus flex-shrink-0 rounded-xl text-start focus-card outline-none"
          >
            <MovieCard movie={movie} index={i} />
          </button>
        ))}
      </div>
    </div>
  );
});

ContentRow.displayName = 'ContentRow';
