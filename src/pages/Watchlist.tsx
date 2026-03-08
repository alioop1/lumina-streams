import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Bookmark, Clock, Trash2 } from 'lucide-react';

interface ResumeEntry {
  key: string;
  imdbId: string;
  position: number;
  title?: string;
}

const Watchlist = () => {
  const { t, dir, lang } = useLanguage();
  const navigate = useNavigate();
  const [resumeList, setResumeList] = useState<ResumeEntry[]>([]);

  // Feature: Show "Continue Watching" from localStorage resume data
  useEffect(() => {
    const entries: ResumeEntry[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('resume_')) {
        const val = parseFloat(localStorage.getItem(key) || '0');
        if (val > 30) {
          const parts = key.replace('resume_', '').split('_');
          entries.push({ key, imdbId: parts[0], position: val, title: parts[0] });
        }
      }
    }
    setResumeList(entries);
  }, []);

  const clearResume = (key: string) => {
    localStorage.removeItem(key);
    setResumeList(prev => prev.filter(e => e.key !== key));
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="min-h-screen bg-background pt-12 3xl:pt-16 4k:pt-20 pb-24 3xl:pb-32 px-6 3xl:px-10 4k:px-14" dir={dir}>
      <h1 className="font-display text-3xl 3xl:text-4xl 4k:text-5xl text-foreground mb-6 3xl:mb-8">{t('myList')}</h1>

      {/* Feature: Continue Watching section */}
      {resumeList.length > 0 && (
        <div className="mb-8 3xl:mb-10">
          <h2 className="flex items-center gap-2 3xl:gap-3 text-lg 3xl:text-xl 4k:text-2xl font-semibold text-foreground mb-4 3xl:mb-6">
            <Clock className="w-5 h-5 3xl:w-6 3xl:h-6 text-primary" />
            {lang === 'he' ? 'המשך צפייה' : 'Continue Watching'}
          </h2>
          <div data-nav-row="resume-list" className="space-y-2 3xl:space-y-3 max-w-3xl 3xl:max-w-4xl">
            {resumeList.map(entry => (
              <div key={entry.key} className="glass rounded-xl 3xl:rounded-2xl p-4 3xl:p-5 4k:p-6 flex items-center gap-4 3xl:gap-5">
                <div className="w-10 h-10 3xl:w-12 3xl:h-12 rounded-lg 3xl:rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 3xl:w-6 3xl:h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm 3xl:text-base font-medium text-foreground truncate" dir="ltr">{entry.imdbId}</p>
                  <p className="text-xs 3xl:text-sm text-muted-foreground">
                    {lang === 'he' ? 'עצרת ב-' : 'Stopped at '}{formatTime(entry.position)}
                  </p>
                </div>
                <button
                  onClick={() => clearResume(entry.key)}
                  className="tv-focus p-2 text-muted-foreground outline-none"
                >
                  <Trash2 className="w-4 h-4 3xl:w-5 3xl:h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center h-[40vh] 3xl:h-[45vh] text-center">
        <div className="w-20 h-20 3xl:w-24 3xl:h-24 4k:w-28 4k:h-28 rounded-full glass flex items-center justify-center mb-4 3xl:mb-6">
          <Bookmark className="w-8 h-8 3xl:w-10 3xl:h-10 4k:w-12 4k:h-12 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-base 3xl:text-lg 4k:text-xl">{t('emptyList')}</p>
        <p className="text-sm 3xl:text-base text-muted-foreground mt-1">{t('addLater')}</p>
        <div data-nav-row="watchlist-action" className="mt-5 3xl:mt-7">
          <button
            onClick={() => navigate('/search')}
            className="tv-focus bg-primary text-primary-foreground rounded-lg 3xl:rounded-xl px-6 3xl:px-8 4k:px-10 py-3 3xl:py-4 text-sm 3xl:text-base 4k:text-lg font-semibold outline-none"
          >
            {lang === 'he' ? 'חפש משהו לצפייה' : 'Find Something to Watch'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Watchlist;