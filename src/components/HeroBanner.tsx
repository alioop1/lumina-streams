import { useState, useEffect, useCallback } from 'react';
import { Play, Plus, Info } from 'lucide-react';
import { Movie } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsTVDevice } from '@/hooks/use-tv';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroBannerProps {
  movies: Movie[];
  onInfoClick: (movie: Movie) => void;
}

export const HeroBanner = ({ movies, onInfoClick }: HeroBannerProps) => {
  const heroMovies = movies.filter(m => m.backdrop).slice(0, 5);
  const [current, setCurrent] = useState(0);
  const movie = heroMovies[current];
  const { t, lang, dir } = useLanguage();
  const isTVDevice = useIsTVDevice();
  const { toast } = useToast();

  useEffect(() => {
    if (heroMovies.length === 0) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % heroMovies.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [heroMovies.length]);


  const handlePlay = useCallback(() => {
    if (movie) {
      onInfoClick(movie);
    }
  }, [movie, onInfoClick]);

  const handleAddToList = useCallback(() => {
    if (movie) {
      const displayTitle = lang === 'he' ? (movie.titleHe || movie.title) : movie.title;
      toast({
        title: lang === 'he' ? '✓ נוסף לרשימה' : '✓ Added to list',
        description: displayTitle,
      });
    }
  }, [movie, lang, toast]);

  if (!movie) return <div className="w-full h-[70vh] bg-background" />;

  const displayTitle = lang === 'he' ? (movie.titleHe || movie.title) : movie.title;

  return (
    <div className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden" dir={dir}>
      <AnimatePresence mode="wait">
        <motion.img
          key={movie.id}
          src={movie.backdrop || movie.poster}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: isTVDevice ? 1 : 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: isTVDevice ? 0 : 0.8 }}
        />
      </AnimatePresence>
      <div className="absolute inset-0 gradient-fade-bottom" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background" />

      <div className="absolute bottom-0 start-0 end-0 p-6 md:p-12 space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={movie.id + '-text'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-5xl md:text-7xl text-foreground text-glow">
              {displayTitle}
            </h1>
            <p className="text-sm md:text-base text-secondary-foreground max-w-lg line-clamp-2 mt-2">
              {movie.overview}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePlay}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-3 rounded-lg transition-all glow-red tv-focus"
            tabIndex={0}
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{t('play')}</span>
          </button>
          <button
            onClick={() => onInfoClick(movie)}
            className="flex items-center gap-2 glass hover:bg-accent px-6 py-3 rounded-lg transition-all text-foreground tv-focus"
            tabIndex={0}
          >
            <Info className="w-5 h-5" />
            <span>{t('details')}</span>
          </motion.button>
          <button
            onClick={handleAddToList}
            className="glass hover:bg-accent w-12 h-12 rounded-full flex items-center justify-center transition-all text-foreground tv-focus"
            tabIndex={0}
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="flex gap-2 pt-2">
          {heroMovies.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              tabIndex={0}
              className={`h-1 rounded-full transition-all duration-500 tv-focus ${
                i === current ? 'w-8 bg-primary glow-red' : 'w-4 bg-muted-foreground/40 hover:bg-muted-foreground/60'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
