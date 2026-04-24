// api/health.js
// Vercel Serverless Function — GET /api/health

module.exports = function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'Deglora API',
    version: '2.0.0',
    platform: 'Vercel',
    timestamp: new Date().toISOString(),
  });
};
