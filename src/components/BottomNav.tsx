import { Home, Search, Bookmark, Download, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/lib/translations';

const tabs: { icon: typeof Home; labelKey: TranslationKey; path: string }[] = [
  { icon: Home, labelKey: 'home', path: '/' },
  { icon: Search, labelKey: 'search', path: '/search' },
  { icon: Bookmark, labelKey: 'watchlist', path: '/watchlist' },
  { icon: Download, labelKey: 'downloads', path: '/downloads' },
  { icon: Settings, labelKey: 'settings', path: '/settings' },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ icon: Icon, labelKey, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 px-3 py-2 transition-colors tv-focus ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t(labelKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
