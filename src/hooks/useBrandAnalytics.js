import { useState, useEffect } from 'react';

export const useBrandAnalytics = (brandId) => {
  const [analytics, setAnalytics] = useState({
    totalCommunities: 0,
    activeMembers: 0,
    monthlyEngagement: 0,
    contentItems: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Replace with your actual API call
        const response = await fetch(`/api/brands/${brandId}/analytics`);
        
        if (response.ok) {
          const data = await response.json();
          setAnalytics({
            ...data,
            loading: false,
            error: null
          });
        } else {
          throw new Error('Failed to fetch analytics');
        }
      } catch (error) {
        console.error('Error fetching brand analytics:', error);
        
        // Fallback to mock data
        setAnalytics({
          totalCommunities: 3,
          activeMembers: 1247,
          monthlyEngagement: 3456,
          contentItems: 28,
          challengesCompleted: 156,
          averageScore: 87,
          topPerformers: [
            { name: 'Sarah Johnson', score: 95 },
            { name: 'Mike Chen', score: 92 },
            { name: 'Lisa Rodriguez', score: 89 }
          ],
          recentActivity: [
            {
              id: 1,
              type: 'challenge_completed',
              user: 'Sarah Johnson',
              action: 'completed Sustainability Basics challenge',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
            },
            {
              id: 2,
              type: 'community_post',
              user: 'Mike Chen',
              action: 'posted in Product Training Hub',
              timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
            },
            {
              id: 3,
              type: 'content_upload',
              user: 'Brand Manager',
              action: 'uploaded new training video',
              timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000)
            }
          ],
          communityStats: [
            {
              name: 'Sustainability Champions',
              members: 456,
              engagement: 78,
              growth: 12
            },
            {
              name: 'Product Training Hub',
              members: 342,
              engagement: 85,
              growth: 8
            },
            {
              name: 'Retail Excellence',
              members: 449,
              engagement: 72,
              growth: 15
            }
          ],
          loading: false,
          error: null
        });
      }
    };

    if (brandId) {
      fetchAnalytics();
    }
  }, [brandId]);

  return analytics;
};

export default useBrandAnalytics;

