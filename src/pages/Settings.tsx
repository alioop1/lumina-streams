import { ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

const SettingsPage = () => {
  const { t, dir, lang } = useLanguage();

  const settingsItems = [
    { label: t('account'), desc: t('accountDesc'), icon: '👤' },
    { label: t('videoQuality'), desc: t('videoQualityDesc'), icon: '🎬' },
    { label: t('subtitles'), desc: t('subtitlesDesc'), icon: '💬' },
    { label: t('notifications'), desc: t('notificationsDesc'), icon: '🔔' },
    { label: t('language'), desc: t('languageDesc'), icon: '🌐', isLang: true },
    { label: t('uiSize'), desc: t('uiSizeDesc'), icon: '🔤' },
    { label: t('cache'), desc: t('cacheDesc'), icon: '🗑️' },
    { label: t('about'), desc: t('aboutDesc'), icon: 'ℹ️' },
  ];

  const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div className="min-h-screen bg-background pt-12 pb-24 px-4" dir={dir}>
      <h1 className="font-display text-3xl text-foreground mb-6">{t('settingsTitle')}</h1>

      <div className="space-y-2">
        {settingsItems.map(item => (
          item.isLang ? (
            <LanguageToggle key={item.label} variant="setting" settingItem={item} />
          ) : (
            <button
              key={item.label}
              className="w-full glass rounded-xl p-4 flex items-center gap-4 hover:bg-accent transition-colors text-start tv-focus"
            >
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-foreground">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronIcon className="w-4 h-4 text-muted-foreground" />
            </button>
          )
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
