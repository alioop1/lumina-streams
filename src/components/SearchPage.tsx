import { useState, useMemo } from 'react';
import { Search as SearchIcon, X, Mic } from 'lucide-react';
import { MOCK_MOVIES, GENRES, Movie } from '@/lib/mockData';
import { MovieCard } from './MovieCard';

interface SearchPageProps {
  onMovieClick: (movie: Movie) => void;
}

export const SearchPage = ({ onMovieClick }: SearchPageProps) => {
  const [query, setQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const toggleGenre = (g: string) => {
    setSelectedGenres(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    );
  };

  const filtered = useMemo(() => {
    return MOCK_MOVIES.filter(m => {
      const matchesQuery = !query ||
        m.title.toLowerCase().includes(query.toLowerCase()) ||
        (m.titleHe && m.titleHe.includes(query));
      const matchesGenre = selectedGenres.length === 0 ||
        m.genres.some(g => selectedGenres.includes(g));
      return matchesQuery && matchesGenre;
    });
  }, [query, selectedGenres]);

  return (
    <div className="min-h-screen bg-background pt-12 pb-24 px-4" dir="rtl">
      <h1 className="font-display text-3xl text-foreground mb-6">חיפוש</h1>

      {/* Search input */}
      <div className="relative mb-6">
        <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="חפש סרטים, סדרות..."
          className="w-full bg-secondary text-foreground placeholder:text-muted-foreground pr-10 pl-12 py-3.5 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
        />
        {query ? (
          <button onClick={() => setQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Genre filters */}
      <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
        {GENRES.map(g => (
          <button
            key={g}
            onClick={() => toggleGenre(g)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${
              selectedGenres.includes(g)
                ? 'bg-primary text-primary-foreground'
                : 'glass text-muted-foreground hover:text-foreground'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filtered.map((movie, i) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onClick={() => onMovieClick(movie)}
            index={i}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-muted-foreground mt-12">
          <p className="text-lg">לא נמצאו תוצאות</p>
          <p className="text-sm mt-1">נסה חיפוש אחר</p>
        </div>
      )}
    </div>
  );
};
