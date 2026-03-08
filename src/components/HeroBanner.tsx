import { useState, useEffect } from 'react';
import { Play, Plus, Info } from 'lucide-react';
import { Movie, MOCK_MOVIES } from '@/lib/mockData';
import { getImage } from '@/lib/images';

interface HeroBannerProps {
  onInfoClick: (movie: Movie) => void;
}

export const HeroBanner = ({ onInfoClick }: HeroBannerProps) => {
  const heroMovies = MOCK_MOVIES.filter(m => m.backdrop);
  const [current, setCurrent] = useState(0);
  const movie = heroMovies[current];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % heroMovies.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [heroMovies.length]);

  if (!movie) return null;

  return (
    <div className="relative w-full h-[70vh] md:h-[80vh]">
      {/* Backdrop image */}
      <img
        src={getImage(movie.backdrop!)}
        alt={movie.title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Gradient overlays */}
      <div className="absolute inset-0 gradient-fade-bottom" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 space-y-4">
        <h1 className="font-display text-5xl md:text-7xl text-foreground text-glow animate-fade-in">
          {movie.title}
        </h1>
        <p className="text-sm md:text-base text-secondary-foreground max-w-lg line-clamp-2 animate-fade-in" style={{ animationDelay: '100ms' }}>
          {movie.overview}
        </p>
        <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg transition-all glow-red">
            <Play className="w-5 h-5 fill-current" />
            <span>הפעל</span>
          </button>
          <button
            onClick={() => onInfoClick(movie)}
            className="flex items-center gap-2 glass hover:bg-accent px-6 py-3 rounded-lg transition-all text-foreground"
          >
            <Info className="w-5 h-5" />
            <span>פרטים</span>
          </button>
          <button className="glass hover:bg-accent w-12 h-12 rounded-full flex items-center justify-center transition-all text-foreground">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Dots indicator */}
        <div className="flex gap-2 pt-2">
          {heroMovies.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1 rounded-full transition-all duration-300 ${
                i === current ? 'w-8 bg-primary' : 'w-4 bg-muted-foreground/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
