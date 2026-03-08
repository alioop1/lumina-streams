import { useQuery } from '@tanstack/react-query';
import { tmdb, tmdbToMovie, TMDBMovie } from '@/lib/tmdb';
import { useLanguage } from '@/contexts/LanguageContext';
import { Movie } from '@/lib/mockData';

const getLang = (lang: string) => lang === 'he' ? 'he-IL' : 'en-US';

export const useTrending = (mediaType = 'all', timeWindow = 'week') => {
  const { lang } = useLanguage();
  return useQuery({
    queryKey: ['tmdb', 'trending', mediaType, timeWindow, lang],
    queryFn: async () => {
      const data = await tmdb.trending(mediaType, timeWindow, getLang(lang));
      return data.results
        .filter((r: TMDBMovie) => r.poster_path)
        .map((r: TMDBMovie) => tmdbToMovie(r));
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const usePopular = (mediaType = 'movie') => {
  const { lang } = useLanguage();
  return useQuery({
    queryKey: ['tmdb', 'popular', mediaType, lang],
    queryFn: async () => {
      const data = await tmdb.popular(mediaType, getLang(lang));
      return data.results
        .filter((r: TMDBMovie) => r.poster_path)
        .map((r: TMDBMovie) => tmdbToMovie(r, mediaType));
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useTopRated = (mediaType = 'movie') => {
  const { lang } = useLanguage();
  return useQuery({
    queryKey: ['tmdb', 'top_rated', mediaType, lang],
    queryFn: async () => {
      const data = await tmdb.topRated(mediaType, getLang(lang));
      return data.results
        .filter((r: TMDBMovie) => r.poster_path)
        .map((r: TMDBMovie) => tmdbToMovie(r, mediaType));
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useSearch = (query: string) => {
  const { lang } = useLanguage();
  return useQuery({
    queryKey: ['tmdb', 'search', query, lang],
    queryFn: async () => {
      const data = await tmdb.search(query, getLang(lang));
      return data.results
        .filter((r: TMDBMovie) => r.poster_path && (r.media_type === 'movie' || r.media_type === 'tv'))
        .map((r: TMDBMovie) => tmdbToMovie(r));
    },
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000,
  });
};

export const useMovieDetails = (id: number | null, mediaType = 'movie') => {
  const { lang } = useLanguage();
  return useQuery({
    queryKey: ['tmdb', 'details', id, mediaType, lang],
    queryFn: async () => {
      const data = await tmdb.details(id!, mediaType, getLang(lang));
      return { raw: data, movie: tmdbToMovie(data, mediaType) };
    },
    enabled: id !== null,
    staleTime: 10 * 60 * 1000,
  });
};

export const useSeason = (tvId: number | null, seasonNumber: number) => {
  const { lang } = useLanguage();
  return useQuery({
    queryKey: ['tmdb', 'season', tvId, seasonNumber, lang],
    queryFn: () => tmdb.season(tvId!, seasonNumber, getLang(lang)),
    enabled: tvId !== null,
    staleTime: 10 * 60 * 1000,
  });
};

export const useGenres = (mediaType = 'movie') => {
  const { lang } = useLanguage();
  return useQuery({
    queryKey: ['tmdb', 'genres', mediaType, lang],
    queryFn: () => tmdb.genres(mediaType, getLang(lang)),
    staleTime: 60 * 60 * 1000,
  });
};

export const useDiscover = (mediaType = 'movie', genreId?: string) => {
  const { lang } = useLanguage();
  return useQuery({
    queryKey: ['tmdb', 'discover', mediaType, genreId, lang],
    queryFn: async () => {
      const data = await tmdb.discover(mediaType, getLang(lang), 1, 'popularity.desc', genreId);
      return data.results
        .filter((r: TMDBMovie) => r.poster_path)
        .map((r: TMDBMovie) => tmdbToMovie(r, mediaType));
    },
    staleTime: 5 * 60 * 1000,
  });
};
