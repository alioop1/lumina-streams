import { Home, Search, Bookmark, Download, Settings, Compass } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/lib/translations';
import { useWatchlist } from '@/hooks/useWatchlist';
import { cn } from '@/lib/utils';

const tabs: { icon: typeof Home; labelKey: TranslationKey; path: string; showBadge?: boolean }[] = [
  { icon: Home, labelKey: 'home', path: '/' },
  { icon: Search, labelKey: 'search', path: '/search' },
  { icon: Bookmark, labelKey: 'watchlist', path: '/watchlist', showBadge: true },
  { icon: Download, labelKey: 'downloads', path: '/downloads' },
  { icon: Settings, labelKey: 'settings', path: '/settings' },
];

interface Props {
  collapsed: boolean;
}

export const AppSidebar = ({ collapsed }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const { count } = useWatchlist();
  const isRTL = dir === 'rtl';

  return (
    <nav
      data-sidebar
      className={cn(
        'fixed top-0 h-full z-50 flex flex-col transition-[width] duration-200',
        'bg-sidebar border-sidebar-border',
        collapsed ? 'w-16 3xl:w-20 4k:w-24' : 'w-56 3xl:w-64 4k:w-72',
        isRTL ? 'right-0 border-s' : 'left-0 border-e'
      )}
      style={{ willChange: 'width' }}
    >
      {/* Logo */}
      <div className="h-16 3xl:h-20 4k:h-24 flex items-center px-4 3xl:px-5 shrink-0 border-b border-sidebar-border justify-center">
        <Compass className="w-7 h-7 3xl:w-9 3xl:h-9 4k:w-10 4k:h-10 text-primary shrink-0" />
        {!collapsed && (
          <span className="font-display text-lg 3xl:text-xl 4k:text-2xl text-foreground ms-2 tracking-wider whitespace-nowrap">STREAM</span>
        )}
      </div>

      {/* Nav items */}
      <div className="flex-1 flex flex-col pt-4 3xl:pt-6 gap-1 3xl:gap-2 px-2 3xl:px-3">
        {tabs.map(({ icon: Icon, labelKey, path, showBadge }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'tv-focus relative flex items-center rounded-lg 3xl:rounded-xl h-12 3xl:h-14 4k:h-16 transition-colors duration-100',
                collapsed ? 'justify-center px-0' : 'gap-3 3xl:gap-4 px-4 3xl:px-5',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-sidebar-foreground'
              )}
            >
              {active && (
                <div className={cn(
                  'absolute top-2 bottom-2 w-[3px] 3xl:w-1 rounded-full bg-primary',
                  isRTL ? 'right-0' : 'left-0'
                )} />
              )}
              <div className="relative">
                <Icon className={cn('w-5 h-5 3xl:w-6 3xl:h-6 4k:w-7 4k:h-7 shrink-0', active && 'drop-shadow-[0_0_6px_hsl(var(--primary))]')} />
                {/* Watchlist badge */}
                {showBadge && count > 0 && (
                  <span className="absolute -top-1.5 -end-1.5 w-4 h-4 3xl:w-5 3xl:h-5 bg-primary text-primary-foreground rounded-full text-[9px] 3xl:text-[10px] font-bold flex items-center justify-center">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </div>
              {!collapsed && <span className="text-sm 3xl:text-base 4k:text-lg font-medium whitespace-nowrap">{t(labelKey)}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
