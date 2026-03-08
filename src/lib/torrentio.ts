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

const normalizeImdbId = (imdbId: string) => (imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`);

const buildTorrentioUrl = (
  type: 'movie' | 'series',
  imdbId: string,
  season?: number,
  episode?: number
) => {
  const safeImdbId = normalizeImdbId(imdbId);
  const path = type === 'series' && season !== undefined && episode !== undefined
    ? `${safeImdbId}:${season}:${episode}`
    : safeImdbId;

  return `https://torrentio.strem.fun/stream/${type}/${path}.json`;
};

const safeParseTorrentio = (raw: string): TorrentioResponse => {
  const trimmed = raw.trim();
  const jsonLike = trimmed
    .replace(/^<html><body>/i, '')
    .replace(/<\/body><\/html>$/i, '');

  try {
    const parsed = JSON.parse(jsonLike);
    return { streams: Array.isArray(parsed?.streams) ? parsed.streams : [] };
  } catch {
    return { streams: [] };
  }
};

export const torrentio = {
  search: async (
    type: 'movie' | 'series',
    imdbId: string,
    season?: number,
    episode?: number
  ): Promise<TorrentioResponse> => {
    const normalizedId = normalizeImdbId(imdbId);

    const { data, error } = await supabase.functions.invoke('torrentio', {
      body: { type, imdbId: normalizedId, season, episode },
    });

    const blockedInEdge = !!data?.error && String(data.error).includes('blocked request');

    if (!error && !blockedInEdge) {
      return { streams: Array.isArray(data?.streams) ? data.streams : [] };
    }

    // Fallback: browser-direct call (Torrentio may block datacenter IPs)
    const directUrl = buildTorrentioUrl(type, normalizedId, season, episode);
    const response = await fetch(directUrl, {
      headers: { Accept: 'application/json, text/plain, */*' },
    });
    const text = await response.text();

    if (!response.ok) {
      return { streams: [] };
    }

    return safeParseTorrentio(text);
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
