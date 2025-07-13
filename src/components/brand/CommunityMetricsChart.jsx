import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { format, subDays, subWeeks, subMonths, parseISO, isWithinInterval } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Font styles matching the updated App.css
const fontStyles = {
  sectionHeading: {
    fontFamily: 'Playfair Display, serif',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    lineHeight: '1.2'
  },
  subsectionTitle: {
    fontFamily: 'Playfair Display, serif',
    fontWeight: '600',
    letterSpacing: '-0.01em',
    lineHeight: '1.3'
  }
};

// Sample data for community engagement over time
const generateTimeSeriesData = () => {
  const today = new Date();
  const data = [];
  
  // Generate 30 days of data
  for (let i = 30; i >= 0; i--) {
    const date = subDays(today, i);
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    data.push({
      date: formattedDate,
      likes: Math.floor(Math.random() * 50) + 20,
      comments: Math.floor(Math.random() * 30) + 10,
      shares: Math.floor(Math.random() * 15) + 5,
      views: Math.floor(Math.random() * 200) + 100
    });
  }
  
  return data;
};

// Sample data for post categories
const categoryData = [
  { category: 'Product Drop', posts: 28, engagement: 342, avgEngagement: 12.2 },
  { category: 'Industry Buzz', posts: 35, engagement: 487, avgEngagement: 13.9 },
  { category: 'Question', posts: 42, engagement: 318, avgEngagement: 7.6 },
  { category: 'Tip & Trick', posts: 23, engagement: 276, avgEngagement: 12.0 },
  { category: 'Discussion', posts: 31, engagement: 245, avgEngagement: 7.9 },
  { category: 'Product Review', posts: 18, engagement: 198, avgEngagement: 11.0 },
  { category: 'Easter Egg', posts: 7, engagement: 154, avgEngagement: 22.0 },
  { category: 'Community Shoutout', posts: 15, engagement: 187, avgEngagement: 12.5 },
  { category: 'Affirmation', posts: 12, engagement: 132, avgEngagement: 11.0 }
];

// Sample data for engagement types
const engagementTypesData = {
  likes: 2450,
  comments: 1280,
  shares: 640,
  saves: 320,
  reactions: {
    love: 580,
    insightful: 420,
    celebrate: 310,
    laugh: 240
  }
};

export default function CommunityMetricsChart({ brandId }) {
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [dateRange, setDateRange] = useState('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState('total');
  const [categorySort, setCategorySort] = useState('engagement');
  
  useEffect(() => {
    // In a real app, you would fetch data from Firebase based on brandId
    // For now, we'll use our generated sample data
    const data = generateTimeSeriesData();
    setTimeSeriesData(data);
    setLoading(false);
  }, [brandId]);
  
  // Filter data based on selected date range
  const getFilteredTimeSeriesData = () => {
    if (timeSeriesData.length === 0) return [];
    
    const today = new Date();
    let startDate;
    
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      startDate = parseISO(customStartDate);
      const endDate = parseISO(customEndDate);
      
      return timeSeriesData.filter(item => {
        const itemDate = parseISO(item.date);
        return isWithinInterval(itemDate, { start: startDate, end: endDate });
      });
    }
    
    switch (dateRange) {
      case '7d':
        startDate = subDays(today, 7);
        break;
      case '14d':
        startDate = subDays(today, 14);
        break;
      case '30d':
        startDate = subDays(today, 30);
        break;
      case '90d':
        startDate = subDays(today, 90);
        break;
      case '6m':
        startDate = subMonths(today, 6);
        break;
      case '1y':
        startDate = subMonths(today, 12);
        break;
      default:
        startDate = subDays(today, 30);
    }
    
    return timeSeriesData.filter(item => {
      const itemDate = parseISO(item.date);
      return itemDate >= startDate && itemDate <= today;
    });
  };
  
  // Prepare data for the line chart
  const prepareLineChartData = () => {
    const filteredData = getFilteredTimeSeriesData();
    
    const labels = filteredData.map(item => format(parseISO(item.date), 'MMM d'));
    
    const datasets = [];
    
    if (activeMetric === 'total' || activeMetric === 'likes') {
      datasets.push({
        label: 'Likes',
        data: filteredData.map(item => item.likes),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true
      });
    }
    
    if (activeMetric === 'total' || activeMetric === 'comments') {
      datasets.push({
        label: 'Comments',
        data: filteredData.map(item => item.comments),
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.4,
        fill: true
      });
    }
    
    if (activeMetric === 'total' || activeMetric === 'shares') {
      datasets.push({
        label: 'Shares',
        data: filteredData.map(item => item.shares),
        borderColor: 'rgba(255, 159, 64, 1)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        tension: 0.4,
        fill: true
      });
    }
    
    if (activeMetric === 'views') {
      datasets.push({
        label: 'Views',
        data: filteredData.map(item => item.views),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
        fill: true
      });
    }
    
    return { labels, datasets };
  };
  
  // Prepare data for the bar chart
  const prepareBarChartData = () => {
    // Sort categories based on selected sort method
    const sortedCategories = [...categoryData].sort((a, b) => {
      if (categorySort === 'engagement') {
        return b.engagement - a.engagement;
      } else if (categorySort === 'posts') {
        return b.posts - a.posts;
      } else if (categorySort === 'avgEngagement') {
        return b.avgEngagement - a.avgEngagement;
      }
      return 0;
    });
    
    // Take top 6 categories for better visualization
    const topCategories = sortedCategories.slice(0, 6);
    
    return {
      labels: topCategories.map(item => item.category),
      datasets: [
        {
          label: 'Total Engagement',
          data: topCategories.map(item => item.engagement),
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        },
        {
          label: 'Number of Posts',
          data: topCategories.map(item => item.posts * 5), // Multiply for better visualization
          backgroundColor: 'rgba(153, 102, 255, 0.8)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1
        }
      ]
    };
  };
  
  // Prepare data for the pie chart
  const preparePieChartData = () => {
    const { likes, comments, shares, saves, reactions } = engagementTypesData;
    const totalReactions = Object.values(reactions).reduce((sum, val) => sum + val, 0);
    
    return {
      labels: ['Likes', 'Comments', 'Shares', 'Saves', 'Other Reactions'],
      datasets: [
        {
          data: [likes, comments, shares, saves, totalReactions],
          backgroundColor: [
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
  };
  
  // Calculate total engagement for the selected period
  const calculateTotalEngagement = () => {
    const filteredData = getFilteredTimeSeriesData();
    
    const totals = {
      likes: filteredData.reduce((sum, item) => sum + item.likes, 0),
      comments: filteredData.reduce((sum, item) => sum + item.comments, 0),
      shares: filteredData.reduce((sum, item) => sum + item.shares, 0),
      views: filteredData.reduce((sum, item) => sum + item.views, 0)
    };
    
    return totals;
  };
  
  // Options for the line chart
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Community Engagement Over Time',
        font: {
          size: 16,
          family: fontStyles.subsectionTitle.fontFamily,
          weight: fontStyles.subsectionTitle.fontWeight
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    }
  };
  
  // Options for the bar chart
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Performance by Post Category',
        font: {
          size: 16,
          family: fontStyles.subsectionTitle.fontFamily,
          weight: fontStyles.subsectionTitle.fontWeight
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.raw;
            
            if (label === 'Number of Posts') {
              return `${label}: ${value / 5}`; // Divide to get actual value
            }
            
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      }
    }
  };
  
  // Options for the pie chart
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Engagement Types Distribution',
        font: {
          size: 16,
          family: fontStyles.subsectionTitle.fontFamily,
          weight: fontStyles.subsectionTitle.fontWeight
        }
      }
    }
  };
  
  // Calculate engagement metrics
  const engagementTotals = calculateTotalEngagement();
  const totalEngagement = engagementTotals.likes + engagementTotals.comments + engagementTotals.shares;
  const engagementRate = totalEngagement > 0 && engagementTotals.views > 0 
    ? ((totalEngagement / engagementTotals.views) * 100).toFixed(1) 
    : 0;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl mb-6" style={fontStyles.sectionHeading}>Community Engagement Metrics</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600">Total Engagement</div>
          <div className="text-2xl font-bold">{totalEngagement.toLocaleString()}</div>
          <div className="text-xs text-blue-500">Likes + Comments + Shares</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600">Engagement Rate</div>
          <div className="text-2xl font-bold">{engagementRate}%</div>
          <div className="text-xs text-green-500">Engagement / Views</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-600">Active Discussions</div>
          <div className="text-2xl font-bold">{Math.floor(engagementTotals.comments / 3).toLocaleString()}</div>
          <div className="text-xs text-purple-500">Posts with 3+ comments</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-sm text-orange-600">Content Reach</div>
          <div className="text-2xl font-bold">{engagementTotals.views.toLocaleString()}</div>
          <div className="text-xs text-orange-500">Total post views</div>
        </div>
      </div>
      
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="14d">Last 14 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="6m">Last 6 months</option>
            <option value="1y">Last year</option>
            <option value="custom">Custom range</option>
          </select>
        </div>
        
        {dateRange === 'custom' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        )}
        
        <div className="ml-auto">
          <label className="block text-sm font-medium text-gray-700 mb-1">Metric</label>
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveMetric('total')}
              className={`px-3 py-1 text-sm rounded-md ${
                activeMetric === 'total' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveMetric('likes')}
              className={`px-3 py-1 text-sm rounded-md ${
                activeMetric === 'likes' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Likes
            </button>
            <button
              onClick={() => setActiveMetric('comments')}
              className={`px-3 py-1 text-sm rounded-md ${
                activeMetric === 'comments' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Comments
            </button>
            <button
              onClick={() => setActiveMetric('shares')}
              className={`px-3 py-1 text-sm rounded-md ${
                activeMetric === 'shares' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Shares
            </button>
            <button
              onClick={() => setActiveMetric('views')}
              className={`px-3 py-1 text-sm rounded-md ${
                activeMetric === 'views' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Views
            </button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Line Chart */}
          <div className="h-80">
            <Line data={prepareLineChartData()} options={lineChartOptions} />
          </div>
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Bar Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Category Performance</h3>
                <select
                  value={categorySort}
                  onChange={(e) => setCategorySort(e.target.value)}
                  className="border border-gray-300 rounded-md shadow-sm p-1 text-sm"
                >
                  <option value="engagement">Sort by Engagement</option>
                  <option value="posts">Sort by Post Count</option>
                  <option value="avgEngagement">Sort by Avg Engagement</option>
                </select>
              </div>
              <div className="h-64">
                <Bar data={prepareBarChartData()} options={barChartOptions} />
              </div>
            </div>
            
            {/* Pie Chart */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Engagement Distribution</h3>
              <div className="h-64">
                <Pie data={preparePieChartData()} options={pieChartOptions} />
              </div>
            </div>
          </div>
          
          {/* Insights Section */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-2">Engagement Insights</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>
                  {activeMetric === 'total' 
                    ? 'Overall engagement is ' 
                    : `${activeMetric.charAt(0).toUpperCase() + activeMetric.slice(1)} are `}
                  {Math.random() > 0.5 ? 'up' : 'down'} {Math.floor(Math.random() * 20) + 5}% compared to the previous period.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>
                  {categoryData.sort((a, b) => b.engagement - a.engagement)[0].category} is your best performing category with 
                  {' '}{categoryData.sort((a, b) => b.engagement - a.engagement)[0].engagement} total engagements.
                </span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>
                  Your content reaches an average of {Math.floor(engagementTotals.views / getFilteredTimeSeriesData().length)} views per day.
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
