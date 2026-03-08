import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroBanner } from '@/components/HeroBanner';
import { ContentRow } from '@/components/ContentRow';
import { MovieDetails } from '@/components/MovieDetails';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Movie } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrending, usePopular, useTopRated } from '@/hooks/useTMDB';

const Index = () => {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const { t } = useLanguage();

  const { data: trending, isLoading: trendingLoading } = useTrending('all', 'week');
  const { data: popular, isLoading: popularLoading } = usePopular('movie');
  const { data: topRated } = useTopRated('movie');
  const { data: popularTV } = usePopular('tv');
  const { data: topRatedTV } = useTopRated('tv');

  if (selectedMovie) {
    return (
      <MovieDetails
        movie={selectedMovie}
        onBack={() => setSelectedMovie(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <LanguageToggle className="fixed top-4 start-4 z-50" />
      <HeroBanner movies={trending || []} onInfoClick={setSelectedMovie} />

      <div className="mt-6 space-y-2">
        <ContentRow
          title={t('trendingNow')}
          movies={trending || []}
          onMovieClick={setSelectedMovie}
          isLoading={trendingLoading}
        />
        <ContentRow
          title={t('newOnSite')}
          movies={popular || []}
          onMovieClick={setSelectedMovie}
          isLoading={popularLoading}
        />
        <ContentRow
          title={t('topRated')}
          movies={topRated || []}
          onMovieClick={setSelectedMovie}
        />
        <ContentRow
          title={t('topSeries')}
          movies={popularTV || []}
          onMovieClick={setSelectedMovie}
        />
        <ContentRow
          title={t('actionThriller')}
          movies={topRatedTV || []}
          onMovieClick={setSelectedMovie}
        />
      </div>
    </div>
  );
};

export default Index;
