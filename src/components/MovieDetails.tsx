import { useState, useEffect, useRef } from 'react';
import { ArrowRight, ArrowLeft, Play, Star, Plus, Check, Share2, Link, Loader2, Search, Download } from 'lucide-react';
import { Movie } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMovieDetails, useSeason } from '@/hooks/useTMDB';
import { useRDUnrestrict, useRDAddMagnet } from '@/hooks/useRealDebrid';
import { useTorrentioSearch } from '@/hooks/useTorrentio';
import { parseTorrentioTitle, streamToMagnet, type TorrentioStream } from '@/lib/torrentio';
import { VideoPlayer } from './VideoPlayer';
import { useWatchlist, useWatchHistory } from '@/hooks/useWatchlist';
import { useToast } from '@/hooks/use-toast';

interface MovieDetailsProps {
  movie: Movie;
  onBack: () => void;
}

export const MovieDetails = ({ movie, onBack }: MovieDetailsProps) => {
  const backdrop = movie.backdrop || movie.poster;
  const { t, lang, dir } = useLanguage();
  const { toast } = useToast();
  const watchlist = useWatchlist();
  const history = useWatchHistory();
  const displayTitle = lang === 'he' ? (movie.titleHe || movie.title) : movie.title;
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const tmdbId = movie.tmdbId || parseInt(movie.id);
  const mediaType = movie.mediaType || (movie.type === 'series' ? 'tv' : 'movie');

  const { data: details } = useMovieDetails(tmdbId, mediaType);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);
  const { data: seasonData } = useSeason(
    movie.type === 'series' ? tmdbId : null,
    selectedSeason
  );

  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [rdFileId, setRdFileId] = useState<string | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [showTorrents, setShowTorrents] = useState(false);
  const [selectedStreamLanguages, setSelectedStreamLanguages] = useState<string[]>([]);
  const unrestrict = useRDUnrestrict();
  const addMagnet = useRDAddMagnet();
  const torrentResultsRef = useRef<HTMLDivElement>(null);
  const episodeSectionRef = useRef<HTMLDivElement>(null);

  const detailMovie = details?.movie || movie;
  const rawDetails = details?.raw;
  const imdbId = (rawDetails as any)?.external_ids?.imdb_id || (rawDetails as any)?.imdb_id || null;

  const torrentType = movie.type === 'series' ? 'series' : 'movie';
  const { data: torrentioData, isLoading: torrentsLoading } = useTorrentioSearch(
    showTorrents ? torrentType : null,
    showTorrents ? imdbId : null,
    torrentType === 'series' && selectedEpisode !== null ? selectedSeason : undefined,
    torrentType === 'series' && selectedEpisode !== null ? selectedEpisode : undefined
  );
  const streams = torrentioData?.streams || [];

  const resolutionWeight = (resolution: string) => {
    if (resolution === '1080p') return 120;
    if (resolution === '720p') return 100;
    if (resolution === '4K') return 40;
    if (resolution === '480p') return 60;
    return 80;
  };

  const streamScore = (title: string) => {
    const parsed = parseTorrentioTitle(title || '');
    const sizeWeight = Number.isFinite(parsed.sizeInMB) ? Math.max(0, 130 - parsed.sizeInMB / 140) : 0;

    return (
      (parsed.isInstant ? 1200 : 0) +
      (parsed.videoCompatible ? 300 : 0) +
      (parsed.audioCompatible ? 160 : 0) +
      resolutionWeight(parsed.resolution) +
      sizeWeight +
      parsed.seeds * 2
    );
  };

  const displayStreams = [...streams].sort((a, b) => streamScore(b.title || '') - streamScore(a.title || ''));

  const [loadingStreamIdx, setLoadingStreamIdx] = useState<number | null>(null);

  // Scroll to torrent results when they appear
  useEffect(() => {
    if (showTorrents && torrentResultsRef.current) {
      torrentResultsRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [showTorrents, selectedEpisode]);

  const handleStreamSelect = async (stream: TorrentioStream, idx: number) => {
    let selected = { stream, idx, parsed: parseTorrentioTitle(stream.title || '') };

    // Prefer instant + browser-compatible source if chosen stream is weak
    if (!selected.parsed.videoCompatible || !selected.parsed.isInstant) {
      const fastAlternative = displayStreams
        .map((candidate, candidateIdx) => ({
          stream: candidate,
          idx: candidateIdx,
          parsed: parseTorrentioTitle(candidate.title || ''),
        }))
        .filter((item) => item.parsed.videoCompatible && item.parsed.isInstant)
        .sort((a, b) => streamScore(b.stream.title || '') - streamScore(a.stream.title || ''))[0];

      if (fastAlternative) {
        selected = fastAlternative;
      }
    }

    const link = streamToMagnet(selected.stream);
    if (!link) return;

    setSelectedStreamLanguages(selected.parsed.languages);
    setLoadingStreamIdx(selected.idx);

    try {
      if (link.startsWith('magnet:')) {
        const result = await addMagnet.mutateAsync(link);
        const pollForLinks = async (
          torrentId: string,
          retries: number
        ): Promise<{ url: string; fileId: string } | null> => {
          const { realDebrid } = await import('@/lib/realDebrid');

          for (let i = 0; i < retries; i++) {
            await new Promise(r => setTimeout(r, 1500));
            const info = await realDebrid.getTorrentInfo(torrentId);

            if (info.links && info.links.length > 0) {
              const unrestricted = await unrestrict.mutateAsync(info.links[0]);
              return { url: unrestricted.download, fileId: unrestricted.id };
            }

            if (['error', 'dead', 'magnet_error', 'virus'].includes(info.status)) break;

            // If torrent is not instant-cached, don't wait long
            if (
              !selected.parsed.isInstant &&
              ['downloading', 'queued', 'waiting_files_selection'].includes(info.status) &&
              i >= 2
            ) {
              break;
            }
          }

          return null;
        };

        const result2 = await pollForLinks(result.id, selected.parsed.isInstant ? 10 : 4);

        if (result2) {
          setStreamUrl(result2.url);
          setRdFileId(result2.fileId);
        } else if (!selected.parsed.isInstant) {
          const instantFallback = displayStreams
            .map((candidate, candidateIdx) => ({
              stream: candidate,
              idx: candidateIdx,
              parsed: parseTorrentioTitle(candidate.title || ''),
            }))
            .filter((item) => item.idx !== selected.idx && item.parsed.videoCompatible && item.parsed.isInstant)
            .sort((a, b) => streamScore(b.stream.title || '') - streamScore(a.stream.title || ''))[0];

          if (instantFallback) {
            await handleStreamSelect(instantFallback.stream, instantFallback.idx);
            return;
          }
        }
      } else {
        const result3 = await unrestrict.mutateAsync(link);
        setStreamUrl(result3.download);
        setRdFileId(result3.id);
      }
    } catch (e) {
      console.error('Stream select failed:', e);
    } finally {
      setLoadingStreamIdx(null);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = `${displayTitle} - ${detailMovie.year}`;
    if (navigator.share) {
      try { await navigator.share({ title: displayTitle, text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert(lang === 'he' ? 'הקישור הועתק!' : 'Link copied!');
    }
  };

  const handleUnrestrict = async () => {
    if (!linkInput.trim()) return;
    try {
      const result = await unrestrict.mutateAsync(linkInput.trim());
      setStreamUrl(result.download);
      setShowLinkInput(false);
      setLinkInput('');
    } catch (e) {
      console.error('Unrestrict failed:', e);
    }
  };

  const handleChooseAudioLanguage = async (language: string) => {
    const candidates = displayStreams
      .map((stream, idx) => ({ stream, idx, parsed: parseTorrentioTitle(stream.title || '') }))
      .filter(item => item.parsed.languages.includes(language));

    if (candidates.length === 0) return;

    // Prefer fast-start profile
    candidates.sort((a, b) => streamScore(b.stream.title || '') - streamScore(a.stream.title || ''));

    await handleStreamSelect(candidates[0].stream, candidates[0].idx);
  };

  if (streamUrl) {
    return (
      <VideoPlayer
        url={streamUrl}
        title={displayTitle}
        onBack={() => { setStreamUrl(null); setRdFileId(null); }}
        imdbId={imdbId}
        mediaType={movie.type === 'series' ? 'series' : 'movie'}
        season={movie.type === 'series' ? selectedSeason : undefined}
        episode={movie.type === 'series' && selectedEpisode !== null ? selectedEpisode : undefined}
        rdFileId={rdFileId}
        streamLanguages={selectedStreamLanguages}
        onSelectAudioLanguage={handleChooseAudioLanguage}
      />
    );
  }

  const genres = rawDetails?.genres || detailMovie.genres?.map(g => typeof g === 'string' ? g : (g as any).name) || [];
  const seasons = rawDetails?.seasons?.filter((s: any) => s.season_number > 0) || [];
  const recommendations = rawDetails?.recommendations?.results || [];
  const cast = rawDetails?.credits?.cast?.slice(0, 10) || [];
  const trailer = rawDetails?.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');

  const renderTorrentResults = () => (
    <div ref={torrentResultsRef} className="space-y-4">
      <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
        <Search className="w-5 h-5 text-primary" />
        {lang === 'he' ? 'בחר מקור' : 'Choose Source'}
        {movie.type === 'series' && selectedEpisode !== null && (
          <span className="text-sm text-primary font-normal">
            — {t('season')} {selectedSeason} {t('episode')} {selectedEpisode}
          </span>
        )}
        {!imdbId && (
          <span className="text-sm text-muted-foreground font-normal">
            ({lang === 'he' ? 'ממתין ל-IMDB ID...' : 'Waiting for IMDB ID...'})
          </span>
        )}
      </h3>
      {torrentsLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}
      {!torrentsLoading && streams.length === 0 && imdbId && (
        <div className="glass rounded-xl p-6 text-center text-muted-foreground">
          {lang === 'he' ? 'לא נמצאו מקורות' : 'No sources found'}
        </div>
      )}
      <div data-nav-row="torrent-results" className="grid grid-cols-1 gap-3 3xl:gap-4">
        {displayStreams.map((stream: TorrentioStream, idx: number) => {
          const parsed = parseTorrentioTitle(stream.title || '');
          return (
            <button
              key={idx}
              onClick={() => handleStreamSelect(stream, idx)}
              disabled={loadingStreamIdx !== null}
              className="w-full glass rounded-xl 3xl:rounded-2xl p-4 3xl:p-5 4k:p-6 flex items-center gap-4 3xl:gap-5 tv-focus text-start transition-colors disabled:opacity-50 min-h-[4.5rem] 3xl:min-h-[5.5rem] 4k:min-h-[6rem]"
            >
              <div className="w-14 h-14 3xl:w-16 3xl:h-16 4k:w-20 4k:h-20 rounded-xl 3xl:rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                {loadingStreamIdx === idx ? <Loader2 className="w-6 h-6 3xl:w-8 3xl:h-8 text-primary animate-spin" /> : <Download className="w-6 h-6 3xl:w-8 3xl:h-8 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base 3xl:text-lg 4k:text-xl font-semibold text-foreground truncate" dir="ltr">
                  {stream.name}
                </p>
                <p className="text-sm 3xl:text-base text-muted-foreground mt-0.5 line-clamp-1" dir="ltr">
                  {parsed.quality}
                </p>
                {(parsed.languages.length > 0 || parsed.audioCodec || parsed.videoCodec || parsed.resolution || parsed.sourceType || parsed.hdr) && (
                  <div className="flex gap-1.5 3xl:gap-2 mt-1 flex-wrap">
                    {parsed.resolution && (
                      <span className="text-xs 3xl:text-sm bg-blue-500/15 text-blue-400 px-2 3xl:px-3 py-0.5 3xl:py-1 rounded-full font-medium">
                        {parsed.resolution}
                      </span>
                    )}
                    {parsed.hdr && (
                      <span className="text-xs 3xl:text-sm bg-purple-500/15 text-purple-400 px-2 3xl:px-3 py-0.5 3xl:py-1 rounded-full font-medium">
                        {parsed.hdr}
                      </span>
                    )}
                    {parsed.videoCodec && (
                      <span className={`text-xs 3xl:text-sm px-2 3xl:px-3 py-0.5 3xl:py-1 rounded-full font-medium ${
                        parsed.videoCompatible ? 'bg-green-500/15 text-green-400' : 'bg-orange-500/15 text-orange-400'
                      }`}>
                        🎬 {parsed.videoCodec}
                      </span>
                    )}
                    {parsed.sourceType && (
                      <span className="text-xs 3xl:text-sm bg-accent text-accent-foreground px-2 3xl:px-3 py-0.5 3xl:py-1 rounded-full font-medium">
                        {parsed.sourceType}
                      </span>
                    )}
                    {parsed.languages.map((lang) => (
                      <span key={lang} className="text-xs 3xl:text-sm bg-primary/15 text-primary px-2 3xl:px-3 py-0.5 3xl:py-1 rounded-full font-medium">
                        {lang}
                      </span>
                    ))}
                    {parsed.audioCodec && (
                      <span className={`text-xs 3xl:text-sm px-2 3xl:px-3 py-0.5 3xl:py-1 rounded-full font-medium ${
                        parsed.audioCompatible ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'
                      }`}>
                        🔊 {parsed.audioCodec}{!parsed.audioCompatible ? ' ⚠️' : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0 text-sm 3xl:text-base text-muted-foreground">
                {parsed.size && <span className="text-foreground font-medium">💾 {parsed.size}</span>}
                {parsed.seeds > 0 && <span className="text-green-400">👤 {parsed.seeds}</span>}
                {parsed.source && <span className="text-xs 3xl:text-sm truncate max-w-[120px] 3xl:max-w-[180px]">{parsed.source}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background animate-fade-in" dir={dir}>
      {/* ══════ HERO: Full-width backdrop with info overlay ══════ */}
      <div className="relative h-[70vh] 3xl:h-[75vh] 4k:h-[80vh] min-h-[500px]">
        <img
          src={backdrop}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

        {/* Back button */}
        <div data-nav-row="details-back" className="absolute top-8 3xl:top-12 start-8 3xl:start-12 z-20">
          <button
            onClick={onBack}
            className="glass w-12 h-12 3xl:w-14 3xl:h-14 4k:w-16 4k:h-16 rounded-full flex items-center justify-center text-foreground tv-focus"
          >
            <BackArrow className="w-6 h-6 3xl:w-7 3xl:h-7 4k:w-8 4k:h-8" />
          </button>
        </div>

        {/* Info overlay on left side of backdrop */}
        <div className="absolute bottom-0 start-0 end-0 p-8 3xl:p-12 4k:p-16 pb-10 3xl:pb-14 z-10">
          <div className="max-w-[55%]">
            <h1 className="font-display text-5xl lg:text-6xl 3xl:text-7xl 4k:text-8xl tv:text-9xl text-foreground text-glow leading-tight">
              {displayTitle}
            </h1>
            {lang === 'he' && movie.titleHe && (
              <p className="text-muted-foreground text-base 3xl:text-lg 4k:text-xl mt-2 3xl:mt-3" dir="ltr">{movie.title}</p>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-4 3xl:gap-5 mt-4 3xl:mt-6 text-base 3xl:text-lg 4k:text-xl text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <Star className="w-5 h-5 3xl:w-6 3xl:h-6 text-primary fill-primary" />
                <span className="text-foreground font-bold text-lg 3xl:text-xl 4k:text-2xl">{detailMovie.rating}</span>
              </span>
              <span className="text-foreground">{detailMovie.year}</span>
              <span>{detailMovie.duration}</span>
              {detailMovie.quality && (
                <span className="bg-primary/20 text-primary px-2.5 py-1 3xl:px-3 3xl:py-1.5 rounded text-xs 3xl:text-sm font-bold tracking-wide">
                  {detailMovie.quality}
                </span>
              )}
            </div>

            {/* Genres */}
            <div className="flex gap-2 3xl:gap-3 flex-wrap mt-4 3xl:mt-5">
              {genres.map((g: any) => {
                const name = typeof g === 'string' ? g : g.name;
                return (
                  <span key={name} className="glass px-3 py-1.5 3xl:px-4 3xl:py-2 rounded-full text-xs 3xl:text-sm text-secondary-foreground font-medium">
                    {name}
                  </span>
                );
              })}
            </div>

            {/* Synopsis */}
            <p className="text-sm 3xl:text-base 4k:text-lg text-muted-foreground leading-relaxed mt-4 3xl:mt-6 line-clamp-3 max-w-[600px] 3xl:max-w-[800px] 4k:max-w-[1000px]">
              {detailMovie.overview}
            </p>
          </div>
        </div>
      </div>

      {/* ══════ MAIN CONTENT AREA ══════ */}
      <div className="px-8 3xl:px-12 4k:px-16 pb-24 3xl:pb-32 space-y-8 3xl:space-y-12 -mt-2 relative z-10">

        {/* Action buttons - large, TV-friendly */}
        <div data-nav-row="details-actions" className="flex gap-4 3xl:gap-5 4k:gap-6 items-center">
          <button
            onClick={() => {
              if (movie.type === 'series') {
                episodeSectionRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
                window.setTimeout(() => {
                  const firstEpisodeButton = episodeSectionRef.current?.querySelector<HTMLElement>('[data-episode-button="true"]');
                  firstEpisodeButton?.focus();
                }, 80);
                return;
              }
              setShowTorrents(!showTorrents);
            }}
            className="flex items-center justify-center gap-3 3xl:gap-4 bg-primary text-primary-foreground px-8 py-4 3xl:px-10 3xl:py-5 4k:px-12 4k:py-6 rounded-xl 3xl:rounded-2xl font-bold text-base 3xl:text-lg 4k:text-xl glow-red transition-all tv-focus min-w-[220px] 3xl:min-w-[280px]"
          >
            <Search className="w-6 h-6 3xl:w-7 3xl:h-7" />
            {movie.type === 'series'
              ? (lang === 'he' ? 'בחר פרק' : 'Choose Episode')
              : (lang === 'he' ? 'חפש מקורות' : 'Find Sources')}
          </button>

          {trailer && (
            <button
              onClick={() => setStreamUrl(`https://www.youtube.com/embed/${trailer.key}?autoplay=1`)}
              className="flex items-center gap-3 3xl:gap-4 glass px-6 py-4 3xl:px-8 3xl:py-5 rounded-xl 3xl:rounded-2xl text-foreground font-medium text-base 3xl:text-lg transition-colors tv-focus"
            >
              <Play className="w-5 h-5 3xl:w-6 3xl:h-6 text-primary fill-primary" />
              {lang === 'he' ? 'טריילר' : 'Trailer'}
            </button>
          )}

          <button
            onClick={() => setShowLinkInput(true)}
            className="glass w-14 h-14 3xl:w-16 3xl:h-16 4k:w-18 4k:h-18 rounded-xl 3xl:rounded-2xl flex items-center justify-center text-foreground transition-colors tv-focus"
          >
            <Link className="w-5 h-5 3xl:w-6 3xl:h-6" />
          </button>
          <button
            onClick={() => {
              const text = `${displayTitle} (${detailMovie.year})`;
              navigator.clipboard.writeText(text);
              alert(lang === 'he' ? 'נוסף לרשימה!' : 'Added to watchlist!');
            }}
            className="glass w-14 h-14 3xl:w-16 3xl:h-16 4k:w-18 4k:h-18 rounded-xl 3xl:rounded-2xl flex items-center justify-center text-foreground transition-colors tv-focus"
          >
            <Plus className="w-6 h-6 3xl:w-7 3xl:h-7" />
          </button>
          <button
            onClick={handleShare}
            className="glass w-14 h-14 3xl:w-16 3xl:h-16 4k:w-18 4k:h-18 rounded-xl 3xl:rounded-2xl flex items-center justify-center text-foreground transition-colors tv-focus"
          >
            <Share2 className="w-5 h-5 3xl:w-6 3xl:h-6" />
          </button>
        </div>

        {/* Link input panel */}
        {showLinkInput && (
          <div className="glass rounded-xl p-5 space-y-3 max-w-2xl">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <Link className="w-5 h-5" />
              {lang === 'he' ? 'הדבק קישור או מגנט לצפייה' : 'Paste a link or magnet to watch'}
            </div>
            <div data-nav-row="details-link-input" className="flex gap-3">
              <input
                value={linkInput}
                onChange={e => setLinkInput(e.target.value)}
                placeholder={lang === 'he' ? 'קישור / magnet...' : 'Link / magnet...'}
                className="flex-1 bg-secondary text-foreground placeholder:text-muted-foreground px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary text-sm tv-focus"
                dir="ltr"
              />
              <button
                onClick={handleUnrestrict}
                disabled={unrestrict.isPending || !linkInput.trim()}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold disabled:opacity-50 tv-focus flex items-center gap-2"
              >
                {unrestrict.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {lang === 'he' ? 'הפעל' : 'Play'}
              </button>
            </div>
            <button
              onClick={() => setShowLinkInput(false)}
              className="text-sm text-muted-foreground tv-focus px-2 py-1"
            >
              {lang === 'he' ? 'ביטול' : 'Cancel'}
            </button>
          </div>
        )}

        {/* Movie torrent results */}
        {showTorrents && movie.type !== 'series' && (
          <div className="max-w-3xl 3xl:max-w-4xl 4k:max-w-5xl">
            {renderTorrentResults()}
          </div>
        )}

        {/* Cast - horizontal scroll with bigger items */}
        {cast.length > 0 && (
          <div>
            <h3 className="text-lg 3xl:text-xl 4k:text-2xl font-semibold text-foreground mb-4 3xl:mb-6">
              {lang === 'he' ? 'שחקנים' : 'Cast'}
            </h3>
            <div className="flex gap-5 3xl:gap-7 overflow-x-auto pb-2">
              {cast.map((actor: any) => (
                <div key={actor.id} className="flex-shrink-0 w-24 3xl:w-32 4k:w-36 text-center">
                  {actor.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                      alt={actor.name}
                      className="w-20 h-20 3xl:w-28 3xl:h-28 4k:w-32 4k:h-32 rounded-full object-cover mx-auto mb-2 3xl:mb-3 ring-2 ring-border"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-20 h-20 3xl:w-28 3xl:h-28 4k:w-32 4k:h-32 rounded-full bg-muted mx-auto mb-2 3xl:mb-3 flex items-center justify-center text-muted-foreground text-lg 3xl:text-2xl ring-2 ring-border">
                      {actor.name?.[0]}
                    </div>
                  )}
                  <p className="text-sm 3xl:text-base text-foreground truncate font-medium">{actor.name}</p>
                  <p className="text-xs 3xl:text-sm text-muted-foreground truncate">{actor.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════ Series: Seasons & Episodes ══════ */}
        {movie.type === 'series' && seasons.length > 0 && (
          <div ref={episodeSectionRef}>
            <h3 className="text-lg 3xl:text-xl 4k:text-2xl font-semibold text-foreground mb-4 3xl:mb-6">{t('seasons')}</h3>
            <div data-nav-row="details-seasons" className="flex gap-3 3xl:gap-4 overflow-x-auto pb-3">
              {seasons.map((s: any) => (
                <button
                  key={s.season_number}
                  onClick={() => { setSelectedSeason(s.season_number); setSelectedEpisode(null); setShowTorrents(false); }}
                  className={`flex-shrink-0 px-5 py-2.5 3xl:px-7 3xl:py-3.5 4k:px-8 4k:py-4 rounded-xl 3xl:rounded-2xl text-sm 3xl:text-base 4k:text-lg font-semibold transition-all tv-focus ${
                    selectedSeason === s.season_number
                      ? 'bg-primary text-primary-foreground'
                      : 'glass text-muted-foreground'
                  }`}
                >
                  {t('season')} {s.season_number}
                </button>
              ))}
            </div>

            {!selectedEpisode && (
              <p className="text-sm text-muted-foreground mt-3">
                {lang === 'he' ? '👆 בחר פרק כדי לחפש מקורות' : '👆 Select an episode to find sources'}
              </p>
            )}

            {seasonData?.episodes && (
              <div data-nav-row="details-episodes" className="mt-5 3xl:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-3 3xl:gap-4">
                {seasonData.episodes.map((ep: any) => (
                  <button
                    key={ep.id}
                    data-episode-button="true"
                    onClick={() => { setSelectedEpisode(ep.episode_number); setShowTorrents(true); }}
                    className={`w-full rounded-xl 3xl:rounded-2xl p-4 3xl:p-5 4k:p-6 flex items-center gap-4 3xl:gap-5 tv-focus text-start transition-all ${
                      selectedEpisode === ep.episode_number
                        ? 'bg-primary/10 ring-2 ring-primary'
                        : 'glass'
                    }`}
                  >
                    {ep.still_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                        alt={ep.name}
                        className="w-32 3xl:w-44 4k:w-52 h-[4.5rem] 3xl:h-[6rem] 4k:h-[7rem] rounded-lg 3xl:rounded-xl object-cover flex-shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-32 3xl:w-44 4k:w-52 h-[4.5rem] 3xl:h-[6rem] 4k:h-[7rem] rounded-lg 3xl:rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                        <Play className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm 3xl:text-base 4k:text-lg font-semibold text-foreground">
                        {t('episode')} {ep.episode_number}: {ep.name}
                      </h4>
                      <p className="text-xs 3xl:text-sm text-muted-foreground line-clamp-1 mt-0.5">{ep.overview}</p>
                      {ep.runtime && (
                        <p className="text-xs text-muted-foreground mt-0.5">{ep.runtime} {t('minutes')}</p>
                      )}
                    </div>
                    {selectedEpisode === ep.episode_number && (
                      <Search className="w-5 h-5 text-primary flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Series torrent results */}
            {showTorrents && selectedEpisode !== null && (
              <div className="mt-6 3xl:mt-8 max-w-3xl 3xl:max-w-4xl 4k:max-w-5xl">
                {renderTorrentResults()}
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {lang === 'he' ? 'המלצות דומות' : 'Recommendations'}
            </h3>
            <div className="flex gap-4 3xl:gap-6 overflow-x-auto pb-2">
              {recommendations.filter((r: any) => r.poster_path).slice(0, 10).map((rec: any) => (
                <div key={rec.id} className="flex-shrink-0 w-32 3xl:w-44 4k:w-52">
                  <img
                    src={`https://image.tmdb.org/t/p/w342${rec.poster_path}`}
                    alt={rec.title || rec.name}
                    className="w-full rounded-xl 3xl:rounded-2xl aspect-[2/3] object-cover mb-1.5 3xl:mb-2"
                    loading="lazy"
                  />
                  <p className="text-sm 3xl:text-base text-foreground truncate font-medium">{rec.title || rec.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
