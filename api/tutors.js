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

  // Mock tutors data
  const tutors = [
    {
      id: '1',
      user: { name: 'John Smith', email: 'john@example.com' },
      bio: 'Experienced math tutor with 5+ years of teaching experience.',
      hourlyRate: 25,
      rating: 4.8,
      totalReviews: 24,
      subjects: ['Mathematics', 'Algebra', 'Calculus']
    },
    {
      id: '2',
      user: { name: 'Sarah Johnson', email: 'sarah@example.com' },
      bio: 'Science teacher specializing in chemistry and biology.',
      hourlyRate: 30,
      rating: 4.9,
      totalReviews: 18,
      subjects: ['Chemistry', 'Biology', 'Science']
    },
    {
      id: '3',
      user: { name: 'Mike Chen', email: 'mike@example.com' },
      bio: 'Software engineer teaching programming and computer science.',
      hourlyRate: 40,
      rating: 4.7,
      totalReviews: 32,
      subjects: ['Programming', 'JavaScript', 'Python', 'Web Development']
    }
  ];

  return res.status(200).json({
    data: tutors,
    pagination: {
      total: tutors.length,
      pages: 1,
      currentPage: 1,
      limit: 10
    }
  });
}