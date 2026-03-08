import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroBanner } from '@/components/HeroBanner';
import { ContentRow } from '@/components/ContentRow';
import { MovieDetails } from '@/components/MovieDetails';
import { MOCK_MOVIES, Movie } from '@/lib/mockData';

const Index = () => {
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  if (selectedMovie) {
    return (
      <MovieDetails
        movie={selectedMovie}
        onBack={() => setSelectedMovie(null)}
      />
    );
  }

  // Duplicate movies to fill rows
  const trending = [...MOCK_MOVIES, ...MOCK_MOVIES.slice(0, 3)];
  const newReleases = [...MOCK_MOVIES.slice(2), ...MOCK_MOVIES.slice(0, 4)];
  const topRated = [...MOCK_MOVIES].sort((a, b) => b.rating - a.rating);
  const series = MOCK_MOVIES.filter(m => m.type === 'series');

  return (
    <div className="min-h-screen bg-background pb-20">
      <HeroBanner onInfoClick={setSelectedMovie} />

      <div className="mt-6 space-y-2">
        <ContentRow title="פופולרי עכשיו 🔥" movies={trending} onMovieClick={setSelectedMovie} />
        <ContentRow title="חדש באתר" movies={newReleases} onMovieClick={setSelectedMovie} />
        <ContentRow title="הכי מדורגים" movies={topRated} onMovieClick={setSelectedMovie} />
        {series.length > 0 && (
          <ContentRow title="סדרות מובילות" movies={[...series, ...series]} onMovieClick={setSelectedMovie} />
        )}
        <ContentRow title="אקשן ומתח" movies={MOCK_MOVIES.filter(m => m.genres.includes('Action') || m.genres.includes('Thriller'))} onMovieClick={setSelectedMovie} />
      </div>
    </div>
  );
};

export default Index;
