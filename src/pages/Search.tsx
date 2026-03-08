import { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MOCK_MOVIES, Movie } from '@/lib/mockData';
import { MovieCard } from '@/components/MovieCard';
import { MovieDetails } from '@/components/MovieDetails';

const SearchRoute = () => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const filtered = query.trim()
    ? MOCK_MOVIES.filter(m =>
        m.title.toLowerCase().includes(query.toLowerCase()) ||
        (m.titleHe && m.titleHe.includes(query))
      )
    : MOCK_MOVIES;

  if (selectedMovie) {
    return <MovieDetails movie={selectedMovie} onBack={() => setSelectedMovie(null)} />;
  }

  return (
    <div className="p-6">
      <h1 className="font-display text-3xl text-foreground mb-6 tracking-wide">{t('searchTitle')}</h1>

      {/* Search input row */}
      <div data-nav-row="search-input" className="mb-8">
        <div className="relative max-w-lg">
          <SearchIcon className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            tabIndex={0}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="tv-focus w-full bg-secondary text-foreground ps-12 pe-4 py-3 rounded-lg text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center text-muted-foreground mt-20">
          <p className="text-lg mb-2">{t('noResults')}</p>
          <p className="text-sm">{t('tryAnother')}</p>
        </div>
      ) : (
        <div data-nav-row="search-results" className="flex flex-wrap gap-4">
          {filtered.map((movie, i) => (
            <button
              key={movie.id}
              onClick={() => setSelectedMovie(movie)}
              className="tv-focus flex-shrink-0 rounded-xl text-start focus-card outline-none"
            >
              <MovieCard movie={movie} index={i} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchRoute;
