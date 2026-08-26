import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Currently supported Google Gemini Flash model identifier
const GEMINI_MODEL = 'gemini-3.7-flash';

// Language detection helper
function detectMessageLanguage(text: string, fallbackLang: string): 'rw' | 'fr' | 'en' {
  if (!text || typeof text !== 'string') {
    return (fallbackLang === 'rw' || fallbackLang === 'fr') ? fallbackLang : 'en';
  }

  const lower = text.toLowerCase();

  // High-confidence Kinyarwanda indicators
  const kinyarwandaPatterns = [
    /\b(muraho|bite|amakuru|umuco|nyarwanda|urwanda|u rwanda|akamaro|akahe kamaro|ni iki|kuki|gute|kubera iki|ryari|hehe)\b/i,
    /\b(umuganura|kwita izina|gusaba|gukwa|inyambo|intore|imigongo|ingoma|inanga|kalinga|ubwiru|mwami|umwami)\b/i,
    /\b(abanyarwanda|abakurambere|amateka|umuco nyarwanda|imigani|inzu ndangamurage|ubupfura|kwigira)\b/i,
    /\b(ufite|bafite|bifashishwa|bakora|byakorwaga|wajyaga|byari|yari|kandi|ndetse|cyangwa|kubera|niba)\b/i,
    /\b(mu muco|mu mateka|ku isi|mu rwanda|ku butaka|mu birori|mu migenzo)\b/i,
    /\b(sobanura|mbwira|tanga|ibisobanuro|ubusobanuro|kumenya)\b/i,
  ];

  // High-confidence French indicators
  const frenchPatterns = [
    /\b(bonjour|salut|bonsoir|merci|s'il vous plaît|sil vous plait)\b/i,
    /\b(quelle|quel|quels|quelles|pourquoi|comment|qu'est-ce|est-ce que|qu'est ce que)\b/i,
    /\b(l'importance|importance|dans la culture|dans le|dans les|du rwanda|au rwanda|culture rwandaise)\b/i,
    /\b(patrimoine|cérémonie|cérémonies|tradition|traditions|traditionnel|traditionnelle|histoire|historique)\b/i,
    /\b(pouvez-vous|expliquez-moi|racontez-moi|parlez-moi de|donnez-moi|quelles sont|quels sont)\b/i,
    /\b(avec|pour|dans|sur|sous|mais|donc|or|ni|car|parce que|c'est|ce sont)\b/i,
  ];

  let rwScore = 0;
  for (const pattern of kinyarwandaPatterns) {
    if (pattern.test(lower)) rwScore += 2;
  }

  let frScore = 0;
  for (const pattern of frenchPatterns) {
    if (pattern.test(lower)) frScore += 2;
  }

  // If explicit selector was given and matches or scores are low, favor selector
  if (fallbackLang === 'rw' && rwScore >= frScore) return 'rw';
  if (fallbackLang === 'fr' && frScore >= rwScore) return 'fr';
  if (fallbackLang === 'en' && rwScore === 0 && frScore === 0) return 'en';

  // Override if message has clear linguistic markers
  if (rwScore >= 2 && rwScore > frScore) return 'rw';
  if (frScore >= 2 && frScore > rwScore) return 'fr';

  if (fallbackLang === 'rw' || fallbackLang === 'fr' || fallbackLang === 'en') {
    return fallbackLang;
  }

  return 'en';
}

const BASE_SYSTEM_PROMPT = `You are the Umurage Hub AI Cultural Guide — an expert on Rwandan cultural heritage, history, traditions, language, arts, and values.

Your role:
- Provide accurate, respectful, and educational information about Rwandan culture
- Share knowledge about traditions, ceremonies, history, language, arts, and heritage
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

Always end responses with a culturally relevant saying or proverb in the response language when appropriate.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let dbRecords: Array<{ title: string; content: string; source_name?: string }> | null = null;
  let targetLang: 'rw' | 'fr' | 'en' = 'en';

  try {
    const { messages, language } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const latestUserMsg = messages[messages.length - 1]?.content ?? '';
    targetLang = detectMessageLanguage(latestUserMsg, language);

    // Query cultural_knowledge table for grounding context using authenticated Supabase client
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

      groundingInstructions = `\n\nVERIFIED CULTURAL ARCHIVE CONTEXT:\n${formattedRecords}\n\nPRIORITY INSTRUCTION: Use the above verified archive records as your primary reference source. Prioritize this information over general knowledge. If the context answers the user's query, base your response on it and cite the source accurately. Translate and adapt the information naturally into the required response language. Do not invent historical facts when verified information is unavailable.`;
    }

    // Explicit, strict language instructions
    let langInstruction = '';
    if (targetLang === 'rw') {
      langInstruction = `\n\nCRITICAL LANGUAGE MANDATE:
- You MUST write your ENTIRE response in natural, fluent, grammatically correct Kinyarwanda.
- Subiza mu Kinyarwanda gisobanutse kandi gisanzwe gikoreshwa mu Rwanda.
- Ntuhindukire mu Cyongereza cyangwa mu Gifaransa na gato.
- Niba hari ijambo ry'icyongereza/igifaransa cyangwa izina ry'inzobere rikenewe, risobanure mu Kinyarwanda.
- Umugani cyangwa intero y'umusozo igomba kuba mu Kinyarwanda.`;
    } else if (targetLang === 'fr') {
      langInstruction = `\n\nCRITICAL LANGUAGE MANDATE:
- You MUST write your ENTIRE response in natural, fluent, correct French.
- Réponds entièrement en français clair, élégant et naturel.
- Ne bascule JAMAIS vers l'anglais sauf pour une citation ou un nom propre spécifique.
- Le proverbe ou dicton de clôture doit être expliqué en français.`;
    } else {
      langInstruction = `\n\nCRITICAL LANGUAGE MANDATE:
- You MUST write your entire response in clear, engaging English.
- Include Kinyarwanda cultural terms with their English explanations where appropriate.`;
    }

    const systemContent = BASE_SYSTEM_PROMPT + langInstruction + groundingInstructions;

    // Localized fallback helper if Gemini is unavailable
    const getLocalizedFallback = () => {
      if (dbRecords && dbRecords.length > 0) {
        const topRecord = dbRecords[0];
        return {
          content: `**${topRecord.title}**\n\n${topRecord.content}`,
          source: topRecord.source_name || 'Rwanda Cultural Heritage Academy (RCHA)',
        };
      }

      if (targetLang === 'rw') {
        return {
          content: "Muraho! Ubu ndi gukoresha uburyo bw'ububiko bw'amateka (Archive Mode). Urashobora kumbaza ku birori gakondo nka **Umuganura** na **Kwita Izina**, inka z'**Inyambo**, cyangwa ubugeni bwa **Imigongo**.",
          source: "Inzu Ndangamurage y'u Rwanda (RCHA)",
        };
      }

      if (targetLang === 'fr') {
        return {
          content: "Bonjour ! Le guide culturel fonctionne actuellement en mode archives locales. Vous pouvez poser des questions sur les cérémonies traditionnelles comme l'**Umuganura** ou le **Kwita Izina**, les vaches royales **Inyambo**, ou l'art des **Imigongo**.",
          source: "Académie du Patrimoine Culturel du Rwanda (RCHA)",
        };
      }

      return {
        content: "Muraho! I am currently operating in archive fallback mode. Please ask about traditional ceremonies (**Umuganura**, **Kwita Izina**), royal cattle (**Inyambo**), or historical arts (**Imigongo**).",
        source: "Rwanda Cultural Heritage Academy (RCHA)",
      };
    };

    // If GEMINI_API_KEY is not configured or fails, fallback gracefully to database records
    if (!geminiApiKey) {
      console.warn('GEMINI_API_KEY environment variable is not set. Returning grounded fallback.');
      const fb = getLocalizedFallback();
      return new Response(
        JSON.stringify({
          content: fb.content,
          source: fb.source,
          languageUsed: targetLang,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Google Gemini API (v1beta endpoint for Gemini 3.7 Flash)
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
        temperature: 0.5, // Slightly lower temperature for stricter language obedience
        maxOutputTokens: 1200,
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

      const fb = getLocalizedFallback();
      return new Response(
        JSON.stringify({
          content: fb.content,
          source: fb.source,
          languageUsed: targetLang,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Parse response supporting standard Gemini candidates structure
    const generatedText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ??
      data.text ??
      (targetLang === 'rw'
        ? "Ntabwo nashoboye gutanga igisubizo ako kanya. Nyamuneka ongera ugerageze."
        : targetLang === 'fr'
        ? "Je n'ai pas pu générer de réponse pour le moment. Veuillez réessayer."
        : "I could not generate a response at this time. Please try asking again.");

    return new Response(
      JSON.stringify({
        content: generatedText,
        source: defaultSource,
        languageUsed: targetLang,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('cultural-ai function error:', err);

    // Fallback localized response on failure to prevent app crash
    let fallbackText = "Muraho! I am currently unable to reach the AI engine, but you can explore verified heritage topics like Umuganura, Inyambo, and Imigongo in our Cultural Library.";
    let fallbackSource = "Umurage Heritage Archives";

    if (targetLang === 'rw') {
      fallbackText = "Muraho! Ntabwo serivisi ya AI irimo gukora ubu, ariko urashobora gusoma amakuru yizewe ku muco nka Umuganura, Inyambo, n'Imigongo mu isomero ryacu.";
      fallbackSource = "Inzu Ndangamurage y'u Rwanda";
    } else if (targetLang === 'fr') {
      fallbackText = "Bonjour ! Le service d'IA est momentanément indisponible, mais vous pouvez explorer les thèmes culturels comme Umuganura, Inyambo et Imigongo dans notre bibliothèque.";
      fallbackSource = "Académie du Patrimoine Culturel du Rwanda";
    }

    return new Response(
      JSON.stringify({
        content: fallbackText,
        source: fallbackSource,
        languageUsed: targetLang,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
