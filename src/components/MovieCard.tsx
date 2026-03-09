import { memo } from 'react';
import { Star, Play } from 'lucide-react';
import { Movie } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';

interface MovieCardProps {
  movie: Movie;
  index: number;
}

export const MovieCard = memo(({ movie, index }: MovieCardProps) => {
  const { lang } = useLanguage();
  const displayTitle = lang === 'he' ? (movie.titleHe || movie.title) : movie.title;

  return (
    <div
      className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[200px] 3xl:w-[260px] 4k:w-[320px] tv:w-[400px] snap-start cursor-pointer text-start bg-transparent border-none p-0 outline-none"
      data-card-index={index}
    >
      {/* Feature: Full border frame on poster — no clipping */}
      <div className="relative rounded-xl 4k:rounded-2xl aspect-[2/3] mb-2 3xl:mb-3 movie-card-poster bg-transparent overflow-hidden ring-1 ring-border/20">
        {movie.poster ? (
          <img
            src={movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-xs 3xl:text-sm 4k:text-base">No Image</span>
          </div>
        )}
        {movie.quality && (
          <div className="absolute top-2 end-2 3xl:top-3 3xl:end-3 bg-primary/90 backdrop-blur-sm rounded px-1.5 py-0.5 3xl:px-2 3xl:py-1 z-10">
            <span className="text-[10px] 3xl:text-xs 4k:text-sm font-bold text-primary-foreground tracking-wide">{movie.quality}</span>
          </div>
        )}
        {/* Hover/focus overlay */}
        <div className="movie-card-overlay absolute inset-0 bg-gradient-to-t from-background/75 via-transparent to-transparent opacity-0 transition-opacity duration-150 pointer-events-none flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 3xl:w-14 3xl:h-14 4k:w-16 4k:h-16 rounded-full bg-primary/90 flex items-center justify-center">
            <Play className="w-4 h-4 3xl:w-6 3xl:h-6 4k:w-7 4k:h-7 text-primary-foreground fill-primary-foreground ms-0.5" />
          </div>
          <div className="absolute bottom-2 start-2 3xl:bottom-3 3xl:start-3 flex items-center gap-1">
            <Star className="w-3 h-3 3xl:w-4 3xl:h-4 text-primary fill-primary" />
            <span className="text-xs 3xl:text-sm font-semibold text-foreground">{movie.rating}</span>
          </div>
        </div>
      </div>
      <h3 className="text-sm 3xl:text-base 4k:text-lg tv:text-xl font-medium text-foreground truncate">{displayTitle}</h3>
      <p className="text-xs 3xl:text-sm 4k:text-base text-muted-foreground">
        {movie.year}{movie.genres?.[0] ? ` · ${movie.genres[0]}` : ''}
      </p>
    </div>
  );
});

MovieCard.displayName = 'MovieCard';