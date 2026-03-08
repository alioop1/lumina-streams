import { supabase } from '@/integrations/supabase/client';

export interface TorrentioStream {
  name: string;
  title: string;
  infoHash?: string;
  fileIdx?: number;
  url?: string;
  behaviorHints?: Record<string, any>;
}

export interface TorrentioResponse {
  streams: TorrentioStream[];
}

export const torrentio = {
  search: async (
    type: 'movie' | 'series',
    imdbId: string,
    season?: number,
    episode?: number
  ): Promise<TorrentioResponse> => {
    const { data, error } = await supabase.functions.invoke('torrentio', {
      body: { type, imdbId, season, episode },
    });
    if (error) throw error;
    return data || { streams: [] };
  },
};

export const parseTorrentioTitle = (title: string) => {
  const lines = title.split('\n');
  const quality = lines[0] || '';
  const sizeMatch = quality.match(/💾\s*([\d.]+\s*(?:GB|MB))/i);
  const seedMatch = quality.match(/👤\s*(\d+)/);
  return {
    quality: lines[0]?.replace(/💾.*/, '').replace(/👤.*/, '').trim() || '',
    size: sizeMatch?.[1] || '',
    seeds: seedMatch ? parseInt(seedMatch[1]) : 0,
    source: lines[1] || '',
  };
};

export const streamToMagnet = (stream: TorrentioStream): string | null => {
  if (stream.infoHash) {
    const encodedName = encodeURIComponent(stream.name || 'torrent');
    return `magnet:?xt=urn:btih:${stream.infoHash}&dn=${encodedName}`;
  }
  return stream.url || null;
};
