import { useState, useCallback, lazy, Suspense, memo } from 'react';
import { HeroBanner } from '@/components/HeroBanner';
import { ContentRow } from '@/components/ContentRow';
import { Movie } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTrending, usePopular, useTopRated, useDiscover } from '@/hooks/useTMDB';
import { Loader2 } from 'lucide-react';

const MovieDetails = lazy(() => import('@/components/MovieDetailsLazy'));

interface CategoryPageProps {
  mediaType: 'movie' | 'tv';
  genreId?: string;
  titleEn: string;
  titleHe: string;
}

const CategoryPage = memo(({ mediaType, genreId, titleEn, titleHe }: CategoryPageProps) => {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const { lang } = useLanguage();

  const { data: trending, isLoading: trendingLoading } = useTrending(mediaType, 'week');
  const { data: popular, isLoading: popularLoading } = usePopular(mediaType);
  const { data: topRated } = useTopRated(mediaType);
  const { data: discover1 } = useDiscover(mediaType, genreId);

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

  const title = lang === 'he' ? titleHe : titleEn;

  return (
    <div className="min-h-screen bg-background pb-20 3xl:pb-28 page-enter">
      <HeroBanner movies={trending || []} onInfoClick={handleMovieClick} />

      <div className="mt-2 3xl:mt-4 space-y-0">
        <ContentRow
          rowId={`${mediaType}-trending`}
          title={lang === 'he' ? `פופולרי עכשיו 🔥` : `Trending ${title} 🔥`}
          movies={trending || []}
          onMovieClick={handleMovieClick}
          isLoading={trendingLoading}
        />
        <ContentRow
          rowId={`${mediaType}-popular`}
          title={lang === 'he' ? `${titleHe} חדשים` : `New ${title}`}
          movies={popular || []}
          onMovieClick={handleMovieClick}
          isLoading={popularLoading}
        />
        <ContentRow
          rowId={`${mediaType}-top`}
          title={lang === 'he' ? 'הכי מדורגים' : 'Top Rated'}
          movies={topRated || []}
          onMovieClick={handleMovieClick}
        />
        {discover1 && discover1.length > 0 && (
          <ContentRow
            rowId={`${mediaType}-discover`}
            title={lang === 'he' ? 'מומלצים' : 'Recommended'}
            movies={discover1}
            onMovieClick={handleMovieClick}
          />
        )}
      </div>
    </div>
  );
});

CategoryPage.displayName = 'CategoryPage';
export default CategoryPage;
