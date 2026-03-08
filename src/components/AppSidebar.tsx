import { Home, Search, Bookmark, Download, Settings, Compass } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/lib/translations';
import { cn } from '@/lib/utils';

const tabs: { icon: typeof Home; labelKey: TranslationKey; path: string }[] = [
  { icon: Home, labelKey: 'home', path: '/' },
  { icon: Search, labelKey: 'search', path: '/search' },
  { icon: Bookmark, labelKey: 'watchlist', path: '/watchlist' },
  { icon: Download, labelKey: 'downloads', path: '/downloads' },
  { icon: Settings, labelKey: 'settings', path: '/settings' },
];

export const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const isRTL = dir === 'rtl';

  return (
    <nav
      data-sidebar
      className={cn(
        'fixed top-0 h-full z-50 flex flex-col w-56',
        'bg-sidebar border-sidebar-border',
        isRTL ? 'right-0 border-s' : 'left-0 border-e'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 shrink-0 border-b border-sidebar-border">
        <Compass className="w-7 h-7 text-primary shrink-0" />
        <span className="font-display text-lg text-foreground ms-2 tracking-wider">STREAM</span>
      </div>

      {/* Nav items */}
      <div className="flex-1 flex flex-col pt-4 gap-1 px-2">
        {tabs.map(({ icon: Icon, labelKey, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'tv-focus relative flex items-center gap-3 rounded-lg px-4 h-12',
                'transition-colors duration-100',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-sidebar-foreground'
              )}
            >
              {active && (
                <div className={cn(
                  'absolute top-2 bottom-2 w-[3px] rounded-full bg-primary',
                  isRTL ? 'right-0' : 'left-0'
                )} />
              )}
              <Icon className={cn('w-5 h-5 shrink-0', active && 'drop-shadow-[0_0_6px_hsl(var(--primary))]')} />
              <span className="text-sm font-medium">{t(labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
