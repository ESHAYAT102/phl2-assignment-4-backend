export default function handler(req, res) {
  // Set CORS headers for your frontend
  res.setHeader('Access-Control-Allow-Origin', 'https://phl2-assignment-4-frontend.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Simple response
  return res.status(200).json({
    message: 'SkillBridge API is running',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
}