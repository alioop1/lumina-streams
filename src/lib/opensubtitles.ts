export interface SubtitleTrack {
  id: string;
  url: string;
  lang: string;
  label: string;
}

const ADDON_BASE = 'https://opensubtitles-v3.strem.io';

const normalizeImdbId = (imdbId: string) =>
  imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;

const LANG_LABELS: Record<string, string> = {
  heb: 'עברית',
  eng: 'English',
  ara: 'العربية',
  spa: 'Español',
  fre: 'Français',
  ger: 'Deutsch',
  ita: 'Italiano',
  por: 'Português',
  rus: 'Русский',
  jpn: '日本語',
  kor: '한국어',
  chi: '中文',
  tur: 'Türkçe',
  pol: 'Polski',
  dut: 'Nederlands',
  rum: 'Română',
  hun: 'Magyar',
  cze: 'Čeština',
  gre: 'Ελληνικά',
  swe: 'Svenska',
  nor: 'Norsk',
  dan: 'Dansk',
  fin: 'Suomi',
};

export async function fetchSubtitles(
  type: 'movie' | 'series',
  imdbId: string,
  season?: number,
  episode?: number
): Promise<SubtitleTrack[]> {
  const safeId = normalizeImdbId(imdbId);
  const videoId =
    type === 'series' && season !== undefined && episode !== undefined
      ? `${safeId}:${season}:${episode}`
      : safeId;

  const url = `${ADDON_BASE}/subtitles/${type}/${videoId}.json`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const subtitles: SubtitleTrack[] = (data?.subtitles || []).map(
      (sub: any, i: number) => ({
        id: sub.id || `sub-${i}`,
        url: sub.url,
        lang: sub.lang || 'unknown',
        label:
          LANG_LABELS[sub.lang] ||
          sub.SubLanguageID ||
          sub.lang ||
          `Subtitle ${i + 1}`,
      })
    );

    // Dedupe by lang - keep first (highest rated) per language
    const seen = new Set<string>();
    return subtitles.filter((s) => {
      if (seen.has(s.lang)) return false;
      seen.add(s.lang);
      return true;
    });
  } catch (e) {
    console.error('OpenSubtitles fetch failed:', e);
    return [];
  }
}
