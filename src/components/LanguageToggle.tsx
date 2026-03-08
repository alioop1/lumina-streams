import { Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  className?: string;
  variant?: 'floating' | 'setting' | 'setting-tv';
  settingItem?: { label: string; desc: string; icon: React.ReactNode };
}

export const LanguageToggle = ({ className, variant = 'floating', settingItem }: LanguageToggleProps) => {
  const { lang, toggleLanguage, dir } = useLanguage();
  const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  if (variant === 'setting-tv' && settingItem) {
    return (
      <button
        onClick={toggleLanguage}
        className="tv-focus w-full glass rounded-2xl p-6 flex items-center gap-5 text-start outline-none transition-all group"
      >
        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-muted-foreground flex-shrink-0 transition-colors group-focus-visible:bg-primary/20 group-focus-visible:text-primary">
          {settingItem.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground">{settingItem.label}</h3>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{settingItem.desc}</p>
        </div>
        <span className="text-sm font-bold text-primary me-2">
          {lang === 'he' ? 'EN' : 'עב'}
        </span>
        <ChevronIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </button>
    );
  }

  if (variant === 'setting' && settingItem) {
    return (
      <button
        onClick={toggleLanguage}
        className="w-full glass rounded-xl p-4 flex items-center gap-4 text-start tv-focus"
      >
        <span className="text-2xl">{settingItem.icon}</span>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-foreground">{settingItem.label}</h3>
          <p className="text-xs text-muted-foreground">{settingItem.desc}</p>
        </div>
        <span className="text-xs font-semibold text-primary me-2">
          {lang === 'he' ? 'EN' : 'עב'}
        </span>
        <ChevronIcon className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleLanguage}
      className={cn(
        'glass-strong rounded-full w-10 h-10 flex items-center justify-center text-foreground tv-focus',
        className
      )}
      title={lang === 'he' ? 'Switch to English' : 'החלף לעברית'}
    >
      <span className="text-xs font-bold">{lang === 'he' ? 'EN' : 'עב'}</span>
    </button>
  );
};
