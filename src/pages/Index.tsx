import { useState, useCallback, lazy, Suspense } from 'react';
import { HeroBanner } from '@/components/HeroBanner';
import { ContentRow } from '@/components/ContentRow';
import { Movie } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrending, usePopular, useTopRated } from '@/hooks/useTMDB';
import { Loader2 } from 'lucide-react';

const MovieDetails = lazy(() => import('@/components/MovieDetailsLazy'));

const Index = () => {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const { t } = useLanguage();

  const { data: trending, isLoading: trendingLoading } = useTrending('all', 'week');
  const { data: popular, isLoading: popularLoading } = usePopular('movie');
  const { data: topRated } = useTopRated('movie');
  const { data: popularTV } = usePopular('tv');
  const { data: topRatedTV } = useTopRated('tv');

  const handleMovieClick = useCallback((movie: Movie) => setSelectedMovie(movie), []);
  const handleBack = useCallback(() => setSelectedMovie(null), []);

  if (selectedMovie) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }>
        <MovieDetails movie={selectedMovie} onBack={handleBack} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <HeroBanner movies={trending || []} onInfoClick={handleMovieClick} />

      <div className="mt-6 space-y-2">
        <ContentRow
          title={t('trendingNow')}
          movies={trending || []}
          onMovieClick={handleMovieClick}
          isLoading={trendingLoading}
        />
        <ContentRow
          title={t('newOnSite')}
          movies={popular || []}
          onMovieClick={handleMovieClick}
          isLoading={popularLoading}
        />
        <ContentRow
          title={t('topRated')}
          movies={topRated || []}
          onMovieClick={handleMovieClick}
        />
        <ContentRow
          title={t('topSeries')}
          movies={popularTV || []}
          onMovieClick={handleMovieClick}
        />
        <ContentRow
          title={t('actionThriller')}
          movies={topRatedTV || []}
          onMovieClick={handleMovieClick}
        />
      </div>
    </div>
  );
};

export default Index;
