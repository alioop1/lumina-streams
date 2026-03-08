import { useState, useMemo, useRef, useCallback } from 'react';
import { Search as SearchIcon, X, Mic, Film, Tv } from 'lucide-react';
import { Movie } from '@/lib/mockData';
import { MovieCard } from './MovieCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSearch, useGenres, useDiscover } from '@/hooks/useTMDB';
import { useIsTVDevice } from '@/hooks/use-tv';
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
  const { data: discoverResults, isLoading: discoverLoading } = useDiscover(
    mediaTab,
    selectedGenreId || undefined
  );

  const genres = mediaTab === 'movie'
    ? (movieGenres?.genres || [])
    : (tvGenres?.genres || []);

  const genreRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const resultRefs = useRef<(HTMLButtonElement | null)[]>([]);
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

  const handleGenreKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    const isRTL = dir === 'rtl';
    const nextKey = isRTL ? 'ArrowLeft' : 'ArrowRight';
    const prevKey = isRTL ? 'ArrowRight' : 'ArrowLeft';

    switch (e.key) {
      case nextKey:
        e.preventDefault();
        genreRefs.current[index + 1]?.focus();
        break;
      case prevKey:
        e.preventDefault();
        if (index > 0) genreRefs.current[index - 1]?.focus();
        else searchInputRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        resultRefs.current[0]?.focus();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        const genre = genres[index];
        if (genre) selectGenre(genre.id);
        break;
    }
  }, [dir, genres]);

  const handleResultKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    const cols = window.innerWidth >= 1024 ? 6 : window.innerWidth >= 768 ? 4 : 3;
    const isRTL = dir === 'rtl';
    const nextKey = isRTL ? 'ArrowLeft' : 'ArrowRight';
    const prevKey = isRTL ? 'ArrowRight' : 'ArrowLeft';

    switch (e.key) {
      case nextKey:
        e.preventDefault();
        resultRefs.current[index + 1]?.focus();
        break;
      case prevKey:
        e.preventDefault();
        if (index > 0) resultRefs.current[index - 1]?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        resultRefs.current[index + cols]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (index - cols >= 0) resultRefs.current[index - cols]?.focus();
        else genreRefs.current[0]?.focus();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (results[index]) onMovieClick(results[index]);
        break;
    }
  }, [dir, results, onMovieClick]);

  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'he' ? 'he-IL' : 'en-US';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
      };
      recognition.start();
    }
  };

  const selectedGenreName = genres.find((g: any) => String(g.id) === selectedGenreId)?.name;

  return (
    <div className="min-h-screen bg-background pt-12 pb-24 px-4" dir={dir}>
      <h1 className="font-display text-3xl text-foreground mb-6">{t('searchTitle')}</h1>

      <div className="relative mb-4">
        <SearchIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          ref={searchInputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="tv-focus w-full bg-secondary text-foreground placeholder:text-muted-foreground ps-10 pe-12 py-3.5 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
          onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (!isSearchMode && genreRefs.current[0]) {
                genreRefs.current[0].focus();
              } else {
                resultRefs.current[0]?.focus();
              }
            }
          }}
        />
        {query ? (
          <button onClick={() => setQuery('')} className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground tv-focus" aria-label="Clear search">
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={handleVoiceSearch} className="absolute end-3 top-1/2 -translate-y-1/2 text-primary tv-focus" aria-label="Voice search">
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>

      {!isSearchMode && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setMediaTab('movie'); setSelectedGenreId(null); }}
            className={cn(
              'tv-focus flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              mediaTab === 'movie' ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground hover:text-foreground'
            )}
          >
            <Film className="w-4 h-4" />
            {lang === 'he' ? 'סרטים' : 'Movies'}
          </button>
          <button
            onClick={() => { setMediaTab('tv'); setSelectedGenreId(null); }}
            className={cn(
              'tv-focus flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              mediaTab === 'tv' ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground hover:text-foreground'
            )}
          >
            <Tv className="w-4 h-4" />
            {lang === 'he' ? 'סדרות' : 'Series'}
          </button>
        </div>
      )}

      {!isSearchMode && genres.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
          {genres.map((g: any, index: number) => (
            <button
              key={g.id}
              ref={el => { genreRefs.current[index] = el; }}
              onClick={() => selectGenre(g.id)}
              onKeyDown={e => handleGenreKeyDown(e, index)}
              tabIndex={0}
              className={cn(
                'tv-focus flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all',
                selectedGenreId === String(g.id)
                  ? 'bg-primary text-primary-foreground'
                  : 'glass text-muted-foreground hover:text-foreground'
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
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {[...Array(12)].map((_, i) => (
            <div key={i}>
              <div className="rounded-lg aspect-[2/3] mb-2 bg-muted animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse mb-1" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {results.map((movie: Movie, i: number) => (
            <button
              key={movie.id}
              ref={el => { resultRefs.current[i] = el; }}
              tabIndex={0}
              onClick={() => onMovieClick(movie)}
              onKeyDown={e => handleResultKeyDown(e, i)}
              className="tv-focus focus-card rounded-lg text-start"
            >
              <MovieCard
                movie={movie}
                index={i}
              />
            </button>
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
