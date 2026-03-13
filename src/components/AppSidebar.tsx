import { Power, Cast, Clock, Film, Tv, Sparkles, Trophy, Radio, MonitorPlay, Puzzle, Heart, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWatchlist } from '@/hooks/useWatchlist';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';

const menuItems = [
  { label: 'Movies', labelHe: 'סרטים', path: '/', id: 'movies' },
  { label: 'TV Shows', labelHe: 'סדרות', path: '/', id: 'tv' },
  { label: 'Anime', labelHe: 'אנימה', path: '/', id: 'anime' },
  { label: 'Live Sports', labelHe: 'ספורט חי', path: '/', id: 'sports' },
  { label: 'Live TV', labelHe: 'טלוויזיה חיה', path: '/', id: 'livetv' },
  { label: 'Add-ons', labelHe: 'תוספים', path: '/settings', id: 'addons' },
  { label: 'Favourites', labelHe: 'מועדפים', path: '/watchlist', id: 'favourites' },
];

interface Props {
  collapsed: boolean;
}

export const AppSidebar = ({ collapsed }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, dir } = useLanguage();
  const { count } = useWatchlist();
  const isRTL = dir === 'rtl';
  const [time, setTime] = useState(() => new Date());
  const [activeId, setActiveId] = useState('movies');

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (location.pathname === '/watchlist') setActiveId('favourites');
    else if (location.pathname === '/settings') setActiveId('addons');
    else if (location.pathname === '/search') setActiveId('search');
    else if (location.pathname === '/') setActiveId('movies');
  }, [location.pathname]);

  const handleNav = useCallback((id: string, path: string) => {
    setActiveId(id);
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
          : 'w-[300px] 3xl:w-[340px] 4k:w-[380px] opacity-100 translate-x-0',
        isRTL ? 'right-0' : 'left-0'
      )}
      style={{
        background: 'linear-gradient(180deg, hsl(0 0% 0% / 0.93) 0%, hsl(0 15% 6% / 0.96) 100%)',
        willChange: 'transform, opacity',
      }}
    >
      {/* Top action buttons */}
      <div className="flex items-center gap-3 3xl:gap-4 px-8 3xl:px-10 pt-8 3xl:pt-10 pb-6">
        <button
          className="tv-focus w-11 h-11 3xl:w-13 3xl:h-13 4k:w-14 4k:h-14 rounded-full border-2 border-primary/40 bg-primary/10 flex items-center justify-center text-primary/80 hover:bg-primary/25 hover:border-primary/60 transition-colors outline-none"
          aria-label="Power"
        >
          <Power className="w-5 h-5 3xl:w-6 3xl:h-6" />
        </button>
        <button
          onClick={() => handleNav('search', '/search')}
          className="tv-focus w-11 h-11 3xl:w-13 3xl:h-13 4k:w-14 4k:h-14 rounded-full border-2 border-primary/40 bg-primary/10 flex items-center justify-center text-primary/80 hover:bg-primary/25 hover:border-primary/60 transition-colors outline-none"
          aria-label="Search"
        >
          <Search className="w-5 h-5 3xl:w-6 3xl:h-6" />
        </button>
        <button
          onClick={() => handleNav('history', '/downloads')}
          className="tv-focus w-11 h-11 3xl:w-13 3xl:h-13 4k:w-14 4k:h-14 rounded-full border-2 border-primary/40 bg-primary/10 flex items-center justify-center text-primary/80 hover:bg-primary/25 hover:border-primary/60 transition-colors outline-none"
          aria-label="History"
        >
          <Clock className="w-5 h-5 3xl:w-6 3xl:h-6" />
        </button>
      </div>

      {/* Menu items */}
      <div className="flex-1 flex flex-col gap-0.5 px-4 3xl:px-5">
        {menuItems.map(({ label, labelHe, path, id }) => {
          const active = activeId === id;
          return (
            <button
              key={id}
              onClick={() => handleNav(id, path)}
              className={cn(
                'tv-focus relative flex items-center gap-3 rounded-lg h-12 3xl:h-14 4k:h-16 px-5 3xl:px-6 transition-colors duration-150 outline-none text-start',
                active
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground/80'
              )}
            >
              {active && (
                <div className={cn(
                  'absolute top-3 bottom-3 w-[3px] rounded-full bg-primary',
                  isRTL ? 'right-0' : 'left-0'
                )} />
              )}
              <span className={cn(
                'text-xl 3xl:text-2xl 4k:text-3xl tracking-wide whitespace-nowrap',
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
      <div className="px-8 3xl:px-10 pb-8 3xl:pb-10 pt-4">
        <div className="text-2xl 3xl:text-3xl 4k:text-4xl font-semibold text-foreground/90 tracking-wide">
          {timeStr}
        </div>
        <div className="text-sm 3xl:text-base 4k:text-lg text-muted-foreground mt-0.5">
          {dayName}<span className="text-primary mx-1.5">•</span>{dateRest}
        </div>
      </div>
    </nav>
  );
};
