import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const TORRENTIO_BASE = 'https://torrentio.strem.fun';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { type, imdbId, season, episode } = await req.json();

    if (!imdbId || !type) {
      return new Response(JSON.stringify({ error: 'Missing type or imdbId', streams: [] }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const safeType = type === 'series' ? 'series' : 'movie';
    const safeImdbId = String(imdbId).startsWith('tt') ? String(imdbId) : `tt${imdbId}`;

    let streamPath = safeImdbId;
    if (safeType === 'series' && season !== undefined && episode !== undefined) {
      streamPath = `${safeImdbId}:${season}:${episode}`;
    }

    const url = `${TORRENTIO_BASE}/stream/${safeType}/${streamPath}.json`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'stremio/4.4.168',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://web.stremio.com',
        'Referer': 'https://web.stremio.com/',
      },
    });

    const text = await response.text();

    let data: { streams: unknown[]; [key: string]: unknown } = { streams: [] };
    try {
      data = text ? JSON.parse(text) : { streams: [] };
    } catch {
      data = { streams: [] };
    }

    if (!response.ok) {
      return new Response(JSON.stringify({
        error: `Torrentio blocked request (${response.status})`,
        streams: [],
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ streams: Array.isArray(data.streams) ? data.streams : [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg, streams: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
