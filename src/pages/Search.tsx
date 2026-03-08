import { useState } from 'react';
import { SearchPage } from '@/components/SearchPage';
import { MovieDetails } from '@/components/MovieDetails';
import { Movie } from '@/lib/mockData';

const SearchRoute = () => {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  if (selectedMovie) {
    return <MovieDetails movie={selectedMovie} onBack={() => setSelectedMovie(null)} />;
  }

  return <SearchPage onMovieClick={setSelectedMovie} />;
};

export default SearchRoute;
