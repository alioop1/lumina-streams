import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, X, Settings, Volume2, Subtitles, ChevronRight, ChevronLeft, Maximize, Minimize, Play, Pause, SkipForward, SkipBack, Loader2, Languages, Download, ExternalLink, Monitor } from 'lucide-react';
import { fetchSubtitles, type SubtitleTrack } from '@/lib/opensubtitles';
import { useRDTranscode } from '@/hooks/useRealDebrid';
import { useLanguage } from '@/contexts/LanguageContext';

interface VideoPlayerProps {
  url: string;
  title: string;
  onBack: () => void;
  imdbId?: string | null;
  mediaType?: 'movie' | 'series';
  season?: number;
  episode?: number;
  rdFileId?: string | null;
  streamLanguages?: string[];
  onSelectAudioLanguage?: (language: string) => void | Promise<void>;
}

type SettingsPanel = 'main' | 'speed' | 'audio' | 'subtitles' | 'external';

interface AudioTrackInfo {
  index: number;
  label: string;
  language: string;
  enabled: boolean;
}

const isWebAudioCodecCompatible = (codec?: string) => {
  if (!codec) return false;
  const c = codec.toLowerCase();
  return c.includes('aac') || c.includes('mp3') || c.includes('opus') || c.includes('vorbis') || c.includes('flac');
};

const PLAYER_KEYCODE_MAP: Record<number, string> = {
  13: 'Enter',
  19: 'ArrowUp',
  20: 'ArrowDown',
  21: 'ArrowLeft',
  22: 'ArrowRight',
  23: 'Enter',
  27: 'Back',
  32: 'Enter',
  37: 'ArrowLeft',
  38: 'ArrowUp',
  39: 'ArrowRight',
  40: 'ArrowDown',
  66: 'Enter',
  4: 'Back',
};

const normalizePlayerKey = (e: KeyboardEvent): string => {
  const k = (e.key || '').toLowerCase();
  if (k === 'arrowup' || k === 'up' || k === 'dpadup') return 'ArrowUp';
  if (k === 'arrowdown' || k === 'down' || k === 'dpaddown') return 'ArrowDown';
  if (k === 'arrowleft' || k === 'left' || k === 'dpadleft') return 'ArrowLeft';
  if (k === 'arrowright' || k === 'right' || k === 'dpadright') return 'ArrowRight';
  if (k === 'enter' || k === 'select' || k === 'ok' || k === 'center') return 'Enter';
  if (k === 'escape' || k === 'backspace' || k === 'goback' || k === 'back') return 'Back';
  if (k === 'mediaplaypause') return 'MediaPlayPause';
  if (k === 'mediarewind') return 'MediaRewind';
  if (k === 'mediafastforward') return 'MediaFastForward';
  if (k === 'mediastop') return 'MediaStop';
  if (k === 'f') return 'f';
  if (k === 'm') return 'm';
  if (k === ' ') return 'Enter';
  if (e.code?.startsWith('Arrow')) return e.code;
  return PLAYER_KEYCODE_MAP[e.keyCode || 0] || '';
};

const getFocusable = (root: ParentNode): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>('.tv-focus')).filter(el => {
    const rect = el.getBoundingClientRect();
    return el.offsetParent !== null && rect.width > 0 && rect.height > 0 && !el.hasAttribute('disabled');
  });

const getCenter = (rect: DOMRect) => ({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });

const findNextFocusable = (
  current: HTMLElement,
  direction: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight',
  candidates: HTMLElement[],
): HTMLElement | null => {
  const currentRect = current.getBoundingClientRect();
  const currentCenter = getCenter(currentRect);

  const filtered = candidates.filter((candidate) => {
    if (candidate === current) return false;
    const candidateCenter = getCenter(candidate.getBoundingClientRect());

    if (direction === 'ArrowRight') return candidateCenter.x > currentCenter.x + 4;
    if (direction === 'ArrowLeft') return candidateCenter.x < currentCenter.x - 4;
    if (direction === 'ArrowDown') return candidateCenter.y > currentCenter.y + 4;
    return candidateCenter.y < currentCenter.y - 4;
  });

  if (filtered.length === 0) return null;

  filtered.sort((a, b) => {
    const aCenter = getCenter(a.getBoundingClientRect());
    const bCenter = getCenter(b.getBoundingClientRect());

    const aPrimary = direction === 'ArrowLeft' || direction === 'ArrowRight'
      ? Math.abs(aCenter.x - currentCenter.x)
      : Math.abs(aCenter.y - currentCenter.y);
    const bPrimary = direction === 'ArrowLeft' || direction === 'ArrowRight'
      ? Math.abs(bCenter.x - currentCenter.x)
      : Math.abs(bCenter.y - currentCenter.y);

    const aCross = direction === 'ArrowLeft' || direction === 'ArrowRight'
      ? Math.abs(aCenter.y - currentCenter.y)
      : Math.abs(aCenter.x - currentCenter.x);
    const bCross = direction === 'ArrowLeft' || direction === 'ArrowRight'
      ? Math.abs(bCenter.y - currentCenter.y)
      : Math.abs(bCenter.x - currentCenter.x);

    return aPrimary * 10 + aCross - (bPrimary * 10 + bCross);
  });

  return filtered[0] ?? null;
};

export const VideoPlayer = ({ url, title, onBack, imdbId, mediaType, season, episode, rdFileId, streamLanguages = [], onSelectAudioLanguage }: VideoPlayerProps) => {
  const { lang, dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | null>(null);
  const lastFocusedControlRef = useRef<HTMLElement | null>(null);
  const { data: transcodeData, isLoading: loadingTranscode } = useRDTranscode(rdFileId || null);

  const [playbackUrl, setPlaybackUrl] = useState(url);
  const [usingTranscode, setUsingTranscode] = useState(false);

  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsPanel, setSettingsPanel] = useState<SettingsPanel>('main');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const [embeddedAudioTracks, setEmbeddedAudioTracks] = useState<AudioTrackInfo[]>([]);
  const [activeAudioIdx, setActiveAudioIdx] = useState<number>(0);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [canSwitchAudioTracks, setCanSwitchAudioTracks] = useState(false);
  const [noAudioDetected, setNoAudioDetected] = useState(false);

  const [availableSubs, setAvailableSubs] = useState<SubtitleTrack[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [activeSub, setActiveSub] = useState<string | null>(null);

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  const defaultAudioLabel = lang === 'he' ? 'ברירת מחדל' : 'Default';

  // i18n labels
  const labels = {
    subtitles: lang === 'he' ? 'כתוביות' : 'Subtitles',
    audio: lang === 'he' ? 'אודיו' : 'Audio',
    downloadSubs: lang === 'he' ? 'הורד כתוביות' : 'Download Subtitles',
    playbackSpeed: lang === 'he' ? 'מהירות ניגון' : 'Playback Speed',
    audioLang: lang === 'he' ? 'שפת אודיו' : 'Audio Language',
    normal: lang === 'he' ? 'רגיל' : 'Normal',
    off: lang === 'he' ? 'כבוי' : 'Off',
    default: defaultAudioLabel,
    loading: lang === 'he' ? 'טוען...' : 'Loading...',
    loadingSubs: lang === 'he' ? 'טוען כתוביות...' : 'Loading subtitles...',
    noAudio: lang === 'he' ? 'האודיו הראשי זמין, אבל אין רצועות נוספות לזיהוי' : 'Primary audio is available, but no additional tracks were detected',
    noSubs: lang === 'he' ? 'אין כתוביות זמינות' : 'No subtitles available',
    cannotSwitchAudio: lang === 'he' ? 'במכשיר/דפדפן הזה לא ניתן להחליף רצועת אודיו מתוך הנגן' : 'Audio track switching is not supported on this device/browser',
    chooseSourceAudio: lang === 'he' ? 'בחר שפה (יחליף מקור):' : 'Choose language (will switch source):',
    transcodeActive: lang === 'he' ? 'מצב תאימות אודיו פעיל' : 'Audio compatibility mode active',
    openExternal: lang === 'he' ? 'פתח בנגן חיצוני' : 'Open in External Player',
    openVlc: lang === 'he' ? 'פתח ב-VLC' : 'Open in VLC',
    openMx: lang === 'he' ? 'פתח ב-MX Player' : 'Open in MX Player',
    openSystem: lang === 'he' ? 'פתח בנגן המערכת' : 'Open in System Player',
    externalPlayerHint: lang === 'he' ? 'לניגון עם כל הקודקים (DTS, AC3, EAC3 וכו\')' : 'For playback with all codecs (DTS, AC3, EAC3, etc.)',
  };

  const openInExternalPlayer = (playerType: 'vlc' | 'mx' | 'system') => {
    const videoUrl = url; // Always use original (not transcoded) URL for external player
    let intentUrl = '';

    switch (playerType) {
      case 'vlc':
        // VLC intent
        intentUrl = `vlc://${videoUrl}`;
        // Try Android intent as fallback
        if (/android/i.test(navigator.userAgent)) {
          intentUrl = `intent://${videoUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=org.videolan.vlc;type=video/*;S.title=${encodeURIComponent(title)};end`;
        }
        break;
      case 'mx':
        // MX Player intent
        if (/android/i.test(navigator.userAgent)) {
          intentUrl = `intent://${videoUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.mxtech.videoplayer.ad;type=video/*;S.title=${encodeURIComponent(title)};end`;
        } else {
          intentUrl = videoUrl; // Fallback: just open URL
        }
        break;
      case 'system':
        // Generic Android video intent
        if (/android/i.test(navigator.userAgent)) {
          intentUrl = `intent://${videoUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;type=video/*;S.title=${encodeURIComponent(title)};end`;
        } else {
          intentUrl = videoUrl;
        }
        break;
    }

    if (intentUrl) {
      window.location.href = intentUrl;
    }
  };

  useEffect(() => {
    setPlaybackUrl(url);
    setUsingTranscode(false);
    setNoAudioDetected(false);
  }, [url]);

  // Prefer RD transcode stream when available to improve codec compatibility
  useEffect(() => {
    if (!transcodeData || isYouTube) return;

    const candidates = Object.values(transcodeData as Record<string, any>)
      .filter((item: any) => item?.full)
      .map((item: any) => ({ full: item.full as string, acodec: (item.acodec as string | undefined) || '' }));

    if (candidates.length === 0) return;

    const preferred = candidates.find((c) => isWebAudioCodecCompatible(c.acodec)) || candidates[0];

    if (preferred?.full && preferred.full !== playbackUrl) {
      setPlaybackUrl(preferred.full);
      setUsingTranscode(true);
    }
  }, [transcodeData, isYouTube, playbackUrl]);

  // Fetch subtitles
  useEffect(() => {
    if (!imdbId || isYouTube) return;
    setLoadingSubs(true);
    fetchSubtitles(mediaType || 'movie', imdbId, season, episode)
      .then(subs => {
        setAvailableSubs(subs);
        const heb = subs.find(s => s.lang === 'heb');
        if (heb) {
          setActiveSub(heb.id);
          addTrackToVideo(heb);
        }
      })
      .finally(() => setLoadingSubs(false));
  }, [imdbId, mediaType, season, episode]);

  // Detect embedded audio tracks from the video element
  useEffect(() => {
    const v = videoRef.current;
    if (!v || isYouTube) return;

    const detectAudioTracks = () => {
      const vAny = v as any;
      const tracks = vAny.audioTracks;

      // Fallback for platforms (Android TV / some Chromium builds) with no audioTracks API
      if (!tracks || typeof tracks.length !== 'number' || tracks.length === 0) {
        setCanSwitchAudioTracks(false);
        setEmbeddedAudioTracks([
          {
            index: 0,
            label: defaultAudioLabel,
            language: '',
            enabled: true,
          },
        ]);
        setActiveAudioIdx(0);
        setLoadingAudio(false);
        return;
      }

      setCanSwitchAudioTracks(true);
      const list: AudioTrackInfo[] = [];
      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        list.push({
          index: i,
          label: t.label || t.language || `Track ${i + 1}`,
          language: t.language || '',
          enabled: t.enabled,
        });
        if (t.enabled) setActiveAudioIdx(i);
      }
      setEmbeddedAudioTracks(list);
      setLoadingAudio(false);
    };

    setLoadingAudio(true);
    v.addEventListener('loadedmetadata', detectAudioTracks);
    // Also try after a short delay for browsers that populate audioTracks late
    const timer = setTimeout(detectAudioTracks, 2000);

    return () => {
      v.removeEventListener('loadedmetadata', detectAudioTracks);
      clearTimeout(timer);
    };
  }, [playbackUrl, isYouTube, defaultAudioLabel]);

  // Detect no-audio via Web Audio API analyzer
  useEffect(() => {
    const v = videoRef.current;
    if (!v || isYouTube) return;

    let ctx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let checkTimer: number | null = null;
    let cancelled = false;

    const checkAudio = () => {
      try {
        ctx = new AudioContext();
        const source = ctx.createMediaElementSource(v);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(ctx.destination);

        const data = new Uint8Array(analyser.frequencyBinCount);
        let silentChecks = 0;
        const maxChecks = 8;

        const check = () => {
          if (cancelled) return;
          analyser!.getByteFrequencyData(data);
          const maxVal = Math.max(...data);
          if (maxVal < 5 && !v.paused && v.currentTime > 1) {
            silentChecks++;
            if (silentChecks >= 3) {
              setNoAudioDetected(true);
              return;
            }
          } else {
            silentChecks = 0;
            setNoAudioDetected(false);
          }
          if (silentChecks < maxChecks) {
            checkTimer = window.setTimeout(check, 1500);
          }
        };

        // Start checking after video plays a bit
        checkTimer = window.setTimeout(check, 3000);
      } catch (e) {
        // Web Audio API not available - skip detection
        console.warn('Audio detection unavailable:', e);
      }
    };

    v.addEventListener('playing', checkAudio, { once: true });

    return () => {
      cancelled = true;
      if (checkTimer) clearTimeout(checkTimer);
      v.removeEventListener('playing', checkAudio);
      if (ctx && ctx.state !== 'closed') {
        try { ctx.close(); } catch {}
      }
    };
  }, [playbackUrl, isYouTube]);

  const fetchSubAsBlob = async (subUrl: string): Promise<string> => {
    try {
      const res = await fetch(subUrl);
      const text = await res.text();
      let vttContent = text;
      if (!text.trimStart().startsWith('WEBVTT')) {
        vttContent = 'WEBVTT\n\n' + text
          .replace(/\r\n/g, '\n')
          .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
      }
      const blob = new Blob([vttContent], { type: 'text/vtt' });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error('Failed to fetch subtitle:', e);
      return subUrl;
    }
  };

  const addTrackToVideo = async (sub: SubtitleTrack) => {
    const v = videoRef.current;
    if (!v) return;
    while (v.textTracks.length > 0) {
      const track = v.querySelector('track');
      if (track) track.remove();
      else break;
    }
    const blobUrl = await fetchSubAsBlob(sub.url);
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = sub.label;
    track.srclang = sub.lang;
    track.src = blobUrl;
    track.default = true;
    v.appendChild(track);
    setTimeout(() => {
      if (v.textTracks[0]) v.textTracks[0].mode = 'showing';
    }, 100);
  };

  const selectSubtitle = (sub: SubtitleTrack | null) => {
    const v = videoRef.current;
    if (!v) return;
    if (!sub) {
      for (let i = 0; i < v.textTracks.length; i++) v.textTracks[i].mode = 'hidden';
      setActiveSub(null);
    } else {
      setActiveSub(sub.id);
      addTrackToVideo(sub);
    }
    setSettingsPanel('main');
    setShowSettings(false);
  };

  const handleDownloadSubtitle = () => {
    const targetSub = availableSubs.find((s) => s.id === activeSub) || availableSubs[0];
    if (!targetSub) return;
    const a = document.createElement('a');
    a.href = targetSub.url;
    a.download = `${title}.${targetSub.lang}.vtt`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const resetHideTimer = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setShowControls(true);
    hideTimerRef.current = window.setTimeout(() => {
      if (isPlaying && !showSettings) setShowControls(false);
    }, 3000);
  }, [isPlaying, showSettings]);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [resetHideTimer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDuration = () => setDuration(video.duration);
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onVolumeChange = () => { setVolume(video.volume); setIsMuted(video.muted); };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onDuration);
    video.addEventListener('durationchange', onDuration);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('playing', onCanPlay);
    video.addEventListener('volumechange', onVolumeChange);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onDuration);
      video.removeEventListener('durationchange', onDuration);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('playing', onCanPlay);
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, []);

  // ========== Smart TV remote navigation ==========
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const v = videoRef.current;
      const root = containerRef.current;
      if (!root) return;

      const key = normalizePlayerKey(e);
      if (!key) return;

      const active = document.activeElement as HTMLElement | null;
      const activeInsidePlayer = !!active && root.contains(active);
      const activeInSettings = !!active?.closest('[data-player-settings-panel="true"]');

      const focusDefaultControl = () => {
        const fallback = root.querySelector<HTMLElement>('[data-player-default="true"]');
        fallback?.focus();
      };

      // Always keep controls visible on remote interaction
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'MediaPlayPause'].includes(key)) {
        resetHideTimer();
      }

      if (key === 'Back') {
        e.preventDefault();
        if (showSettings) {
          if (settingsPanel !== 'main') setSettingsPanel('main');
          else {
            setShowSettings(false);
            requestAnimationFrame(focusDefaultControl);
          }
          return;
        }
        onBack();
        return;
      }

      if (showSettings) {
        const settingsPanelEl = root.querySelector<HTMLElement>('[data-player-settings-panel="true"]');
        const settingsItems = settingsPanelEl ? getFocusable(settingsPanelEl) : [];

        if (settingsItems.length === 0) return;

        if (!activeInSettings) {
          e.preventDefault();
          settingsItems[0].focus();
          return;
        }

        const index = active ? settingsItems.indexOf(active) : -1;

        if (key === 'Enter') {
          e.preventDefault();
          active?.click();
          return;
        }

        if (key === 'ArrowDown' || key === 'ArrowUp') {
          e.preventDefault();
          const nextIndex = key === 'ArrowDown'
            ? Math.min(settingsItems.length - 1, index + 1)
            : Math.max(0, index - 1);
          settingsItems[Math.max(0, nextIndex)]?.focus();
          return;
        }

        // Close settings with sideways arrow toward player controls
        const towardControls = isRTL ? 'ArrowRight' : 'ArrowLeft';
        if (key === towardControls && settingsPanel === 'main') {
          e.preventDefault();
          setShowSettings(false);
          requestAnimationFrame(focusDefaultControl);
        }
        return;
      }

      if (key === 'Enter') {
        if (activeInsidePlayer && active?.classList.contains('tv-focus')) {
          e.preventDefault();
          active.click();
          return;
        }
        if (v) {
          e.preventDefault();
          v.paused ? v.play() : v.pause();
        }
        return;
      }

      if (key === 'MediaPlayPause') {
        if (!v) return;
        e.preventDefault();
        v.paused ? v.play() : v.pause();
        return;
      }

      if (key === 'MediaStop') {
        e.preventDefault();
        if (v) v.pause();
        onBack();
        return;
      }

      if (key === 'f') {
        e.preventDefault();
        toggleFullscreen();
        return;
      }

      if (key === 'm') {
        if (!v) return;
        e.preventDefault();
        v.muted = !v.muted;
        return;
      }

      if (key === 'MediaRewind') {
        if (!v) return;
        e.preventDefault();
        v.currentTime = Math.max(0, v.currentTime - 30);
        return;
      }

      if (key === 'MediaFastForward') {
        if (!v) return;
        e.preventDefault();
        v.currentTime = Math.min(v.duration, v.currentTime + 30);
        return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        e.preventDefault();

        // If overlay is hidden, arrows act as quick playback controls
        if (!showControls) {
          if (!v) return;
          if (key === 'ArrowLeft') v.currentTime = Math.max(0, v.currentTime - 10);
          if (key === 'ArrowRight') v.currentTime = Math.min(v.duration, v.currentTime + 10);
          if (key === 'ArrowUp') v.volume = Math.min(1, v.volume + 0.1);
          if (key === 'ArrowDown') v.volume = Math.max(0, v.volume - 0.1);
          return;
        }

        const controls = getFocusable(root).filter((el) => !el.closest('[data-player-settings-panel="true"]'));
        if (controls.length === 0) return;

        const current = activeInsidePlayer && active?.classList.contains('tv-focus') ? active : null;
        if (!current) {
          focusDefaultControl();
          return;
        }

        const next = findNextFocusable(current, key as 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight', controls);
        if (next) {
          next.focus();
          lastFocusedControlRef.current = next;
          return;
        }

        // Smart fallback if no focus target in that direction
        if (v && key === 'ArrowLeft') v.currentTime = Math.max(0, v.currentTime - 10);
        if (v && key === 'ArrowRight') v.currentTime = Math.min(v.duration, v.currentTime + 10);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [showSettings, settingsPanel, onBack, resetHideTimer, showControls, isRTL]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || !target.classList.contains('tv-focus')) return;
      if (target.closest('[data-player-settings-panel="true"]')) return;
      lastFocusedControlRef.current = target;
    };

    root.addEventListener('focusin', onFocusIn);
    return () => root.removeEventListener('focusin', onFocusIn);
  }, []);

  useEffect(() => {
    if (!showControls || showSettings) return;
    const root = containerRef.current;
    if (!root) return;

    const active = document.activeElement as HTMLElement | null;
    const activeIsUsable = !!active && root.contains(active) && active.classList.contains('tv-focus') && !active.closest('[data-player-settings-panel="true"]');
    if (activeIsUsable) return;

    const preferred = (lastFocusedControlRef.current && root.contains(lastFocusedControlRef.current))
      ? lastFocusedControlRef.current
      : root.querySelector<HTMLElement>('[data-player-default="true"]');

    if (preferred) requestAnimationFrame(() => preferred.focus());
  }, [showControls, showSettings]);

  useEffect(() => {
    if (!showSettings || !showControls) return;
    const root = containerRef.current;
    if (!root) return;

    requestAnimationFrame(() => {
      const first = root.querySelector<HTMLElement>('[data-player-settings-panel="true"] .tv-focus');
      first?.focus();
    });
  }, [showSettings, settingsPanel, showControls]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  };

  const seek = (seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + seconds));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = parseFloat(e.target.value);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const val = parseFloat(e.target.value);
    v.volume = val;
    v.muted = val === 0;
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
  };

  const setSpeed = (speed: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = speed;
    setPlaybackSpeed(speed);
    setSettingsPanel('main');
  };

  const selectAudioTrack = (trackIdx: number) => {
    const v = videoRef.current;
    if (!v) return;

    if (!canSwitchAudioTracks) {
      setSettingsPanel('main');
      setShowSettings(false);
      return;
    }

    const vAny = v as any;
    const tracks = vAny.audioTracks;
    if (!tracks) return;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].enabled = i === trackIdx;
    }
    setActiveAudioIdx(trackIdx);
    setSettingsPanel('main');
    setShowSettings(false);
  };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      await el.requestFullscreen();
      setIsFullscreen(true);
    }
  };

  const formatTime = (s: number) => {
    if (!isFinite(s)) return '0:00';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
      : `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const NavChevron = isRTL ? ChevronRight : ChevronLeft;
  const BackChevron = isRTL ? ChevronLeft : ChevronRight;

  if (isYouTube) {
    return (
      <div ref={containerRef} data-video-player="true" className="fixed inset-0 z-50 bg-black flex flex-col" dir={dir}>
        <div className="absolute top-4 start-4 end-4 z-10 flex items-center justify-between">
          <button onClick={onBack} data-player-default="true" className="glass w-10 h-10 rounded-full flex items-center justify-center text-foreground tv-focus">
            <BackArrow className="w-5 h-5" />
          </button>
          <h2 className="text-foreground text-sm font-medium truncate max-w-[60%]">{title}</h2>
          <button onClick={onBack} className="glass w-10 h-10 rounded-full flex items-center justify-center text-foreground tv-focus">
            <X className="w-5 h-5" />
          </button>
        </div>
        <iframe src={url} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={title} />
      </div>
    );
  }

  const activeSubLabel = availableSubs.find(s => s.id === activeSub)?.label || labels.off;

  return (
    <div
      ref={containerRef}
      dir={dir}
      data-video-player="true"
      className="fixed inset-0 z-50 bg-black flex items-center justify-center cursor-pointer select-none"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('[data-controls]')) return;
        togglePlay();
        resetHideTimer();
      }}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      <video
        key={playbackUrl}
        ref={videoRef}
        src={playbackUrl}
        className="w-full h-full object-contain"
        autoPlay
        playsInline
      />

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      )}

      {/* No audio warning banner - with external player buttons */}
      {noAudioDetected && !isBuffering && (
        <div className="absolute top-20 start-1/2 -translate-x-1/2 z-20 bg-yellow-500/90 text-black px-6 py-4 rounded-xl text-sm font-semibold shadow-lg max-w-lg" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 mb-3">
            <Volume2 className="w-5 h-5 flex-shrink-0" />
            {lang === 'he'
              ? 'לא זוהה אודיו — הקודק לא נתמך בדפדפן.'
              : 'No audio detected — codec not supported in browser.'}
            <button onClick={() => setNoAudioDetected(false)} className="ms-auto text-black/60 hover:text-black tv-focus">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => openInExternalPlayer('vlc')} className="flex items-center gap-1.5 bg-black/20 hover:bg-black/30 text-black px-3 py-2 rounded-lg transition-colors tv-focus text-xs font-bold">
              <ExternalLink className="w-4 h-4" /> {labels.openVlc}
            </button>
            <button onClick={() => openInExternalPlayer('mx')} className="flex items-center gap-1.5 bg-black/20 hover:bg-black/30 text-black px-3 py-2 rounded-lg transition-colors tv-focus text-xs font-bold">
              <ExternalLink className="w-4 h-4" /> {labels.openMx}
            </button>
            <button onClick={() => openInExternalPlayer('system')} className="flex items-center gap-1.5 bg-black/20 hover:bg-black/30 text-black px-3 py-2 rounded-lg transition-colors tv-focus text-xs font-bold">
              <Monitor className="w-4 h-4" /> {labels.openSystem}
            </button>
          </div>
        </div>
      )}

      {/* Side toolbar removed - controls are in bottom bar */}

      <div
        data-controls
        className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors tv-focus">
            <BackArrow className="w-5 h-5" />
          </button>
          <h2 className="text-white text-sm font-medium truncate max-w-[60%]">{title}</h2>
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors tv-focus">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center controls */}
        <div className="flex items-center justify-center gap-8">
          <button onClick={() => seek(-10)} className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors tv-focus">
            <SkipBack className="w-6 h-6" />
          </button>
          <button onClick={togglePlay} data-player-default="true" className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors tv-focus">
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ms-1" />}
          </button>
          <button onClick={() => seek(10)} className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors tv-focus">
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        {/* Bottom bar */}
        <div className="p-4 bg-gradient-to-t from-black/70 to-transparent space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-white text-xs min-w-[40px]">{formatTime(currentTime)}</span>
            <div className="relative flex-1 h-6 flex items-center group">
              <div className="absolute inset-x-0 h-1 bg-white/20 rounded-full group-hover:h-1.5 transition-all">
                <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <input type="range" min={0} max={duration || 0} value={currentTime} onChange={handleSeek} className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer" step={0.1} />
            </div>
            <span className="text-white text-xs min-w-[40px] text-end">{formatTime(duration)}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors tv-focus">
                <Volume2 className="w-5 h-5" />
              </button>
              <div className="w-20 relative h-6 flex items-center">
                <div className="absolute inset-x-0 h-1 bg-white/20 rounded-full">
                  <div className="h-full bg-white rounded-full" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} />
                </div>
                <input type="range" min={0} max={1} step={0.05} value={isMuted ? 0 : volume} onChange={handleVolume} className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
              {playbackSpeed !== 1 && <span className="text-white text-xs bg-white/10 px-2 py-0.5 rounded">{playbackSpeed}x</span>}
            </div>

            <div className="flex items-center gap-1">
              <button onClick={() => { setShowSettings(!showSettings); setSettingsPanel('main'); }} className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors tv-focus">
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={() => { setSettingsPanel('audio'); setShowSettings(true); }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors tv-focus"
              >
                <Languages className="w-5 h-5" />
              </button>
              <button
                onClick={() => { setSettingsPanel('subtitles'); setShowSettings(true); }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors tv-focus ${activeSub ? 'text-primary bg-white/10' : 'text-white hover:bg-white/10'}`}
              >
                <Subtitles className="w-5 h-5" />
              </button>
              <button
                onClick={handleDownloadSubtitle}
                disabled={availableSubs.length === 0}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed tv-focus"
              >
                <Download className="w-5 h-5" />
              </button>
              <button onClick={toggleFullscreen} className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors tv-focus">
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
              <button
                onClick={() => openInExternalPlayer('vlc')}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors tv-focus"
                title={labels.openExternal}
              >
                <ExternalLink className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && showControls && (
        <div
          data-controls
          data-player-settings-panel="true"
          className="absolute bottom-24 end-4 w-64 max-h-80 overflow-y-auto bg-black/90 backdrop-blur-lg rounded-xl border border-white/10 text-white text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {settingsPanel === 'main' && (
            <div className="py-1">
              <button onClick={() => setSettingsPanel('speed')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/10 transition-colors tv-focus">
                <span>{labels.playbackSpeed}</span>
                <span className="text-white/60 flex items-center gap-1">{playbackSpeed === 1 ? labels.normal : `${playbackSpeed}x`} <NavChevron className="w-4 h-4" /></span>
              </button>
              <button onClick={() => setSettingsPanel('audio')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/10 transition-colors tv-focus">
                <span>{labels.audioLang}</span>
                <span className="text-white/60 flex items-center gap-1">
                  {embeddedAudioTracks[activeAudioIdx]?.label || labels.default}
                  {loadingAudio && <Loader2 className="w-3 h-3 animate-spin" />}
                  <NavChevron className="w-4 h-4" />
                </span>
              </button>
              <button onClick={() => setSettingsPanel('subtitles')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/10 transition-colors tv-focus">
                <span>{labels.subtitles}</span>
                <span className="text-white/60 flex items-center gap-1">
                  {activeSubLabel}
                  {loadingSubs && <Loader2 className="w-3 h-3 animate-spin" />}
                  <NavChevron className="w-4 h-4" />
                </span>
              </button>
            </div>
          )}

          {settingsPanel === 'speed' && (
            <div className="py-1">
              <button onClick={() => setSettingsPanel('main')} className="w-full px-4 py-2 flex items-center gap-2 text-white/60 hover:bg-white/10 transition-colors border-b border-white/10 tv-focus">
                <BackChevron className="w-4 h-4" /> {labels.playbackSpeed}
              </button>
              {speeds.map(s => (
                <button key={s} onClick={() => setSpeed(s)} className={`w-full px-4 py-2.5 text-start hover:bg-white/10 transition-colors flex items-center justify-between tv-focus ${playbackSpeed === s ? 'text-primary' : ''}`}>
                  {s === 1 ? `${labels.normal} (1x)` : `${s}x`}
                  {playbackSpeed === s && <span className="text-primary">✓</span>}
                </button>
              ))}
            </div>
          )}

          {settingsPanel === 'audio' && (
            <div className="py-1">
              <button onClick={() => setSettingsPanel('main')} className="w-full px-4 py-2 flex items-center gap-2 text-white/60 hover:bg-white/10 transition-colors border-b border-white/10 tv-focus">
                <BackChevron className="w-4 h-4" /> {labels.audioLang}
              </button>

              {!canSwitchAudioTracks && (
                <div className="px-4 py-2 text-white/40 text-xs text-center space-y-2">
                  <div>{labels.cannotSwitchAudio}</div>
                  {(loadingTranscode || usingTranscode) && (
                    <div className="text-primary">{labels.transcodeActive}</div>
                  )}
                  {streamLanguages.length > 0 && onSelectAudioLanguage && (
                    <div className="pt-1">
                      <div className="text-white/60 mb-2">{labels.chooseSourceAudio}</div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {streamLanguages.map((language) => (
                          <button
                            key={language}
                            onClick={() => {
                              Promise.resolve(onSelectAudioLanguage(language));
                              setShowSettings(false);
                              setSettingsPanel('main');
                            }}
                            className="px-3 py-1 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors tv-focus"
                          >
                            {language}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {embeddedAudioTracks.length === 0 ? (
                <div className="px-4 py-3 text-white/40 text-center">
                  {loadingAudio ? labels.loading : labels.noAudio}
                </div>
              ) : (
                embeddedAudioTracks.map((track) => (
                  <button
                    key={track.index}
                    onClick={() => selectAudioTrack(track.index)}
                    disabled={!canSwitchAudioTracks}
                    className={`w-full px-4 py-2.5 text-start hover:bg-white/10 transition-colors flex items-center justify-between tv-focus disabled:opacity-60 ${activeAudioIdx === track.index ? 'text-primary' : ''}`}
                  >
                    <div>
                      <div>{track.label}</div>
                      {track.language && track.language !== track.label && <div className="text-xs text-white/40">{track.language}</div>}
                    </div>
                    {activeAudioIdx === track.index && <span className="w-2 h-2 rounded-full bg-green-400" />}
                  </button>
                ))
              )}
            </div>
          )}

          {settingsPanel === 'subtitles' && (
            <div className="py-1">
              <button onClick={() => setSettingsPanel('main')} className="w-full px-4 py-2 flex items-center gap-2 text-white/60 hover:bg-white/10 transition-colors border-b border-white/10 tv-focus">
                <BackChevron className="w-4 h-4" /> {labels.subtitles}
              </button>
              {loadingSubs && (
                <div className="px-4 py-3 flex items-center justify-center gap-2 text-white/40">
                  <Loader2 className="w-4 h-4 animate-spin" /> {labels.loadingSubs}
                </div>
              )}
              <button
                onClick={() => selectSubtitle(null)}
                className={`w-full px-4 py-2.5 text-start hover:bg-white/10 transition-colors flex items-center justify-between tv-focus ${!activeSub ? 'text-primary' : ''}`}
              >
                {labels.off}
                {!activeSub && <span className="text-primary">✓</span>}
              </button>
              {availableSubs.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => selectSubtitle(sub)}
                  className={`w-full px-4 py-2.5 text-start hover:bg-white/10 transition-colors flex items-center justify-between tv-focus ${activeSub === sub.id ? 'text-primary' : ''}`}
                >
                  {sub.label}
                  {activeSub === sub.id && <span className="text-primary">✓</span>}
                </button>
              ))}
              {!loadingSubs && availableSubs.length === 0 && (
                <div className="px-4 py-3 text-white/40 text-center">{labels.noSubs}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
