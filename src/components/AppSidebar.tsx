import { Power, Cast, Clock, Film, Tv, Link2, Sparkles, Trophy, Radio, MonitorPlay, Puzzle, Heart } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWatchlist } from '@/hooks/useWatchlist';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const menuItems = [
  { icon: Film, label: 'Movies', labelHe: 'סרטים', path: '/', id: 'movies' },
  { icon: Tv, label: 'TV Shows', labelHe: 'סדרות', path: '/', id: 'tv' },
  { icon: Link2, label: 'Chains', labelHe: 'רשתות', path: '/', id: 'chains' },
  { icon: Sparkles, label: 'Anime', labelHe: 'אנימה', path: '/', id: 'anime' },
  { icon: Trophy, label: 'Live Sports', labelHe: 'ספורט חי', path: '/', id: 'sports' },
  { icon: Radio, label: 'Live TV', labelHe: 'טלוויזיה חיה', path: '/', id: 'livetv' },
  { icon: Puzzle, label: 'Add-ons', labelHe: 'תוספים', path: '/settings', id: 'addons' },
  { icon: Heart, label: 'Favourites', labelHe: 'מועדפים', path: '/watchlist', id: 'favourites' },
];

const topButtons = [
  { icon: Power, label: 'Power', action: 'power' },
  { icon: Cast, label: 'Cast', action: 'cast' },
  { icon: Clock, label: 'History', action: 'history' },
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

  // Map current path to active menu item
  useEffect(() => {
    if (location.pathname === '/watchlist') setActiveId('favourites');
    else if (location.pathname === '/settings') setActiveId('addons');
    else if (location.pathname === '/') setActiveId('movies');
  }, [location.pathname]);

  const timeStr = time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <nav
      data-sidebar
      className={cn(
        'fixed top-0 h-full z-50 flex flex-col transition-all duration-300 ease-out',
        collapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-[320px] 3xl:w-[360px] 4k:w-[400px] opacity-100',
        isRTL ? 'right-0' : 'left-0'
      )}
      style={{
        background: 'linear-gradient(180deg, hsl(0 0% 0% / 0.92) 0%, hsl(0 20% 8% / 0.95) 100%)',
        willChange: 'width, opacity',
      }}
    >
      {/* Top action buttons */}
      <div className="flex items-center gap-3 3xl:gap-4 px-8 3xl:px-10 pt-8 3xl:pt-10 pb-4">
        {topButtons.map(({ icon: Icon, label, action }) => (
          <button
            key={action}
            className="tv-focus w-12 h-12 3xl:w-14 3xl:h-14 4k:w-16 4k:h-16 rounded-full border-2 border-primary/40 bg-primary/10 flex items-center justify-center text-primary/80 hover:bg-primary/20 hover:border-primary/60 transition-colors outline-none"
            aria-label={label}
            onClick={() => {
              if (action === 'history') navigate('/downloads');
            }}
          >
            <Icon className="w-5 h-5 3xl:w-6 3xl:h-6 4k:w-7 4k:h-7" />
          </button>
        ))}
      </div>

      {/* Menu items */}
      <div className="flex-1 flex flex-col gap-0.5 px-4 3xl:px-6 pt-4 3xl:pt-6">
        {menuItems.map(({ icon: Icon, label, labelHe, path, id }) => {
          const active = activeId === id;
          return (
            <button
              key={id}
              onClick={() => {
                setActiveId(id);
                navigate(path);
              }}
              className={cn(
                'tv-focus relative flex items-center gap-4 3xl:gap-5 rounded-lg h-12 3xl:h-14 4k:h-16 px-4 3xl:px-6 transition-colors duration-150 outline-none text-start',
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
                'text-xl 3xl:text-2xl 4k:text-3xl font-medium tracking-wide whitespace-nowrap',
                active && 'text-foreground font-semibold'
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
          {dateStr.split(',').map((part, i) => (
            <span key={i}>
              {i === 1 && <span className="text-primary mx-1">•</span>}
              {part.trim()}
            </span>
          ))}
        </div>
      </div>
    </nav>
  );
};
