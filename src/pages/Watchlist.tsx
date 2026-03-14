import { useState, lazy, Suspense } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWatchlist, useWatchHistory } from '@/hooks/useWatchlist';
import { Movie } from '@/lib/mockData';
import { MovieCard } from '@/components/MovieCard';
import { Bookmark, Clock, Trash2, History, SortAsc, Film, Tv, Loader2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const MovieDetails = lazy(() => import('@/components/MovieDetailsLazy'));

type SortBy = 'date' | 'name' | 'rating';
type FilterType = 'all' | 'movie' | 'series';
type Tab = 'watchlist' | 'history';

const Watchlist = () => {
  const { t, dir, lang } = useLanguage();
  const navigate = useNavigate();
  const watchlist = useWatchlist();
  const history = useWatchHistory();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [activeTab, setActiveTab] = useState<Tab>('watchlist');

  if (selectedMovie) {
    return (
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }>
        <MovieDetails movie={selectedMovie} onBack={() => setSelectedMovie(null)} />
      </Suspense>
    );
  }

  const items = activeTab === 'watchlist' ? watchlist.items : history.items;

  // Filter
  const filtered = filterType === 'all' ? items : items.filter(i => i.type === filterType);

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    return (b as any).addedAt - (a as any).addedAt || (b as any).watchedAt - (a as any).watchedAt;
  });

  return (
    <div className="min-h-screen bg-background pt-12 3xl:pt-16 4k:pt-20 pb-24 3xl:pb-32 px-6 3xl:px-10 4k:px-14 page-enter" dir={dir}>
      <h1 className="font-display text-3xl 3xl:text-4xl 4k:text-5xl text-foreground mb-6 3xl:mb-8 ps-6 3xl:ps-10 4k:ps-14">{t('myList')}</h1>

      {/* Tabs: Watchlist / History */}
      <div data-nav-row="wl-tabs" className="flex gap-2 3xl:gap-3 mb-4 3xl:mb-6">
        <button
          onClick={() => setActiveTab('watchlist')}
          className={cn(
            'tv-focus flex items-center gap-2 3xl:gap-3 px-4 3xl:px-6 py-2 3xl:py-3 rounded-lg 3xl:rounded-xl text-sm 3xl:text-base font-medium outline-none',
            activeTab === 'watchlist' ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground'
          )}
        >
          <Bookmark className="w-4 h-4 3xl:w-5 3xl:h-5" />
          {lang === 'he' ? 'רשימת צפייה' : 'Watchlist'}
          {watchlist.count > 0 && (
            <span className="bg-primary-foreground/20 text-primary-foreground px-1.5 py-0.5 rounded-full text-xs font-bold">
              {watchlist.count}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            'tv-focus flex items-center gap-2 3xl:gap-3 px-4 3xl:px-6 py-2 3xl:py-3 rounded-lg 3xl:rounded-xl text-sm 3xl:text-base font-medium outline-none',
            activeTab === 'history' ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground'
          )}
        >
          <History className="w-4 h-4 3xl:w-5 3xl:h-5" />
          {lang === 'he' ? 'היסטוריה' : 'History'}
        </button>
      </div>

      {/* Sort & Filter */}
      {items.length > 0 && (
        <div data-nav-row="wl-filters" className="flex gap-2 3xl:gap-3 mb-6 3xl:mb-8 flex-wrap">
          {/* Sort buttons */}
          <button
            onClick={() => setSortBy('date')}
            className={cn('tv-focus px-3 3xl:px-4 py-1.5 3xl:py-2 rounded-full text-xs 3xl:text-sm font-medium outline-none', sortBy === 'date' ? 'bg-accent text-accent-foreground' : 'glass text-muted-foreground')}
          >
            <SortAsc className="w-3 h-3 inline-block me-1" />
            {lang === 'he' ? 'תאריך' : 'Date'}
          </button>
          <button
            onClick={() => setSortBy('name')}
            className={cn('tv-focus px-3 3xl:px-4 py-1.5 3xl:py-2 rounded-full text-xs 3xl:text-sm font-medium outline-none', sortBy === 'name' ? 'bg-accent text-accent-foreground' : 'glass text-muted-foreground')}
          >
            {lang === 'he' ? 'שם' : 'Name'}
          </button>
          <button
            onClick={() => setSortBy('rating')}
            className={cn('tv-focus px-3 3xl:px-4 py-1.5 3xl:py-2 rounded-full text-xs 3xl:text-sm font-medium outline-none', sortBy === 'rating' ? 'bg-accent text-accent-foreground' : 'glass text-muted-foreground')}
          >
            {lang === 'he' ? 'דירוג' : 'Rating'}
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          {/* Filter buttons */}
          <button
            onClick={() => setFilterType('all')}
            className={cn('tv-focus px-3 3xl:px-4 py-1.5 3xl:py-2 rounded-full text-xs 3xl:text-sm font-medium outline-none', filterType === 'all' ? 'bg-accent text-accent-foreground' : 'glass text-muted-foreground')}
          >
            {lang === 'he' ? 'הכל' : 'All'}
          </button>
          <button
            onClick={() => setFilterType('movie')}
            className={cn('tv-focus px-3 3xl:px-4 py-1.5 3xl:py-2 rounded-full text-xs 3xl:text-sm font-medium outline-none flex items-center gap-1', filterType === 'movie' ? 'bg-accent text-accent-foreground' : 'glass text-muted-foreground')}
          >
            <Film className="w-3 h-3" />
            {lang === 'he' ? 'סרטים' : 'Movies'}
          </button>
          <button
            onClick={() => setFilterType('series')}
            className={cn('tv-focus px-3 3xl:px-4 py-1.5 3xl:py-2 rounded-full text-xs 3xl:text-sm font-medium outline-none flex items-center gap-1', filterType === 'series' ? 'bg-accent text-accent-foreground' : 'glass text-muted-foreground')}
          >
            <Tv className="w-3 h-3" />
            {lang === 'he' ? 'סדרות' : 'Series'}
          </button>

          {activeTab === 'history' && history.items.length > 0 && (
            <>
              <div className="flex-1" />
              <button
                onClick={history.clearHistory}
                className="tv-focus px-3 3xl:px-4 py-1.5 3xl:py-2 rounded-full text-xs 3xl:text-sm font-medium outline-none text-destructive glass flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                {lang === 'he' ? 'נקה היסטוריה' : 'Clear History'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Content */}
      {sorted.length > 0 ? (
        <div className="space-y-4 3xl:space-y-6">
          {chunkArray(sorted, 10).map((chunk, rowIdx) => (
            <div key={rowIdx} data-nav-row={`wl-results-${rowIdx}`} className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 3xl:grid-cols-7 4k:grid-cols-8 tv:grid-cols-10 gap-4 3xl:gap-6 4k:gap-8">
              {chunk.map((movie, i) => (
                <div key={movie.id} className="relative group">
                  <button
                    onClick={() => setSelectedMovie(movie)}
                    className="tv-focus focus-card rounded-xl 3xl:rounded-2xl text-start outline-none w-full"
                  >
                    <MovieCard movie={movie} index={rowIdx * 10 + i} />
                  </button>
                  {activeTab === 'watchlist' && (
                    <button
                      onClick={() => watchlist.remove(movie.id)}
                      className="absolute top-2 end-2 z-10 w-7 h-7 3xl:w-8 3xl:h-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-destructive opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity tv-focus outline-none"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[40vh] 3xl:h-[45vh] text-center">
          <div className="w-20 h-20 3xl:w-24 3xl:h-24 4k:w-28 4k:h-28 rounded-full glass flex items-center justify-center mb-4 3xl:mb-6">
            {activeTab === 'watchlist' ? (
              <Bookmark className="w-8 h-8 3xl:w-10 3xl:h-10 4k:w-12 4k:h-12 text-muted-foreground" />
            ) : (
              <History className="w-8 h-8 3xl:w-10 3xl:h-10 4k:w-12 4k:h-12 text-muted-foreground" />
            )}
          </div>
          <p className="text-muted-foreground text-base 3xl:text-lg 4k:text-xl">
            {activeTab === 'watchlist' ? t('emptyList') : (lang === 'he' ? 'אין היסטוריית צפייה' : 'No watch history')}
          </p>
          <p className="text-sm 3xl:text-base text-muted-foreground mt-1">
            {activeTab === 'watchlist' ? t('addLater') : (lang === 'he' ? 'סרטים שתצפה בהם יופיעו כאן' : 'Movies you watch will appear here')}
          </p>
          <div data-nav-row="watchlist-action" className="mt-5 3xl:mt-7">
            <button
              onClick={() => navigate('/search')}
              className="tv-focus bg-primary text-primary-foreground rounded-lg 3xl:rounded-xl px-6 3xl:px-8 4k:px-10 py-3 3xl:py-4 text-sm 3xl:text-base 4k:text-lg font-semibold outline-none flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              {lang === 'he' ? 'חפש משהו לצפייה' : 'Find Something to Watch'}
            </button>
          </div>
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

export default Watchlist;
