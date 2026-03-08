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

interface Props {
  collapsed: boolean;
}

export const AppSidebar = ({ collapsed }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const isRTL = dir === 'rtl';

  return (
    <nav
      data-sidebar
      className={cn(
        'fixed top-0 h-full z-50 flex flex-col transition-all duration-200',
        'bg-sidebar border-sidebar-border',
        collapsed ? 'w-16' : 'w-56',
        isRTL ? 'right-0 border-s' : 'left-0 border-e'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 shrink-0 border-b border-sidebar-border justify-center">
        <Compass className="w-7 h-7 text-primary shrink-0" />
        {!collapsed && (
          <span className="font-display text-lg text-foreground ms-2 tracking-wider whitespace-nowrap">STREAM</span>
        )}
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
                'tv-focus relative flex items-center rounded-lg h-12 transition-colors duration-100',
                collapsed ? 'justify-center px-0' : 'gap-3 px-4',
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
              {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{t(labelKey)}</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
