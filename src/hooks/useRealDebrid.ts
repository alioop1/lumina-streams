import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { realDebrid } from '@/lib/realDebrid';

export const useRDUser = () =>
  useQuery({
    queryKey: ['rd', 'user'],
    queryFn: () => realDebrid.getUser(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

export const useRDTorrents = (limit = 20, offset = 0) =>
  useQuery({
    queryKey: ['rd', 'torrents', limit, offset],
    queryFn: () => realDebrid.getTorrents(limit, offset),
    staleTime: 30 * 1000,
  });

export const useRDTorrentInfo = (id: string | null) =>
  useQuery({
    queryKey: ['rd', 'torrent', id],
    queryFn: () => realDebrid.getTorrentInfo(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === 'downloading' ? 3000 : false;
    },
  });

export const useRDDownloads = (limit = 20, offset = 0) =>
  useQuery({
    queryKey: ['rd', 'downloads', limit, offset],
    queryFn: () => realDebrid.getDownloads(limit, offset),
    staleTime: 30 * 1000,
  });

export const useRDUnrestrict = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (link: string) => realDebrid.unrestrictLink(link),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rd', 'downloads'] }),
  });
};

export const useRDAddMagnet = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (magnet: string) => {
      const result = await realDebrid.addMagnet(magnet);
      try {
        await realDebrid.selectFiles(result.id, 'all');
      } catch (e) {
        // Already cached/downloaded torrents may reject selectFiles - that's OK
        console.warn('selectFiles skipped (likely already cached):', e);
      }
      return result;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rd', 'torrents'] }),
  });
};

export const useRDDeleteTorrent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => realDebrid.deleteTorrent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rd', 'torrents'] }),
  });
};

export const useRDTranscode = (id: string | null) =>
  useQuery({
    queryKey: ['rd', 'transcode', id],
    queryFn: () => realDebrid.getTranscode(id!),
    enabled: !!id,
  });
