import { useState } from 'react';
import { ArrowRight, ArrowLeft, Play, Star, Plus, Share2, Link, Loader2, Search, Download } from 'lucide-react';
import { Movie } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMovieDetails, useSeason } from '@/hooks/useTMDB';
import { useRDUnrestrict, useRDAddMagnet } from '@/hooks/useRealDebrid';
import { useTorrentioSearch } from '@/hooks/useTorrentio';
import { parseTorrentioTitle, streamToMagnet, type TorrentioStream } from '@/lib/torrentio';
import { VideoPlayer } from './VideoPlayer';

interface MovieDetailsProps {
  movie: Movie;
  onBack: () => void;
}

export const MovieDetails = ({ movie, onBack }: MovieDetailsProps) => {
  const backdrop = movie.backdrop || movie.poster;
  const { t, lang, dir } = useLanguage();
  const displayTitle = lang === 'he' ? (movie.titleHe || movie.title) : movie.title;
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const tmdbId = movie.tmdbId || parseInt(movie.id);
  const mediaType = movie.mediaType || (movie.type === 'series' ? 'tv' : 'movie');

  const { data: details } = useMovieDetails(tmdbId, mediaType);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const { data: seasonData } = useSeason(
    movie.type === 'series' ? tmdbId : null,
    selectedSeason
  );

  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [rdFileId, setRdFileId] = useState<string | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [showTorrents, setShowTorrents] = useState(false);
  const unrestrict = useRDUnrestrict();
  const addMagnet = useRDAddMagnet();

  const detailMovie = details?.movie || movie;
  const rawDetails = details?.raw;
  const imdbId = (rawDetails as any)?.external_ids?.imdb_id || (rawDetails as any)?.imdb_id || null;

  const torrentType = movie.type === 'series' ? 'series' : 'movie';
  const { data: torrentioData, isLoading: torrentsLoading } = useTorrentioSearch(
    showTorrents ? torrentType : null,
    showTorrents ? imdbId : null
  );
  const streams = torrentioData?.streams || [];

  const [loadingStreamIdx, setLoadingStreamIdx] = useState<number | null>(null);

  const handleStreamSelect = async (stream: TorrentioStream, idx: number) => {
    const link = streamToMagnet(stream);
    if (!link) return;
    setLoadingStreamIdx(idx);
    try {
      if (link.startsWith('magnet:')) {
        const result = await addMagnet.mutateAsync(link);
        // Poll torrent info until we get links, then unrestrict
          const pollForLinks = async (torrentId: string, retries = 15): Promise<{ url: string; fileId: string } | null> => {
            const { realDebrid } = await import('@/lib/realDebrid');
            for (let i = 0; i < retries; i++) {
              await new Promise(r => setTimeout(r, 2000));
              const info = await realDebrid.getTorrentInfo(torrentId);
              if (info.links && info.links.length > 0) {
                const unrestricted = await unrestrict.mutateAsync(info.links[0]);
                return { url: unrestricted.download, fileId: unrestricted.id };
              }
              if (info.status === 'error' || info.status === 'dead') break;
            }
            return null;
          };
          const result2 = await pollForLinks(result.id);
          if (result2) {
            setStreamUrl(result2.url);
            setRdFileId(result2.fileId);
          }
      } else {
        const result = await unrestrict.mutateAsync(link);
        setStreamUrl(result.download);
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

  if (streamUrl) {
    return (
      <VideoPlayer
        url={streamUrl}
        title={displayTitle}
        onBack={() => setStreamUrl(null)}
        imdbId={imdbId}
        mediaType={mediaType as 'movie' | 'series'}
      />
    );
  }

  const genres = rawDetails?.genres || detailMovie.genres?.map(g => typeof g === 'string' ? g : (g as any).name) || [];
  const seasons = rawDetails?.seasons?.filter((s: any) => s.season_number > 0) || [];
  const recommendations = rawDetails?.recommendations?.results || [];
  const cast = rawDetails?.credits?.cast?.slice(0, 10) || [];
  const trailer = rawDetails?.videos?.results?.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');

  return (
    <div className="min-h-screen bg-background animate-fade-in" dir={dir}>
      <div className="relative h-[50vh]">
        <img
          src={backdrop}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <button
          onClick={onBack}
          className="absolute top-12 start-4 glass w-10 h-10 rounded-full flex items-center justify-center text-foreground tv-focus"
        >
          <BackArrow className="w-5 h-5" />
        </button>
      </div>

      <div className="px-4 -mt-20 relative z-10 pb-24 space-y-6">
        <div>
          <h1 className="font-display text-4xl text-foreground text-glow">
            {displayTitle}
          </h1>
          {lang === 'he' && movie.titleHe && (
            <p className="text-muted-foreground text-sm mt-1">{movie.title}</p>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-foreground font-semibold">{detailMovie.rating}</span>
          </span>
          <span>{detailMovie.year}</span>
          <span>{detailMovie.duration}</span>
          {detailMovie.quality && (
            <span className="glass-strong px-2 py-0.5 rounded text-xs text-foreground font-medium">
              {detailMovie.quality}
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowTorrents(!showTorrents)}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold glow-red transition-all hover:bg-primary/90 tv-focus"
          >
            <Search className="w-5 h-5" />
            {lang === 'he' ? 'חפש טורנטים' : 'Find Torrents'}
          </button>
          <button
            onClick={() => setShowLinkInput(true)}
            className="glass w-14 h-14 rounded-xl flex items-center justify-center text-foreground hover:bg-accent transition-colors tv-focus"
          >
            <Link className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              const text = `${displayTitle} (${detailMovie.year})`;
              navigator.clipboard.writeText(text);
              alert(lang === 'he' ? 'נוסף לרשימה!' : 'Added to watchlist!');
            }}
            className="glass w-14 h-14 rounded-xl flex items-center justify-center text-foreground hover:bg-accent transition-colors tv-focus"
          >
            <Plus className="w-6 h-6" />
          </button>
          <button
            onClick={handleShare}
            className="glass w-14 h-14 rounded-xl flex items-center justify-center text-foreground hover:bg-accent transition-colors tv-focus"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>

        {showTorrents && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              {lang === 'he' ? 'תוצאות Torrentio' : 'Torrentio Results'}
              {!imdbId && (
                <span className="text-xs text-muted-foreground font-normal">
                  ({lang === 'he' ? 'ממתין ל-IMDB ID...' : 'Waiting for IMDB ID...'})
                </span>
              )}
            </h3>
            {torrentsLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            )}
            {!torrentsLoading && streams.length === 0 && imdbId && (
              <div className="glass rounded-xl p-4 text-center text-muted-foreground text-sm">
                {lang === 'he' ? 'לא נמצאו טורנטים' : 'No torrents found'}
              </div>
            )}
            {streams.map((stream: TorrentioStream, idx: number) => {
              const parsed = parseTorrentioTitle(stream.title || '');
              return (
                <button
                  key={idx}
                  onClick={() => handleStreamSelect(stream, idx)}
                  disabled={loadingStreamIdx !== null}
                  className="w-full glass rounded-xl p-3 flex items-start gap-3 tv-focus text-start hover:bg-accent/50 transition-colors disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {loadingStreamIdx === idx ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <Download className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground" dir="ltr">
                      {stream.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2" dir="ltr">
                      {parsed.quality}
                    </p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      {parsed.size && <span>💾 {parsed.size}</span>}
                      {parsed.seeds > 0 && <span>👤 {parsed.seeds}</span>}
                      {parsed.source && <span className="truncate">{parsed.source}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {showLinkInput && (
          <div className="glass rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-foreground text-sm font-medium">
              <Link className="w-4 h-4" />
              {lang === 'he' ? 'הדבק קישור או מגנט לצפייה' : 'Paste a link or magnet to watch'}
            </div>
            <div className="flex gap-2">
              <input
                value={linkInput}
                onChange={e => setLinkInput(e.target.value)}
                placeholder={lang === 'he' ? 'קישור / magnet...' : 'Link / magnet...'}
                className="flex-1 bg-secondary text-foreground placeholder:text-muted-foreground px-3 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm tv-focus"
                dir="ltr"
              />
              <button
                onClick={handleUnrestrict}
                disabled={unrestrict.isPending || !linkInput.trim()}
                className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 tv-focus flex items-center gap-2"
              >
                {unrestrict.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {lang === 'he' ? 'הפעל' : 'Play'}
              </button>
            </div>
            <button
              onClick={() => setShowLinkInput(false)}
              className="text-xs text-muted-foreground hover:text-foreground tv-focus"
            >
              {lang === 'he' ? 'ביטול' : 'Cancel'}
            </button>
          </div>
        )}

        {trailer && (
          <button
            onClick={() => setStreamUrl(`https://www.youtube.com/embed/${trailer.key}?autoplay=1`)}
            className="w-full glass rounded-xl p-3 flex items-center gap-3 tv-focus text-start"
          >
            <div className="w-16 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Play className="w-5 h-5 text-primary fill-primary" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground">
                {lang === 'he' ? 'צפה בטריילר' : 'Watch Trailer'}
              </h4>
              <p className="text-xs text-muted-foreground">YouTube</p>
            </div>
          </button>
        )}

        <div className="flex gap-2 flex-wrap">
          {genres.map((g: any) => {
            const name = typeof g === 'string' ? g : g.name;
            return (
              <span key={name} className="glass px-3 py-1.5 rounded-full text-xs text-secondary-foreground">
                {name}
              </span>
            );
          })}
        </div>

        <div>
          <h3 className="font-semibold text-foreground mb-2">{t('synopsis')}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {detailMovie.overview}
          </p>
        </div>

        {cast.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-3">
              {lang === 'he' ? 'שחקנים' : 'Cast'}
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {cast.map((actor: any) => (
                <div key={actor.id} className="flex-shrink-0 w-20 text-center">
                  {actor.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                      alt={actor.name}
                      className="w-16 h-16 rounded-full object-cover mx-auto mb-1"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-1 flex items-center justify-center text-muted-foreground text-xs">
                      {actor.name?.[0]}
                    </div>
                  )}
                  <p className="text-xs text-foreground truncate">{actor.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{actor.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {movie.type === 'series' && seasons.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-3">{t('seasons')}</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {seasons.map((s: any) => (
                <button
                  key={s.season_number}
                  onClick={() => setSelectedSeason(s.season_number)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all tv-focus ${
                    selectedSeason === s.season_number
                      ? 'bg-primary text-primary-foreground'
                      : 'glass text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('season')} {s.season_number}
                </button>
              ))}
            </div>
            {seasonData?.episodes && (
              <div className="mt-4 space-y-3">
                {seasonData.episodes.map((ep: any) => (
                  <button key={ep.id} className="w-full glass rounded-xl p-3 flex items-center gap-3 tv-focus text-start">
                    {ep.still_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                        alt={ep.name}
                        className="w-24 h-14 rounded-lg object-cover flex-shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-24 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Play className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground">
                        {t('episode')} {ep.episode_number}: {ep.name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">{ep.overview}</p>
                      {ep.runtime && (
                        <p className="text-xs text-muted-foreground">{ep.runtime} {t('minutes')}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {recommendations.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-3">
              {lang === 'he' ? 'המלצות דומות' : 'Recommendations'}
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {recommendations.filter((r: any) => r.poster_path).slice(0, 10).map((rec: any) => (
                <div key={rec.id} className="flex-shrink-0 w-28">
                  <img
                    src={`https://image.tmdb.org/t/p/w342${rec.poster_path}`}
                    alt={rec.title || rec.name}
                    className="w-full rounded-lg aspect-[2/3] object-cover mb-1"
                    loading="lazy"
                  />
                  <p className="text-xs text-foreground truncate">{rec.title || rec.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
