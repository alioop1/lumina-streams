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
  const jsonLike = trimmed.replace(/^<html><body>/i, '').replace(/<\/body><\/html>$/i, '');
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

    // Fallback: browser-direct call
    const directUrl = buildTorrentioUrl(type, normalizedId, season, episode);
    const response = await fetch(directUrl, {
      headers: { Accept: 'application/json, text/plain, */*' },
    });
    const text = await response.text();
    if (!response.ok) return { streams: [] };
    return safeParseTorrentio(text);
  },
};

// ═══════════════════════════════════════════
//  Language detection
// ═══════════════════════════════════════════

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
  const flagRegex = /[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g;
  let match;
  while ((match = flagRegex.exec(title)) !== null) {
    const flag = match[0];
    if (FLAG_LANG_MAP[flag]) langs.add(FLAG_LANG_MAP[flag]);
  }
  const lower = title.toLowerCase();
  for (const [kw, lang] of Object.entries(KEYWORD_LANG_MAP)) {
    const re = new RegExp(`(?:^|[\\s._-])${kw}(?:[\\s._-]|$)`, 'i');
    if (re.test(lower)) langs.add(lang);
  }
  return Array.from(langs);
};

// ═══════════════════════════════════════════
//  Codec detection (AV1, HEVC, H264, VP9...)
// ═══════════════════════════════════════════

type AudioCodecInfo = { codec: string; compatible: boolean };
type VideoCodecInfo = { codec: string; compatible: boolean };

const detectAudioCodec = (title: string): AudioCodecInfo => {
  const upper = title.toUpperCase();
  if (/\bDTS[\s.-]?HD[\s.-]?MA/i.test(upper)) return { codec: 'DTS-HD MA', compatible: false };
  if (/\bDTS[\s.-]?HD/i.test(upper)) return { codec: 'DTS-HD', compatible: false };
  if (/\bTRUE[\s.-]?HD/i.test(upper)) return { codec: 'TrueHD', compatible: false };
  if (/\bAtmos/i.test(upper)) return { codec: 'Atmos', compatible: false };
  if (/\bDTS[\s.-]?X/i.test(upper)) return { codec: 'DTS:X', compatible: false };
  if (/\bDTS/i.test(upper)) return { codec: 'DTS', compatible: false };
  if (/\bEAC[\s.-]?3|E[\s.-]?AC3|DDP?\d/i.test(upper)) return { codec: 'EAC3/DD+', compatible: false };
  if (/\bAC[\s.-]?3|DD[\s.]?5[\s.]?1/i.test(upper)) return { codec: 'AC3/DD', compatible: false };
  if (/DDP?5[\s.]?1/i.test(upper)) return { codec: 'DD+ 5.1', compatible: false };
  // Compatible codecs
  if (/\bAAC/i.test(upper)) return { codec: 'AAC', compatible: true };
  if (/\bOPUS/i.test(upper)) return { codec: 'Opus', compatible: true };
  if (/\bVORBIS/i.test(upper)) return { codec: 'Vorbis', compatible: true };
  if (/\bFLAC/i.test(upper)) return { codec: 'FLAC', compatible: true };
  if (/\bMP3/i.test(upper)) return { codec: 'MP3', compatible: true };
  return { codec: '', compatible: true };
};

const detectVideoCodec = (title: string): VideoCodecInfo => {
  const upper = title.toUpperCase();
  // AV1 — supported in modern browsers (Chrome 70+, Firefox 67+, Edge 79+)
  if (/\bAV1\b/i.test(upper)) return { codec: 'AV1', compatible: true };
  // VP9 — widely supported
  if (/\bVP9\b/i.test(upper)) return { codec: 'VP9', compatible: true };
  // HEVC/H265 — NOT supported in most browsers (only Safari/Edge with HW)
  const hasHevc = /\b(H[\s.-]?265|HEVC|X265)\b/i.test(upper);
  const hasHdrDv = /\b(HDR10\+?|DV|DOLBY[\s.-]?VISION|HDR)\b/i.test(upper);
  if (hasHevc || hasHdrDv) return { codec: hasHdrDv ? 'HEVC/HDR' : 'HEVC', compatible: false };
  // H264/AVC — universally supported
  if (/\b(H[\s.-]?264|AVC|X264)\b/i.test(upper)) return { codec: 'H264', compatible: true };
  // MPEG-4 — supported
  if (/\bXVID|DIVX/i.test(upper)) return { codec: 'MPEG-4', compatible: true };
  return { codec: '', compatible: true };
};

// Resolution detection
const detectResolution = (title: string): string => {
  if (/\b2160p|4K|UHD\b/i.test(title)) return '4K';
  if (/\b1080p\b/i.test(title)) return '1080p';
  if (/\b720p\b/i.test(title)) return '720p';
  if (/\b480p\b/i.test(title)) return '480p';
  return '';
};

// Source type detection (Stremio-style)
const detectSourceType = (title: string): string => {
  if (/\bWEB[\s.-]?DL\b/i.test(title)) return 'WEB-DL';
  if (/\bWEB[\s.-]?Rip\b/i.test(title)) return 'WEBRip';
  if (/\bBlu[\s.-]?Ray|BDREMUX|BDRIP\b/i.test(title)) return 'BluRay';
  if (/\bHDRip\b/i.test(title)) return 'HDRip';
  if (/\bDVD[\s.-]?Rip\b/i.test(title)) return 'DVDRip';
  if (/\bHDTV\b/i.test(title)) return 'HDTV';
  if (/\bCAM|TS|HDCAM\b/i.test(title)) return 'CAM';
  return '';
};

// HDR type detection
const detectHDR = (title: string): string => {
  if (/\bDolby[\s.-]?Vision|DV\b/i.test(title)) return 'DV';
  if (/\bHDR10\+/i.test(title)) return 'HDR10+';
  if (/\bHDR10\b/i.test(title)) return 'HDR10';
  if (/\bHDR\b/i.test(title)) return 'HDR';
  return '';
};

const parseSizeToMB = (size: string): number => {
  const match = size.match(/([\d.]+)\s*(GB|MB)/i);
  if (!match) return Number.POSITIVE_INFINITY;
  const value = Number(match[1]);
  const unit = match[2].toUpperCase();
  return unit === 'GB' ? value * 1024 : value;
};

const detectInstantAvailability = (title: string): boolean =>
  /⚡|instant|cached|rd\+|real-?debrid/i.test(title);

export interface ParsedTorrentInfo {
  quality: string;
  size: string;
  sizeInMB: number;
  seeds: number;
  source: string;
  languages: string[];
  audioCodec: string;
  audioCompatible: boolean;
  videoCodec: string;
  videoCompatible: boolean;
  resolution: string;
  sourceType: string;
  hdr: string;
  isInstant: boolean;
}

export const parseTorrentioTitle = (title: string): ParsedTorrentInfo => {
  const lines = title.split('\n');
  const quality = lines[0] || '';
  const sizeMatch = quality.match(/💾\s*([\d.]+\s*(?:GB|MB))/i);
  const seedMatch = quality.match(/👤\s*(\d+)/);
  const languages = detectLanguages(title);
  const audioCodec = detectAudioCodec(title);
  const videoCodec = detectVideoCodec(title);
  const resolution = detectResolution(title);
  const sourceType = detectSourceType(title);
  const hdr = detectHDR(title);
  const size = sizeMatch?.[1] || '';

  return {
    quality: lines[0]?.replace(/💾.*/, '').replace(/👤.*/, '').trim() || '',
    size,
    sizeInMB: parseSizeToMB(size),
    seeds: seedMatch ? parseInt(seedMatch[1]) : 0,
    source: lines[1] || '',
    languages,
    audioCodec: audioCodec.codec,
    audioCompatible: audioCodec.compatible,
    videoCodec: videoCodec.codec,
    videoCompatible: videoCodec.compatible,
    resolution,
    sourceType,
    hdr,
    isInstant: detectInstantAvailability(title),
  };
};

export const streamToMagnet = (stream: TorrentioStream): string | null => {
  if (stream.infoHash) {
    const encodedName = encodeURIComponent(stream.name || 'torrent');
    return `magnet:?xt=urn:btih:${stream.infoHash}&dn=${encodedName}`;
  }
  return stream.url || null;
};
