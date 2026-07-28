import { corsHeaders } from '../_shared/cors.ts';

const CULTURAL_KEYWORDS = [
  'Rwanda', 'Kigali', 'Umuganura', 'Intore', 'Inyambo', 'Imigongo', 'Kalinga',
  'Gusaba', 'Kwita Izina', 'Ubwuzu', 'Umubyeyi', 'Ikinimba', 'Umushagiriro',
  'Agaseke', 'Umuganda', 'Ruhago', 'Amajina', 'Ejo', 'Imanzi', 'Girinka',
  'Ikiganiro', 'Ubukwe', 'Gukuna', 'Guharira', 'Kwiga', 'Amasaza',
  'Amaraso', 'Imigani', 'Ibyivugo', 'Ibisigo', 'Indirimbo', 'Umunyigoga',
  'Umugore', 'Umushumba', 'Uburago', 'Ibimbo', 'Icyivugo', 'Ururimi',
  'Kinyarwanda', 'Rwandan', 'Akagera', 'Nyungwe', 'Volcanoes', 'Virunga',
  'Nyanza', 'Huye', 'Butare', 'Ruhengeri', 'Musanze', 'Rubavu', 'Rusizi',
  'Northern Province', 'Southern Province', 'Eastern Province', 'Western Province',
  'kingdom', 'mwami', 'royal', 'monarchy', 'RCHA', 'Inteko Yumuco',
  'heritage', 'tradition', 'ceremony', 'dance', 'drum', 'storytelling',
  'oral history', 'cultural', 'ancestry', 'lineage', 'proverb',
  'cattle', 'pastoral', 'agriculture', 'harvest', 'festival',
  'weaving', 'pottery', 'craft', 'artifact', 'museum',
  'colonial', 'independence', 'genocide', 'reconciliation',
  'ubuntu', 'gukunda', 'kwesha', 'kuzahinda', 'ishimwe',
  'kwigira', 'kuremera', 'guhumeka', 'gukore', 'kugira',
];

const NON_CULTURAL_PATTERNS = [
  /\b(politics|election|campaign|party|leader|opposition|government|bureaucracy)\b/i,
  /\b(sports|football|soccer|basketball|olympic|championship|tournament)\b/i,
  /\b(technology|software|app|startup|crypto|blockchain|AI|machine learning)\b/i,
  /\b(finance|stock|market|investment|bitcoin|trading)\b/i,
  /\b(celebrity|movie|hollywood|entertainment|gossip|tv show)\b/i,
  /\b(violence|terrorism|war|weapon|gun|bomb|attack)\b/i,
  /\b(weather|climate|global warming|pollution|environmental\s+disaster)\b/i,
  /\b(health|disease|covid|pandemic|hospital|medicine|pharmacy)\b/i,
];

const RWANDAN_PLACE_NAMES = [
  'Kigali', 'Gisenyi', 'Rubavu', 'Rusizi', 'Cyangugu', 'Musanze', 'Ruhengeri',
  'Huye', 'Butare', 'Nyanza', 'Muhanga', 'Kamonyi', 'Mafinga', 'Kayonza',
  'Kibungo', 'Ngoma', 'Kirehe', 'Gisagara', 'Nyamasheke', 'Rutsiro',
  'Rubavu', 'Rusizi', 'Karongi', 'Nyabihu', 'Western Province',
  'Northern Province', 'Southern Province', 'Eastern Province', 'Central Province',
];

const CULTURAL_TOPICS = [
  'Traditions and Ceremonies',
  'History and Kingdoms',
  'Visual Arts and Crafts',
  'Music and Dance',
  'Oral Heritage and Storytelling',
  'Language and Literature',
  'Cultural Symbols and Icons',
  'Sacred Sites and Heritage',
  'Food and Agriculture',
  'Community and Social Practices',
  'Cultural Preservation',
];

interface TruthAnalysis {
  is_culturally_relevant: boolean;
  confidence: number;
  score: number;
  cultural_topics: string[];
  flagged: boolean;
  reason: string;
  rwandan_keywords_found: string[];
  non_cultural_indicators: string[];
  summary: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { title, description, tags, content, userId } = await req.json();

    if (!title && !description && !content) {
      throw new Error('Missing content to analyze');
    }

    const combinedText = [
      title || '',
      description || '',
      content || '',
      tags ? tags.join(' ') : '',
    ].join(' ').toLowerCase();

    const foundKeywords: string[] = [];
    const foundPlaces: string[] = [];
    const foundTopics: string[] = [];

    for (const keyword of CULTURAL_KEYWORDS) {
      if (combinedText.includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
      }
    }

    for (const place of RWANDAN_PLACE_NAMES) {
      if (combinedText.includes(place.toLowerCase())) {
        foundPlaces.push(place);
      }
    }

    for (const topic of CULTURAL_TOPICS) {
      const topicWords = topic.toLowerCase().split(' and ');
      if (topicWords.every(w => combinedText.includes(w))) {
        foundTopics.push(topic);
      }
    }

    const nonCulturalMatches: string[] = [];
    for (const pattern of NON_CULTURAL_PATTERNS) {
      const match = combinedText.match(pattern);
      if (match) {
        nonCulturalMatches.push(match[0]);
      }
    }

    const keywordScore = Math.min(foundKeywords.length * 15, 60);
    const placeScore = Math.min(foundPlaces.length * 10, 25);
    const topicScore = Math.min(foundTopics.length * 10, 15);
    const nonCulturalPenalty = nonCulturalMatches.length * 20;

    const rawScore = keywordScore + placeScore + topicScore - nonCulturalPenalty;
    const score = Math.max(0, Math.min(100, rawScore + 10));

    const threshold = 35;
    const isCulturallyRelevant = score >= threshold;
    const hasNonCulturalIndicators = nonCulturalMatches.length > 0;
    const flagged = !isCulturallyRelevant || hasNonCulturalIndicators;

    let reason = '';
    if (isCulturallyRelevant && !flagged) {
      reason = `This content appears to be related to Rwandan culture with a confidence score of ${score}%.`;
    } else if (flagged && !isCulturallyRelevant) {
      const missingKw = CULTURAL_KEYWORDS.filter(k => !combinedText.includes(k.toLowerCase())).slice(0, 3);
      reason = `This content does not appear to be related to Rwandan culture. ${nonCulturalMatches.length > 0 ? 'It contains non-cultural indicators.' : ''} Cultural keywords not found: ${missingKw.join(', ')}.`;
    } else if (hasNonCulturalIndicators && isCulturallyRelevant) {
      reason = `This content is related to Rwandan culture but contains non-cultural indicators that may need review.`;
    } else {
      reason = 'Unable to determine cultural relevance. Manual review recommended.';
    }

    const result: TruthAnalysis = {
      is_culturally_relevant: isCulturallyRelevant,
      confidence: score,
      score: score,
      cultural_topics: foundTopics.slice(0, 5),
      flagged: flagged,
      reason: reason,
      rwandan_keywords_found: foundKeywords.slice(0, 10),
      non_cultural_indicators: nonCulturalMatches,
      summary: `Analyzed ${foundKeywords.length} cultural keywords, ${foundPlaces.length} Rwandan place references, and ${foundTopics.length} cultural topic matches. ${isCulturallyRelevant ? 'Content is relevant to Rwandan culture.' : 'Content does not appear relevant to Rwandan culture.'}`,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('truth-detector error:', err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Unknown error',
        is_culturally_relevant: false,
        confidence: 0,
        score: 0,
        flagged: true,
        reason: 'Analysis failed due to an error.',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});