import { Star } from 'lucide-react';
import { Movie } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';

interface MovieCardProps {
  movie: Movie;
  onClick?: () => void;
  index: number;
}

export const MovieCard = ({ movie, onClick, index }: MovieCardProps) => {
  const { lang } = useLanguage();
  const displayTitle = lang === 'he' ? (movie.titleHe || movie.title) : movie.title;
  const posterSrc = movie.poster;

  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 w-[140px] md:w-[180px] snap-start group/card"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative rounded-lg overflow-hidden aspect-[2/3] mb-2 transition-transform duration-300 group-hover/card:scale-105 group-focus-within/card:scale-105 group-focus-within/card:ring-2 group-focus-within/card:ring-primary">
        {posterSrc ? (
          <img
            src={posterSrc}
            alt={movie.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground text-xs">No Image</span>
          </div>
        )}
        {movie.quality && (
          <div className="absolute top-2 end-2 glass-strong rounded px-1.5 py-0.5">
            <span className="text-[10px] font-semibold text-foreground tracking-wide">
              {movie.quality}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-primary fill-primary" />
            <span className="text-xs font-medium text-foreground">{movie.rating}</span>
          </div>
        </div>
      </div>
      <h3 className="text-sm font-medium text-foreground truncate text-start">
        {displayTitle}
      </h3>
      <p className="text-xs text-muted-foreground text-start">
        {movie.year}{movie.genres?.[0] ? ` · ${movie.genres[0]}` : ''}
      </p>
    </div>
  );
};
