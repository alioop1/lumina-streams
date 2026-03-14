import { useState, useMemo, useRef, useEffect } from 'react';
import { Search as SearchIcon, X, Film, Tv, Loader2 } from 'lucide-react';
import { Movie } from '@/lib/mockData';
import { MovieCard } from './MovieCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSearch, useGenres, useDiscover } from '@/hooks/useTMDB';
import { cn } from '@/lib/utils';

interface SearchPageProps {
  onMovieClick: (movie: Movie) => void;
}

type MediaTab = 'movie' | 'tv';

export const SearchPage = ({ onMovieClick }: SearchPageProps) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedGenreId, setSelectedGenreId] = useState<string | null>(null);
  const [mediaTab, setMediaTab] = useState<MediaTab>('movie');
  const { t, dir, lang } = useLanguage();

  // Feature: Debounced search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchResults, isLoading: searchLoading } = useSearch(debouncedQuery);
  const { data: movieGenres } = useGenres('movie');
  const { data: tvGenres } = useGenres('tv');
  const { data: discoverResults, isLoading: discoverLoading } = useDiscover(mediaTab, selectedGenreId || undefined);

  const genres = mediaTab === 'movie' ? (movieGenres?.genres || []) : (tvGenres?.genres || []);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isSearchMode = debouncedQuery.length >= 2;
  const isLoading = isSearchMode ? searchLoading : discoverLoading;
  const results = useMemo(
    () => (isSearchMode ? (searchResults || []) : (discoverResults || [])),
    [isSearchMode, searchResults, discoverResults]
  );

  const selectGenre = (genreId: number) => {
    const id = String(genreId);
    setSelectedGenreId(prev => prev === id ? null : id);
  };

  const selectedGenreName = genres.find((g: any) => String(g.id) === selectedGenreId)?.name;

  // Feature: Responsive grid columns for TV
  const gridCols = 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 3xl:grid-cols-7 4k:grid-cols-8 tv:grid-cols-10';

  return (
    <div className="min-h-screen bg-background pt-12 3xl:pt-16 4k:pt-20 pb-24 3xl:pb-32 px-12 3xl:px-16 4k:px-20 page-enter" dir={dir}>
      <h1 className="font-display text-3xl 3xl:text-4xl 4k:text-5xl text-foreground mb-6 3xl:mb-8">{t('searchTitle')}</h1>

      {/* Search input row */}
      <div data-nav-row="search-input" className="relative mb-4 3xl:mb-6">
        <SearchIcon className="absolute start-3 3xl:start-4 top-1/2 -translate-y-1/2 w-5 h-5 3xl:w-6 3xl:h-6 text-muted-foreground" />
        <input
          ref={searchInputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="tv-focus w-full bg-secondary text-foreground placeholder:text-muted-foreground ps-10 3xl:ps-12 pe-12 3xl:pe-14 py-3.5 3xl:py-4 4k:py-5 rounded-xl 3xl:rounded-2xl outline-none focus:ring-2 focus:ring-primary text-sm 3xl:text-base 4k:text-lg"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute end-3 3xl:end-4 top-1/2 -translate-y-1/2 text-muted-foreground tv-focus outline-none" aria-label="Clear">
            <X className="w-5 h-5 3xl:w-6 3xl:h-6" />
          </button>
        )}
      </div>

      {/* Media type tabs */}
      {!isSearchMode && (
        <div data-nav-row="search-tabs" className="flex gap-2 3xl:gap-3 mb-4 3xl:mb-6">
          <button
            onClick={() => { setMediaTab('movie'); setSelectedGenreId(null); }}
            className={cn(
              'tv-focus flex items-center gap-2 3xl:gap-3 px-4 3xl:px-6 4k:px-7 py-2 3xl:py-3 4k:py-3.5 rounded-lg 3xl:rounded-xl text-sm 3xl:text-base 4k:text-lg font-medium outline-none',
              mediaTab === 'movie' ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground'
            )}
          >
            <Film className="w-4 h-4 3xl:w-5 3xl:h-5" />
            {lang === 'he' ? 'סרטים' : 'Movies'}
          </button>
          <button
            onClick={() => { setMediaTab('tv'); setSelectedGenreId(null); }}
            className={cn(
              'tv-focus flex items-center gap-2 3xl:gap-3 px-4 3xl:px-6 4k:px-7 py-2 3xl:py-3 4k:py-3.5 rounded-lg 3xl:rounded-xl text-sm 3xl:text-base 4k:text-lg font-medium outline-none',
              mediaTab === 'tv' ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground'
            )}
          >
            <Tv className="w-4 h-4 3xl:w-5 3xl:h-5" />
            {lang === 'he' ? 'סדרות' : 'Series'}
          </button>
        </div>
      )}

      {/* Genre chips */}
      {!isSearchMode && genres.length > 0 && (
        <div data-nav-row="search-genres" className="flex gap-2 3xl:gap-3 overflow-x-auto mb-6 3xl:mb-8 pb-2 scroll-smooth">
          {genres.map((g: any) => (
            <button
              key={g.id}
              onClick={() => selectGenre(g.id)}
              className={cn(
                'tv-focus flex-shrink-0 px-4 3xl:px-6 4k:px-7 py-2 3xl:py-2.5 4k:py-3 rounded-full text-xs 3xl:text-sm 4k:text-base font-medium outline-none',
                selectedGenreId === String(g.id)
                  ? 'bg-primary text-primary-foreground'
                  : 'glass text-muted-foreground'
              )}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {!isSearchMode && (
        <h2 className="font-display text-xl 3xl:text-2xl 4k:text-3xl text-foreground mb-4 3xl:mb-6">
          {selectedGenreName
            ? `${selectedGenreName} - ${mediaTab === 'movie' ? (lang === 'he' ? 'סרטים' : 'Movies') : (lang === 'he' ? 'סדרות' : 'Series')}`
            : (lang === 'he' ? 'פופולרי עכשיו' : 'Popular Now')
          }
        </h2>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 3xl:w-14 3xl:h-14 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm 3xl:text-base mt-3">{lang === 'he' ? 'טוען...' : 'Loading...'}</p>
        </div>
      )}

      {/* Results grid */}
      {!isLoading && results.length > 0 && (
        <div className="space-y-4 3xl:space-y-6">
          {chunkArray(results, 10).map((chunk, rowIdx) => (
            <div key={rowIdx} data-nav-row={`search-results-${rowIdx}`} className={`grid ${gridCols} gap-4 3xl:gap-6 4k:gap-8`}>
              {chunk.map((movie: Movie, i: number) => (
                <button
                  key={movie.id}
                  onClick={() => onMovieClick(movie)}
                  className="tv-focus focus-card rounded-xl 3xl:rounded-2xl text-start outline-none"
                >
                  <MovieCard movie={movie} index={rowIdx * 10 + i} />
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {!isLoading && isSearchMode && results.length === 0 && (
        <div className="text-center text-muted-foreground mt-12 3xl:mt-16">
          <p className="text-lg 3xl:text-xl 4k:text-2xl">{t('noResults')}</p>
          <p className="text-sm 3xl:text-base mt-1">{t('tryAnother')}</p>
        </div>
      )}
    </div>
  );
};

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}