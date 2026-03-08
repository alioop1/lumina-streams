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

// Map flag emojis & common language tags to language labels
const FLAG_LANG_MAP: Record<string, string> = {
  '🇬🇧': 'English', '🇺🇸': 'English', '🇮🇹': 'Italiano', '🇪🇸': 'Español',
  '🇫🇷': 'Français', '🇩🇪': 'Deutsch', '🇵🇹': 'Português', '🇧🇷': 'Português',
  '🇷🇺': 'Русский', '🇯🇵': '日本語', '🇰🇷': '한국어', '🇨🇳': '中文',
  '🇹🇷': 'Türkçe', '🇵🇱': 'Polski', '🇳🇱': 'Nederlands', '🇷🇴': 'Română',
  '🇭🇺': 'Magyar', '🇨🇿': 'Čeština', '🇬🇷': 'Ελληνικά', '🇸🇪': 'Svenska',
  '🇳🇴': 'Norsk', '🇩🇰': 'Dansk', '🇫🇮': 'Suomi', '🇮🇱': 'עברית',
  '🇸🇦': 'العربية', '🇮🇳': 'Hindi', '🇹🇭': 'ไทย', '🇺🇦': 'Українська',
};

const KEYWORD_LANG_MAP: Record<string, string> = {
  'dual audio': 'Dual Audio', 'multi': 'Multi',
  'ita': 'Italiano', 'eng': 'English', 'spa': 'Español',
  'fre': 'Français', 'ger': 'Deutsch', 'por': 'Português',
  'rus': 'Русский', 'jpn': '日本語', 'kor': '한국어',
  'chi': '中文', 'tur': 'Türkçe', 'pol': 'Polski',
  'ara': 'العربية', 'heb': 'עברית', 'hin': 'Hindi',
};

const detectLanguages = (title: string): string[] => {
  const langs = new Set<string>();

  // Detect flag emojis (surrogate pairs)
  const flagRegex = /[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g;
  let match;
  while ((match = flagRegex.exec(title)) !== null) {
    const flag = match[0];
    if (FLAG_LANG_MAP[flag]) langs.add(FLAG_LANG_MAP[flag]);
  }

  // Detect keywords (case-insensitive)
  const lower = title.toLowerCase();
  for (const [kw, lang] of Object.entries(KEYWORD_LANG_MAP)) {
    // Match as whole word or surrounded by dots/spaces
    const re = new RegExp(`(?:^|[\\s._-])${kw}(?:[\\s._-]|$)`, 'i');
    if (re.test(lower)) langs.add(lang);
  }

  return Array.from(langs);
};

export const parseTorrentioTitle = (title: string) => {
  const lines = title.split('\n');
  const quality = lines[0] || '';
  const sizeMatch = quality.match(/💾\s*([\d.]+\s*(?:GB|MB))/i);
  const seedMatch = quality.match(/👤\s*(\d+)/);
  const languages = detectLanguages(title);

  return {
    quality: lines[0]?.replace(/💾.*/, '').replace(/👤.*/, '').trim() || '',
    size: sizeMatch?.[1] || '',
    seeds: seedMatch ? parseInt(seedMatch[1]) : 0,
    source: lines[1] || '',
    languages,
  };
};

export const streamToMagnet = (stream: TorrentioStream): string | null => {
  if (stream.infoHash) {
    const encodedName = encodeURIComponent(stream.name || 'torrent');
    return `magnet:?xt=urn:btih:${stream.infoHash}&dn=${encodedName}`;
  }
  return stream.url || null;
};
