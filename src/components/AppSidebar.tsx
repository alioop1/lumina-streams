import { Home, Search, Bookmark, Download, Settings, Compass } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { TranslationKey } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect, useCallback } from 'react';

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
  const [expanded, setExpanded] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Handle D-pad navigation for Android TV
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, tabs.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (isRTL) {
          // In RTL, ArrowRight opens sidebar
          setExpanded(true);
        } else {
          // In LTR, ArrowRight exits sidebar
          setExpanded(false);
          const mainContent = document.querySelector('main');
          const firstFocusable = mainContent?.querySelector<HTMLElement>('[tabindex], a, button, input');
          firstFocusable?.focus();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (isRTL) {
          // In RTL, ArrowLeft exits sidebar
          setExpanded(false);
          const mainContent = document.querySelector('main');
          const firstFocusable = mainContent?.querySelector<HTMLElement>('[tabindex], a, button, input');
          firstFocusable?.focus();
        } else {
          // In LTR, ArrowLeft opens sidebar
          setExpanded(true);
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusedIndex >= 0) {
          navigate(tabs[focusedIndex].path);
        }
        break;
    }
  }, [focusedIndex, navigate, isRTL]);

  useEffect(() => {
    if (focusedIndex >= 0 && buttonRefs.current[focusedIndex]) {
      buttonRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  // Collapse when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={sidebarRef}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onKeyDown={handleKeyDown}
      className={cn(
        'fixed top-0 h-full z-50 flex flex-col',
        'bg-[hsl(var(--sidebar-background))] transition-all duration-200 ease-out',
        isRTL ? 'right-0 border-s border-[hsl(var(--sidebar-border))]' : 'left-0 border-e border-[hsl(var(--sidebar-border))]',
        expanded ? 'w-52' : 'w-16'
      )}
    >
      {/* Logo area */}
      <div className="h-16 flex items-center justify-center shrink-0 border-b border-[hsl(var(--sidebar-border))]">
        <div className={cn(
          'flex items-center gap-2 transition-all duration-200',
          expanded ? 'px-4' : 'px-0'
        )}>
          <Compass className="w-7 h-7 text-primary shrink-0" />
          {expanded && (
            <span className="text-display text-lg text-foreground whitespace-nowrap overflow-hidden">
              STREAM
            </span>
          )}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col pt-4 gap-1 px-2">
        {tabs.map(({ icon: Icon, labelKey, path }, index) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              ref={el => { buttonRefs.current[index] = el; }}
              onClick={() => navigate(path)}
              onFocus={() => setFocusedIndex(index)}
              tabIndex={0}
              className={cn(
                'tv-focus relative flex items-center gap-3 rounded-lg',
                'transition-all duration-150 cursor-pointer',
                'h-12',
                expanded ? 'px-4' : 'px-0 justify-center',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]',
              )}
            >
              {/* Active indicator bar */}
              {active && (
                <div className={cn(
                  'absolute top-2 bottom-2 w-[3px] rounded-full bg-primary',
                  isRTL ? 'right-0' : 'left-0'
                )} />
              )}
              <Icon className={cn('w-5 h-5 shrink-0', active && 'drop-shadow-[0_0_6px_hsl(var(--primary))]')} />
              {expanded && (
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
