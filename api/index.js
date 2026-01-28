// Simple Node.js serverless function for Vercel
module.exports = (req, res) => {
  // Dynamic CORS headers
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000'
  ];
  
  // Add Vercel app patterns
  const isVercelApp = origin && /^https:\/\/.*\.vercel\.app$/.test(origin);
  const isFrontendApp = origin && /^https:\/\/phl2-assignment-4-frontend.*\.vercel\.app$/.test(origin);
  
  if (allowedOrigins.includes(origin) || isVercelApp || isFrontendApp || process.env.FRONTEND_URL === origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    return res.status(200).json({ 
      status: "ok", 
      message: "SkillBridge API is running",
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      path: req.url
    });
  } catch (error) {
    console.error("Handler error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      message: error.message
    });
  }
};