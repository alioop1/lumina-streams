import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSettings, VideoQuality, SubtitleSize, UISize } from '@/contexts/SettingsContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { cn } from '@/lib/utils';

type SettingPanel = null | 'videoQuality' | 'subtitles' | 'uiSize' | 'notifications' | 'cache';

const SettingsPage = () => {
  const { t, dir, lang } = useLanguage();
  const settings = useSettings();
  const [activePanel, setActivePanel] = useState<SettingPanel>(null);
  const ChevronIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;

  const qualityOptions: { value: VideoQuality; label: string }[] = [
    { value: 'auto', label: lang === 'he' ? 'אוטומטי' : 'Auto' },
    { value: '4k', label: '4K Ultra HD' },
    { value: '1080p', label: '1080p Full HD' },
    { value: '720p', label: '720p HD' },
    { value: '480p', label: '480p SD' },
  ];

  const subSizeOptions: { value: SubtitleSize; label: string }[] = [
    { value: 'small', label: lang === 'he' ? 'קטן' : 'Small' },
    { value: 'medium', label: lang === 'he' ? 'בינוני' : 'Medium' },
    { value: 'large', label: lang === 'he' ? 'גדול' : 'Large' },
  ];

  const subLangOptions = [
    { value: 'heb', label: lang === 'he' ? 'עברית' : 'Hebrew' },
    { value: 'eng', label: lang === 'he' ? 'אנגלית' : 'English' },
    { value: 'ara', label: lang === 'he' ? 'ערבית' : 'Arabic' },
    { value: 'rus', label: lang === 'he' ? 'רוסית' : 'Russian' },
    { value: 'off', label: lang === 'he' ? 'כבוי' : 'Off' },
  ];

  const uiSizeOptions: { value: UISize; label: string }[] = [
    { value: 'small', label: lang === 'he' ? 'קטן' : 'Small' },
    { value: 'medium', label: lang === 'he' ? 'רגיל' : 'Normal' },
    { value: 'large', label: lang === 'he' ? 'גדול (TV)' : 'Large (TV)' },
  ];

  const qualityLabel = qualityOptions.find(q => q.value === settings.videoQuality)?.label || '';
  const subLangLabel = subLangOptions.find(s => s.value === settings.subtitleLang)?.label || '';
  const uiSizeLabel = uiSizeOptions.find(s => s.value === settings.uiSize)?.label || '';

  const settingsItems = [
    { key: 'videoQuality', label: t('videoQuality'), desc: qualityLabel, icon: '🎬', panel: 'videoQuality' as SettingPanel },
    { key: 'subtitles', label: t('subtitles'), desc: subLangLabel, icon: '💬', panel: 'subtitles' as SettingPanel },
    { key: 'notifications', label: t('notifications'), desc: settings.notifications ? (lang === 'he' ? 'מופעל' : 'On') : (lang === 'he' ? 'כבוי' : 'Off'), icon: '🔔', panel: 'notifications' as SettingPanel },
    { key: 'language', label: t('language'), desc: t('languageDesc'), icon: '🌐', isLang: true },
    { key: 'uiSize', label: t('uiSize'), desc: uiSizeLabel, icon: '🔤', panel: 'uiSize' as SettingPanel },
    { key: 'cache', label: t('cache'), desc: t('cacheDesc'), icon: '🗑️', panel: 'cache' as SettingPanel },
    { key: 'about', label: t('about'), desc: t('aboutDesc'), icon: 'ℹ️' },
  ];

  // Sub-panels
  if (activePanel === 'videoQuality') {
    return (
      <div className="min-h-screen bg-background pt-12 pb-24 px-4" dir={dir}>
        <button onClick={() => setActivePanel(null)} className="flex items-center gap-2 text-muted-foreground mb-6 tv-focus">
          <BackIcon className="w-5 h-5" />
          <span className="text-sm">{lang === 'he' ? 'חזרה' : 'Back'}</span>
        </button>
        <h1 className="font-display text-3xl text-foreground mb-6">{t('videoQuality')}</h1>
        <div className="space-y-2">
          {qualityOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => settings.setVideoQuality(opt.value)}
              className={cn('w-full glass rounded-xl p-4 flex items-center justify-between tv-focus text-start transition-colors', settings.videoQuality === opt.value && 'ring-2 ring-primary')}
            >
              <span className="text-sm text-foreground">{opt.label}</span>
              {settings.videoQuality === opt.value && <Check className="w-5 h-5 text-primary" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (activePanel === 'subtitles') {
    return (
      <div className="min-h-screen bg-background pt-12 pb-24 px-4" dir={dir}>
        <button onClick={() => setActivePanel(null)} className="flex items-center gap-2 text-muted-foreground mb-6 tv-focus">
          <BackIcon className="w-5 h-5" />
          <span className="text-sm">{lang === 'he' ? 'חזרה' : 'Back'}</span>
        </button>
        <h1 className="font-display text-3xl text-foreground mb-6">{t('subtitles')}</h1>
        
        <h3 className="text-sm font-medium text-foreground mb-3">{lang === 'he' ? 'שפת כתוביות ברירת מחדל' : 'Default Subtitle Language'}</h3>
        <div className="space-y-2 mb-8">
          {subLangOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                settings.setSubtitleLang(opt.value);
                settings.setSubtitleEnabled(opt.value !== 'off');
              }}
              className={cn('w-full glass rounded-xl p-4 flex items-center justify-between tv-focus text-start transition-colors', settings.subtitleLang === opt.value && 'ring-2 ring-primary')}
            >
              <span className="text-sm text-foreground">{opt.label}</span>
              {settings.subtitleLang === opt.value && <Check className="w-5 h-5 text-primary" />}
            </button>
          ))}
        </div>

        <h3 className="text-sm font-medium text-foreground mb-3">{lang === 'he' ? 'גודל כתוביות' : 'Subtitle Size'}</h3>
        <div className="space-y-2">
          {subSizeOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => settings.setSubtitleSize(opt.value)}
              className={cn('w-full glass rounded-xl p-4 flex items-center justify-between tv-focus text-start transition-colors', settings.subtitleSize === opt.value && 'ring-2 ring-primary')}
            >
              <span className="text-sm text-foreground">{opt.label}</span>
              {settings.subtitleSize === opt.value && <Check className="w-5 h-5 text-primary" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (activePanel === 'uiSize') {
    return (
      <div className="min-h-screen bg-background pt-12 pb-24 px-4" dir={dir}>
        <button onClick={() => setActivePanel(null)} className="flex items-center gap-2 text-muted-foreground mb-6 tv-focus">
          <BackIcon className="w-5 h-5" />
          <span className="text-sm">{lang === 'he' ? 'חזרה' : 'Back'}</span>
        </button>
        <h1 className="font-display text-3xl text-foreground mb-6">{t('uiSize')}</h1>
        <div className="space-y-2">
          {uiSizeOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => settings.setUISize(opt.value)}
              className={cn('w-full glass rounded-xl p-4 flex items-center justify-between tv-focus text-start transition-colors', settings.uiSize === opt.value && 'ring-2 ring-primary')}
            >
              <span className="text-sm text-foreground">{opt.label}</span>
              {settings.uiSize === opt.value && <Check className="w-5 h-5 text-primary" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (activePanel === 'notifications') {
    return (
      <div className="min-h-screen bg-background pt-12 pb-24 px-4" dir={dir}>
        <button onClick={() => setActivePanel(null)} className="flex items-center gap-2 text-muted-foreground mb-6 tv-focus">
          <BackIcon className="w-5 h-5" />
          <span className="text-sm">{lang === 'he' ? 'חזרה' : 'Back'}</span>
        </button>
        <h1 className="font-display text-3xl text-foreground mb-6">{t('notifications')}</h1>
        <button
          onClick={() => settings.setNotifications(!settings.notifications)}
          className="w-full glass rounded-xl p-4 flex items-center justify-between tv-focus"
        >
          <span className="text-sm text-foreground">{lang === 'he' ? 'התראות פוש' : 'Push Notifications'}</span>
          <div className={cn(
            'w-12 h-7 rounded-full transition-colors relative',
            settings.notifications ? 'bg-primary' : 'bg-muted'
          )}>
            <div className={cn(
              'w-5 h-5 rounded-full bg-foreground absolute top-1 transition-all',
              settings.notifications ? 'end-1' : 'start-1'
            )} />
          </div>
        </button>
      </div>
    );
  }

  if (activePanel === 'cache') {
    return (
      <div className="min-h-screen bg-background pt-12 pb-24 px-4" dir={dir}>
        <button onClick={() => setActivePanel(null)} className="flex items-center gap-2 text-muted-foreground mb-6 tv-focus">
          <BackIcon className="w-5 h-5" />
          <span className="text-sm">{lang === 'he' ? 'חזרה' : 'Back'}</span>
        </button>
        <h1 className="font-display text-3xl text-foreground mb-6">{t('cache')}</h1>
        <button
          onClick={settings.clearCache}
          className="w-full bg-destructive text-destructive-foreground rounded-xl p-4 font-medium tv-focus"
        >
          {lang === 'he' ? 'נקה מטמון ורענן' : 'Clear Cache & Refresh'}
        </button>
        <p className="text-xs text-muted-foreground mt-3">
          {lang === 'he' ? 'פעולה זו תנקה את כל הנתונים השמורים ותרענן את האפליקציה.' : 'This will clear all cached data and refresh the app.'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-12 pb-24 px-4" dir={dir}>
      <h1 className="font-display text-3xl text-foreground mb-6">{t('settingsTitle')}</h1>

      <div className="space-y-2">
        {settingsItems.map(item => (
          item.isLang ? (
            <LanguageToggle key={item.key} variant="setting" settingItem={item} />
          ) : (
            <button
              key={item.key}
              onClick={() => item.panel ? setActivePanel(item.panel) : undefined}
              className="w-full glass rounded-xl p-4 flex items-center gap-4 hover:bg-accent transition-colors text-start tv-focus"
            >
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-foreground">{item.label}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              {item.panel && <ChevronIcon className="w-4 h-4 text-muted-foreground" />}
            </button>
          )
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
