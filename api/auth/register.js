export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://phl2-assignment-4-frontend.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, password, phone, role } = req.body;

  // Basic validation
  if (!name || !email || !password || !role) {
    return res.status(400).json({
      error: 'name, email, password, and role are required'
    });
  }

  // Mock successful registration
  return res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: 'mock-user-id',
      name,
      email,
      role
    },
    token: 'mock-jwt-token'
  });
}