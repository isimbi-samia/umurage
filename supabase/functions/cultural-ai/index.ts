import { corsHeaders } from '../_shared/cors.ts';

const SYSTEM_PROMPT = `You are the Umurage Hub AI Cultural Guide — an expert on Rwandan cultural heritage, history, traditions, language, arts, and values.

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

  try {
    const { messages, language } = await req.json();
    
    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    if (!apiKey || !baseUrl) {
      throw new Error('OnSpace AI not configured');
    }

    const langInstruction = language === 'rw' 
      ? '\n\nIMPORTANT: The user prefers Kinyarwanda. Respond primarily in Kinyarwanda with English translations where helpful.'
      : language === 'fr'
      ? '\n\nIMPORTANT: The user prefers French. Respond primarily in French.'
      : '';

    const systemContent = SYSTEM_PROMPT + langInstruction;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemContent },
          ...messages,
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OnSpace AI error:', errText);
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? 'I could not generate a response. Please try again.';

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('cultural-ai error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
