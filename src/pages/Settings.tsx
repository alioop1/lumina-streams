import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Settings, Monitor, Subtitles, Bell, Globe, Trash2, Info, Film, Type, Keyboard } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSettings, VideoQuality, SubtitleSize, UISize } from '@/contexts/SettingsContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { cn } from '@/lib/utils';

type SettingPanel = null | 'videoQuality' | 'subtitles' | 'uiSize' | 'notifications' | 'cache' | 'shortcuts';

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

  const PanelShell = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="min-h-screen bg-background p-8 3xl:p-12 4k:p-16" dir={dir}>
      <div data-nav-row="settings-back" className="mb-8 3xl:mb-10">
        <button
          onClick={() => setActivePanel(null)}
          className="tv-focus flex items-center gap-3 text-muted-foreground rounded-xl 3xl:rounded-2xl px-4 3xl:px-6 py-3 3xl:py-4 glass outline-none text-base 3xl:text-lg"
        >
          <BackIcon className="w-5 h-5 3xl:w-6 3xl:h-6" />
          <span className="font-medium">{lang === 'he' ? 'חזרה להגדרות' : 'Back to Settings'}</span>
        </button>
      </div>
      <h1 className="font-display text-4xl 3xl:text-5xl 4k:text-6xl text-foreground mb-8 3xl:mb-10">{title}</h1>
      {children}
    </div>
  );

  const OptionButton = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={cn(
        'tv-focus w-full rounded-xl 3xl:rounded-2xl p-5 3xl:p-6 4k:p-7 flex items-center justify-between text-start outline-none transition-all',
        selected ? 'bg-primary/10 ring-2 ring-primary' : 'glass'
      )}
    >
      <span className="text-base 3xl:text-lg 4k:text-xl text-foreground font-medium">{label}</span>
      {selected && <Check className="w-6 h-6 3xl:w-7 3xl:h-7 text-primary flex-shrink-0" />}
    </button>
  );

  if (activePanel === 'videoQuality') {
    return (
      <PanelShell title={t('videoQuality')}>
        <div data-nav-row="settings-options" className="space-y-3 3xl:space-y-4 max-w-2xl 3xl:max-w-3xl">
          {qualityOptions.map(opt => (
            <OptionButton key={opt.value} label={opt.label} selected={settings.videoQuality === opt.value} onClick={() => settings.setVideoQuality(opt.value)} />
          ))}
        </div>
      </PanelShell>
    );
  }

  if (activePanel === 'subtitles') {
    return (
      <PanelShell title={t('subtitles')}>
        <div className="max-w-2xl 3xl:max-w-3xl space-y-8 3xl:space-y-10">
          <div>
            <h3 className="text-lg 3xl:text-xl 4k:text-2xl font-semibold text-foreground mb-4 3xl:mb-6">{lang === 'he' ? 'שפת כתוביות' : 'Subtitle Language'}</h3>
            <div data-nav-row="sub-lang" className="space-y-3 3xl:space-y-4">
              {subLangOptions.map(opt => (
                <OptionButton
                  key={opt.value}
                  label={opt.label}
                  selected={settings.subtitleLang === opt.value}
                  onClick={() => { settings.setSubtitleLang(opt.value); settings.setSubtitleEnabled(opt.value !== 'off'); }}
                />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg 3xl:text-xl 4k:text-2xl font-semibold text-foreground mb-4 3xl:mb-6">{lang === 'he' ? 'גודל כתוביות' : 'Subtitle Size'}</h3>
            <div data-nav-row="sub-size" className="space-y-3 3xl:space-y-4">
              {subSizeOptions.map(opt => (
                <OptionButton key={opt.value} label={opt.label} selected={settings.subtitleSize === opt.value} onClick={() => settings.setSubtitleSize(opt.value)} />
              ))}
            </div>
          </div>
        </div>
      </PanelShell>
    );
  }

  if (activePanel === 'uiSize') {
    return (
      <PanelShell title={t('uiSize')}>
        <div data-nav-row="settings-options" className="space-y-3 3xl:space-y-4 max-w-2xl 3xl:max-w-3xl">
          {uiSizeOptions.map(opt => (
            <OptionButton key={opt.value} label={opt.label} selected={settings.uiSize === opt.value} onClick={() => settings.setUISize(opt.value)} />
          ))}
        </div>
      </PanelShell>
    );
  }

  if (activePanel === 'notifications') {
    return (
      <PanelShell title={t('notifications')}>
        <div data-nav-row="notif-toggle" className="max-w-2xl 3xl:max-w-3xl">
          <button
            onClick={() => settings.setNotifications(!settings.notifications)}
            className="tv-focus w-full glass rounded-xl 3xl:rounded-2xl p-5 3xl:p-6 4k:p-7 flex items-center justify-between outline-none"
          >
            <div className="flex items-center gap-4 3xl:gap-5">
              <Bell className="w-6 h-6 3xl:w-7 3xl:h-7 text-muted-foreground" />
              <span className="text-base 3xl:text-lg 4k:text-xl text-foreground font-medium">{lang === 'he' ? 'התראות פוש' : 'Push Notifications'}</span>
            </div>
            <div className={cn('w-14 3xl:w-16 h-8 3xl:h-9 rounded-full transition-colors relative flex-shrink-0', settings.notifications ? 'bg-primary' : 'bg-muted')}>
              <div className={cn('w-6 3xl:w-7 h-6 3xl:h-7 rounded-full bg-foreground absolute top-1 transition-all', settings.notifications ? 'end-1' : 'start-1')} />
            </div>
          </button>
        </div>
      </PanelShell>
    );
  }

  if (activePanel === 'cache') {
    return (
      <PanelShell title={t('cache')}>
        <div data-nav-row="cache-action" className="max-w-2xl 3xl:max-w-3xl">
          <button
            onClick={settings.clearCache}
            className="tv-focus w-full bg-destructive text-destructive-foreground rounded-xl 3xl:rounded-2xl p-5 3xl:p-6 4k:p-7 font-semibold text-base 3xl:text-lg 4k:text-xl outline-none flex items-center justify-center gap-3"
          >
            <Trash2 className="w-5 h-5 3xl:w-6 3xl:h-6" />
            {lang === 'he' ? 'נקה מטמון ורענן' : 'Clear Cache & Refresh'}
          </button>
        </div>
      </PanelShell>
    );
  }

  // Feature: Keyboard shortcuts panel
  if (activePanel === 'shortcuts') {
    const shortcuts = [
      { key: 'Space / Enter', desc: lang === 'he' ? 'הפעל/השהה' : 'Play/Pause' },
      { key: '← →', desc: lang === 'he' ? 'דלג 10 שניות' : 'Seek ±10s' },
      { key: '↑ ↓', desc: lang === 'he' ? 'עוצמת קול' : 'Volume' },
      { key: 'F', desc: lang === 'he' ? 'מסך מלא' : 'Fullscreen' },
      { key: 'M', desc: lang === 'he' ? 'השתק' : 'Mute' },
      { key: 'Esc', desc: lang === 'he' ? 'חזרה' : 'Back' },
    ];
    return (
      <PanelShell title={lang === 'he' ? 'קיצורי מקלדת' : 'Keyboard Shortcuts'}>
        <div data-nav-row="settings-options" className="space-y-3 3xl:space-y-4 max-w-2xl 3xl:max-w-3xl">
          {shortcuts.map(s => (
            <div key={s.key} className="glass rounded-xl 3xl:rounded-2xl p-5 3xl:p-6 flex items-center justify-between">
              <span className="text-base 3xl:text-lg text-foreground font-medium">{s.desc}</span>
              <kbd className="bg-secondary text-foreground px-3 3xl:px-4 py-1.5 3xl:py-2 rounded-lg text-sm 3xl:text-base font-mono">{s.key}</kbd>
            </div>
          ))}
        </div>
      </PanelShell>
    );
  }

  const qualityLabel = qualityOptions.find(q => q.value === settings.videoQuality)?.label || '';
  const subLangLabel = subLangOptions.find(s => s.value === settings.subtitleLang)?.label || '';
  const uiSizeLabel = uiSizeOptions.find(s => s.value === settings.uiSize)?.label || '';

  const iconMap: Record<string, React.ReactNode> = {
    videoQuality: <Film className="w-6 h-6 3xl:w-7 3xl:h-7" />,
    subtitles: <Subtitles className="w-6 h-6 3xl:w-7 3xl:h-7" />,
    notifications: <Bell className="w-6 h-6 3xl:w-7 3xl:h-7" />,
    language: <Globe className="w-6 h-6 3xl:w-7 3xl:h-7" />,
    uiSize: <Type className="w-6 h-6 3xl:w-7 3xl:h-7" />,
    cache: <Trash2 className="w-6 h-6 3xl:w-7 3xl:h-7" />,
    shortcuts: <Keyboard className="w-6 h-6 3xl:w-7 3xl:h-7" />,
    about: <Info className="w-6 h-6 3xl:w-7 3xl:h-7" />,
  };

  const settingsItems = [
    { key: 'videoQuality', label: t('videoQuality'), desc: qualityLabel, panel: 'videoQuality' as SettingPanel },
    { key: 'subtitles', label: t('subtitles'), desc: subLangLabel, panel: 'subtitles' as SettingPanel },
    { key: 'notifications', label: t('notifications'), desc: settings.notifications ? (lang === 'he' ? 'מופעל' : 'On') : (lang === 'he' ? 'כבוי' : 'Off'), panel: 'notifications' as SettingPanel },
    { key: 'language', label: t('language'), desc: t('languageDesc'), isLang: true },
    { key: 'uiSize', label: t('uiSize'), desc: uiSizeLabel, panel: 'uiSize' as SettingPanel },
    { key: 'shortcuts', label: lang === 'he' ? 'קיצורי מקלדת' : 'Keyboard Shortcuts', desc: lang === 'he' ? 'צפה בקיצורים' : 'View shortcuts', panel: 'shortcuts' as SettingPanel },
    { key: 'cache', label: t('cache'), desc: t('cacheDesc'), panel: 'cache' as SettingPanel },
    { key: 'about', label: t('about'), desc: t('aboutDesc') },
  ];

  return (
    <div className="min-h-screen bg-background ps-16 pe-8 py-8 3xl:ps-20 3xl:pe-12 3xl:py-12 4k:ps-24 4k:pe-16 4k:py-16 page-enter" dir={dir}>
      <div className="flex items-center gap-4 3xl:gap-5 mb-10 3xl:mb-12">
        <div className="w-12 h-12 3xl:w-14 3xl:h-14 4k:w-16 4k:h-16 rounded-xl 3xl:rounded-2xl bg-primary/10 flex items-center justify-center">
          <Settings className="w-6 h-6 3xl:w-7 3xl:h-7 4k:w-8 4k:h-8 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-4xl 3xl:text-5xl 4k:text-6xl text-foreground">{t('settingsTitle')}</h1>
          <p className="text-sm 3xl:text-base 4k:text-lg text-muted-foreground mt-1">
            {lang === 'he' ? 'התאם את האפליקציה לטעמך' : 'Customize your experience'}
          </p>
        </div>
      </div>

      <div data-nav-row="settings-list" className="space-y-3 3xl:space-y-4 max-w-3xl 3xl:max-w-4xl">
        {settingsItems.map(item =>
          item.isLang ? (
            <LanguageToggle key={item.key} variant="setting-tv" settingItem={{ ...item, icon: iconMap[item.key] }} />
          ) : (
            <button
              key={item.key}
              onClick={() => item.panel ? setActivePanel(item.panel) : undefined}
              className="tv-focus w-full glass rounded-2xl 3xl:rounded-3xl p-6 3xl:p-7 4k:p-8 flex items-center gap-5 3xl:gap-6 text-start outline-none transition-all group"
            >
              <div className="w-12 h-12 3xl:w-14 3xl:h-14 4k:w-16 4k:h-16 rounded-xl 3xl:rounded-2xl bg-accent flex items-center justify-center text-muted-foreground flex-shrink-0 transition-colors group-focus-visible:bg-primary/20 group-focus-visible:text-primary">
                {iconMap[item.key]}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base 3xl:text-lg 4k:text-xl font-semibold text-foreground">{item.label}</h3>
                <p className="text-sm 3xl:text-base 4k:text-lg text-muted-foreground mt-0.5 truncate">{item.desc}</p>
              </div>
              {item.panel && <ChevronIcon className="w-5 h-5 3xl:w-6 3xl:h-6 text-muted-foreground flex-shrink-0" />}
            </button>
          )
        )}
      </div>

      <div className="mt-12 3xl:mt-16 text-center">
        <p className="text-xs 3xl:text-sm text-muted-foreground">Lumina Streams v1.0.0</p>
      </div>
    </div>
  );
};

export default SettingsPage;