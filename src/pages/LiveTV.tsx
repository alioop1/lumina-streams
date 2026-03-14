import { useState, useCallback, lazy, Suspense } from 'react';
import { ContentRow } from '@/components/ContentRow';
import { Movie } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePopular, useTopRated, useTrending } from '@/hooks/useTMDB';
import { Loader2, Radio, Tv } from 'lucide-react';

const MovieDetails = lazy(() => import('@/components/MovieDetailsLazy'));

const LiveTV = () => {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const { lang, dir } = useLanguage();

  const { data: trendingTV, isLoading } = useTrending('tv', 'day');
  const { data: popularTV } = usePopular('tv');
  const { data: topRatedTV } = useTopRated('tv');

  const handleMovieClick = useCallback((movie: Movie) => setSelectedMovie(movie), []);

  if (selectedMovie) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }>
        <MovieDetails movie={selectedMovie} onBack={() => setSelectedMovie(null)} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-12 3xl:pt-16 4k:pt-20 pb-24 3xl:pb-32 page-enter" dir={dir}>
      <div className="px-12 3xl:px-16 4k:px-20 mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 3xl:w-14 3xl:h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Radio className="w-6 h-6 3xl:w-7 3xl:h-7 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-4xl 3xl:text-5xl 4k:text-6xl text-foreground">
              {lang === 'he' ? 'טלוויזיה חיה' : 'Live TV'}
            </h1>
            <p className="text-sm 3xl:text-base text-muted-foreground mt-1">
              {lang === 'he' ? 'ערוצים פופולריים ושידורים חיים' : 'Popular channels and live broadcasts'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-0">
        <ContentRow
          rowId="live-trending"
          title={lang === 'he' ? 'פופולרי עכשיו' : 'Trending Now'}
          movies={trendingTV || []}
          onMovieClick={handleMovieClick}
          isLoading={isLoading}
        />
        <ContentRow
          rowId="live-popular"
          title={lang === 'he' ? 'הנצפים ביותר' : 'Most Watched'}
          movies={popularTV || []}
          onMovieClick={handleMovieClick}
        />
        <ContentRow
          rowId="live-top"
          title={lang === 'he' ? 'מומלצים' : 'Top Picks'}
          movies={topRatedTV || []}
          onMovieClick={handleMovieClick}
        />
      </div>
    </div>
  );
};

export default LiveTV;
