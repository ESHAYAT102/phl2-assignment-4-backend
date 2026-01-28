export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://phl2-assignment-4-frontend.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Mock categories
  const categories = [
    { id: '1', name: 'Mathematics', description: 'Math tutoring' },
    { id: '2', name: 'Science', description: 'Science tutoring' },
    { id: '3', name: 'English', description: 'English tutoring' },
    { id: '4', name: 'Programming', description: 'Programming tutoring' },
    { id: '5', name: 'Languages', description: 'Language tutoring' }
  ];

  return res.status(200).json(categories);
}