// api/recommend.js
// Vercel Serverless Function — POST /api/recommend
// Calls Anthropic Claude to generate a personalised granola blend.

const Anthropic = require('@anthropic-ai/sdk');

module.exports = async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { goal, lifestyle, diet, timing } = req.body || {};

  if (!goal || !lifestyle) {
    return res.status(400).json({ error: 'goal and lifestyle are required' });
  }

  // --- Client-side fallback blends (used when API key is missing) ---
  const fallbacks = {
    fitness: {
      name: 'The Athlete Formula',
      ingredients: ['Granola Base', 'Date Jam', 'Plant Protein', 'Mixed Nuts', 'Dark Chocolate'],
      explanation: 'Built for performance and recovery. Plant protein supports muscle repair, date jam provides natural glucose for workouts, mixed nuts deliver sustained energy through healthy fats, and dark chocolate adds antioxidants for post-exercise recovery.'
    },
    focus: {
      name: 'The Focus Formula',
      ingredients: ['Granola Base', 'Date Jam', 'Super Seeds', 'Dark Chocolate'],
      explanation: 'Engineered for cognitive clarity. Omega-3 rich super seeds support brain cell function, dark chocolate flavonoids improve cerebral blood flow, and date jam provides a steady glucose curve — no spikes, no crashes.'
    },
    weightloss: {
      name: 'The Balance Formula',
      ingredients: ['Granola Base', 'Date Jam', 'Super Seeds', 'Coconut Flakes'],
      explanation: 'Fibre-dense and satisfying with zero refined sugar. Super seeds expand in the stomach for lasting fullness, coconut MCTs are burned for fuel rather than stored as fat, and date jam naturally curbs sugar cravings.'
    },
    energy: {
      name: 'The Vitality Formula',
      ingredients: ['Granola Base', 'Date Jam', 'Wild Honey', 'Mixed Nuts', 'Coconut Flakes'],
      explanation: 'All-day vitality from nature\'s best energy sources. Date jam and raw honey pair for an immediate yet sustained energy curve, while mixed nuts and coconut flakes maintain metabolic momentum throughout the day.'
    }
  };

  // If no API key set, return smart fallback immediately
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[/api/recommend] No ANTHROPIC_API_KEY set — returning fallback');
    return res.status(200).json(fallbacks[goal] || fallbacks.energy);
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `You are a premium nutrition expert for Deglora, a Tunisian artisan granola brand.

User profile:
- Primary goal: ${goal}
- Lifestyle: ${lifestyle}
- Dietary preference: ${diet || 'no restrictions'}
- Eating time: ${timing || 'morning'}

Available ingredients:
Base (always included): Granola Oats + Deglet Nour Date Jam (Tozeur, Tunisia)
Add-ins: Dark Chocolate (70% cacao), Wild Honey (raw/unfiltered), Mixed Nuts (almonds/cashews/walnuts), Plant Protein (+20g/serving), Coconut Flakes (toasted organic), Super Seeds (chia/flax/hemp)

Create a personalised blend. Respond ONLY with valid JSON — no markdown, no backticks, no preamble:
{"name":"The [Adjective] Formula","ingredients":["Granola Base","Date Jam","..."],"explanation":"2-3 sentences explaining why this blend fits the user."}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }]
    });

    const raw = message.content[0]?.text || '';
    // Strip any accidental markdown fences
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleaned);

    return res.status(200).json(result);

  } catch (err) {
    console.error('[/api/recommend] Error:', err.message);
    // Always return a usable result — never a bare 500
    return res.status(200).json(fallbacks[goal] || fallbacks.energy);
  }
};
