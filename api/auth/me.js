// Get current user endpoint
module.exports = async (req, res) => {
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
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check for authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized'
      });
    }

    // Mock user data
    return res.status(200).json({
      user: {
        id: 'mock-user-id',
        name: 'Mock User',
        email: 'user@example.com',
        phone: '1234567890',
        role: 'STUDENT',
        isActive: true
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      error: 'Failed to get user'
    });
  }
};