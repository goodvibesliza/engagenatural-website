// src/pages/brand/BrandAnalyticsPage.jsx
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/auth-context';
import BrandManagerLayout from '../../components/brand/BrandManagerLayout';

export default function BrandAnalyticsPage() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    totalViews: 0,
    totalEngagement: 0,
    contentCount: 0,
    publishedCount: 0,
    topContent: [],
    recentViews: []
  });
  const [timeRange, setTimeRange] = useState('30d');
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const brandId = localStorage.getItem('selectedBrandId');
        
        if (!brandId) {
          console.error('No selected brand');
          setLoading(false);
          return;
        }
        
        // Get content count
        const contentQuery = query(
          collection(db, 'content'),
          where('brandId', '==', brandId)
        );
        
        const publishedQuery = query(
          collection(db, 'content'),
          where('brandId', '==', brandId),
          where('status', '==', 'published')
        );
        
        const [contentSnapshot, publishedSnapshot] = await Promise.all([
          getDocs(contentQuery),
          getDocs(publishedQuery)
        ]);
        
        const contentCount = contentSnapshot.size;
        const publishedCount = publishedSnapshot.size;
        
        // In a real app, we would query analytics data from a separate collection
        // For now, we'll use placeholder data
        const mockTopContent = publishedSnapshot.docs
          .slice(0, 5)
          .map(doc => ({
            id: doc.id,
            title: doc.data().title || 'Untitled Content',
            type: doc.data().type || 'lesson',
            views: Math.floor(Math.random() * 100),
            engagement: Math.floor(Math.random() * 100) / 100
          }));
        
        const mockRecentViews = Array(7).fill(0).map((_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - i);
          return {
            date: date.toISOString().split('T')[0],
            views: Math.floor(Math.random() * 20)
          };
        }).reverse();
        
        setAnalyticsData({
          totalViews: mockTopContent.reduce((sum, item) => sum + item.views, 0),
          totalEngagement: mockTopContent.length > 0 
            ? mockTopContent.reduce((sum, item) => sum + item.engagement, 0) / mockTopContent.length
            : 0,
          contentCount,
          publishedCount,
          topContent: mockTopContent,
          recentViews: mockRecentViews
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [user, timeRange]);
  
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const renderBarChart = (data) => {
    const maxValue = Math.max(...data.map(d => d.views));
    
    return (
      <div className="w-full">
        <div className="flex items-end h-40 space-x-2">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-blue-500 rounded-t" 
                style={{ 
                  height: maxValue > 0 ? `${(item.views / maxValue) * 100}%` : '0%',
                  minHeight: item.views > 0 ? '8px' : '0px'
                }}
              ></div>
              <div className="text-xs text-gray-600 mt-1">{formatDate(item.date)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <BrandManagerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-gray-600">Monitor performance and engagement metrics</p>
      </div>
      
      {/* Time range selector */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex justify-end">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-4 py-2 text-sm font-medium ${
                timeRange === '7d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              } rounded-l-md`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-4 py-2 text-sm font-medium ${
                timeRange === '30d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeRange('90d')}
              className={`px-4 py-2 text-sm font-medium ${
                timeRange === '90d'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              } rounded-r-md`}
            >
              Last 90 Days
            </button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="sr-only">Loading...</span>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-3xl font-bold">{analyticsData.totalViews}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Engagement</p>
                  <p className="text-3xl font-bold">{(analyticsData.totalEngagement * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Content</p>
                  <p className="text-3xl font-bold">{analyticsData.contentCount}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-3xl font-bold">{analyticsData.publishedCount}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
              <h2 className="text-lg font-medium mb-4">Views Over Time</h2>
              {analyticsData.recentViews.length > 0 ? (
                renderBarChart(analyticsData.recentViews)
              ) : (
                <p className="text-gray-500 text-center py-6">No view data available</p>
              )}
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Top Content</h2>
              {analyticsData.topContent.length > 0 ? (
                <div className="space-y-3">
                  {analyticsData.topContent.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="mr-3 text-gray-500 font-medium">{index + 1}.</div>
                        <div className="truncate max-w-xs">
                          <p className="font-medium text-gray-800 truncate">{item.title}</p>
                          <p className="text-xs text-gray-500">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                              item.type === 'lesson'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {item.type === 'lesson' ? 'Lesson' : 'Community'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.views}</p>
                        <p className="text-xs text-gray-500">views</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6">No content data available</p>
              )}
            </div>
          </div>
          
          {/* Coming soon features */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">More Analytics Features Coming Soon</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-sm font-medium">Audience Demographics</h3>
                <p className="text-xs text-gray-500 mt-1">Learn more about your audience</p>
              </div>
              
              <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                <h3 className="text-sm font-medium">Conversion Analytics</h3>
                <p className="text-xs text-gray-500 mt-1">Track conversions and ROI</p>
              </div>
              
              <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="text-sm font-medium">Content Insights</h3>
                <p className="text-xs text-gray-500 mt-1">Get AI-powered content recommendations</p>
              </div>
            </div>
          </div>
        </>
      )}
    </BrandManagerLayout>
  );
}