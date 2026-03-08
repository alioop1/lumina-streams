import { supabase } from '@/integrations/supabase/client';

export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export interface TMDBMovie {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  media_type?: string;
  runtime?: number;
  number_of_seasons?: number;
  episode_run_time?: number[];
  credits?: { cast: any[]; crew: any[] };
  videos?: { results: any[] };
  recommendations?: { results: TMDBMovie[] };
  similar?: { results: TMDBMovie[] };
  seasons?: any[];
}

export interface TMDBResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

const callTmdb = async (action: string, params: Record<string, any> = {}) => {
  const { data, error } = await supabase.functions.invoke('tmdb', {
    body: { action, params },
  });
  if (error) throw error;
  return data;
};

export const tmdb = {
  trending: (mediaType = 'all', timeWindow = 'week', language = 'en-US', page = 1): Promise<TMDBResponse> =>
    callTmdb('trending', { media_type: mediaType, time_window: timeWindow, language, page }),

  popular: (mediaType = 'movie', language = 'en-US', page = 1): Promise<TMDBResponse> =>
    callTmdb('popular', { media_type: mediaType, language, page }),

  topRated: (mediaType = 'movie', language = 'en-US', page = 1): Promise<TMDBResponse> =>
    callTmdb('top_rated', { media_type: mediaType, language, page }),

  search: (query: string, language = 'en-US', page = 1): Promise<TMDBResponse> =>
    callTmdb('search', { query, language, page }),

  details: (id: number, mediaType = 'movie', language = 'en-US'): Promise<TMDBMovie> =>
    callTmdb('details', { id, media_type: mediaType, language }),

  season: (id: number, seasonNumber: number, language = 'en-US') =>
    callTmdb('season', { id, season_number: seasonNumber, language }),

  discover: (mediaType = 'movie', language = 'en-US', page = 1, sortBy = 'popularity.desc', withGenres?: string): Promise<TMDBResponse> =>
    callTmdb('discover', { media_type: mediaType, language, page, sort_by: sortBy, with_genres: withGenres }),

  genres: (mediaType = 'movie', language = 'en-US'): Promise<{ genres: { id: number; name: string }[] }> =>
    callTmdb('genres', { media_type: mediaType, language }),
};

export const getImageUrl = (path: string | null, size = 'w500'): string => {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

export const getBackdropUrl = (path: string | null, size = 'w1280'): string => {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

// Convert TMDB movie to our Movie type for backward compatibility
export const tmdbToMovie = (item: TMDBMovie, mediaType?: string): import('./mockData').Movie => {
  const type = mediaType || item.media_type || 'movie';
  const isTV = type === 'tv';
  const title = isTV ? (item.name || '') : (item.title || '');
  const year = isTV
    ? (item.first_air_date ? new Date(item.first_air_date).getFullYear() : 0)
    : (item.release_date ? new Date(item.release_date).getFullYear() : 0);
  const duration = isTV
    ? (item.episode_run_time?.[0] ? `${item.episode_run_time[0]}m/ep` : (item.number_of_seasons ? `${item.number_of_seasons} Seasons` : 'Series'))
    : (item.runtime ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m` : '');

  return {
    id: String(item.id),
    title,
    year,
    rating: Math.round(item.vote_average * 10) / 10,
    duration,
    genres: item.genres?.map(g => g.name) || [],
    overview: item.overview || '',
    poster: item.poster_path ? getImageUrl(item.poster_path) : '',
    backdrop: item.backdrop_path ? getBackdropUrl(item.backdrop_path) : undefined,
    quality: item.vote_average >= 8 ? '4K HDR' : item.vote_average >= 7 ? '4K' : '1080p',
    type: isTV ? 'series' : 'movie',
    tmdbId: item.id,
    mediaType: isTV ? 'tv' : 'movie',
  };
};
