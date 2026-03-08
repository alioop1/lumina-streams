import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TORRENTIO_BASE = 'https://torrentio.strem.fun';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, imdbId, season, episode } = await req.json();

    if (!imdbId || !type) {
      return new Response(JSON.stringify({ error: 'Missing type or imdbId' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let streamPath = `${imdbId}`;
    if (type === 'series' && season !== undefined && episode !== undefined) {
      streamPath = `${imdbId}:${season}:${episode}`;
    }

    const url = `${TORRENTIO_BASE}/stream/${type}/${streamPath}.json`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });
    const text = await response.text();

    let data;
    try {
      data = text ? JSON.parse(text) : { streams: [] };
    } catch {
      data = { streams: [] };
    }

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Torrentio API error', streams: [] }), {
        status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg, streams: [] }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
