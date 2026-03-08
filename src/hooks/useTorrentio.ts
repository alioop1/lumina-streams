import { useQuery } from '@tanstack/react-query';
import { torrentio } from '@/lib/torrentio';

export const useTorrentioSearch = (
  type: 'movie' | 'series' | null,
  imdbId: string | null,
  season?: number,
  episode?: number
) =>
  useQuery({
    queryKey: ['torrentio', type, imdbId, season, episode],
    queryFn: () => torrentio.search(type!, imdbId!, season, episode),
    enabled: !!type && !!imdbId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
