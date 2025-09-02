// src/pages/brand/BrandAnalyticsPage.jsx
import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, orderBy, limit, startAfter, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { format, subDays, subMonths, parseISO, isAfter } from 'date-fns';

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';

// Icons
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp, 
  Users, 
  Eye, 
  MessageSquare, 
  Heart, 
  Share2, 
  DollarSign, 
  Calendar, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  ChevronRight, 
  Trophy, 
  ArrowUp, 
  ArrowDown, 
  Layers, 
  Video, 
  FileText, 
  BookOpen
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

export default function BrandAnalyticsPage({ brandId }) {
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
  
  // brandId is received via props from the Dashboard; validate it exists
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format date
  const formatDate = (date) => {
    return format(date, 'MMM d, yyyy');
  };
  
  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!brandId) {
        setError("No brand ID available. Please select a brand.");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const startDate = getDateFromRange(dateRange);
        const startTimestamp = Timestamp.fromDate(startDate);
        
        // Fetch trainings
        const trainingsQuery = query(
          collection(db, 'trainings'),
          where('brandId', '==', brandId),
          orderBy('createdAt', 'desc')
        );
        
        const trainingsSnapshot = await getDocs(trainingsQuery);
        const trainings = trainingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Get training IDs for further queries
        const trainingIds = trainings.map(training => training.id);
        
        // Fetch training progress data
        let progressData = [];
        if (trainingIds.length > 0) {
          // Firestore IN queries are limited to 10 items, so we might need multiple queries
          const batchSize = 10;
          for (let i = 0; i < trainingIds.length; i += batchSize) {
            const batch = trainingIds.slice(i, i + batchSize);
            
            const progressQuery = query(
              collection(db, 'training_progress'),
              where('trainingId', 'in', batch),
              where('updatedAt', '>=', startTimestamp)
            );
            
            const progressSnapshot = await getDocs(progressQuery);
            progressData = [
              ...progressData,
              ...progressSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }))
            ];
          }
        }
        
        // Fetch sample requests
        const requestsQuery = query(
          collection(db, 'sample_requests'),
          where('brandId', '==', brandId),
          where('createdAt', '>=', startTimestamp),
          orderBy('createdAt', 'desc')
        );
        
        const requestsSnapshot = await getDocs(requestsQuery);
        const sampleRequests = requestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Calculate summary metrics
        const totalViews = progressData.reduce((sum, item) => sum + (item.viewCount || 0), 0);
        const totalEngagements = progressData.reduce((sum, item) => sum + (item.engagementCount || 0), 0);
        const completedTrainings = progressData.filter(item => item.status === 'completed').length;
        const totalTrainingAttempts = progressData.length;
        
        // Calculate engagement and completion rates
        const engagementRate = totalViews > 0 ? (totalEngagements / totalViews) * 100 : 0;
        const completionRate = totalTrainingAttempts > 0 ? (completedTrainings / totalTrainingAttempts) * 100 : 0;
        
        // Calculate sales impact (based on sample requests and completed trainings)
        // Assumption: Each completed training leads to 3 additional product sales
        const avgProductPrice = 49.99; // Default value, could be fetched from settings
        const profitMargin = 0.4; // 40% profit margin
        const additionalSalesPerTraining = 3;
        const salesImpact = completedTrainings * additionalSalesPerTraining * avgProductPrice * profitMargin;
        
        // Set summary metrics
        setSummaryMetrics({
          totalViews,
          engagementRate,
          completionRate,
          salesImpact,
          totalUsers: new Set(progressData.map(item => item.userId)).size,
          totalContent: trainings.length
        });
        
        // Process content performance data
        const viewsByContent = trainings.map(training => {
          const trainingProgress = progressData.filter(item => item.trainingId === training.id);
          const views = trainingProgress.reduce((sum, item) => sum + (item.viewCount || 0), 0);
          const engagements = trainingProgress.reduce((sum, item) => sum + (item.engagementCount || 0), 0);
          const completions = trainingProgress.filter(item => item.status === 'completed').length;
          
          return {
            id: training.id,
            title: training.title,
            type: training.type || 'training',
            views,
            engagements,
            completions,
            engagementRate: views > 0 ? (engagements / views) * 100 : 0,
            completionRate: trainingProgress.length > 0 ? (completions / trainingProgress.length) * 100 : 0
          };
        }).sort((a, b) => b.views - a.views);
        
        // Generate engagement over time data
        const engagementOverTime = [];
        const now = new Date();
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
        
        for (let i = days - 1; i >= 0; i--) {
          const date = subDays(now, i);
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayStart = new Date(date);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(date);
          dayEnd.setHours(23, 59, 59, 999);
          
          const dayProgress = progressData.filter(item => {
            const updatedAt = item.updatedAt?.toDate();
            return updatedAt && updatedAt >= dayStart && updatedAt <= dayEnd;
          });
          
          engagementOverTime.push({
            date: dateStr,
            views: dayProgress.reduce((sum, item) => sum + (item.viewCount || 0), 0),
            engagements: dayProgress.reduce((sum, item) => sum + (item.engagementCount || 0), 0),
            completions: dayProgress.filter(item => item.status === 'completed').length
          });
        }
        
        // Calculate completion rates by content type
        const completionRates = [];
        const contentTypes = ['video', 'article', 'quiz', 'training'];
        
        contentTypes.forEach(type => {
          const typeTrainings = trainings.filter(training => (training.type || 'training') === type);
          const typeProgress = progressData.filter(item => {
            const training = trainings.find(t => t.id === item.trainingId);
            return training && (training.type || 'training') === type;
          });
          
          const attempts = typeProgress.length;
          const completed = typeProgress.filter(item => item.status === 'completed').length;
          
          completionRates.push({
            type,
            attempts,
            completed,
            rate: attempts > 0 ? (completed / attempts) * 100 : 0
          });
        });
        
        setContentPerformance({
          viewsByContent,
          engagementOverTime,
          completionRates
        });
        
        // Process user metrics
        const trainingCompletion = [
          {
            status: 'completed',
            count: progressData.filter(item => item.status === 'completed').length
          },
          {
            status: 'in_progress',
            count: progressData.filter(item => item.status === 'in_progress').length
          },
          {
            status: 'not_started',
            count: progressData.filter(item => item.status === 'not_started' || !item.status).length
          }
        ];
        
        // Generate user growth data
        const userGrowth = [];
        const usersByDate = new Map();
        
        progressData.forEach(item => {
          if (item.createdAt && item.userId) {
            const date = format(item.createdAt.toDate(), 'yyyy-MM-dd');
            if (!usersByDate.has(date)) {
              usersByDate.set(date, new Set());
            }
            usersByDate.get(date).add(item.userId);
          }
        });
        
        let cumulativeUsers = 0;
        for (let i = days - 1; i >= 0; i--) {
          const date = subDays(now, i);
          const dateStr = format(date, 'yyyy-MM-dd');
          const dateUsers = usersByDate.get(dateStr)?.size || 0;
          cumulativeUsers += dateUsers;
          
          userGrowth.push({
            date: dateStr,
            users: cumulativeUsers,
            newUsers: dateUsers
          });
        }
        
        // Mock geographic distribution (would be replaced with real data)
        const geographicDistribution = [
          { region: 'North America', users: 65 },
          { region: 'Europe', users: 20 },
          { region: 'Asia', users: 10 },
          { region: 'Other', users: 5 }
        ];
        
        setUserMetrics({
          trainingCompletion,
          userGrowth,
          geographicDistribution
        });
        
        // Process sales metrics
        const productsSoldPerUser = [
          { category: 'Trained Users', value: 4.5 },
          { category: 'Untrained Users', value: 1.5 }
        ];
        
        // Calculate sales attribution by content
        const salesAttribution = viewsByContent.map(content => {
          const completions = content.completions;
          const salesPerCompletion = additionalSalesPerTraining;
          const sales = completions * salesPerCompletion;
          
          return {
            id: content.id,
            title: content.title,
            type: content.type,
            sales,
            revenue: sales * avgProductPrice,
            profit: sales * avgProductPrice * profitMargin
          };
        }).sort((a, b) => b.sales - a.sales);
        
        setSalesMetrics({
          productsSoldPerUser,
          salesAttribution,
          revenueByContent: salesAttribution
        });
        
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError(`Failed to load analytics data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, [brandId, dateRange, contentType, refreshTrigger]);
  
  // Chart data for engagement over time
  const engagementChartData = {
    labels: contentPerformance.engagementOverTime.map(item => format(parseISO(item.date), 'MMM d')),
    datasets: [
      {
        label: 'Views',
        data: contentPerformance.engagementOverTime.map(item => item.views),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Engagements',
        data: contentPerformance.engagementOverTime.map(item => item.engagements),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Completions',
        data: contentPerformance.engagementOverTime.map(item => item.completions),
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.4,
        fill: true
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
        text: 'Engagement Over Time'
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count'
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    }
  };
  
  // Chart data for views by content
  const viewsChartData = {
    labels: contentPerformance.viewsByContent.slice(0, 10).map(item => item.title),
    datasets: [
      {
        label: 'Views',
        data: contentPerformance.viewsByContent.slice(0, 10).map(item => item.views),
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
    labels: userMetrics.userGrowth.map(item => format(parseISO(item.date), 'MMM d')),
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
    labels: salesMetrics.salesAttribution.slice(0, 10).map(item => item.title),
    datasets: [
      {
        label: 'Sales',
        data: salesMetrics.salesAttribution.slice(0, 10).map(item => item.sales),
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      },
      {
        label: 'Revenue',
        data: salesMetrics.salesAttribution.slice(0, 10).map(item => item.revenue / 100), // Scaled down for visibility
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }
    ]
  };
  
  // Chart options for sales attribution
  const salesAttributionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Sales Attribution by Content'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.raw;
            
            if (label === 'Revenue') {
              return `${label}: ${formatCurrency(value * 100)}`; // Scale back up
            }
            
            return `${label}: ${formatNumber(value)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count / Amount'
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
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header and filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Brand Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400">Comprehensive analytics and insights for your brand</p>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
          {/* Date range filter */}
          <Select value={dateRange} onValueChange={handleDateRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Content type filter */}
          <Select value={contentType} onValueChange={handleContentTypeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select content type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Content</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="article">Articles</SelectItem>
              <SelectItem value="quiz">Quizzes</SelectItem>
              <SelectItem value="training">Trainings</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Refresh button */}
          <Button variant="outline" onClick={() => setRefreshTrigger(prev => prev + 1)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          {/* Export button */}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {loading ? (
        // Loading state
        <>
          {/* Skeleton for summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Skeleton for charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
            
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Total Views */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-md bg-blue-100 text-blue-600">
                  <Eye className="h-6 w-6" />
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
                  <Heart className="h-6 w-6" />
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
                  <BookOpen className="h-6 w-6" />
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
                  <DollarSign className="h-6 w-6" />
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
                        {formatPercentage(contentPerformance.completionRates.find(rate => rate.type === content.type)?.rate || 0)}
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
    </div>
  );
}
