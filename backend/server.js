/* ============================================================
   DEGLORA — server.js
   Node.js / Express backend
   - POST /api/recommend  → AI blend recommendation
   - POST /api/qr-scan    → Points system
   - GET  /api/user/:id   → User profile + points
   ============================================================ */

const express  = require('express');
const cors     = require('cors');
const dotenv   = require('dotenv');
const Anthropic = require('@anthropic-ai/sdk');

dotenv.config();

const app  = express();
const port = process.env.PORT || 3001;

/* ---- Middleware ---- */
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static('../frontend'));

/* ---- Anthropic Client ---- */
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/* ---- In-memory DB (replace with Supabase/Firebase) ---- */
const users = new Map();
const qrCodes = new Map([
  ['DGL-001-ORIG', { bottleId: 'DGL-001', blend: 'Original', scanned: false }],
  ['DGL-002-FOCS', { bottleId: 'DGL-002', blend: 'Focus Formula', scanned: false }],
  ['DGL-003-ATHL', { bottleId: 'DGL-003', blend: 'Athlete Formula', scanned: false }],
]);

/* ============================================================
   AI RECOMMENDATION
   ============================================================ */
app.post('/api/recommend', async (req, res) => {
  const { goal, lifestyle, diet, timing } = req.body;

  if (!goal || !lifestyle) {
    return res.status(400).json({ error: 'Missing required fields: goal, lifestyle' });
  }

  const prompt = buildPrompt({ goal, lifestyle, diet, timing });

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content[0]?.text || '';
    const result = parseAIResponse(text);

    res.json(result);
  } catch (err) {
    console.error('AI Error:', err.message);
    // Return smart fallback
    res.json(getFallback(goal));
  }
});

function buildPrompt({ goal, lifestyle, diet, timing }) {
  return `You are a premium nutrition expert for Deglora, a Tunisian granola brand.

User profile:
- Goal: ${goal}
- Lifestyle: ${lifestyle}
- Dietary preference: ${diet || 'no restrictions'}
- Eating time: ${timing || 'morning'}

Our available ingredients:
Base (always included): Granola + Deglet Nour Date Jam (natural sweetener from Tozeur, Tunisia)
Add-ins: Dark Chocolate (70% cacao), Wild Honey (raw), Mixed Nuts (almonds/cashews/walnuts), Plant Protein (+20g), Coconut Flakes (toasted), Super Seeds (chia/flax/hemp)

Create a personalised blend. Respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "name": "The [Adjective] Formula",
  "ingredients": ["Granola Base", "Date Jam", "...add-ins..."],
  "explanation": "2-3 sentences explaining why this blend fits the user's specific goal and lifestyle."
}`;
}

function parseAIResponse(text) {
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return getFallback('energy');
  }
}

function getFallback(goal) {
  const fallbacks = {
    fitness:    { name: 'The Athlete Formula', ingredients: ['Granola Base', 'Date Jam', 'Plant Protein', 'Mixed Nuts', 'Dark Chocolate'], explanation: 'A high-performance blend engineered for strength and recovery. Plant protein supports muscle repair while date jam fuels workouts with natural glucose. Dark chocolate provides antioxidants and mixed nuts deliver lasting energy through healthy fats.' },
    focus:      { name: 'The Focus Formula',   ingredients: ['Granola Base', 'Date Jam', 'Super Seeds', 'Dark Chocolate'], explanation: 'Optimised for cognitive clarity, this blend delivers omega-3 fatty acids from super seeds to support brain function. Dark chocolate provides flavonoids that improve blood flow to the brain, while date jam offers steady mental fuel.' },
    weightloss: { name: 'The Balance Formula', ingredients: ['Granola Base', 'Date Jam', 'Super Seeds', 'Coconut Flakes'], explanation: 'A fibre-rich, satisfying blend with zero refined sugar. Super seeds expand in the stomach to keep you fuller longer, coconut flakes provide metabolism-boosting MCTs, and date jam naturally curbs sugar cravings.' },
    energy:     { name: 'The Vitality Formula', ingredients: ['Granola Base', 'Date Jam', 'Wild Honey', 'Mixed Nuts', 'Coconut Flakes'], explanation: 'A comprehensive energy blend that pairs the natural glucose of Deglet Nour dates with raw wild honey for an immediate vitality boost. Mixed nuts ensure sustained energy through healthy fats and protein.' }
  };
  return fallbacks[goal] || fallbacks.energy;
}

/* ============================================================
   QR SCAN + POINTS
   ============================================================ */
app.post('/api/qr-scan', (req, res) => {
  const { qrCode, userId } = req.body;

  if (!qrCode || !userId) {
    return res.status(400).json({ error: 'qrCode and userId are required' });
  }

  const bottle = qrCodes.get(qrCode);
  if (!bottle) {
    return res.status(404).json({ error: 'QR code not found' });
  }

  // Get or create user
  if (!users.has(userId)) {
    users.set(userId, { id: userId, points: 0, scannedBottles: [], joinedAt: new Date() });
  }
  const user = users.get(userId);

  // Check if already scanned
  const alreadyScanned = user.scannedBottles.includes(qrCode);
  const pointsEarned = alreadyScanned ? 5 : 50; // Bonus for first scan

  user.points += pointsEarned;
  if (!alreadyScanned) user.scannedBottles.push(qrCode);

  res.json({
    success: true,
    bottle: {
      blend: bottle.blend,
      bottleId: bottle.bottleId,
      origin: 'Tozeur, Tunisia',
      harvestDate: '2024-10',
      ingredients: ['Deglet Nour Dates', 'Whole Grain Oats', 'Sunflower Oil'],
      sustainability: { carbonOffset: '0.2kg', waterSaved: '1.2L', bottleReturns: 0 }
    },
    reward: {
      pointsEarned,
      totalPoints: user.points,
      isNewScan: !alreadyScanned,
      message: alreadyScanned
        ? `+${pointsEarned} pts for re-scanning! Total: ${user.points} Degla Points`
        : `🎉 First scan! +${pointsEarned} Degla Points! Total: ${user.points}`
    }
  });
});

/* ============================================================
   USER PROFILE
   ============================================================ */
app.get('/api/user/:id', (req, res) => {
  const user = users.get(req.params.id);
  if (!user) {
    return res.json({ id: req.params.id, points: 0, scannedBottles: [], tier: 'Seed' });
  }

  const tier = user.points >= 500 ? 'Date' : user.points >= 200 ? 'Oat' : 'Seed';
  res.json({ ...user, tier });
});

/* ============================================================
   HEALTH CHECK
   ============================================================ */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Deglora API', version: '1.0.0' });
});

/* ---- Start ---- */
app.listen(port, () => {
  console.log(`\n✦ DEGLORA API running on http://localhost:${port}`);
  console.log(`  POST /api/recommend  → AI blend recommendation`);
  console.log(`  POST /api/qr-scan    → QR points system`);
  console.log(`  GET  /api/user/:id   → User profile\n`);
});

module.exports = app;
