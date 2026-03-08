import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TMDB_BASE = 'https://api.themoviedb.org/3';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
  if (!TMDB_API_KEY) {
    return new Response(JSON.stringify({ error: 'TMDB_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { action, params } = await req.json();
    let url = '';
    const langParam = params?.language || 'en-US';

    switch (action) {
      case 'trending':
        url = `${TMDB_BASE}/trending/${params?.media_type || 'all'}/${params?.time_window || 'week'}?api_key=${TMDB_API_KEY}&language=${langParam}&page=${params?.page || 1}`;
        break;
      case 'popular':
        url = `${TMDB_BASE}/${params?.media_type || 'movie'}/popular?api_key=${TMDB_API_KEY}&language=${langParam}&page=${params?.page || 1}`;
        break;
      case 'top_rated':
        url = `${TMDB_BASE}/${params?.media_type || 'movie'}/top_rated?api_key=${TMDB_API_KEY}&language=${langParam}&page=${params?.page || 1}`;
        break;
      case 'search':
        url = `${TMDB_BASE}/search/multi?api_key=${TMDB_API_KEY}&language=${langParam}&query=${encodeURIComponent(params?.query || '')}&page=${params?.page || 1}`;
        break;
      case 'details': {
        const type = params?.media_type || 'movie';
        url = `${TMDB_BASE}/${type}/${params?.id}?api_key=${TMDB_API_KEY}&language=${langParam}&append_to_response=credits,videos,recommendations,similar`;
        break;
      }
      case 'season': {
        url = `${TMDB_BASE}/tv/${params?.id}/season/${params?.season_number}?api_key=${TMDB_API_KEY}&language=${langParam}`;
        break;
      }
      case 'discover':
        url = `${TMDB_BASE}/discover/${params?.media_type || 'movie'}?api_key=${TMDB_API_KEY}&language=${langParam}&page=${params?.page || 1}&sort_by=${params?.sort_by || 'popularity.desc'}${params?.with_genres ? '&with_genres=' + params.with_genres : ''}`;
        break;
      case 'genres':
        url = `${TMDB_BASE}/genre/${params?.media_type || 'movie'}/list?api_key=${TMDB_API_KEY}&language=${langParam}`;
        break;
      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'TMDB API error', details: data }), {
        status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
