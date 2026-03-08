import { Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  className?: string;
  variant?: 'floating' | 'setting';
  settingItem?: { label: string; desc: string; icon: string };
}

export const LanguageToggle = ({ className, variant = 'floating', settingItem }: LanguageToggleProps) => {
  const { lang, toggleLanguage, dir } = useLanguage();

  if (variant === 'setting' && settingItem) {
    const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;
    return (
      <button
        onClick={toggleLanguage}
        className="w-full glass rounded-xl p-4 flex items-center gap-4 hover:bg-accent transition-colors text-start tv-focus"
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
        'glass-strong rounded-full w-10 h-10 flex items-center justify-center text-foreground hover:bg-accent transition-colors tv-focus',
        className
      )}
      title={lang === 'he' ? 'Switch to English' : 'החלף לעברית'}
    >
      <span className="text-xs font-bold">{lang === 'he' ? 'EN' : 'עב'}</span>
    </button>
  );
};
