import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const Watchlist = () => {
  const { t, dir, lang } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pt-12 pb-24 px-6" dir={dir}>
      <h1 className="font-display text-3xl text-foreground mb-6">{t('myList')}</h1>
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <div className="w-20 h-20 rounded-full glass flex items-center justify-center mb-4">
          <span className="text-3xl">📑</span>
        </div>
        <p className="text-muted-foreground">{t('emptyList')}</p>
        <p className="text-sm text-muted-foreground mt-1">{t('addLater')}</p>
        <div data-nav-row="watchlist-action" className="mt-5">
          <button
            onClick={() => navigate('/search')}
            className="tv-focus bg-primary text-primary-foreground rounded-lg px-6 py-3 text-sm font-semibold outline-none"
          >
            {lang === 'he' ? 'חפש משהו לצפייה' : 'Find Something to Watch'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Watchlist;
