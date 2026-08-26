import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_MODEL = 'gemini-1.5-flash';

const BASE_SYSTEM_PROMPT = `You are the Umurage Hub AI Cultural Guide — an expert on Rwandan cultural heritage, history, traditions, language, arts, and values.

Your role:
- Provide accurate, respectful, and educational information about Rwandan culture
- Share knowledge about traditions, ceremonies, history, language, arts, and heritage
- Respond in the same language the user writes in (English, Kinyarwanda, or French)
- Be warm, respectful, and culturally sensitive in your tone
- Format responses with bold headers using **text** for key concepts
- Keep answers educational yet engaging — include cultural context and significance
- Cite traditional knowledge respectfully, acknowledging elders and oral traditions
- For topics about history: be accurate and acknowledge Rwanda's full history
- Encourage deeper learning and appreciation of Rwandan culture

Topics you excel at:
- Rwanda's kingdoms and historical events
- Traditional ceremonies (Umuganura, Kwita Izina, Gusaba, Gukwa, etc.)
- Traditional arts (Imigongo, weaving, pottery)
- Traditional dances (Intore, Umushagiriro, Ikinimba)
- Kinyarwanda language, proverbs (imigani), and idioms
- Traditional foods and agriculture
- Oral traditions and elder wisdom
- Cultural symbols (Inyambo cattle, Ingoma, Kalinga)
- Rwanda's natural heritage
- Cultural preservation and digital archiving

Always end responses with a culturally relevant saying or proverb when appropriate.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let dbRecords: Array<{ title: string; content: string; source_name?: string }> | null = null;

  try {
    const { messages, language } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const latestUserMsg = messages[messages.length - 1]?.content ?? '';

    // Query cultural_knowledge table for grounding context using Supabase client
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
      const authHeader = req.headers.get('Authorization') ?? '';

      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });

        const keywords = latestUserMsg
          .replace(/[^\w\s]/gi, '')
          .split(/\s+/)
          .filter((w: string) => w.length > 3)
          .slice(0, 3);

        if (keywords.length > 0) {
          const filter = keywords.map((k: string) => `title.ilike.%${k}%,topic.ilike.%${k}%,content.ilike.%${k}%`).join(',');
          const { data } = await supabase
            .from('cultural_knowledge')
            .select('title, content, source_name')
            .or(filter)
            .limit(3);

          if (data && data.length > 0) {
            dbRecords = data;
          }
        }
      }
    } catch (dbErr) {
      console.warn('Database grounding query failed, proceeding with model knowledge:', dbErr);
    }

    // Read Google Gemini API Key from environment secret
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    // Grounding Context Assembly
    let groundingInstructions = '';
    let defaultSource = 'Umurage AI Cultural Guide';

    if (dbRecords && dbRecords.length > 0) {
      defaultSource = dbRecords[0].source_name || 'Rwanda Cultural Heritage Academy (RCHA) Verified Knowledge';
      const formattedRecords = dbRecords
        .map((r, i) => `[Record ${i + 1}: ${r.title} | Source: ${r.source_name || 'RCHA Archives'}]\n${r.content}`)
        .join('\n\n');

      groundingInstructions = `\n\nVERIFIED CULTURAL ARCHIVE CONTEXT:\n${formattedRecords}\n\nPRIORITY INSTRUCTION: Use the above verified archive records as your primary reference source. Prioritize this information over general knowledge. If the context answers the user's query, base your response on it and cite the source accurately. Do not invent historical facts when verified information is unavailable.`;
    }

    const langInstruction =
      language === 'rw'
        ? '\n\nIMPORTANT: The user prefers Kinyarwanda. Respond primarily in Kinyarwanda with English translations for key technical/cultural terms where helpful.'
        : language === 'fr'
        ? '\n\nIMPORTANT: The user prefers French. Respond primarily in French.'
        : '';

    const systemContent = BASE_SYSTEM_PROMPT + langInstruction + groundingInstructions;

    // If GEMINI_API_KEY is not configured or fails, fallback gracefully to database records
    if (!geminiApiKey) {
      console.warn('GEMINI_API_KEY environment variable is not set. Returning grounded fallback.');
      if (dbRecords && dbRecords.length > 0) {
        const topRecord = dbRecords[0];
        return new Response(
          JSON.stringify({
            content: `**${topRecord.title}**\n\n${topRecord.content}`,
            source: topRecord.source_name || 'Rwanda Cultural Heritage Academy (RCHA)',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          content: "Muraho! I am currently operating in archive fallback mode. Please ask about traditional ceremonies (Umuganura, Kwita Izina), royal cattle (Inyambo), or historical arts (Imigongo).",
          source: "RCHA Heritage Archives",
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Google Gemini API (generateContent endpoint)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`;

    // Format message history for Gemini API payload
    const formattedContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const payload = {
      systemInstruction: {
        parts: [{ text: systemContent }],
      },
      contents: formattedContents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    };

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', response.status, errText);

      // Fallback if Gemini is rate limited or unavailable
      if (dbRecords && dbRecords.length > 0) {
        const topRecord = dbRecords[0];
        return new Response(
          JSON.stringify({
            content: `**${topRecord.title}**\n\n${topRecord.content}`,
            source: topRecord.source_name || 'Rwanda Cultural Heritage Academy (RCHA)',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`Gemini API responded with status ${response.status}`);
    }

    const data = await response.json();
    const generatedText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ??
      'I could not generate a response at this time. Please try asking again.';

    return new Response(
      JSON.stringify({
        content: generatedText,
        source: defaultSource,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('cultural-ai function error:', err);

    // Fallback response on failure to prevent app crash
    if (dbRecords && dbRecords.length > 0) {
      const topRecord = dbRecords[0];
      return new Response(
        JSON.stringify({
          content: `**${topRecord.title}**\n\n${topRecord.content}`,
          source: topRecord.source_name || 'Rwanda Cultural Heritage Academy (RCHA)',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        content: 'Muraho! I am currently unable to reach the AI engine, but you can explore verified heritage topics like Umuganura, Inyambo, and Imigongo in our Cultural Library.',
        source: 'Umurage Heritage Archives',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
