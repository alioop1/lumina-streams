import { useLanguage } from '@/contexts/LanguageContext';
import { Puzzle, Check, Plus, ExternalLink } from 'lucide-react';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface Addon {
  id: string;
  name: string;
  nameHe: string;
  description: string;
  descriptionHe: string;
  icon: string;
  installed: boolean;
}

const ADDONS: Addon[] = [
  { id: 'torrentio', name: 'Torrentio', nameHe: 'טורנטיו', description: 'Stream torrents directly', descriptionHe: 'סטרימינג ישיר מטורנטים', icon: '🧲', installed: true },
  { id: 'opensubtitles', name: 'OpenSubtitles', nameHe: 'כתוביות פתוחות', description: 'Automatic subtitles', descriptionHe: 'כתוביות אוטומטיות', icon: '💬', installed: true },
  { id: 'realdebrid', name: 'Real-Debrid', nameHe: 'ריאל דבריד', description: 'Premium link resolver', descriptionHe: 'שירות הורדות פרימיום', icon: '⚡', installed: false },
  { id: 'trakt', name: 'Trakt', nameHe: 'טראקט', description: 'Track your watching', descriptionHe: 'עקוב אחרי הצפייה שלך', icon: '📊', installed: false },
  { id: 'tmdb', name: 'TMDB', nameHe: 'TMDB', description: 'Movie & TV database', descriptionHe: 'מאגר סרטים וסדרות', icon: '🎬', installed: true },
  { id: 'fanart', name: 'Fanart.tv', nameHe: 'Fanart.tv', description: 'Enhanced artwork', descriptionHe: 'אמנות משופרת', icon: '🎨', installed: false },
];

const Addons = () => {
  const { lang, dir } = useLanguage();
  const [addons, setAddons] = useState(ADDONS);

  const toggleAddon = useCallback((id: string) => {
    setAddons(prev => prev.map(a => a.id === id ? { ...a, installed: !a.installed } : a));
  }, []);

  return (
    <div className="min-h-screen bg-background pt-12 3xl:pt-16 4k:pt-20 pb-24 3xl:pb-32 px-12 3xl:px-16 4k:px-20 page-enter" dir={dir}>
      <div className="flex items-center gap-4 mb-8 3xl:mb-10">
        <div className="w-12 h-12 3xl:w-14 3xl:h-14 rounded-xl bg-primary/10 flex items-center justify-center">
          <Puzzle className="w-6 h-6 3xl:w-7 3xl:h-7 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-4xl 3xl:text-5xl 4k:text-6xl text-foreground">
            {lang === 'he' ? 'תוספים' : 'Add-ons'}
          </h1>
          <p className="text-sm 3xl:text-base text-muted-foreground mt-1">
            {lang === 'he' ? 'הרחב את חוויית הצפייה שלך' : 'Extend your viewing experience'}
          </p>
        </div>
      </div>

      <div data-nav-row="addons-list" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-4 3xl:gap-6 max-w-6xl">
        {addons.map(addon => (
          <button
            key={addon.id}
            onClick={() => toggleAddon(addon.id)}
            className={cn(
              'tv-focus glass rounded-2xl 3xl:rounded-3xl p-6 3xl:p-7 flex items-start gap-4 text-start outline-none transition-all',
              addon.installed && 'ring-1 ring-primary/30 bg-primary/5'
            )}
          >
            <span className="text-3xl 3xl:text-4xl flex-shrink-0">{addon.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base 3xl:text-lg font-semibold text-foreground">{lang === 'he' ? addon.nameHe : addon.name}</h3>
                {addon.installed && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
              </div>
              <p className="text-sm 3xl:text-base text-muted-foreground">{lang === 'he' ? addon.descriptionHe : addon.description}</p>
            </div>
            <div className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
              addon.installed ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              {addon.installed ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Addons;
