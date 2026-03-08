import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RD_BASE = 'https://api.real-debrid.com/rest/1.0';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const RD_API_KEY = Deno.env.get('REAL_DEBRID_API_KEY');
  if (!RD_API_KEY) {
    return new Response(JSON.stringify({ error: 'REAL_DEBRID_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const rdHeaders = {
    'Authorization': `Bearer ${RD_API_KEY}`,
  };

  try {
    const { action, params } = await req.json();

    let url = '';
    let method = 'GET';
    let body: string | undefined;

    switch (action) {
      case 'user':
        url = `${RD_BASE}/user`;
        break;
      case 'unrestrict':
        url = `${RD_BASE}/unrestrict/link`;
        method = 'POST';
        body = `link=${encodeURIComponent(params?.link || '')}`;
        break;
      case 'torrents':
        url = `${RD_BASE}/torrents?limit=${params?.limit || 20}&offset=${params?.offset || 0}`;
        break;
      case 'torrents_info':
        url = `${RD_BASE}/torrents/info/${params?.id}`;
        break;
      case 'torrents_add_magnet':
        url = `${RD_BASE}/torrents/addMagnet`;
        method = 'POST';
        body = `magnet=${encodeURIComponent(params?.magnet || '')}`;
        break;
      case 'torrents_select_files':
        url = `${RD_BASE}/torrents/selectFiles/${params?.id}`;
        method = 'POST';
        body = `files=${params?.files || 'all'}`;
        break;
      case 'torrents_delete':
        url = `${RD_BASE}/torrents/delete/${params?.id}`;
        method = 'DELETE';
        break;
      case 'downloads':
        url = `${RD_BASE}/downloads?limit=${params?.limit || 20}&offset=${params?.offset || 0}`;
        break;
      case 'streaming_transcode':
        url = `${RD_BASE}/streaming/transcode/${params?.id}`;
        break;
      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...rdHeaders,
        ...(method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      },
    };
    if (body) fetchOptions.body = body;

    const response = await fetch(url, fetchOptions);
    
    if (method === 'DELETE' && response.status === 204) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Real-Debrid API error', details: data }), {
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
