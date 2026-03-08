import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, X, Settings, Volume2, Subtitles, ChevronRight, ChevronLeft, Maximize, Minimize, Play, Pause, SkipForward, SkipBack, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  title: string;
  onBack: () => void;
}

type SettingsPanel = 'main' | 'speed' | 'audio' | 'subtitles' | 'quality';

export const VideoPlayer = ({ url, title, onBack }: VideoPlayerProps) => {
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
  const [audioTracks, setAudioTracks] = useState<{ id: number; label: string; language: string; enabled: boolean }[]>([]);
  const [textTracks, setTextTracks] = useState<{ id: number; label: string; language: string; mode: string }[]>([]);

  const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

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

    // Detect audio tracks
    const detectTracks = () => {
      const at = (video as any).audioTracks;
      if (at && at.length > 0) {
        const tracks: typeof audioTracks = [];
        for (let i = 0; i < at.length; i++) {
          tracks.push({ id: i, label: at[i].label || `Track ${i + 1}`, language: at[i].language || '', enabled: at[i].enabled });
        }
        setAudioTracks(tracks);
      }

      if (video.textTracks && video.textTracks.length > 0) {
        const tracks: typeof textTracks = [];
        for (let i = 0; i < video.textTracks.length; i++) {
          const t = video.textTracks[i];
          tracks.push({ id: i, label: t.label || `Subtitle ${i + 1}`, language: t.language || '', mode: t.mode });
        }
        setTextTracks(tracks);
      }
    };

    video.addEventListener('loadedmetadata', detectTracks);
    // Also check after a delay for tracks loaded later
    const trackTimer = setTimeout(detectTracks, 2000);

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
      video.removeEventListener('loadedmetadata', detectTracks);
      clearTimeout(trackTimer);
    };
  }, []);

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

  const selectAudioTrack = (idx: number) => {
    const v = videoRef.current;
    if (!v) return;
    const at = (v as any).audioTracks;
    if (at) {
      for (let i = 0; i < at.length; i++) {
        at[i].enabled = i === idx;
      }
      setAudioTracks(prev => prev.map((t, i) => ({ ...t, enabled: i === idx })));
    }
    setSettingsPanel('main');
  };

  const selectTextTrack = (idx: number | null) => {
    const v = videoRef.current;
    if (!v) return;
    for (let i = 0; i < v.textTracks.length; i++) {
      v.textTracks[i].mode = i === idx ? 'showing' : 'hidden';
    }
    setTextTracks(prev => prev.map((t, i) => ({ ...t, mode: i === idx ? 'showing' : 'hidden' })));
    setSettingsPanel('main');
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

  if (isYouTube) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          <button onClick={onBack} className="glass w-10 h-10 rounded-full flex items-center justify-center text-foreground tv-focus">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-foreground text-sm font-medium truncate max-w-[60%]">{title}</h2>
          <button onClick={onBack} className="glass w-10 h-10 rounded-full flex items-center justify-center text-foreground tv-focus">
            <X className="w-5 h-5" />
          </button>
        </div>
        <iframe
          src={url}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
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
        crossOrigin="anonymous"
      />

      {/* Buffering indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      )}

      {/* Controls overlay */}
      <div
        data-controls
        className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-white text-sm font-medium truncate max-w-[60%]">{title}</h2>
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center controls */}
        <div className="flex items-center justify-center gap-8">
          <button onClick={() => seek(-10)} className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors">
            <SkipBack className="w-6 h-6" />
          </button>
          <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white hover:bg-white/30 transition-colors">
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </button>
          <button onClick={() => seek(10)} className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors">
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        {/* Bottom bar */}
        <div className="p-4 bg-gradient-to-t from-black/70 to-transparent space-y-2">
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <span className="text-white text-xs min-w-[40px]">{formatTime(currentTime)}</span>
            <div className="relative flex-1 h-6 flex items-center group">
              <div className="absolute inset-x-0 h-1 bg-white/20 rounded-full group-hover:h-1.5 transition-all">
                <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer"
                step={0.1}
              />
            </div>
            <span className="text-white text-xs min-w-[40px] text-end">{formatTime(duration)}</span>
          </div>

          {/* Bottom buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors">
                <Volume2 className="w-5 h-5" />
              </button>
              <div className="w-20 relative h-6 flex items-center group">
                <div className="absolute inset-x-0 h-1 bg-white/20 rounded-full">
                  <div className="h-full bg-white rounded-full" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} />
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolume}
                  className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              {playbackSpeed !== 1 && (
                <span className="text-white text-xs bg-white/10 px-2 py-0.5 rounded">{playbackSpeed}x</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => { setShowSettings(!showSettings); setSettingsPanel('main'); }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={() => { setSettingsPanel('subtitles'); setShowSettings(true); }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              >
                <Subtitles className="w-5 h-5" />
              </button>
              <button onClick={toggleFullscreen} className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors">
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
          className="absolute bottom-24 right-4 w-64 bg-black/90 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden text-white text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {settingsPanel === 'main' && (
            <div className="py-1">
              <button onClick={() => setSettingsPanel('speed')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/10 transition-colors">
                <span>מהירות ניגון</span>
                <span className="text-white/60 flex items-center gap-1">{playbackSpeed === 1 ? 'רגיל' : `${playbackSpeed}x`} <ChevronLeft className="w-4 h-4" /></span>
              </button>
              <button onClick={() => setSettingsPanel('audio')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/10 transition-colors">
                <span>שפת אודיו</span>
                <span className="text-white/60 flex items-center gap-1">
                  {audioTracks.find(t => t.enabled)?.label || (audioTracks.length === 0 ? 'ברירת מחדל' : 'בחר')}
                  <ChevronLeft className="w-4 h-4" />
                </span>
              </button>
              <button onClick={() => setSettingsPanel('subtitles')} className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/10 transition-colors">
                <span>כתוביות</span>
                <span className="text-white/60 flex items-center gap-1">
                  {textTracks.find(t => t.mode === 'showing')?.label || 'כבוי'}
                  <ChevronLeft className="w-4 h-4" />
                </span>
              </button>
            </div>
          )}

          {settingsPanel === 'speed' && (
            <div className="py-1">
              <button onClick={() => setSettingsPanel('main')} className="w-full px-4 py-2 flex items-center gap-2 text-white/60 hover:bg-white/10 transition-colors border-b border-white/10">
                <ChevronRight className="w-4 h-4" />
                מהירות ניגון
              </button>
              {speeds.map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`w-full px-4 py-2.5 text-start hover:bg-white/10 transition-colors flex items-center justify-between ${playbackSpeed === s ? 'text-primary' : ''}`}
                >
                  {s === 1 ? 'רגיל (1x)' : `${s}x`}
                  {playbackSpeed === s && <span className="text-primary">✓</span>}
                </button>
              ))}
            </div>
          )}

          {settingsPanel === 'audio' && (
            <div className="py-1">
              <button onClick={() => setSettingsPanel('main')} className="w-full px-4 py-2 flex items-center gap-2 text-white/60 hover:bg-white/10 transition-colors border-b border-white/10">
                <ChevronRight className="w-4 h-4" />
                שפת אודיו
              </button>
              {audioTracks.length === 0 ? (
                <div className="px-4 py-3 text-white/40 text-center">
                  רצועת אודיו אחת בלבד
                </div>
              ) : (
                audioTracks.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => selectAudioTrack(i)}
                    className={`w-full px-4 py-2.5 text-start hover:bg-white/10 transition-colors flex items-center justify-between ${t.enabled ? 'text-primary' : ''}`}
                  >
                    {t.label} {t.language && `(${t.language})`}
                    {t.enabled && <span className="text-primary">✓</span>}
                  </button>
                ))
              )}
            </div>
          )}

          {settingsPanel === 'subtitles' && (
            <div className="py-1">
              <button onClick={() => setSettingsPanel('main')} className="w-full px-4 py-2 flex items-center gap-2 text-white/60 hover:bg-white/10 transition-colors border-b border-white/10">
                <ChevronRight className="w-4 h-4" />
                כתוביות
              </button>
              <button
                onClick={() => selectTextTrack(null)}
                className={`w-full px-4 py-2.5 text-start hover:bg-white/10 transition-colors flex items-center justify-between ${!textTracks.some(t => t.mode === 'showing') ? 'text-primary' : ''}`}
              >
                כבוי
                {!textTracks.some(t => t.mode === 'showing') && <span className="text-primary">✓</span>}
              </button>
              {textTracks.length === 0 ? (
                <div className="px-4 py-3 text-white/40 text-center">
                  אין כתוביות זמינות
                </div>
              ) : (
                textTracks.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => selectTextTrack(i)}
                    className={`w-full px-4 py-2.5 text-start hover:bg-white/10 transition-colors flex items-center justify-between ${t.mode === 'showing' ? 'text-primary' : ''}`}
                  >
                    {t.label} {t.language && `(${t.language})`}
                    {t.mode === 'showing' && <span className="text-primary">✓</span>}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
