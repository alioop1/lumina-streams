import { useState, lazy, Suspense } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWatchHistory } from '@/hooks/useWatchlist';
import { Movie } from '@/lib/mockData';
import { MovieCard } from '@/components/MovieCard';
import { Clock, Trash2, Loader2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MovieDetails = lazy(() => import('@/components/MovieDetailsLazy'));

const History = () => {
  const { dir, lang } = useLanguage();
  const navigate = useNavigate();
  const history = useWatchHistory();
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

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

  return (
    <div className="min-h-screen bg-background pt-12 3xl:pt-16 4k:pt-20 pb-24 3xl:pb-32 px-12 3xl:px-16 4k:px-20 page-enter" dir={dir}>
      <div className="flex items-center justify-between mb-6 3xl:mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 3xl:w-14 3xl:h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-6 h-6 3xl:w-7 3xl:h-7 text-primary" />
          </div>
          <h1 className="font-display text-3xl 3xl:text-4xl 4k:text-5xl text-foreground">
            {lang === 'he' ? 'היסטוריית צפייה' : 'Watch History'}
          </h1>
        </div>
        {history.items.length > 0 && (
          <div data-nav-row="history-clear">
            <button
              onClick={history.clearHistory}
              className="tv-focus glass px-4 3xl:px-6 py-2 3xl:py-3 rounded-lg 3xl:rounded-xl text-sm 3xl:text-base font-medium outline-none text-destructive flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {lang === 'he' ? 'נקה היסטוריה' : 'Clear History'}
            </button>
          </div>
        )}
      </div>

      {history.items.length > 0 ? (
        <div className="space-y-4 3xl:space-y-6">
          {chunkArray(history.items, 10).map((chunk, rowIdx) => (
            <div key={rowIdx} data-nav-row={`history-row-${rowIdx}`} className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 3xl:grid-cols-7 4k:grid-cols-8 tv:grid-cols-10 gap-4 3xl:gap-6 4k:gap-8">
              {chunk.map((movie, i) => (
                <button
                  key={movie.id}
                  onClick={() => setSelectedMovie(movie)}
                  className="tv-focus focus-card rounded-xl 3xl:rounded-2xl text-start outline-none"
                >
                  <MovieCard movie={movie} index={rowIdx * 10 + i} />
                </button>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <div className="w-20 h-20 3xl:w-24 3xl:h-24 rounded-full glass flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 3xl:w-10 3xl:h-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-base 3xl:text-lg">
            {lang === 'he' ? 'אין היסטוריית צפייה' : 'No watch history yet'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'he' ? 'סרטים שתצפה בהם יופיעו כאן' : 'Content you watch will appear here'}
          </p>
          <div data-nav-row="history-browse" className="mt-5">
            <button
              onClick={() => navigate('/')}
              className="tv-focus bg-primary text-primary-foreground rounded-lg px-6 py-3 text-sm font-semibold outline-none flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              {lang === 'he' ? 'גלה תוכן' : 'Browse Content'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

export default History;
