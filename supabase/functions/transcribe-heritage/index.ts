import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { title, description, category, language, elder_name } = await req.json();

    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    if (!apiKey || !baseUrl) {
      throw new Error('OnSpace AI not configured');
    }

    const prompt = `You are helping archive Rwandan cultural heritage recordings for the Umurage Hub digital archive.

A recording has been submitted with the following details:
- Title: "${title}"
- Category: "${category}"
- Language: "${language}"
- Elder/Contributor: "${elder_name || 'Anonymous'}"
- Description: "${description || 'No description provided'}"

Please generate:
1. A culturally enriched archive summary (2-3 sentences)
2. Key cultural topics and themes this recording covers
3. Historical and cultural significance
4. Suggested tags for archive categorization (5-8 tags)
5. A brief English translation/summary if the content is in Kinyarwanda or French

Format your response as JSON with keys: summary, themes, significance, tags, translation
Keep the response respectful, educational, and suitable for a national cultural archive.`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.5,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '{}';
    
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { summary: content, themes: [], significance: '', tags: [], translation: '' };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('transcribe-heritage error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
