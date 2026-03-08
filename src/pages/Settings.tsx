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

  // Sub-panel: render options list
  const renderOptionPanel = (
    title: string,
    options: { value: string; label: string }[],
    currentValue: string,
    onSelect: (v: any) => void
  ) => (
    <div className="min-h-screen bg-background pt-12 pb-24 px-6" dir={dir}>
      <div data-nav-row="settings-back">
        <button onClick={() => setActivePanel(null)} className="tv-focus flex items-center gap-2 text-muted-foreground mb-6 outline-none">
          <BackIcon className="w-5 h-5" />
          <span className="text-sm">{lang === 'he' ? 'חזרה' : 'Back'}</span>
        </button>
      </div>
      <h1 className="font-display text-3xl text-foreground mb-6">{title}</h1>
      <div data-nav-row="settings-options" className="space-y-2">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={cn('tv-focus w-full glass rounded-xl p-4 flex items-center justify-between text-start outline-none', currentValue === opt.value && 'ring-2 ring-primary')}
          >
            <span className="text-sm text-foreground">{opt.label}</span>
            {currentValue === opt.value && <Check className="w-5 h-5 text-primary" />}
          </button>
        ))}
      </div>
    </div>
  );

  if (activePanel === 'videoQuality') {
    return renderOptionPanel(t('videoQuality'), qualityOptions, settings.videoQuality, settings.setVideoQuality);
  }

  if (activePanel === 'subtitles') {
    return (
      <div className="min-h-screen bg-background pt-12 pb-24 px-6" dir={dir}>
        <div data-nav-row="settings-back">
          <button onClick={() => setActivePanel(null)} className="tv-focus flex items-center gap-2 text-muted-foreground mb-6 outline-none">
            <BackIcon className="w-5 h-5" />
            <span className="text-sm">{lang === 'he' ? 'חזרה' : 'Back'}</span>
          </button>
        </div>
        <h1 className="font-display text-3xl text-foreground mb-6">{t('subtitles')}</h1>
        <h3 className="text-sm font-medium text-foreground mb-3">{lang === 'he' ? 'שפת כתוביות' : 'Subtitle Language'}</h3>
        <div data-nav-row="sub-lang" className="space-y-2 mb-8">
          {subLangOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => { settings.setSubtitleLang(opt.value); settings.setSubtitleEnabled(opt.value !== 'off'); }}
              className={cn('tv-focus w-full glass rounded-xl p-4 flex items-center justify-between text-start outline-none', settings.subtitleLang === opt.value && 'ring-2 ring-primary')}
            >
              <span className="text-sm text-foreground">{opt.label}</span>
              {settings.subtitleLang === opt.value && <Check className="w-5 h-5 text-primary" />}
            </button>
          ))}
        </div>
        <h3 className="text-sm font-medium text-foreground mb-3">{lang === 'he' ? 'גודל כתוביות' : 'Subtitle Size'}</h3>
        <div data-nav-row="sub-size" className="space-y-2">
          {subSizeOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => settings.setSubtitleSize(opt.value)}
              className={cn('tv-focus w-full glass rounded-xl p-4 flex items-center justify-between text-start outline-none', settings.subtitleSize === opt.value && 'ring-2 ring-primary')}
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
    return renderOptionPanel(t('uiSize'), uiSizeOptions, settings.uiSize, settings.setUISize);
  }

  if (activePanel === 'notifications') {
    return (
      <div className="min-h-screen bg-background pt-12 pb-24 px-6" dir={dir}>
        <div data-nav-row="settings-back">
          <button onClick={() => setActivePanel(null)} className="tv-focus flex items-center gap-2 text-muted-foreground mb-6 outline-none">
            <BackIcon className="w-5 h-5" />
            <span className="text-sm">{lang === 'he' ? 'חזרה' : 'Back'}</span>
          </button>
        </div>
        <h1 className="font-display text-3xl text-foreground mb-6">{t('notifications')}</h1>
        <div data-nav-row="notif-toggle">
          <button
            onClick={() => settings.setNotifications(!settings.notifications)}
            className="tv-focus w-full glass rounded-xl p-4 flex items-center justify-between outline-none"
          >
            <span className="text-sm text-foreground">{lang === 'he' ? 'התראות פוש' : 'Push Notifications'}</span>
            <div className={cn('w-12 h-7 rounded-full transition-colors relative', settings.notifications ? 'bg-primary' : 'bg-muted')}>
              <div className={cn('w-5 h-5 rounded-full bg-foreground absolute top-1 transition-all', settings.notifications ? 'end-1' : 'start-1')} />
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (activePanel === 'cache') {
    return (
      <div className="min-h-screen bg-background pt-12 pb-24 px-6" dir={dir}>
        <div data-nav-row="settings-back">
          <button onClick={() => setActivePanel(null)} className="tv-focus flex items-center gap-2 text-muted-foreground mb-6 outline-none">
            <BackIcon className="w-5 h-5" />
            <span className="text-sm">{lang === 'he' ? 'חזרה' : 'Back'}</span>
          </button>
        </div>
        <h1 className="font-display text-3xl text-foreground mb-6">{t('cache')}</h1>
        <div data-nav-row="cache-action">
          <button
            onClick={settings.clearCache}
            className="tv-focus w-full bg-destructive text-destructive-foreground rounded-xl p-4 font-medium outline-none"
          >
            {lang === 'he' ? 'נקה מטמון ורענן' : 'Clear Cache & Refresh'}
          </button>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-background pt-12 pb-24 px-6" dir={dir}>
      <h1 className="font-display text-3xl text-foreground mb-6">{t('settingsTitle')}</h1>

      <div data-nav-row="settings-list" className="space-y-2">
        {settingsItems.map(item => (
          item.isLang ? (
            <LanguageToggle key={item.key} variant="setting" settingItem={item} />
          ) : (
            <button
              key={item.key}
              onClick={() => item.panel ? setActivePanel(item.panel) : undefined}
              className="tv-focus w-full glass rounded-xl p-4 flex items-center gap-4 text-start outline-none"
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
