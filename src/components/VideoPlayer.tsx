import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, X, Settings, Volume2, Subtitles, ChevronRight, ChevronLeft, Maximize, Minimize, Play, Pause, SkipForward, SkipBack, Loader2, Languages, Download } from 'lucide-react';
import { fetchSubtitles, type SubtitleTrack } from '@/lib/opensubtitles';
import { realDebrid } from '@/lib/realDebrid';
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
}

type SettingsPanel = 'main' | 'speed' | 'audio' | 'subtitles';

interface RDAudioOption {
  label: string;
  url: string;
}

export const VideoPlayer = ({ url, title, onBack, imdbId, mediaType, season, episode, rdFileId }: VideoPlayerProps) => {
  const { lang, dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | null>(null);

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

  const [rdAudioOptions, setRdAudioOptions] = useState<RDAudioOption[]>([]);
  const [activeAudio, setActiveAudio] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);

  const [availableSubs, setAvailableSubs] = useState<SubtitleTrack[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [activeSub, setActiveSub] = useState<string | null>(null);

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // i18n labels
  const labels = {
    subtitles: lang === 'he' ? 'כתוביות' : 'Subtitles',
    audio: lang === 'he' ? 'אודיו' : 'Audio',
    downloadSubs: lang === 'he' ? 'הורד כתוביות' : 'Download Subtitles',
    playbackSpeed: lang === 'he' ? 'מהירות ניגון' : 'Playback Speed',
    audioLang: lang === 'he' ? 'שפת אודיו' : 'Audio Language',
    normal: lang === 'he' ? 'רגיל' : 'Normal',
    off: lang === 'he' ? 'כבוי' : 'Off',
    default: lang === 'he' ? 'ברירת מחדל' : 'Default',
    loading: lang === 'he' ? 'טוען...' : 'Loading...',
    loadingSubs: lang === 'he' ? 'טוען כתוביות...' : 'Loading subtitles...',
    noAudio: lang === 'he' ? 'אין רצועות אודיו נוספות' : 'No additional audio tracks',
    noSubs: lang === 'he' ? 'אין כתוביות זמינות' : 'No subtitles available',
  };

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

  // Fetch audio tracks
  useEffect(() => {
    if (!rdFileId || isYouTube) return;
    setLoadingAudio(true);
    realDebrid.getTranscode(rdFileId)
      .then(data => {
        const options: RDAudioOption[] = [];
        for (const [quality, info] of Object.entries(data)) {
          if (info && typeof info === 'object' && 'full' in info) {
            const label = `${quality}${(info as any).acodec ? ` (${(info as any).acodec})` : ''}`;
            options.push({ label, url: (info as any).full });
          }
        }
        setRdAudioOptions(options);
      })
      .catch(e => console.warn('Transcode fetch failed:', e))
      .finally(() => setLoadingAudio(false));
  }, [rdFileId]);

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

  // ========== Android TV D-pad / Remote keyboard handler ==========
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const v = videoRef.current;
      if (!v) return;

      // If settings panel is open, let it handle navigation
      if (showSettings) {
        if (e.key === 'Escape' || e.key === 'Backspace') {
          e.preventDefault();
          if (settingsPanel !== 'main') setSettingsPanel('main');
          else setShowSettings(false);
        }
        return;
      }

      resetHideTimer();

      switch (e.key) {
        case ' ':
        case 'Enter':
        case 'MediaPlayPause':
          e.preventDefault();
          v.paused ? v.play() : v.pause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          v.currentTime = Math.max(0, v.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          v.currentTime = Math.min(v.duration, v.currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          v.volume = Math.min(1, v.volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          v.volume = Math.max(0, v.volume - 0.1);
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          onBack();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          v.muted = !v.muted;
          break;
        case 'MediaStop':
          e.preventDefault();
          v.pause();
          onBack();
          break;
        case 'MediaRewind':
          e.preventDefault();
          v.currentTime = Math.max(0, v.currentTime - 30);
          break;
        case 'MediaFastForward':
          e.preventDefault();
          v.currentTime = Math.min(v.duration, v.currentTime + 30);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSettings, settingsPanel, onBack, resetHideTimer]);

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

  const selectAudioTrack = (option: RDAudioOption) => {
    const v = videoRef.current;
    if (!v) return;
    const wasPlaying = !v.paused;
    const time = v.currentTime;
    v.src = option.url;
    v.currentTime = time;
    if (wasPlaying) v.play();
    setActiveAudio(option.url);
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
      <div data-video-player="true" className="fixed inset-0 z-50 bg-black flex flex-col" dir={dir}>
        <div className="absolute top-4 start-4 end-4 z-10 flex items-center justify-between">
          <button onClick={onBack} className="glass w-10 h-10 rounded-full flex items-center justify-center text-foreground tv-focus">
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
        ref={videoRef}
        src={url}
        className="w-full h-full object-contain"
        autoPlay
        playsInline
      />

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      )}

      {/* Floating toolbar - top end */}
      <div
        data-controls
        className="absolute top-16 end-4 z-20 flex flex-col gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => { setSettingsPanel('subtitles'); setShowSettings(true); setShowControls(true); }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md transition-colors tv-focus ${activeSub ? 'bg-primary/80 text-white' : 'bg-black/60 text-white hover:bg-black/80'}`}
        >
          <Subtitles className="w-4 h-4" />
          <span className="text-xs font-medium">{labels.subtitles}</span>
          {loadingSubs && <Loader2 className="w-3 h-3 animate-spin" />}
        </button>
        <button
          onClick={() => { setSettingsPanel('audio'); setShowSettings(true); setShowControls(true); }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-colors tv-focus"
        >
          <Languages className="w-4 h-4" />
          <span className="text-xs font-medium">{labels.audio}</span>
        </button>
        <button
          onClick={handleDownloadSubtitle}
          disabled={availableSubs.length === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-colors disabled:opacity-30 tv-focus"
        >
          <Download className="w-4 h-4" />
          <span className="text-xs font-medium">{labels.downloadSubs}</span>
        </button>
      </div>

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
          <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors tv-focus">
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
            </div>
          </div>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && showControls && (
        <div
          data-controls
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
                  {rdAudioOptions.find(o => o.url === activeAudio)?.label || labels.default}
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
              {rdAudioOptions.length === 0 ? (
                <div className="px-4 py-3 text-white/40 text-center">
                  {loadingAudio ? labels.loading : labels.noAudio}
                </div>
              ) : (
                rdAudioOptions.map((opt, i) => (
                  <button key={i} onClick={() => selectAudioTrack(opt)} className={`w-full px-4 py-2.5 text-start hover:bg-white/10 transition-colors flex items-center justify-between tv-focus ${activeAudio === opt.url ? 'text-primary' : ''}`}>
                    {opt.label}
                    {activeAudio === opt.url && <span className="text-primary">✓</span>}
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
