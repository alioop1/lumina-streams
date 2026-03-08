import { useLanguage } from '@/contexts/LanguageContext';

const Watchlist = () => {
  const { t, dir } = useLanguage();

  return (
    <div className="min-h-screen bg-background pt-12 pb-24 px-4" dir={dir}>
      <h1 className="font-display text-3xl text-foreground mb-6">{t('myList')}</h1>
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <div className="w-20 h-20 rounded-full glass flex items-center justify-center mb-4">
          <span className="text-3xl">📑</span>
        </div>
        <p className="text-muted-foreground">{t('emptyList')}</p>
        <p className="text-sm text-muted-foreground mt-1">{t('addLater')}</p>
      </div>
    </div>
  );
};

export default Watchlist;
