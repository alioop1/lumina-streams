import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

export type VideoQuality = 'auto' | '4k' | '1080p' | '720p' | '480p';
export type SubtitleSize = 'small' | 'medium' | 'large';
export type UISize = 'small' | 'medium' | 'large';

interface SettingsContextType {
  videoQuality: VideoQuality;
  setVideoQuality: (q: VideoQuality) => void;
  subtitleLang: string;
  setSubtitleLang: (l: string) => void;
  subtitleSize: SubtitleSize;
  setSubtitleSize: (s: SubtitleSize) => void;
  subtitleEnabled: boolean;
  setSubtitleEnabled: (e: boolean) => void;
  uiSize: UISize;
  setUISize: (s: UISize) => void;
  notifications: boolean;
  setNotifications: (n: boolean) => void;
  clearCache: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const load = <T,>(key: string, fallback: T): T => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [videoQuality, _setVideoQuality] = useState<VideoQuality>(() => load('setting-video-quality', 'auto'));
  const [subtitleLang, _setSubtitleLang] = useState(() => load('setting-sub-lang', 'heb'));
  const [subtitleSize, _setSubtitleSize] = useState<SubtitleSize>(() => load('setting-sub-size', 'medium'));
  const [subtitleEnabled, _setSubtitleEnabled] = useState(() => load('setting-sub-enabled', true));
  const [uiSize, _setUISize] = useState<UISize>(() => load('setting-ui-size', 'medium'));
  const [notifications, _setNotifications] = useState(() => load('setting-notifications', true));

  const persist = (key: string, value: any) => localStorage.setItem(key, JSON.stringify(value));

  const setVideoQuality = useCallback((q: VideoQuality) => { _setVideoQuality(q); persist('setting-video-quality', q); }, []);
  const setSubtitleLang = useCallback((l: string) => { _setSubtitleLang(l); persist('setting-sub-lang', l); }, []);
  const setSubtitleSize = useCallback((s: SubtitleSize) => { _setSubtitleSize(s); persist('setting-sub-size', s); }, []);
  const setSubtitleEnabled = useCallback((e: boolean) => { _setSubtitleEnabled(e); persist('setting-sub-enabled', e); }, []);
  const setUISize = useCallback((s: UISize) => { _setUISize(s); persist('setting-ui-size', s); }, []);
  const setNotifications = useCallback((n: boolean) => { _setNotifications(n); persist('setting-notifications', n); }, []);

  const clearCache = useCallback(() => {
    if ('caches' in window) {
      caches.keys().then(names => names.forEach(name => caches.delete(name)));
    }
    // Clear query cache
    const keys = Object.keys(localStorage).filter(k => k.startsWith('tmdb-') || k.startsWith('REACT_QUERY'));
    keys.forEach(k => localStorage.removeItem(k));
    window.location.reload();
  }, []);

  // Apply UI size as CSS variable
  useEffect(() => {
    const scale = uiSize === 'small' ? '0.85' : uiSize === 'large' ? '1.15' : '1';
    document.documentElement.style.setProperty('--ui-scale', scale);
    document.documentElement.style.fontSize = uiSize === 'small' ? '14px' : uiSize === 'large' ? '18px' : '16px';
  }, [uiSize]);

  return (
    <SettingsContext.Provider value={{
      videoQuality, setVideoQuality,
      subtitleLang, setSubtitleLang,
      subtitleSize, setSubtitleSize,
      subtitleEnabled, setSubtitleEnabled,
      uiSize, setUISize,
      notifications, setNotifications,
      clearCache,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};
