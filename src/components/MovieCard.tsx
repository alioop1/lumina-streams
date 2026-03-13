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
      className="flex-shrink-0 w-[140px] 3xl:w-[170px] 4k:w-[190px] tv:w-[200px] snap-start cursor-pointer text-start bg-transparent border-none p-0 outline-none"
      data-card-index={index}
    >
      <div className="relative rounded-lg 3xl:rounded-xl aspect-[2/3] mb-1.5 movie-card-poster bg-card overflow-hidden ring-1 ring-border/10">
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
            <span className="text-muted-foreground text-xs">No Image</span>
          </div>
        )}
        {movie.quality && (
          <div className="absolute top-1.5 end-1.5 bg-primary/90 backdrop-blur-sm rounded px-1.5 py-0.5 z-10">
            <span className="text-[10px] 3xl:text-xs font-bold text-primary-foreground tracking-wide">{movie.quality}</span>
          </div>
        )}
        <div className="movie-card-overlay absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 transition-opacity duration-150 pointer-events-none flex flex-col items-center justify-center gap-2">
          <div className="w-9 h-9 3xl:w-11 3xl:h-11 rounded-full bg-primary/90 flex items-center justify-center">
            <Play className="w-4 h-4 3xl:w-5 3xl:h-5 text-primary-foreground fill-primary-foreground ms-0.5" />
          </div>
          <div className="absolute bottom-1.5 start-1.5 flex items-center gap-1">
            <Star className="w-3 h-3 text-primary fill-primary" />
            <span className="text-xs font-semibold text-foreground">{movie.rating?.toFixed(1)}</span>
          </div>
        </div>
      </div>
      <h3 className="text-xs 3xl:text-sm 4k:text-base font-medium text-foreground truncate">{displayTitle}</h3>
      <p className="text-[11px] 3xl:text-xs text-muted-foreground">
        {movie.year}{movie.genres?.[0] ? ` · ${movie.genres[0]}` : ''}
      </p>
    </div>
  );
});

MovieCard.displayName = 'MovieCard';
