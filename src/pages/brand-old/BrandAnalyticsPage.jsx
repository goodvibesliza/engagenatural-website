// src/pages/brand/BrandAnalyticsPage.jsx
import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, orderBy, limit, startAfter, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/auth-context';
import BrandManagerLayout from '../../components/brand/BrandManagerLayout';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { format, subDays, subMonths, parseISO, isAfter } from 'date-fns';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function BrandAnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30d'); // '7d', '30d', '90d', '1y'
  const [contentType, setContentType] = useState('all'); // 'all', 'lesson', 'article', etc.
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Analytics data states
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalViews: 0,
    engagementRate: 0,
    completionRate: 0,
    salesImpact: 0,
    totalUsers: 0,
    totalContent: 0
  });
  
  const [contentPerformance, setContentPerformance] = useState({
    viewsByContent: [],
    engagementOverTime: [],
    completionRates: []
  });
  
  const [userMetrics, setUserMetrics] = useState({
    trainingCompletion: [],
    userGrowth: [],
    geographicDistribution: []
  });
  
  const [salesMetrics, setSalesMetrics] = useState({
    productsSoldPerUser: [],
    salesAttribution: [],
    revenueByContent: []
  });

  // Chart refs for responsiveness
  const engagementChartRef = useRef(null);
  const viewsChartRef = useRef(null);
  const userGrowthChartRef = useRef(null);
  const geoDistributionChartRef = useRef(null);
  const salesAttributionChartRef = useRef(null);
  
  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRange(range);
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Handle content type filter change
  const handleContentTypeChange = (type) => {
    setContentType(type);
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Get date from range
  const getDateFromRange = (range) => {
    const now = new Date();
    switch (range) {
      case '7d':
        return subDays(now, 7);
      case '30d':
        return subDays(now, 30);
      case '90d':
        return subDays(now, 90);
      case '1y':
        return subMonths(now, 12);
      default:
        return subDays(now, 30);
    }
  };
  
  // Format number with commas
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };
  
  // Format percentage
  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };
  
  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Generate placeholder data for development
  const generatePlaceholderData = () => {
    // Generate dates for time series
    const dates = [];
    const startDate = getDateFromRange(dateRange);
    const endDate = new Date();
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(format(currentDate, 'MMM dd'));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Generate random data for metrics
    const views = dates.map(() => Math.floor(Math.random() * 100) + 50);
    const engagement = dates.map(() => Math.floor(Math.random() * 30) + 60);
    const completion = dates.map(() => Math.floor(Math.random() * 40) + 40);
    const users = dates.map((_, index) => 100 + index * 2 + Math.floor(Math.random() * 10));
    
    // Content titles
    const contentTitles = [
      'Product Overview', 
      'Sales Techniques', 
      'Customer Objections', 
      'Advanced Features', 
      'Competitor Analysis',
      'Market Trends'
    ];
    
    // Content performance
    const viewsByContent = contentTitles.map(title => ({
      title,
      views: Math.floor(Math.random() * 1000) + 200
    }));
    
    // Completion rates by content
    const completionRates = contentTitles.map(title => ({
      title,
      rate: Math.floor(Math.random() * 40) + 60
    }));
    
    // Geographic distribution
    const regions = ['North America', 'Europe', 'Asia', 'South America', 'Australia', 'Africa'];
    const geoDistribution = regions.map(region => ({
      region,
      users: Math.floor(Math.random() * 500) + 100
    }));
    
    // Sales attribution
    const salesAttribution = contentTitles.map(title => ({
      title,
      sales: Math.floor(Math.random() * 200) + 50
    }));
    
    // Products sold per user
    const productsSoldPerUser = [
      { category: 'Trained Users', value: 8 },
      { category: 'Untrained Users', value: 5 }
    ];
    
    // Set summary metrics
    setSummaryMetrics({
      totalViews: views.reduce((a, b) => a + b, 0),
      engagementRate: engagement.reduce((a, b) => a + b, 0) / engagement.length,
      completionRate: completion.reduce((a, b) => a + b, 0) / completion.length,
      salesImpact: Math.floor(Math.random() * 20000) + 5000,
      totalUsers: users[users.length - 1],
      totalContent: contentTitles.length
    });
    
    // Set content performance
    setContentPerformance({
      viewsByContent,
      engagementOverTime: dates.map((date, index) => ({
        date,
        views: views[index],
        engagement: engagement[index]
      })),
      completionRates
    });
    
    // Set user metrics
    setUserMetrics({
      trainingCompletion: [
        { status: 'Completed', count: Math.floor(Math.random() * 500) + 500 },
        { status: 'In Progress', count: Math.floor(Math.random() * 300) + 200 },
        { status: 'Not Started', count: Math.floor(Math.random() * 200) + 100 }
      ],
      userGrowth: dates.map((date, index) => ({
        date,
        users: users[index]
      })),
      geographicDistribution: geoDistribution
    });
    
    // Set sales metrics
    setSalesMetrics({
      productsSoldPerUser,
      salesAttribution,
      revenueByContent: contentTitles.map(title => ({
        title,
        revenue: Math.floor(Math.random() * 10000) + 2000
      }))
    });
  };
  
  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const brandId = localStorage.getItem('selectedBrandId');
        
        if (!brandId) {
          // For development, use placeholder data
          generatePlaceholderData();
          setLoading(false);
          return;
        }
        
        // In a real implementation, we would fetch data from Firestore
        // For now, use placeholder data
        generatePlaceholderData();
        
        setError(null);
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [dateRange, contentType, refreshTrigger]);
  
  // Chart data for engagement over time
  const engagementChartData = {
    labels: contentPerformance.engagementOverTime.map(item => item.date),
    datasets: [
      {
        label: 'Views',
        data: contentPerformance.engagementOverTime.map(item => item.views),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.4,
        fill: false
      },
      {
        label: 'Engagement',
        data: contentPerformance.engagementOverTime.map(item => item.engagement),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.4,
        fill: false
      }
    ]
  };
  
  // Chart options for engagement
  const engagementChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Views & Engagement Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };
  
  // Chart data for views by content
  const viewsChartData = {
    labels: contentPerformance.viewsByContent.map(item => item.title),
    datasets: [
      {
        label: 'Views',
        data: contentPerformance.viewsByContent.map(item => item.views),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Chart options for views
  const viewsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Views by Content'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Views'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Content'
        }
      }
    }
  };
  
  // Chart data for training completion
  const trainingCompletionData = {
    labels: userMetrics.trainingCompletion.map(item => item.status),
    datasets: [
      {
        data: userMetrics.trainingCompletion.map(item => item.count),
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(255, 99, 132, 0.7)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Chart options for training completion
  const trainingCompletionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right'
      },
      title: {
        display: true,
        text: 'Training Completion Status'
      }
    }
  };
  
  // Chart data for user growth
  const userGrowthData = {
    labels: userMetrics.userGrowth.map(item => item.date),
    datasets: [
      {
        label: 'Users',
        data: userMetrics.userGrowth.map(item => item.users),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        tension: 0.4,
        fill: true
      }
    ]
  };
  
  // Chart options for user growth
  const userGrowthOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'User Growth Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Users'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };
  
  // Chart data for geographic distribution
  const geoDistributionData = {
    labels: userMetrics.geographicDistribution.map(item => item.region),
    datasets: [
      {
        data: userMetrics.geographicDistribution.map(item => item.users),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Chart options for geographic distribution
  const geoDistributionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right'
      },
      title: {
        display: true,
        text: 'User Geographic Distribution'
      }
    }
  };
  
  // Chart data for products sold per user
  const productsSoldData = {
    labels: salesMetrics.productsSoldPerUser.map(item => item.category),
    datasets: [
      {
        label: 'Products Sold',
        data: salesMetrics.productsSoldPerUser.map(item => item.value),
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 99, 132, 0.7)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Chart options for products sold
  const productsSoldOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Products Sold Per User'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Products'
        }
      }
    }
  };
  
  // Chart data for sales attribution
  const salesAttributionData = {
    labels: salesMetrics.salesAttribution.map(item => item.title),
    datasets: [
      {
        label: 'Sales',
        data: salesMetrics.salesAttribution.map(item => item.sales),
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Chart options for sales attribution
  const salesAttributionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Sales Attribution by Content'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Sales'
        }
      }
    }
  };

  return (
    <BrandManagerLayout>
      {/* Page header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          
          <div className="flex space-x-3">
            {/* Date range filter */}
            <div className="inline-flex shadow-sm rounded-md">
              <button
                type="button"
                onClick={() => handleDateRangeChange('7d')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                  dateRange === '7d'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-300`}
              >
                7D
              </button>
              <button
                type="button"
                onClick={() => handleDateRangeChange('30d')}
                className={`px-4 py-2 text-sm font-medium ${
                  dateRange === '30d'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border-t border-b border-gray-300`}
              >
                30D
              </button>
              <button
                type="button"
                onClick={() => handleDateRangeChange('90d')}
                className={`px-4 py-2 text-sm font-medium ${
                  dateRange === '90d'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border-t border-b border-gray-300`}
              >
                90D
              </button>
              <button
                type="button"
                onClick={() => handleDateRangeChange('1y')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                  dateRange === '1y'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-300`}
              >
                1Y
              </button>
            </div>
            
            {/* Content type filter */}
            <select
              value={contentType}
              onChange={(e) => handleContentTypeChange(e.target.value)}
              className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Content Types</option>
              <option value="lesson">Lessons</option>
              <option value="article">Articles</option>
              <option value="video">Videos</option>
            </select>
            
            {/* Refresh button */}
            <button
              type="button"
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
        
        {/* Description */}
        <div className="px-6 py-3 bg-blue-50 border-b border-gray-200">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-blue-700">
              View analytics for your content performance, user engagement, and sales impact.
            </span>
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="px-6 py-3 bg-red-50 border-b border-gray-200">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="bg-white shadow rounded-lg p-6 flex justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="sr-only">Loading...</span>
        </div>
      ) : (
        <>
          {/* Summary metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Total Views */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-md bg-blue-100 text-blue-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Views
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {formatNumber(summaryMetrics.totalViews)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            
            {/* Engagement Rate */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-md bg-green-100 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Engagement Rate
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {formatPercentage(summaryMetrics.engagementRate)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            
            {/* Completion Rate */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-md bg-indigo-100 text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completion Rate
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {formatPercentage(summaryMetrics.completionRate)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            
            {/* Sales Impact */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-md bg-purple-100 text-purple-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Sales Impact
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {formatCurrency(summaryMetrics.salesImpact)}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          {/* Content Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Engagement Over Time */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Engagement Over Time</h3>
              <div className="h-64">
                <Line ref={engagementChartRef} options={engagementChartOptions} data={engagementChartData} />
              </div>
            </div>
            
            {/* Views by Content */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Views by Content</h3>
              <div className="h-64">
                <Bar ref={viewsChartRef} options={viewsChartOptions} data={viewsChartData} />
              </div>
            </div>
          </div>
          
          {/* User Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Training Completion */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Training Completion</h3>
              <div className="h-64">
                <Doughnut options={trainingCompletionOptions} data={trainingCompletionData} />
              </div>
            </div>
            
            {/* User Growth */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Growth</h3>
              <div className="h-64">
                <Line ref={userGrowthChartRef} options={userGrowthOptions} data={userGrowthData} />
              </div>
            </div>
            
            {/* Geographic Distribution */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Geographic Distribution</h3>
              <div className="h-64">
                <Pie ref={geoDistributionChartRef} options={geoDistributionOptions} data={geoDistributionData} />
              </div>
            </div>
          </div>
          
          {/* Sales Impact */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Products Sold Per User */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Products Sold Per User</h3>
              <div className="h-64">
                <Bar options={productsSoldOptions} data={productsSoldData} />
              </div>
              <div className="mt-4 text-center text-sm text-gray-500">
                <p>Trained users sell an average of 3 more products than untrained users</p>
              </div>
            </div>
            
            {/* Sales Attribution */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Attribution by Content</h3>
              <div className="h-64">
                <Bar ref={salesAttributionChartRef} options={salesAttributionOptions} data={salesAttributionData} />
              </div>
            </div>
          </div>
          
          {/* Content Performance Table */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Content Performance Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Content Title
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion Rate
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales Attribution
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue Impact
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contentPerformance.viewsByContent.map((content, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {content.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(content.views)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPercentage(contentPerformance.completionRates[index]?.rate || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(salesMetrics.salesAttribution[index]?.sales || 0)} sales
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(salesMetrics.revenueByContent[index]?.revenue || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </BrandManagerLayout>
  );
}
