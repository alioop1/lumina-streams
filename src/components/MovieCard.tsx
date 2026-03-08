import { memo } from 'react';
import { Star, Play } from 'lucide-react';
import { Movie } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';

interface MovieCardProps {
  movie: Movie;
  onClick?: () => void;
  index: number;
}

export const MovieCard = memo(({ movie, onClick, index }: MovieCardProps) => {
  const { lang } = useLanguage();
  const displayTitle = lang === 'he' ? (movie.titleHe || movie.title) : movie.title;
  const posterSrc = movie.poster;

  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={0}
      className="focus-card flex-shrink-0 w-[140px] md:w-[180px] snap-start group/card cursor-pointer text-start bg-transparent border-none p-0 outline-none"
    >
      <div className="relative rounded-lg overflow-hidden aspect-[2/3] mb-2 movie-card-poster bg-card transition-all duration-200">
        {posterSrc ? (
          <img
            src={posterSrc}
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
        
        {/* Quality badge */}
        {movie.quality && (
          <div className="absolute top-2 end-2 bg-primary/90 backdrop-blur-sm rounded px-1.5 py-0.5 z-10">
            <span className="text-[10px] font-bold text-primary-foreground tracking-wide">
              {movie.quality}
            </span>
          </div>
        )}

        {/* Hover/focus overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 group-focus/card:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
            <Play className="w-4 h-4 text-primary-foreground fill-primary-foreground ms-0.5" />
          </div>
          <div className="absolute bottom-2 start-2 flex items-center gap-1">
            <Star className="w-3 h-3 text-primary fill-primary" />
            <span className="text-xs font-semibold text-foreground">{movie.rating}</span>
          </div>
        </div>
      </div>
      <h3 className="text-sm font-medium text-foreground truncate">
        {displayTitle}
      </h3>
      <p className="text-xs text-muted-foreground">
        {movie.year}{movie.genres?.[0] ? ` · ${movie.genres[0]}` : ''}
      </p>
    </button>
  );
});

MovieCard.displayName = 'MovieCard';
