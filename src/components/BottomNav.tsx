import { Home, Search, Bookmark, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  { icon: Home, label: 'בית', path: '/' },
  { icon: Search, label: 'חיפוש', path: '/search' },
  { icon: Bookmark, label: 'רשימה', path: '/watchlist' },
  { icon: Settings, label: 'הגדרות', path: '/settings' },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {tabs.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
