import { useRef, memo } from 'react';
import { MovieCard } from './MovieCard';
import { Movie } from '@/lib/mockData';

interface ContentRowProps {
  title: string;
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  isLoading?: boolean;
  rowId: string;
}

export const ContentRow = memo(({ title, movies, onMovieClick, isLoading, rowId }: ContentRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="mb-8 3xl:mb-12 4k:mb-16">
      <h2 className="font-display text-2xl 3xl:text-3xl 4k:text-4xl tracking-wide px-6 3xl:px-10 4k:px-14 mb-3 3xl:mb-5 text-foreground">{title}</h2>
      <div
        data-nav-row={rowId}
        ref={scrollRef}
        className="flex gap-4 3xl:gap-6 4k:gap-8 overflow-x-auto px-6 3xl:px-10 4k:px-14 pt-3 pb-2"
        style={{ contain: 'layout' }}
      >
        {movies.map((movie, i) => (
          <button
            key={`${movie.id}-${i}`}
            onClick={() => onMovieClick(movie)}
            className="tv-focus flex-shrink-0 rounded-xl 4k:rounded-2xl text-start focus-card outline-none"
          >
            <MovieCard movie={movie} index={i} />
          </button>
        ))}
      </div>
    </div>
  );
});

ContentRow.displayName = 'ContentRow';
