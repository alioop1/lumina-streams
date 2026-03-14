import { Power, Clock, Search, Film, Tv, Sparkles, Trophy, Radio, Puzzle, Heart } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWatchlist } from '@/hooks/useWatchlist';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback, memo } from 'react';

const menuItems = [
  { label: 'Movies', labelHe: 'סרטים', path: '/movies', id: 'movies', icon: Film },
  { label: 'TV Shows', labelHe: 'סדרות', path: '/tv-shows', id: 'tv', icon: Tv },
  { label: 'Anime', labelHe: 'אנימה', path: '/anime', id: 'anime', icon: Sparkles },
  { label: 'Live Sports', labelHe: 'ספורט חי', path: '/live-sports', id: 'sports', icon: Trophy },
  { label: 'Live TV', labelHe: 'טלוויזיה חיה', path: '/live-tv', id: 'livetv', icon: Radio },
  { label: 'Add-ons', labelHe: 'תוספים', path: '/addons', id: 'addons', icon: Puzzle },
  { label: 'Favourites', labelHe: 'מועדפים', path: '/watchlist', id: 'favourites', icon: Heart },
];

const pathToId: Record<string, string> = {
  '/': 'movies',
  '/movies': 'movies',
  '/tv-shows': 'tv',
  '/anime': 'anime',
  '/live-sports': 'sports',
  '/live-tv': 'livetv',
  '/addons': 'addons',
  '/watchlist': 'favourites',
  '/settings': 'settings',
  '/search': 'search',
  '/history': 'history',
  '/downloads': 'downloads',
};

interface Props {
  collapsed: boolean;
}

export const AppSidebar = memo(({ collapsed }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, dir } = useLanguage();
  const { count } = useWatchlist();
  const isRTL = dir === 'rtl';
  const [time, setTime] = useState(() => new Date());

  const activeId = pathToId[location.pathname] || 'movies';

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleNav = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const timeStr = time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const dayName = time.toLocaleDateString('en-US', { weekday: 'long' });
  const dateRest = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <nav
      data-sidebar
      className={cn(
        'fixed top-0 h-full z-50 flex flex-col transition-all duration-300 ease-out',
        collapsed
          ? 'w-0 opacity-0 pointer-events-none -translate-x-8'
          : 'w-[280px] 3xl:w-[320px] 4k:w-[360px] opacity-100 translate-x-0',
        isRTL ? 'right-0' : 'left-0'
      )}
      style={{
        background: 'linear-gradient(180deg, hsl(0 0% 0% / 0.93) 0%, hsl(0 15% 6% / 0.96) 100%)',
        willChange: 'transform, opacity',
      }}
    >
      {/* Top action buttons */}
      <div className="flex items-center gap-3 3xl:gap-4 px-7 3xl:px-9 pt-7 3xl:pt-9 pb-5">
        <button
          onClick={() => handleNav('/history')}
          className={cn(
            'tv-focus w-11 h-11 3xl:w-13 3xl:h-13 rounded-full border-2 flex items-center justify-center transition-colors outline-none',
            activeId === 'history'
              ? 'border-primary bg-primary/25 text-primary'
              : 'border-primary/40 bg-primary/10 text-primary/80 hover:bg-primary/25 hover:border-primary/60'
          )}
          aria-label="History"
        >
          <Clock className="w-5 h-5 3xl:w-6 3xl:h-6" />
        </button>
        <button
          onClick={() => handleNav('/search')}
          className={cn(
            'tv-focus w-11 h-11 3xl:w-13 3xl:h-13 rounded-full border-2 flex items-center justify-center transition-colors outline-none',
            activeId === 'search'
              ? 'border-primary bg-primary/25 text-primary'
              : 'border-primary/40 bg-primary/10 text-primary/80 hover:bg-primary/25 hover:border-primary/60'
          )}
          aria-label="Search"
        >
          <Search className="w-5 h-5 3xl:w-6 3xl:h-6" />
        </button>
        <button
          className="tv-focus w-11 h-11 3xl:w-13 3xl:h-13 rounded-full border-2 border-primary/40 bg-primary/10 flex items-center justify-center text-primary/80 hover:bg-primary/25 hover:border-primary/60 transition-colors outline-none"
          aria-label="Power"
          onClick={() => window.close()}
        >
          <Power className="w-5 h-5 3xl:w-6 3xl:h-6" />
        </button>
      </div>

      {/* Menu items */}
      <div className="flex-1 flex flex-col gap-0.5 px-4 3xl:px-5 overflow-y-auto">
        {menuItems.map(({ label, labelHe, path, id }) => {
          const active = activeId === id;
          return (
            <button
              key={id}
              onClick={() => handleNav(path)}
              className={cn(
                'tv-focus relative flex items-center gap-3 rounded-lg h-11 3xl:h-13 4k:h-15 px-4 3xl:px-5 transition-colors duration-150 outline-none text-start',
                active
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground/80'
              )}
            >
              {active && (
                <div className={cn(
                  'absolute top-2.5 bottom-2.5 w-[3px] rounded-full bg-primary',
                  isRTL ? 'right-0' : 'left-0'
                )} />
              )}
              <span className={cn(
                'text-lg 3xl:text-xl 4k:text-2xl tracking-wide whitespace-nowrap',
                active ? 'text-foreground font-semibold' : 'font-normal'
              )}>
                {lang === 'he' ? labelHe : label}
              </span>
              {id === 'favourites' && count > 0 && (
                <span className="w-5 h-5 3xl:w-6 3xl:h-6 bg-primary text-primary-foreground rounded-full text-[10px] 3xl:text-xs font-bold flex items-center justify-center">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Clock at bottom */}
      <div className="px-7 3xl:px-9 pb-7 3xl:pb-9 pt-4">
        <div className="text-2xl 3xl:text-3xl 4k:text-4xl font-semibold text-foreground/90 tracking-wide">
          {timeStr}
        </div>
        <div className="text-sm 3xl:text-base 4k:text-lg text-muted-foreground mt-0.5">
          {dayName}<span className="text-primary mx-1.5">•</span>{dateRest}
        </div>
      </div>
    </nav>
  );
});

AppSidebar.displayName = 'AppSidebar';
