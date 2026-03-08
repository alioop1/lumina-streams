import { useState, useMemo, useRef } from 'react';
import { Search as SearchIcon, X, Film, Tv } from 'lucide-react';
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
  const [selectedGenreId, setSelectedGenreId] = useState<string | null>(null);
  const [mediaTab, setMediaTab] = useState<MediaTab>('movie');
  const { t, dir, lang } = useLanguage();

  const { data: searchResults, isLoading: searchLoading } = useSearch(query);
  const { data: movieGenres } = useGenres('movie');
  const { data: tvGenres } = useGenres('tv');
  const { data: discoverResults, isLoading: discoverLoading } = useDiscover(mediaTab, selectedGenreId || undefined);

  const genres = mediaTab === 'movie' ? (movieGenres?.genres || []) : (tvGenres?.genres || []);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isSearchMode = query.length >= 2;
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

  return (
    <div className="min-h-screen bg-background pt-12 pb-24 px-6" dir={dir}>
      <h1 className="font-display text-3xl text-foreground mb-6">{t('searchTitle')}</h1>

      {/* Search input row */}
      <div data-nav-row="search-input" className="relative mb-4">
        <SearchIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          ref={searchInputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="tv-focus w-full bg-secondary text-foreground placeholder:text-muted-foreground ps-10 pe-12 py-3.5 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground tv-focus outline-none" aria-label="Clear">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Media type tabs */}
      {!isSearchMode && (
        <div data-nav-row="search-tabs" className="flex gap-2 mb-4">
          <button
            onClick={() => { setMediaTab('movie'); setSelectedGenreId(null); }}
            className={cn(
              'tv-focus flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium outline-none',
              mediaTab === 'movie' ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground'
            )}
          >
            <Film className="w-4 h-4" />
            {lang === 'he' ? 'סרטים' : 'Movies'}
          </button>
          <button
            onClick={() => { setMediaTab('tv'); setSelectedGenreId(null); }}
            className={cn(
              'tv-focus flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium outline-none',
              mediaTab === 'tv' ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground'
            )}
          >
            <Tv className="w-4 h-4" />
            {lang === 'he' ? 'סדרות' : 'Series'}
          </button>
        </div>
      )}

      {/* Genre chips */}
      {!isSearchMode && genres.length > 0 && (
        <div data-nav-row="search-genres" className="flex gap-2 overflow-x-auto mb-6 pb-2">
          {genres.map((g: any) => (
            <button
              key={g.id}
              onClick={() => selectGenre(g.id)}
              className={cn(
                'tv-focus flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium outline-none',
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
        <h2 className="font-display text-xl text-foreground mb-4">
          {selectedGenreName
            ? `${selectedGenreName} - ${mediaTab === 'movie' ? (lang === 'he' ? 'סרטים' : 'Movies') : (lang === 'he' ? 'סדרות' : 'Series')}`
            : (lang === 'he' ? 'פופולרי עכשיו' : 'Popular Now')
          }
        </h2>
      )}

      {isLoading && (
        <div className="grid grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i}>
              <div className="rounded-lg aspect-[2/3] mb-2 bg-muted animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse mb-1" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
            </div>
          ))}
        </div>
      )}

      {/* Results grid — each visual row of 6 gets its own data-nav-row */}
      {!isLoading && results.length > 0 && (
        <div className="space-y-4">
          {chunkArray(results, 6).map((chunk, rowIdx) => (
            <div key={rowIdx} data-nav-row={`search-results-${rowIdx}`} className="grid grid-cols-6 gap-4">
              {chunk.map((movie: Movie, i: number) => (
                <button
                  key={movie.id}
                  onClick={() => onMovieClick(movie)}
                  className="tv-focus focus-card rounded-lg text-start outline-none"
                >
                  <MovieCard movie={movie} index={rowIdx * 6 + i} />
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {!isLoading && isSearchMode && results.length === 0 && (
        <div className="text-center text-muted-foreground mt-12">
          <p className="text-lg">{t('noResults')}</p>
          <p className="text-sm mt-1">{t('tryAnother')}</p>
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
