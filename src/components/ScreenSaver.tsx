import { useIdleDetection } from '@/hooks/useIdleDetection';
import { useLanguage } from '@/contexts/LanguageContext';
import { Play } from 'lucide-react';

export const ScreenSaver = () => {
  const { isIdle, resetIdle } = useIdleDetection(5 * 60 * 1000);
  const { lang } = useLanguage();

  if (!isIdle) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center cursor-pointer"
      onClick={resetIdle}
      onKeyDown={resetIdle}
    >
      <div className="animate-pulse">
        <div className="w-20 h-20 3xl:w-28 3xl:h-28 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Play className="w-10 h-10 3xl:w-14 3xl:h-14 text-primary fill-primary" />
        </div>
      </div>
      <h2 className="text-2xl 3xl:text-4xl font-display text-foreground mb-2">
        Lumina Streams
      </h2>
      <p className="text-muted-foreground text-sm 3xl:text-lg">
        {lang === 'he' ? 'לחץ על כל מקש כדי להמשיך' : 'Press any key to continue'}
      </p>
      <div className="absolute bottom-8 text-xs text-muted-foreground/50">
        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
};
