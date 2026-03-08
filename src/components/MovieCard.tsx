import { Star } from 'lucide-react';
import { Movie } from '@/lib/mockData';
import { getImage } from '@/lib/images';

interface MovieCardProps {
  movie: Movie;
  onClick: () => void;
  index: number;
}

export const MovieCard = ({ movie, onClick, index }: MovieCardProps) => {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[140px] md:w-[180px] snap-start group/card focus:outline-none"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative rounded-lg overflow-hidden aspect-[2/3] mb-2 transition-transform duration-300 group-hover/card:scale-105 group-focus/card:scale-105 group-focus/card:ring-2 group-focus/card:ring-primary">
        <img
          src={getImage(movie.poster)}
          alt={movie.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Quality badge */}
        {movie.quality && (
          <div className="absolute top-2 right-2 glass-strong rounded px-1.5 py-0.5">
            <span className="text-[10px] font-semibold text-foreground tracking-wide">
              {movie.quality}
            </span>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-end p-3">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 text-primary fill-primary" />
            <span className="text-xs font-medium text-foreground">{movie.rating}</span>
          </div>
        </div>
      </div>
      <h3 className="text-sm font-medium text-foreground truncate text-right" dir="rtl">
        {movie.titleHe || movie.title}
      </h3>
      <p className="text-xs text-muted-foreground">
        {movie.year} · {movie.genres[0]}
      </p>
    </button>
  );
};
