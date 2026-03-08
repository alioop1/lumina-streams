import { memo } from 'react';
import { Star, Play } from 'lucide-react';
import { Movie } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

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
    <div
      onClick={onClick}
      className="flex-shrink-0 w-[140px] md:w-[180px] snap-start group/card cursor-pointer"
    >
      <div className="relative rounded-xl overflow-hidden aspect-[2/3] mb-2 movie-card-poster">
        {posterSrc ? (
          <img
            src={posterSrc}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110 group-focus-within/card:scale-110"
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

        {/* Hover overlay with play icon + rating */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/30 transform scale-75 group-hover/card:scale-100 transition-transform duration-300">
            <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ms-0.5" />
          </div>
          <div className="absolute bottom-3 start-3 flex items-center gap-1">
            <Star className="w-3 h-3 text-primary fill-primary" />
            <span className="text-xs font-semibold text-foreground">{movie.rating}</span>
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
});

MovieCard.displayName = 'MovieCard';
