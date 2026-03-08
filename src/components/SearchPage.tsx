import { useState, useMemo } from 'react';
import { Search as SearchIcon, X, Mic } from 'lucide-react';
import { Movie } from '@/lib/mockData';
import { MovieCard } from './MovieCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSearch, useGenres } from '@/hooks/useTMDB';

interface SearchPageProps {
  onMovieClick: (movie: Movie) => void;
}

export const SearchPage = ({ onMovieClick }: SearchPageProps) => {
  const [query, setQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const { t, dir } = useLanguage();

  const { data: searchResults, isLoading } = useSearch(query);
  const { data: genresData } = useGenres('movie');

  const genres = genresData?.genres?.map((g: any) => g.name) || [];

  const toggleGenre = (g: string) => {
    setSelectedGenres(prev =>
      prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]
    );
  };

  const filtered = useMemo(() => {
    if (!searchResults) return [];
    if (selectedGenres.length === 0) return searchResults;
    return searchResults.filter((m: Movie) =>
      m.genres?.some(g => selectedGenres.includes(g))
    );
  }, [searchResults, selectedGenres]);

  return (
    <div className="min-h-screen bg-background pt-12 pb-24 px-4" dir={dir}>
      <h1 className="font-display text-3xl text-foreground mb-6">{t('searchTitle')}</h1>

      <div className="relative mb-6">
        <SearchIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full bg-secondary text-foreground placeholder:text-muted-foreground ps-10 pe-12 py-3.5 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm tv-focus"
        />
        {query ? (
          <button onClick={() => setQuery('')} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground tv-focus">
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button className="absolute end-3 top-1/2 -translate-y-1/2 text-primary tv-focus">
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>

      {genres.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
          {genres.map((g: string) => (
            <button
              key={g}
              onClick={() => toggleGenre(g)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all tv-focus ${
                selectedGenres.includes(g)
                  ? 'bg-primary text-primary-foreground'
                  : 'glass text-muted-foreground hover:text-foreground'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {isLoading && query.length >= 2 && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <div className="rounded-lg aspect-[2/3] mb-2 bg-muted animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse mb-1" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filtered.map((movie: Movie, i: number) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onClick={() => onMovieClick(movie)}
              index={i}
            />
          ))}
        </div>
      )}

      {!isLoading && query.length >= 2 && filtered.length === 0 && (
        <div className="text-center text-muted-foreground mt-12">
          <p className="text-lg">{t('noResults')}</p>
          <p className="text-sm mt-1">{t('tryAnother')}</p>
        </div>
      )}
    </div>
  );
};
