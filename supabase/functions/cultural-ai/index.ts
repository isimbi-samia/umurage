import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_MODEL = 'gemini-3.7-flash';

// Language detection helper with strict lexical and grammatical priority
function detectEffectiveLanguage(text: string, selectorLang?: string): 'rw' | 'fr' | 'en' {
  if (!text || typeof text !== 'string') {
    return selectorLang === 'rw' || selectorLang === 'fr' ? selectorLang : 'en';
  }

  const lower = text.toLowerCase().trim();

  // Priority A: Explicit language request in the prompt
  if (/\b(mu kinyarwanda|kinyarwanda|mu kinyarwanda gusa)\b/i.test(lower)) return 'rw';
  if (/\b(en français|en francais|en langue française|in french)\b/i.test(lower)) return 'fr';
  if (/\b(in english|mu cyongereza|en anglais)\b/i.test(lower)) return 'en';

  // Priority B: Strong grammatical and conversational indicators (excluding standalone cultural entity names)
  const rwGrammar = [
    /\b(mbwira|sobanura|tanga|ibisobanuro|ubusobanuro|kumenya|kubijyanye|ku bijyanye)\b/i,
    /\b(ni iki|kuki|gute|ryari|hehe|akahe kamaro|akamaro|kamaro ki|kamaro ka)\b/i,
    /\b(mu muco|mu mateka|mu rwanda|ku butaka|mu birori|mu migenzo|k'itorero|by'intore|z'intore)\b/i,
    /\b(abanyarwanda|abakurambere|itorero|amateka ya|umuco nyarwanda|indangagaciro)\b/i,
    /\b(zatangiye|byatangiye|bifashishwa|bakora|byakorwaga|wajyaga|byari|yari|kandi|ndetse|cyangwa|kuko|niba)\b/i,
    /\b(muraho|bite|amakuru|mwaramutse|mwiriwe)\b/i,
  ];

  const frGrammar = [
    /\b(bonjour|salut|bonsoir|merci|s'il vous plaît|sil vous plait)\b/i,
    /\b(quelle est|quel est|quels sont|quelles sont|pourquoi|comment|qu'est-ce|est-ce que|qu'est ce que)\b/i,
    /\b(l'importance|importance de|dans la culture|dans le|dans les|du rwanda|au rwanda|culture rwandaise)\b/i,
    /\b(patrimoine|cérémonie|cérémonies|tradition|traditions|traditionnel|traditionnelle|histoire de)\b/i,
    /\b(pouvez-vous|expliquez-moi|racontez-moi|parlez-moi|parlez-moi de|donnez-moi)\b/i,
    /\b(avec|pour|dans|sur|sous|mais|donc|or|ni|car|parce que|c'est|ce sont)\b/i,
  ];

  const enGrammar = [
    /\b(hello|hi|good morning|good afternoon|thank you|thanks|please)\b/i,
    /\b(what is|what are|why is|why are|how is|how are|who was|who were|when was|where did)\b/i,
    /\b(tell me|tell me about|explain|describe|give me|can you|could you)\b/i,
    /\b(in rwandan culture|in rwanda|rwandan heritage|traditional dance|history of|importance of|meaning of)\b/i,
    /\b(about|with|from|their|there|which|because|started|originated|symbolize|symbolizes)\b/i,
  ];

  let rwScore = 0;
  for (const p of rwGrammar) {
    if (p.test(lower)) rwScore += 2;
  }

  let frScore = 0;
  for (const p of frGrammar) {
    if (p.test(lower)) frScore += 2;
  }

  let enScore = 0;
  for (const p of enGrammar) {
    if (p.test(lower)) enScore += 2;
  }

  // If there are clear grammatical hits for a specific language
  if (rwScore >= 2 && rwScore > frScore && rwScore > enScore) return 'rw';
  if (frScore >= 2 && frScore > rwScore && frScore > enScore) return 'fr';
  if (enScore >= 2 && enScore > rwScore && enScore > frScore) return 'en';

  // Priority C: UI selector language fallback
  if (selectorLang === 'rw' || selectorLang === 'fr') return selectorLang;
  if (selectorLang === 'en') return 'en';

  return 'en';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let dbRecords: Array<{ title: string; content: string; source_name?: string }> | null = null;
  let effectiveLang: 'rw' | 'fr' | 'en' = 'en';

  try {
    const { messages, language } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array is required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const latestUserMsg = messages[messages.length - 1]?.content ?? '';
    effectiveLang = detectEffectiveLanguage(latestUserMsg, language);

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
          .filter((w: string) => w.length > 3 && !['mbwira', 'kubijyanye', 'bijyanye', 'about', 'parlez', 'dans', 'tell', 'what'].includes(w.toLowerCase()))
          .slice(0, 3);

        if (keywords.length > 0) {
          const filter = keywords.map((k: string) => `title.ilike.%${k}%,topic.ilike.%${k}%,content.ilike.%${k}%`).join(',');
          const { data } = await supabase
            .from('cultural_knowledge')
            .select('title, content, source_name')
            .or(filter)
            .limit(2);

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

    // Build strict localized system instructions
    let systemPrompt = '';
    let defaultSource = 'Rwanda Cultural Heritage Academy (RCHA) Verified Knowledge';

    if (effectiveLang === 'rw') {
      systemPrompt = `ROLE: Uri Umusemuzi n'Inzobere y'Umuco n'Amateka by'u Rwanda kuri Umurage Hub.
ITEGEKO RIKOMEYE RY'URURIMI:
- IGISUBIZO CYAWE CYOSE KIGOMBA KUBA MU KINYARWANDA GISOBANUTSE KANDI GIKWIYE.
- NTIWEMEREWE GUSUBIZA MU CYONGEREZA NA GATO.
- Ibisobanuro, imitwe y'ingingo ikozwe na **text**, n'umwanzuro bigomba kuba mu Kinyarwanda cy'umwimerere.
- Sobanura ibijyanye n'itorero, intore, imbyino, imihango gakondo (Umuganura, Kwita Izina), ubuhanzi (Imigongo), n'indangagaciro z'umuco.
- NTUKAZANE amasoko cyangwa imbuga mpimbano (nk'imbuga za internet cyangwa Wikipedia).`;
    } else if (effectiveLang === 'fr') {
      systemPrompt = `RÔLE: Tu es le Guide Culturel et Historique officiel du Rwanda sur Umurage Hub.
RÈGLE ABSOLUE DE LANGUE:
- TOUTE ta réponse doit être rédigée EXCLUSIVEMENT en FRANÇAIS clair, naturel et soigné.
- Il est STRICTEMENT INTERDIT de répondre en anglais.
- Les titres en gras (**texte**), explications historiques et contextes culturels doivent être en français.
- Ne pas inventer de bibliographies externes ou sources non fournies.`;
    } else {
      systemPrompt = `ROLE: You are the official AI Cultural and Heritage Guide for Rwanda on Umurage Hub.
LANGUAGE REQUIREMENT:
- Answer completely in clear, informative, and engaging English.
- Include Kinyarwanda cultural terms with their meanings and significance.
- Do not invent external bibliographies or speculative URLs.`;
    }

    // Append verified database archive grounding if available
    if (dbRecords && dbRecords.length > 0) {
      defaultSource = dbRecords[0].source_name || 'Rwanda Cultural Heritage Academy (RCHA)';
      const formattedRecords = dbRecords
        .map((r, i) => `[Record ${i + 1}: ${r.title} | Source: ${r.source_name || 'RCHA Archives'}]\n${r.content}`)
        .join('\n\n');

      if (effectiveLang === 'rw') {
        systemPrompt += `\n\nAMAKURU Y'INGENZI YIZIWE MU BUBOBIKO:\n${formattedRecords}\nIcyitonderwa: Ibi bisobanuro byizewe bishyire mu Kinyarwanda cyiza usubiza umukoresha.`;
      } else if (effectiveLang === 'fr') {
        systemPrompt += `\n\nARCHIVES CULTURELLES VÉRIFIÉES:\n${formattedRecords}\nInstruction: Utilise ces archives vérifiées et traduis/adapte-les fidèlement en français.`;
      } else {
        systemPrompt += `\n\nVERIFIED CULTURAL ARCHIVE CONTEXT:\n${formattedRecords}\nInstruction: Prioritize this verified cultural information in your English response.`;
      }
    }

    // Localized fallback helper if Gemini fails or is unconfigured
    const getSafeFallback = () => {
      if (effectiveLang === 'rw') {
        if (latestUserMsg.toLowerCase().includes('intore')) {
          return {
            content: "**Intore mu Muco Nyarwanda**\n\nIntore zari ingabo z'igihugu zatozwaga ubutwari, ikinyabupfura, n'umuco mu Itorero ry'i Bwami. Muri iki gihe, Intore zizwi cyane mu mbyino gakondo z'ingwatira zigaragaza ubutwari, gutwaza intsinzi, n'ishema ry'igihugu zikoresheje ingabo, icumu, n'umugara w'amasunzu.",
            source: 'Rwanda Cultural Heritage Academy (RCHA)',
          };
        }
        if (dbRecords && dbRecords.length > 0) {
          return {
            content: `**${dbRecords[0].title}**\n\n${dbRecords[0].content}`,
            source: dbRecords[0].source_name || 'Inzu Ndangamurage y\'u Rwanda (RCHA)',
          };
        }
        return {
          content: "Muraho! Ubu muri muri gahunda y'ububiko bw'umuco Nyarwanda. Urashobora kubaza ibijyanye n'**Intore**, **Umuganura**, inka z'**Inyambo**, cyangwa ubugeni bwa **Imigongo**.",
          source: 'Inzu Ndangamurage y\'u Rwanda (RCHA)',
        };
      }

      if (effectiveLang === 'fr') {
        if (latestUserMsg.toLowerCase().includes('intore')) {
          return {
            content: "**Les Intore dans la Culture Rwandaise**\n\nLes Intore étaient à l'origine de jeunes guerriers formés à la cour royale (Itorero) à la bravoure, à la discipline morale et aux valeurs patriotiques. Aujourd'hui, les danses traditionnelles des Intore symbolisent la fierté, la victoire et le courage des ancêtres, accompagnées des tambours sacrés (Ingoma).",
            source: 'Académie du Patrimoine Culturel du Rwanda (RCHA)',
          };
        }
        return {
          content: "Bonjour ! Le guide culturel est en mode archives vérifiées. Vous pouvez poser des questions sur les guerriers et danses **Intore**, les cérémonies royales (**Umuganura**, **Kwita Izina**), ou l'art des **Imigongo**.",
          source: 'Académie du Patrimoine Culturel du Rwanda (RCHA)',
        };
      }

      return {
        content: "**Intore — Traditional Royal Warriors and Dance**\n\nIntore historically represented elite warriors trained in the royal academy (Itorero) in leadership, courage, and traditional ethics. Today, Intore is celebrated worldwide for its dynamic choreography, symbolizing strength and cultural resilience.",
        source: 'Rwanda Cultural Heritage Academy (RCHA)',
      };
    };

    // If GEMINI_API_KEY is not set
    if (!geminiApiKey) {
      console.warn('GEMINI_API_KEY is not set. Returning grounded fallback.');
      const fb = getSafeFallback();
      return new Response(
        JSON.stringify({
          content: fb.content,
          source: fb.source,
          languageUsed: effectiveLang,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Google Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`;

    // Format message history with explicit language prefix on the current user query turn
    const formattedContents = messages.map((m: { role: string; content: string }, index: number) => {
      let text = m.content;
      if (index === messages.length - 1 && m.role === 'user') {
        if (effectiveLang === 'rw') {
          text = `[ICYITONDERWA: Subiza iki kibazo cyose mu KINYARWANDA gusa]: ${m.content}`;
        } else if (effectiveLang === 'fr') {
          text = `[INSTRUCTION: Réponds à cette question entièrement en FRANÇAIS]: ${m.content}`;
        }
      }
      return {
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text }],
      };
    });

    const payload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: formattedContents,
      generationConfig: {
        temperature: 0.3, // Lower temperature to ensure strict instruction and language adherence
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

      const fb = getSafeFallback();
      return new Response(
        JSON.stringify({
          content: fb.content,
          source: fb.source,
          languageUsed: effectiveLang,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const generatedText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ??
      data.text ??
      getSafeFallback().content;

    return new Response(
      JSON.stringify({
        content: generatedText,
        source: defaultSource,
        languageUsed: effectiveLang,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('cultural-ai function error:', err);

    let fallbackText = "Muraho! Twagize ikibazo gito muri serivisi ya AI, ariko amakuru yizewe y'umuco urayabona mu Isomero ry'Umurage.";
    if (effectiveLang === 'fr') {
      fallbackText = "Bonjour ! Le service d'IA rencontre une difficulté momentanée, mais les archives culturelles restent accessibles dans la Bibliothèque.";
    } else if (effectiveLang === 'en') {
      fallbackText = "Hello! The AI service is currently unavailable, but verified cultural records are available in the Cultural Library.";
    }

    return new Response(
      JSON.stringify({
        content: fallbackText,
        source: 'Rwanda Cultural Heritage Academy (RCHA)',
        languageUsed: effectiveLang,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
