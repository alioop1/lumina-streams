import { useState, lazy, Suspense } from 'react';
import { SearchPage } from '@/components/SearchPage';
import { Movie } from '@/lib/mockData';
import { Loader2 } from 'lucide-react';

const MovieDetails = lazy(() => import('@/components/MovieDetailsLazy'));

const SearchRoute = () => {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  if (selectedMovie) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 3xl:w-12 3xl:h-12 text-primary animate-spin" />
        </div>
      }>
        <MovieDetails movie={selectedMovie} onBack={() => setSelectedMovie(null)} />
      </Suspense>
    );
  }

  return <SearchPage onMovieClick={setSelectedMovie} />;
};

export default SearchRoute;
