import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_MODEL = 'gemini-3.7-flash';
const MAX_REQUEST_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

const SUPPORTED_AUDIO_MIMES = [
  'audio/webm',
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/m4a',
  'audio/aac',
  'audio/x-m4a',
];

Deno.serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 2. Enforce request size limits
  const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_REQUEST_SIZE_BYTES) {
    return new Response(
      JSON.stringify({ error: 'Payload too large. Maximum allowed size is 10MB.' }),
      { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 3. Authenticate user via Supabase JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const authHeader = req.headers.get('Authorization') ?? '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error: missing Supabase credentials.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Please sign in to submit or transcribe heritage recordings.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Parse & Validate request body
    let body: any;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Malformed JSON payload.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { title, description, category, language, elder_name, audio_base64, audio_mime } = body || {};

    if (!title && !description && !audio_base64) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: at least title, description, or audio data must be provided.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate audio MIME if audio data is sent
    if (audio_base64) {
      if (!audio_mime || !SUPPORTED_AUDIO_MIMES.includes(audio_mime.toLowerCase())) {
        return new Response(
          JSON.stringify({
            error: `Unsupported audio format. Supported MIME types: ${SUPPORTED_AUDIO_MIMES.join(', ')}`,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 5. Google Gemini AI Processing (Single Provider Architecture)
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.warn('GEMINI_API_KEY is not configured on the server.');
      return new Response(
        JSON.stringify({
          transcript: null,
          summary: null,
          themes: [],
          significance: null,
          tags: [],
          translation: null,
          status: 'unavailable',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const promptText = `You are a Rwandan cultural heritage preservation assistant for the Umurage Hub digital archive.

Details of the heritage contribution:
- Title: "${title || 'Untitled'}"
- Category: "${category || 'Oral Story'}"
- Language: "${language || 'Kinyarwanda'}"
- Storyteller / Elder: "${elder_name || 'Community Elder'}"
- Description / Notes: "${description || 'None'}"

Please analyze this submission and generate a JSON object with:
- "transcript": Exact transcribed text from the audio if audio was provided, or null if only metadata was provided.
- "summary": A concise cultural archive summary (2-3 sentences).
- "themes": An array of 3-5 cultural topics/themes.
- "significance": Historical and cultural significance for future generations.
- "tags": An array of 4-8 lowercase categorization tags.
- "translation": English translation or summary if the recording is in Kinyarwanda or French.

Return ONLY valid JSON matching this schema. If transcription cannot be accurately performed, set "transcript" to null. Do NOT fabricate or invent words.`;

    const parts: any[] = [{ text: promptText }];
    if (audio_base64 && audio_mime) {
      parts.push({
        inlineData: {
          mimeType: audio_mime,
          data: audio_base64,
        },
      });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1200,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiRes.ok) {
      console.error('Gemini API response error:', geminiRes.status);
      return new Response(
        JSON.stringify({
          transcript: null,
          summary: null,
          themes: [],
          significance: null,
          tags: [],
          translation: null,
          status: 'unavailable',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiRes.json();
    const rawContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    let parsedResult = {
      transcript: null,
      summary: null,
      themes: [],
      significance: null,
      tags: [],
      translation: null,
      status: 'success',
    };

    if (rawContent) {
      try {
        const json = JSON.parse(rawContent);
        parsedResult = {
          transcript: json.transcript || null,
          summary: json.summary || null,
          themes: Array.isArray(json.themes) ? json.themes : [],
          significance: json.significance || null,
          tags: Array.isArray(json.tags) ? json.tags : [],
          translation: json.translation || null,
          status: 'success',
        };
      } catch {
        parsedResult.summary = rawContent;
      }
    }

    return new Response(JSON.stringify(parsedResult), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('transcribe-heritage unexpected error:', err.message || err);
    return new Response(
      JSON.stringify({
        transcript: null,
        summary: null,
        themes: [],
        significance: null,
        tags: [],
        translation: null,
        status: 'unavailable',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
