import { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import {
  ArrowLeft, ArrowRight, X, Settings, Volume2, Subtitles,
  ChevronRight, ChevronLeft, Maximize, Minimize, Play, Pause,
  SkipForward, SkipBack, Loader2, Languages, Download,
  ExternalLink,
} from 'lucide-react';
import { fetchSubtitles, type SubtitleTrack } from '@/lib/opensubtitles';
import { useRDTranscode } from '@/hooks/useRealDebrid';
import { useLanguage } from '@/contexts/LanguageContext';

/* ═══════════════════ Types ═══════════════════ */

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

/* ═══════════════════ TV-remote helpers ═══════════════════ */

const KEYCODE_MAP: Record<number, string> = {
  13: 'Enter', 19: 'ArrowUp', 20: 'ArrowDown', 21: 'ArrowLeft',
  22: 'ArrowRight', 23: 'Enter', 27: 'Back', 32: 'Enter',
  37: 'ArrowLeft', 38: 'ArrowUp', 39: 'ArrowRight', 40: 'ArrowDown',
  66: 'Enter', 4: 'Back',
};

const normalizeKey = (e: KeyboardEvent): string => {
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
  return KEYCODE_MAP[e.keyCode || 0] || '';
};

const getFocusable = (root: ParentNode): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>('.tv-focus')).filter(el => {
    const r = el.getBoundingClientRect();
    return el.offsetParent !== null && r.width > 0 && r.height > 0 && !el.hasAttribute('disabled');
  });

const getCenter = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

const findNext = (
  current: HTMLElement,
  dir: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight',
  candidates: HTMLElement[],
): HTMLElement | null => {
  const cc = getCenter(current.getBoundingClientRect());
  const filtered = candidates.filter(c => {
    if (c === current) return false;
    const tc = getCenter(c.getBoundingClientRect());
    if (dir === 'ArrowRight') return tc.x > cc.x + 4;
    if (dir === 'ArrowLeft') return tc.x < cc.x - 4;
    if (dir === 'ArrowDown') return tc.y > cc.y + 4;
    return tc.y < cc.y - 4;
  });
  if (!filtered.length) return null;
  filtered.sort((a, b) => {
    const ac = getCenter(a.getBoundingClientRect());
    const bc = getCenter(b.getBoundingClientRect());
    const horiz = dir === 'ArrowLeft' || dir === 'ArrowRight';
    const ap = horiz ? Math.abs(ac.x - cc.x) : Math.abs(ac.y - cc.y);
    const bp = horiz ? Math.abs(bc.x - cc.x) : Math.abs(bc.y - cc.y);
    const ax = horiz ? Math.abs(ac.y - cc.y) : Math.abs(ac.x - cc.x);
    const bx = horiz ? Math.abs(bc.y - cc.y) : Math.abs(bc.x - cc.x);
    return ap * 10 + ax - (bp * 10 + bx);
  });
  return filtered[0] ?? null;
};

/* ═══════════════════ Component ═══════════════════ */

export const VideoPlayer = ({
  url, title, onBack, imdbId, mediaType, season, episode,
  rdFileId, streamLanguages = [], onSelectAudioLanguage,
}: VideoPlayerProps) => {
  const { lang, dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const attemptedSourcesRef = useRef<Set<string>>(new Set());

  const { data: transcodeData } = useRDTranscode(rdFileId || null);

  // ── State ──
  const [playbackUrl, setPlaybackUrl] = useState(url);
  const [, setPlaybackMode] = useState<'direct' | 'transcode'>('direct');
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

  const [availableSubs, setAvailableSubs] = useState<SubtitleTrack[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [needsTranscodeFallback, setNeedsTranscodeFallback] = useState(false);

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // ── i18n ──
  const t = (he: string, en: string) => (lang === 'he' ? he : en);
  const labels = {
    subtitles: t('כתוביות', 'Subtitles'),
    audio: t('אודיו', 'Audio'),
    playbackSpeed: t('מהירות ניגון', 'Playback Speed'),
    audioLang: t('שפת אודיו', 'Audio Language'),
    normal: t('רגיל', 'Normal'),
    off: t('כבוי', 'Off'),
    default: t('ברירת מחדל', 'Default'),
    loading: t('טוען...', 'Loading...'),
    loadingSubs: t('טוען כתוביות...', 'Loading subtitles...'),
    noSubs: t('אין כתוביות זמינות', 'No subtitles available'),
    openExternal: t('פתח בנגן חיצוני', 'Open in External Player'),
    openVlc: t('פתח ב-VLC', 'Open in VLC'),
    openMx: t('פתח ב-MX Player', 'Open in MX Player'),
    openSystem: t('פתח בנגן המערכת', 'Open in System Player'),
    externalHint: t('לניגון עם כל הקודקים', 'For playback with all codecs'),
    chooseSource: t('בחר שפה (יחליף מקור):', 'Choose language (will switch source):'),
    downloadSubs: t('הורד כתוביות', 'Download Subtitles'),
  };

  useEffect(() => {
    attemptedSourcesRef.current = new Set([url]);
    setPlaybackUrl(url);
    setPlaybackMode('direct');
    setNeedsTranscodeFallback(false);
    setIsBuffering(true);
  }, [url]);

  const getTranscodeCandidates = useCallback(() => {
    const td = transcodeData as Record<string, any> | undefined;
    return [
      td?.apple?.full as string | undefined,
      td?.liveMP4?.full as string | undefined,
      td?.h264WebM?.full as string | undefined,
    ].filter(Boolean) as string[];
  }, [transcodeData]);

  const switchSource = useCallback((nextUrl: string, reason: string) => {
    if (!nextUrl || attemptedSourcesRef.current.has(nextUrl) || nextUrl === playbackUrl) return false;
    attemptedSourcesRef.current.add(nextUrl);
    setPlaybackMode('transcode');
    setPlaybackUrl(nextUrl);
    setIsBuffering(true);
    console.info(`Switching playback source (${reason})`, nextUrl);
    return true;
  }, [playbackUrl]);

  /* ═══ Fallback to RD transcode on format error ═══ */
  const fallbackToTranscode = useCallback((reason = 'unsupported format') => {
    const candidates = getTranscodeCandidates();
    for (const candidate of candidates) {
      if (switchSource(candidate, reason)) return true;
    }
    return false;
  }, [getTranscodeCandidates, switchSource]);

  useEffect(() => {
    if (!needsTranscodeFallback) return;
    if (fallbackToTranscode('transcode ready')) {
      setNeedsTranscodeFallback(false);
    }
  }, [needsTranscodeFallback, fallbackToTranscode, transcodeData]);

  /* ═══ Playback engine ═══ */
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube) return;

    // Destroy previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = playbackUrl.includes('.m3u8');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        fragLoadingTimeOut: 30000,
        manifestLoadingTimeOut: 15000,
        levelLoadingTimeOut: 15000,
      });
      hlsRef.current = hls;
      hls.loadSource(playbackUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.FRAG_BUFFERED, () => setIsBuffering(false));

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        console.error('HLS fatal error:', data.type, data.details);

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
          return;
        }

        if (!fallbackToTranscode(`hls ${data.details || data.type}`)) {
          setIsBuffering(false);
        }
      });

      return () => { hls.destroy(); hlsRef.current = null; };
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = playbackUrl;
      video.play().catch(() => {});
      return;
    } else {
      // Direct MP4/MKV playback
      video.src = playbackUrl;
      video.load();
      video.play().catch(() => {});
      return;
    }
  }, [playbackUrl, isYouTube]);

  /* ═══ Video events ═══ */
  useEffect(() => {
    const v = videoRef.current;
    if (!v || isYouTube) return;

    const onPlay = () => { setIsPlaying(true); setIsBuffering(false); };
    const onPause = () => setIsPlaying(false);
    const onTime = () => { setCurrentTime(v.currentTime); if (!v.paused && v.readyState >= 3) setIsBuffering(false); };
    const onDur = () => setDuration(v.duration);
    const onWait = () => setIsBuffering(true);
    const onCan = () => setIsBuffering(false);
    const onVol = () => { setVolume(v.volume); setIsMuted(v.muted); };
    const onError = () => {
      const code = v.error?.code;
      const msg = v.error?.message || '';
      console.error('Video error:', msg, code);

      // Code 4/3 = unsupported or decode error in current browser.
      if (code === 4 || code === 3) {
        if (fallbackToTranscode(`media error ${code}`)) return;
        if (rdFileId) {
          setNeedsTranscodeFallback(true);
          setIsBuffering(true);
          return;
        }
      }

      setIsBuffering(false);
    };

    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onDur);
    v.addEventListener('durationchange', onDur);
    v.addEventListener('waiting', onWait);
    v.addEventListener('canplay', onCan);
    v.addEventListener('canplaythrough', onCan);
    v.addEventListener('playing', onCan);
    v.addEventListener('volumechange', onVol);
    v.addEventListener('error', onError);

    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onDur);
      v.removeEventListener('durationchange', onDur);
      v.removeEventListener('waiting', onWait);
      v.removeEventListener('canplay', onCan);
      v.removeEventListener('canplaythrough', onCan);
      v.removeEventListener('playing', onCan);
      v.removeEventListener('volumechange', onVol);
      v.removeEventListener('error', onError);
    };
  }, [playbackUrl, isYouTube, rdFileId, fallbackToTranscode]);

  /* ═══ Subtitles ═══ */
  useEffect(() => {
    if (!imdbId || isYouTube) return;
    setLoadingSubs(true);
    fetchSubtitles(mediaType || 'movie', imdbId, season, episode)
      .then(subs => {
        setAvailableSubs(subs);
        const heb = subs.find(s => s.lang === 'heb');
        if (heb) { setActiveSub(heb.id); addTrackToVideo(heb); }
      })
      .finally(() => setLoadingSubs(false));
  }, [imdbId, mediaType, season, episode]);

  const fetchSubAsBlob = async (subUrl: string): Promise<string> => {
    try {
      const res = await fetch(subUrl);
      const text = await res.text();
      let vtt = text;
      if (!text.trimStart().startsWith('WEBVTT')) {
        vtt = 'WEBVTT\n\n' + text.replace(/\r\n/g, '\n').replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
      }
      return URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }));
    } catch { return subUrl; }
  };

  const addTrackToVideo = async (sub: SubtitleTrack) => {
    const v = videoRef.current;
    if (!v) return;
    while (v.textTracks.length > 0) {
      const track = v.querySelector('track');
      if (track) track.remove(); else break;
    }
    const blobUrl = await fetchSubAsBlob(sub.url);
    const track = document.createElement('track');
    track.kind = 'subtitles'; track.label = sub.label;
    track.srclang = sub.lang; track.src = blobUrl; track.default = true;
    v.appendChild(track);
    setTimeout(() => { if (v.textTracks[0]) v.textTracks[0].mode = 'showing'; }, 100);
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

  const handleDownloadSub = () => {
    const sub = availableSubs.find(s => s.id === activeSub) || availableSubs[0];
    if (!sub) return;
    const a = document.createElement('a');
    a.href = sub.url; a.download = `${title}.${sub.lang}.vtt`; a.target = '_blank';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  /* ═══ External player ═══ */
  const openExternal = (player: 'vlc' | 'mx' | 'system') => {
    const isAndroid = /android/i.test(navigator.userAgent);
    let href = playbackUrl;
    if (player === 'vlc') {
      href = isAndroid
        ? `intent://${playbackUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=org.videolan.vlc;type=video/*;S.title=${encodeURIComponent(title)};end`
        : `vlc://${playbackUrl}`;
    } else if (player === 'mx' && isAndroid) {
      href = `intent://${playbackUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.mxtech.videoplayer.ad;type=video/*;S.title=${encodeURIComponent(title)};end`;
    } else if (player === 'system' && isAndroid) {
      href = `intent://${playbackUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;type=video/*;S.title=${encodeURIComponent(title)};end`;
    }
    window.location.href = href;
  };

  /* ═══ Controls hide timer ═══ */
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

  /* ═══ TV remote navigation ═══ */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const v = videoRef.current;
      const root = containerRef.current;
      if (!root) return;
      const key = normalizeKey(e);
      if (!key) return;

      const active = document.activeElement as HTMLElement | null;
      const insidePlayer = !!active && root.contains(active);
      const inSettings = !!active?.closest('[data-settings-panel]');

      const focusDefault = () => root.querySelector<HTMLElement>('[data-player-default]')?.focus();

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'MediaPlayPause'].includes(key)) resetHideTimer();

      if (key === 'Back') {
        e.preventDefault();
        if (showSettings) {
          if (settingsPanel !== 'main') setSettingsPanel('main');
          else { setShowSettings(false); requestAnimationFrame(focusDefault); }
          return;
        }
        onBack();
        return;
      }

      if (showSettings) {
        const panel = root.querySelector<HTMLElement>('[data-settings-panel]');
        const items = panel ? getFocusable(panel) : [];
        if (!items.length) return;
        if (!inSettings) { e.preventDefault(); items[0].focus(); return; }
        const idx = active ? items.indexOf(active) : -1;
        if (key === 'Enter') { e.preventDefault(); active?.click(); return; }
        if (key === 'ArrowDown' || key === 'ArrowUp') {
          e.preventDefault();
          const next = key === 'ArrowDown' ? Math.min(items.length - 1, idx + 1) : Math.max(0, idx - 1);
          items[Math.max(0, next)]?.focus();
          return;
        }
        const toward = isRTL ? 'ArrowRight' : 'ArrowLeft';
        if (key === toward && settingsPanel === 'main') {
          e.preventDefault();
          setShowSettings(false);
          requestAnimationFrame(focusDefault);
        }
        return;
      }

      if (key === 'Enter') {
        if (insidePlayer && active?.classList.contains('tv-focus')) { e.preventDefault(); active.click(); return; }
        if (v) { e.preventDefault(); v.paused ? v.play() : v.pause(); }
        return;
      }
      if (key === 'MediaPlayPause') { e.preventDefault(); if (v) v.paused ? v.play() : v.pause(); return; }
      if (key === 'MediaStop') { e.preventDefault(); if (v) v.pause(); onBack(); return; }
      if (key === 'f') { e.preventDefault(); toggleFullscreen(); return; }
      if (key === 'm') { e.preventDefault(); if (v) v.muted = !v.muted; return; }
      if (key === 'MediaRewind') { e.preventDefault(); if (v) v.currentTime = Math.max(0, v.currentTime - 30); return; }
      if (key === 'MediaFastForward') { e.preventDefault(); if (v) v.currentTime = Math.min(v.duration, v.currentTime + 30); return; }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        e.preventDefault();
        if (!showControls) {
          if (!v) return;
          if (key === 'ArrowLeft') v.currentTime = Math.max(0, v.currentTime - 10);
          if (key === 'ArrowRight') v.currentTime = Math.min(v.duration, v.currentTime + 10);
          if (key === 'ArrowUp') v.volume = Math.min(1, v.volume + 0.1);
          if (key === 'ArrowDown') v.volume = Math.max(0, v.volume - 0.1);
          return;
        }
        const controls = getFocusable(root).filter(el => !el.closest('[data-settings-panel]'));
        if (!controls.length) return;
        const cur = insidePlayer && active?.classList.contains('tv-focus') ? active : null;
        if (!cur) { focusDefault(); return; }
        const next = findNext(cur, key as any, controls);
        if (next) { next.focus(); lastFocusRef.current = next; return; }
        if (v && key === 'ArrowLeft') v.currentTime = Math.max(0, v.currentTime - 10);
        if (v && key === 'ArrowRight') v.currentTime = Math.min(v.duration, v.currentTime + 10);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [showSettings, settingsPanel, onBack, resetHideTimer, showControls, isRTL]);

  // Restore focus when controls reappear
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.classList.contains('tv-focus') && !target.closest('[data-settings-panel]'))
        lastFocusRef.current = target;
    };
    root.addEventListener('focusin', onFocusIn);
    return () => root.removeEventListener('focusin', onFocusIn);
  }, []);

  useEffect(() => {
    if (!showControls || showSettings) return;
    const root = containerRef.current;
    if (!root) return;
    const active = document.activeElement as HTMLElement | null;
    if (active && root.contains(active) && active.classList.contains('tv-focus') && !active.closest('[data-settings-panel]')) return;
    const preferred = (lastFocusRef.current && root.contains(lastFocusRef.current))
      ? lastFocusRef.current
      : root.querySelector<HTMLElement>('[data-player-default]');
    if (preferred) requestAnimationFrame(() => preferred.focus());
  }, [showControls, showSettings]);

  useEffect(() => {
    if (!showSettings || !showControls) return;
    const root = containerRef.current;
    if (!root) return;
    requestAnimationFrame(() => {
      root.querySelector<HTMLElement>('[data-settings-panel] .tv-focus')?.focus();
    });
  }, [showSettings, settingsPanel, showControls]);

  /* ═══ Playback helpers ═══ */
  const togglePlay = () => { const v = videoRef.current; if (v) v.paused ? v.play() : v.pause(); };
  const seek = (s: number) => { const v = videoRef.current; if (v) v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + s)); };
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => { const v = videoRef.current; if (v) v.currentTime = parseFloat(e.target.value); };
  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => { const v = videoRef.current; if (!v) return; const val = parseFloat(e.target.value); v.volume = val; v.muted = val === 0; };
  const toggleMute = () => { const v = videoRef.current; if (v) v.muted = !v.muted; };
  const setSpeed = (speed: number) => { const v = videoRef.current; if (v) v.playbackRate = speed; setPlaybackSpeed(speed); setSettingsPanel('main'); };

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) { await document.exitFullscreen(); setIsFullscreen(false); }
    else { await el.requestFullscreen(); setIsFullscreen(true); }
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

  /* ═══ YouTube ═══ */
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

  /* ═══ Main player UI ═══ */
  return (
    <div
      ref={containerRef}
      dir={dir}
      data-video-player="true"
      className="fixed inset-0 z-50 bg-black flex items-center justify-center cursor-pointer select-none"
      onClick={e => { if (!(e.target as HTMLElement).closest('[data-controls]')) { togglePlay(); resetHideTimer(); } }}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        autoPlay
        playsInline
        crossOrigin="anonymous"
      />

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-12 h-12 3xl:w-16 3xl:h-16 4k:w-20 4k:h-20 text-primary animate-spin" />
        </div>
      )}

      {/* Controls overlay */}
      <div
        data-controls
        className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 3xl:p-6 4k:p-8 bg-gradient-to-b from-black/70 to-transparent">
          <button onClick={onBack} className="w-10 h-10 3xl:w-12 3xl:h-12 4k:w-14 4k:h-14 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors tv-focus">
            <BackArrow className="w-5 h-5 3xl:w-6 3xl:h-6 4k:w-7 4k:h-7" />
          </button>
          <h2 className="text-white text-sm 3xl:text-base 4k:text-lg font-medium truncate max-w-[60%]">{title}</h2>
          <button onClick={onBack} className="w-10 h-10 3xl:w-12 3xl:h-12 4k:w-14 4k:h-14 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors tv-focus">
            <X className="w-5 h-5 3xl:w-6 3xl:h-6 4k:w-7 4k:h-7" />
          </button>
        </div>

        {/* Center */}
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
          {/* Progress */}
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

          {/* Buttons row */}
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
              <button onClick={() => { setSettingsPanel('subtitles'); setShowSettings(true); }} className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors tv-focus ${activeSub ? 'text-primary bg-white/10' : 'text-white hover:bg-white/10'}`}>
                <Subtitles className="w-5 h-5" />
              </button>
              <button onClick={handleDownloadSub} disabled={!availableSubs.length} className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors disabled:opacity-40 tv-focus">
                <Download className="w-5 h-5" />
              </button>
              <button onClick={toggleFullscreen} className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors tv-focus">
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
              <button onClick={() => openExternal('vlc')} className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors tv-focus" title={labels.openExternal}>
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
          data-settings-panel="true"
          className="absolute bottom-24 end-4 w-64 max-h-80 overflow-y-auto bg-black/90 backdrop-blur-lg rounded-xl border border-white/10 text-white text-sm"
          onClick={e => e.stopPropagation()}
        >
          {settingsPanel === 'main' && (
            <div className="py-1">
              <button onClick={() => setSettingsPanel('speed')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/10 transition-colors tv-focus">
                <span>{labels.playbackSpeed}</span>
                <span className="text-white/60 flex items-center gap-1">{playbackSpeed === 1 ? labels.normal : `${playbackSpeed}x`} <NavChevron className="w-4 h-4" /></span>
              </button>
              <button onClick={() => setSettingsPanel('subtitles')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/10 transition-colors tv-focus">
                <span>{labels.subtitles}</span>
                <span className="text-white/60 flex items-center gap-1">
                  {activeSubLabel}
                  {loadingSubs && <Loader2 className="w-3 h-3 animate-spin" />}
                  <NavChevron className="w-4 h-4" />
                </span>
              </button>
              {streamLanguages.length > 0 && onSelectAudioLanguage && (
                <button onClick={() => setSettingsPanel('audio')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/10 transition-colors tv-focus">
                  <span>{labels.audioLang}</span>
                  <NavChevron className="w-4 h-4 text-white/60" />
                </button>
              )}
              <button onClick={() => setSettingsPanel('external')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/10 transition-colors tv-focus">
                <span className="flex items-center gap-2"><ExternalLink className="w-4 h-4" /> {labels.openExternal}</span>
                <NavChevron className="w-4 h-4 text-white/60" />
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
              {streamLanguages.length > 0 && onSelectAudioLanguage && (
                <div className="px-4 py-2 space-y-2">
                  <div className="text-white/60 text-xs">{labels.chooseSource}</div>
                  <div className="flex flex-wrap gap-2">
                    {streamLanguages.map(language => (
                      <button
                        key={language}
                        onClick={() => { Promise.resolve(onSelectAudioLanguage(language)); setShowSettings(false); setSettingsPanel('main'); }}
                        className="px-3 py-1 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors tv-focus text-xs"
                      >
                        {language}
                      </button>
                    ))}
                  </div>
                </div>
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
              <button onClick={() => selectSubtitle(null)} className={`w-full px-4 py-2.5 text-start hover:bg-white/10 transition-colors flex items-center justify-between tv-focus ${!activeSub ? 'text-primary' : ''}`}>
                {labels.off}
                {!activeSub && <span className="text-primary">✓</span>}
              </button>
              {availableSubs.map(sub => (
                <button key={sub.id} onClick={() => selectSubtitle(sub)} className={`w-full px-4 py-2.5 text-start hover:bg-white/10 transition-colors flex items-center justify-between tv-focus ${activeSub === sub.id ? 'text-primary' : ''}`}>
                  {sub.label}
                  {activeSub === sub.id && <span className="text-primary">✓</span>}
                </button>
              ))}
              {!loadingSubs && availableSubs.length === 0 && (
                <div className="px-4 py-3 text-white/40 text-center">{labels.noSubs}</div>
              )}
            </div>
          )}

          {settingsPanel === 'external' && (
            <div className="py-1">
              <button onClick={() => setSettingsPanel('main')} className="w-full px-4 py-2 flex items-center gap-2 text-white/60 hover:bg-white/10 transition-colors border-b border-white/10 tv-focus">
                <BackChevron className="w-4 h-4" /> {labels.openExternal}
              </button>
              <div className="px-4 py-2 text-white/40 text-xs">{labels.externalHint}</div>
              <button onClick={() => openExternal('vlc')} className="w-full px-4 py-3 text-start hover:bg-white/10 transition-colors tv-focus">{labels.openVlc}</button>
              <button onClick={() => openExternal('mx')} className="w-full px-4 py-3 text-start hover:bg-white/10 transition-colors tv-focus">{labels.openMx}</button>
              <button onClick={() => openExternal('system')} className="w-full px-4 py-3 text-start hover:bg-white/10 transition-colors tv-focus">{labels.openSystem}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
