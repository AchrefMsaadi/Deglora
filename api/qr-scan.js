// api/qr-scan.js
// Vercel Serverless Function — POST /api/qr-scan
// Awards Degla Points and returns bottle traceability data.
// NOTE: Uses in-memory storage (ephemeral per cold start).
// For persistence, integrate Supabase in the frontend (supabase-client.js).

const BOTTLE_DB = {
  'DGL-001-ORIG': {
    blend: 'Original Blend', origin: 'Tozeur, Tunisia',
    harvest: 'October 2024', calories: '180 kcal / 50g',
    sugar: '8g (natural dates)', sustainability: 'Carbon-neutral farm',
  },
  'DGL-002-FOCS': {
    blend: 'Focus Formula', origin: 'Tozeur, Tunisia',
    harvest: 'October 2024', calories: '195 kcal / 50g',
    sugar: '9g (natural dates)', sustainability: 'Fair-trade certified',
  },
  'DGL-003-ATHL': {
    blend: 'Athlete Formula', origin: 'Tozeur, Tunisia',
    harvest: 'October 2024', calories: '220 kcal / 50g',
    sugar: '7g (natural dates)', sustainability: 'Carbon-neutral farm',
  },
  'DGL-004-VTAL': {
    blend: 'Vitality Formula', origin: 'Tozeur, Tunisia',
    harvest: 'October 2024', calories: '210 kcal / 50g',
    sugar: '10g (natural dates)', sustainability: 'Fair-trade certified',
  },
};

// Ephemeral scan tracking (resets on cold start — use Supabase for persistence)
const scannedOnce = new Set();

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { qrCode, userId } = req.body || {};

  if (!qrCode) {
    return res.status(400).json({ error: 'qrCode is required' });
  }

  const bottle = BOTTLE_DB[qrCode];
  if (!bottle) {
    return res.status(404).json({ error: 'QR code not registered', qrCode });
  }

  const scanKey  = `${userId || 'anon'}::${qrCode}`;
  const isFirst  = !scannedOnce.has(scanKey);
  const pts      = isFirst ? 50 : 5;
  scannedOnce.add(scanKey);

  return res.status(200).json({
    success: true,
    bottle,
    reward: {
      pointsEarned: pts,
      isNewScan: isFirst,
      message: isFirst
        ? `🎉 First scan! +${pts} Degla Points earned.`
        : `+${pts} loyalty points for re-scanning.`,
    },
  });
};
