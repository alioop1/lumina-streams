import { ArrowRight, Play, Star, Plus, Share2 } from 'lucide-react';
import { Movie } from '@/lib/mockData';
import { getImage } from '@/lib/images';

interface MovieDetailsProps {
  movie: Movie;
  onBack: () => void;
}

export const MovieDetails = ({ movie, onBack }: MovieDetailsProps) => {
  const backdrop = movie.backdrop ? getImage(movie.backdrop) : getImage(movie.poster);

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Backdrop */}
      <div className="relative h-[50vh]">
        <img
          src={backdrop}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <button
          onClick={onBack}
          className="absolute top-12 right-4 glass w-10 h-10 rounded-full flex items-center justify-center text-foreground"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 -mt-20 relative z-10 pb-24 space-y-6" dir="rtl">
        <div>
          <h1 className="font-display text-4xl text-foreground text-glow">
            {movie.titleHe || movie.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{movie.title}</p>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-foreground font-semibold">{movie.rating}</span>
          </span>
          <span>{movie.year}</span>
          <span>{movie.duration}</span>
          {movie.quality && (
            <span className="glass-strong px-2 py-0.5 rounded text-xs text-foreground font-medium">
              {movie.quality}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold glow-red transition-all hover:bg-primary/90">
            <Play className="w-5 h-5 fill-current" />
            הפעל עכשיו
          </button>
          <button className="glass w-14 h-14 rounded-xl flex items-center justify-center text-foreground hover:bg-accent transition-colors">
            <Plus className="w-6 h-6" />
          </button>
          <button className="glass w-14 h-14 rounded-xl flex items-center justify-center text-foreground hover:bg-accent transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {/* Genres */}
        <div className="flex gap-2 flex-wrap">
          {movie.genres.map(g => (
            <span key={g} className="glass px-3 py-1.5 rounded-full text-xs text-secondary-foreground">
              {g}
            </span>
          ))}
        </div>

        {/* Overview */}
        <div>
          <h3 className="font-semibold text-foreground mb-2">תקציר</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {movie.overview}
          </p>
        </div>

        {/* Season selector for series */}
        {movie.type === 'series' && (
          <div>
            <h3 className="font-semibold text-foreground mb-3">עונות</h3>
            <div className="flex gap-2">
              {[1, 2, 3].map(s => (
                <button
                  key={s}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    s === 1
                      ? 'bg-primary text-primary-foreground'
                      : 'glass text-muted-foreground hover:text-foreground'
                  }`}
                >
                  עונה {s}
                </button>
              ))}
            </div>
            {/* Episodes */}
            <div className="mt-4 space-y-3">
              {[1, 2, 3, 4, 5].map(ep => (
                <div key={ep} className="glass rounded-xl p-3 flex items-center gap-3">
                  <div className="w-24 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Play className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground">פרק {ep}</h4>
                    <p className="text-xs text-muted-foreground">45 דקות</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
