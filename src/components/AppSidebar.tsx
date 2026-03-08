import { Home, Search, Bookmark, Download, Settings, Compass } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useIsTVDevice } from '@/hooks/use-tv';

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
  const isTVDevice = useIsTVDevice();
  const isRTL = dir === 'rtl';
  const [expanded, setExpanded] = useState(isTVDevice);

  useEffect(() => {
    if (isTVDevice) {
      setExpanded(true);
    }
  }, [isTVDevice]);

  return (
    <div
      data-sidebar
      onMouseEnter={!isTVDevice ? () => setExpanded(true) : undefined}
      onMouseLeave={!isTVDevice ? () => setExpanded(false) : undefined}
      className={cn(
        'fixed top-0 h-full z-50 flex flex-col',
        'bg-[hsl(var(--sidebar-background))] transition-all duration-200 ease-out',
        isRTL ? 'right-0 border-s border-[hsl(var(--sidebar-border))]' : 'left-0 border-e border-[hsl(var(--sidebar-border))]',
        isTVDevice ? 'w-56' : expanded ? 'w-52' : 'w-16'
      )}
    >
      <div className="h-16 flex items-center justify-center shrink-0 border-b border-[hsl(var(--sidebar-border))]">
        <div className={cn(
          'flex items-center gap-2 transition-all duration-200',
          expanded || isTVDevice ? 'px-4' : 'px-0'
        )}>
          <Compass className="w-7 h-7 text-primary shrink-0" />
          {(expanded || isTVDevice) && (
            <span className="text-display text-lg text-foreground whitespace-nowrap overflow-hidden">
              STREAM
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 flex flex-col pt-4 gap-1 px-2">
        {tabs.map(({ icon: Icon, labelKey, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              onFocus={() => {
                if (!isTVDevice) setExpanded(true);
              }}
              tabIndex={0}
              className={cn(
                'tv-focus relative flex items-center gap-3 rounded-lg',
                'transition-all duration-150 cursor-pointer',
                'h-12',
                expanded || isTVDevice ? 'px-4' : 'px-0 justify-center',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]'
              )}
            >
              {active && (
                <div className={cn(
                  'absolute top-2 bottom-2 w-[3px] rounded-full bg-primary',
                  isRTL ? 'right-0' : 'left-0'
                )} />
              )}
              <Icon className={cn('w-5 h-5 shrink-0', active && 'drop-shadow-[0_0_6px_hsl(var(--primary))]')} />
              {(expanded || isTVDevice) && (
                <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                  {t(labelKey)}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
