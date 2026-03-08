import { supabase } from '@/integrations/supabase/client';

export interface RDUser {
  id: number;
  username: string;
  email: string;
  points: number;
  locale: string;
  avatar: string;
  type: string;
  premium: number;
  expiration: string;
}

export interface RDTorrent {
  id: string;
  filename: string;
  hash: string;
  bytes: number;
  host: string;
  split: number;
  progress: number;
  status: string;
  added: string;
  links: string[];
  ended?: string;
  speed?: number;
  seeders?: number;
}

export interface RDDownload {
  id: string;
  filename: string;
  mimeType: string;
  filesize: number;
  link: string;
  host: string;
  chunks: number;
  download: string;
  generated: string;
  type?: string;
}

export interface RDUnrestrictedLink {
  id: string;
  filename: string;
  mimeType: string;
  filesize: number;
  link: string;
  host: string;
  chunks: number;
  download: string;
  streamable: number;
}

export interface RDTranscodeResult {
  [quality: string]: {
    full: string;
    acodec?: string;
    vcodec?: string;
  };
}

const callRD = async (action: string, params: Record<string, any> = {}) => {
  const { data, error } = await supabase.functions.invoke('real-debrid', {
    body: { action, params },
  });
  if (error) throw error;
  return data;
};

export const realDebrid = {
  getUser: (): Promise<RDUser> => callRD('user'),

  unrestrictLink: (link: string): Promise<RDUnrestrictedLink> =>
    callRD('unrestrict', { link }),

  getTorrents: (limit = 20, offset = 0): Promise<RDTorrent[]> =>
    callRD('torrents', { limit, offset }),

  getTorrentInfo: (id: string): Promise<RDTorrent> =>
    callRD('torrents_info', { id }),

  addMagnet: (magnet: string): Promise<{ id: string; uri: string }> =>
    callRD('torrents_add_magnet', { magnet }),

  selectFiles: (id: string, files = 'all'): Promise<void> =>
    callRD('torrents_select_files', { id, files }),

  deleteTorrent: (id: string): Promise<{ success: boolean }> =>
    callRD('torrents_delete', { id }),

  getDownloads: (limit = 20, offset = 0): Promise<RDDownload[]> =>
    callRD('downloads', { limit, offset }),

  getTranscode: (id: string): Promise<RDTranscodeResult> =>
    callRD('streaming_transcode', { id }),
};
