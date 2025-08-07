import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../UpdatedAppWithIntegration';

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';

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
  MessageCircle,
  HelpCircle,
  Info
} from 'lucide-react';

// Recharts for data visualization
import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart as RechartsLineChart, Line,
  PieChart as RechartsPieChart, Pie, Cell,
  ResponsiveContainer,
  XAxis, YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

// Mock data - would be replaced with actual API calls in production
const mockAnalyticsData = {
  communityMetrics: {
    totalCommunities: 12,
    activeMembers: 2847,
    communityGrowth: 8.2,
    topCommunities: [
      { name: 'Outdoor Enthusiasts', members: 1247, engagement: 89, growth: '+12%' },
      { name: 'Fitness Community', members: 892, engagement: 76, growth: '+8%' },
      { name: 'Tech Innovators', members: 634, engagement: 94, growth: '+15%' }
    ],
    activityTrend: [
      { date: 'Jan 1', posts: 45, comments: 132 },
      { date: 'Jan 8', posts: 52, comments: 187 },
      { date: 'Jan 15', posts: 61, comments: 215 },
      { date: 'Jan 22', posts: 48, comments: 176 },
      { date: 'Jan 29', posts: 38, comments: 154 },
      { date: 'Feb 5', posts: 48, comments: 198 },
      { date: 'Feb 12', posts: 61, comments: 221 }
    ]
  },
  contentMetrics: {
    engagementRate: 24.7,
    engagementBreakdown: {
      videos: 1247,
      articles: 892,
      posts: 2156,
      socialAsks: 634
    },
    topPerformingContent: [
      { title: 'Sustainable Shopping Guide', type: 'Article', views: 1245, engagement: 32 },
      { title: 'Product Demo Video', type: 'Video', views: 987, engagement: 28 },
      { title: 'Community Challenge', type: 'Post', views: 876, engagement: 41 },
      { title: 'Customer Feedback Survey', type: 'Social Ask', views: 654, engagement: 19 }
    ]
  },
  userMetrics: {
    usersByLocation: [
      { name: 'North America', value: 65 },
      { name: 'Europe', value: 20 },
      { name: 'Asia', value: 10 },
      { name: 'Other', value: 5 }
    ],
    usersByDevice: [
      { name: 'Mobile', value: 68 },
      { name: 'Desktop', value: 24 },
      { name: 'Tablet', value: 8 }
    ]
  }
};

// Chart colors
const CHART_COLORS = ['#0ea5e9', '#10b981', '#8b5cf6', '#f97316', '#ef4444', '#f59e0b'];
const CONTENT_COLORS = {
  videos: '#ef4444',    // Red
  articles: '#0ea5e9',  // Blue
  posts: '#10b981',     // Green
  socialAsks: '#8b5cf6' // Purple
};

const EnhancedBrandDashboard = ({ brandId: propBrandId }) => {
  const { brandId: paramBrandId } = useParams();
  const brandId = propBrandId || paramBrandId;
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [brandInfo, setBrandInfo] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [dateRange, setDateRange] = useState('30d');
  
  // ROI Calculator state
  const [roiData, setRoiData] = useState({
    totalInvestment: 1000,
    employeesTrained: 50,
    avgProfitPerItem: 5
  });
  
  // Calculate ROI metrics
  const additionalProductsSold = roiData.employeesTrained * 3;
  const additionalRevenue = additionalProductsSold * roiData.avgProfitPerItem;
  const roiPercentage = roiData.totalInvestment > 0
    ? ((additionalRevenue - roiData.totalInvestment) / roiData.totalInvestment * 100).toFixed(1)
    : 0;
  
  // Handle ROI input changes
  const handleRoiChange = (e) => {
    const { name, value } = e.target;
    setRoiData(prev => ({ ...prev, [name]: Number(value) }));
  };
  
  // Format numbers for display
  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  // Fetch brand data
  const fetchBrandData = useCallback(async () => {
    if (!brandId) {
      setError("Brand ID is missing");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would fetch from Firebase
      const brandDocRef = doc(db, 'brands', brandId);
      const brandDoc = await getDoc(brandDocRef);
      
      if (brandDoc.exists()) {
        setBrandInfo(brandDoc.data());
      } else {
        // Use mock data for demo purposes
        setBrandInfo({
          name: brandId.charAt(0).toUpperCase() + brandId.slice(1),
          logoURL: null,
          primaryColor: '#0ea5e9',
          secondaryColor: '#10b981'
        });
      }
      
      // In a real app, this would fetch analytics from an API or Firebase
      // For now, use mock data
      setAnalyticsData(mockAnalyticsData);
    } catch (err) {
      console.error("Error fetching brand data:", err);
      setError("Could not load brand data. Using sample data instead.");
      
      // Set fallback data
      setBrandInfo({
        name: brandId.charAt(0).toUpperCase() + brandId.slice(1),
        logoURL: null,
        primaryColor: '#0ea5e9',
        secondaryColor: '#10b981'
      });
      setAnalyticsData(mockAnalyticsData);
    } finally {
      setLoading(false);
    }
  }, [brandId]);
  
  useEffect(() => {
    fetchBrandData();
  }, [fetchBrandData]);
  
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }
  
  if (!brandInfo || !analyticsData) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load dashboard data. Please try again later.
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchBrandData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brand Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and insights for {brandInfo.name}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center border rounded-md overflow-hidden">
            <Button variant="ghost" size="sm" className={dateRange === '7d' ? 'bg-muted' : ''} onClick={() => setDateRange('7d')}>
              7D
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="sm" className={dateRange === '30d' ? 'bg-muted' : ''} onClick={() => setDateRange('30d')}>
              30D
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="ghost" size="sm" className={dateRange === '90d' ? 'bg-muted' : ''} onClick={() => setDateRange('90d')}>
              90D
            </Button>
          </div>
          
          <Button variant="outline" size="sm" onClick={fetchBrandData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Error message if any */}
      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Note</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Community Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.communityMetrics.activeMembers)}</div>
            <div className="flex items-center pt-1 text-xs">
              <span className="text-green-500 flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />
                {analyticsData.communityMetrics.communityGrowth}%
              </span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.contentMetrics.engagementRate}%</div>
            <div className="flex items-center pt-1 text-xs">
              <span className="text-green-500 flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />
                5.2%
              </span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Content Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(analyticsData.contentMetrics.topPerformingContent.reduce((sum, item) => sum + item.views, 0))}
            </div>
            <div className="flex items-center pt-1 text-xs">
              <span className="text-green-500 flex items-center">
                <ArrowUp className="h-3 w-3 mr-1" />
                22.4%
              </span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ROI Estimate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roiPercentage}%</div>
            <div className="flex items-center pt-1 text-xs">
              <span className="text-muted-foreground">Based on current inputs</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Content Engagement Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-red-50 border-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {formatNumber(analyticsData.contentMetrics.engagementBreakdown.videos)}
            </div>
            <p className="text-xs text-red-600">engagements</p>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {formatNumber(analyticsData.contentMetrics.engagementBreakdown.articles)}
            </div>
            <p className="text-xs text-blue-600">engagements</p>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {formatNumber(analyticsData.contentMetrics.engagementBreakdown.posts)}
            </div>
            <p className="text-xs text-green-600">engagements</p>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Social Asks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {formatNumber(analyticsData.contentMetrics.engagementBreakdown.socialAsks)}
            </div>
            <p className="text-xs text-purple-600">engagements</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        {/* Tabs header */}
        <TabsList className="flex flex-wrap gap-2 border-b border-muted pb-2">
          {/* Overview */}
          <TabsTrigger
            value="overview"
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors
                       data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                       hover:bg-muted/70"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>

          {/* Content */}
          <TabsTrigger
            value="content"
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors
                       data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                       hover:bg-muted/70"
          >
            <Layers className="h-4 w-4" />
            <span>Content</span>
          </TabsTrigger>

          {/* Audience */}
          <TabsTrigger
            value="audience"
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors
                       data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                       hover:bg-muted/70"
          >
            <Users className="h-4 w-4" />
            <span>Audience</span>
          </TabsTrigger>

          {/* ROI */}
          <TabsTrigger
            value="roi"
            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors
                       data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                       hover:bg-muted/70"
          >
            <DollarSign className="h-4 w-4" />
            <span>ROI Calculator</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Community Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Community Growth</CardTitle>
                <CardDescription>Daily active members in your communities</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData.communityMetrics.activityTrend}>
                      <defs>
                        <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <CartesianGrid strokeDasharray="3 3" />
                      <RechartsTooltip />
                      <Area 
                        type="monotone" 
                        dataKey="posts" 
                        stroke={CHART_COLORS[0]} 
                        fillOpacity={1} 
                        fill="url(#colorPosts)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Content Engagement Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Content Engagement</CardTitle>
                <CardDescription>Views vs. engagement over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={analyticsData.contentMetrics.topPerformingContent}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="title" tick={{ fontSize: 12 }} tickFormatter={(value) => value.substring(0, 10) + '...'} />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip />
                      <Legend />
                      <Line 
                        yAxisId="left" 
                        type="monotone" 
                        dataKey="views" 
                        stroke={CHART_COLORS[1]} 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="engagement" 
                        stroke={CHART_COLORS[2]} 
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Top Communities */}
          <Card>
            <CardHeader>
              <CardTitle>Top Communities</CardTitle>
              <CardDescription>Your most active community groups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.communityMetrics.topCommunities.map((community, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{community.name}</p>
                      <p className="text-sm text-muted-foreground">{community.members} members</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-medium">{community.engagement}%</span>
                        <span className="text-xs text-muted-foreground">Engagement</span>
                      </div>
                      <Badge variant="outline" className="text-green-600">{community.growth}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between">
              <span className="text-sm text-muted-foreground">
                {analyticsData.communityMetrics.totalCommunities} communities total
              </span>
              <Button variant="ghost" size="sm" className="gap-1">
                View all <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Performance</CardTitle>
              <CardDescription>Analysis of your top performing content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.contentMetrics.topPerformingContent.map((content, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      {content.type === 'Video' && <Video className="h-5 w-5 text-red-500" />}
                      {content.type === 'Article' && <FileText className="h-5 w-5 text-blue-500" />}
                      {content.type === 'Post' && <MessageCircle className="h-5 w-5 text-green-500" />}
                      {content.type === 'Social Ask' && <Users className="h-5 w-5 text-purple-500" />}
                      <div>
                        <p className="font-medium">{content.title}</p>
                        <Badge variant="outline">{content.type}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatNumber(content.views)} views</p>
                      <p className="text-sm text-green-600">{content.engagement}% engagement</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Type Distribution</CardTitle>
                <CardDescription>Breakdown by content category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Videos', value: analyticsData.contentMetrics.engagementBreakdown.videos },
                          { name: 'Articles', value: analyticsData.contentMetrics.engagementBreakdown.articles },
                          { name: 'Posts', value: analyticsData.contentMetrics.engagementBreakdown.posts },
                          { name: 'Social Asks', value: analyticsData.contentMetrics.engagementBreakdown.socialAsks }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label
                      >
                        <Cell key="videos" fill={CONTENT_COLORS.videos} />
                        <Cell key="articles" fill={CONTENT_COLORS.articles} />
                        <Cell key="posts" fill={CONTENT_COLORS.posts} />
                        <Cell key="socialAsks" fill={CONTENT_COLORS.socialAsks} />
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>Likes, comments, and shares over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.communityMetrics.activityTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="posts" name="Posts" fill={CHART_COLORS[0]} />
                      <Bar dataKey="comments" name="Comments" fill={CHART_COLORS[1]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>User Demographics</CardTitle>
                <CardDescription>Breakdown of your audience by location</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={analyticsData.userMetrics.usersByLocation}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label
                      >
                        {analyticsData.userMetrics.usersByLocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Device Usage</CardTitle>
                <CardDescription>What devices your audience uses to engage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={analyticsData.userMetrics.usersByDevice} 
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="name" />
                      <RechartsTooltip />
                      <Bar dataKey="value" fill={CHART_COLORS[3]}>
                        {analyticsData.userMetrics.usersByDevice.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* ROI Calculator Tab */}
        <TabsContent value="roi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Return on Investment (ROI) Calculator</CardTitle>
              <CardDescription>
                <p className="mb-1">
                  <strong>ROI = Return on Investment.</strong> This tool estimates the increase in items sold as a result of your brand's challenges and engagement campaigns.
                </p>
                <p className="text-sm text-muted-foreground">
                  Based on our research, each trained retail employee sells an average of 3 additional products before another training session occurs.
                </p>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Input Form */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalInvestment">Total Investment ($)</Label>
                    <Input
                      id="totalInvestment"
                      name="totalInvestment"
                      type="number"
                      value={roiData.totalInvestment}
                      onChange={handleRoiChange}
                      placeholder="e.g., 1000"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the total amount invested in your brand campaign
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="employeesTrained">Number of Employees Trained</Label>
                    <Input
                      id="employeesTrained"
                      name="employeesTrained"
                      type="number"
                      value={roiData.employeesTrained}
                      onChange={handleRoiChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      How many retail employees completed your training program
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="avgProfitPerItem">Average Profit per Item ($)</Label>
                    <Input
                      id="avgProfitPerItem"
                      name="avgProfitPerItem"
                      type="number"
                      value={roiData.avgProfitPerItem}
                      onChange={handleRoiChange}
                    />
                    <p className="text-xs text-muted-foreground">
                      The average profit margin on each item sold
                    </p>
                  </div>
                </div>
                
                {/* Calculation Results */}
                <div className="bg-muted/50 rounded-lg p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-4">Calculation Breakdown</h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Additional Products Sold:</span>
                        <span className="font-semibold text-lg">{additionalProductsSold}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Additional Revenue:</span>
                        <span className="font-semibold text-lg">${additionalRevenue.toLocaleString()}</span>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-lg">Estimated ROI:</span>
                        <span className={`text-xl font-bold ${Number(roiPercentage) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {roiPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">ROI Performance</span>
                      <span className="text-sm font-medium">{roiPercentage}%</span>
                    </div>
                    <Progress 
                      value={Math.min(Math.max(Number(roiPercentage), 0), 100)} 
                      className="h-2" 
                    />
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%+</span>
                    </div>
                  </div>
                  
                  {Number(roiPercentage) > 0 ? (
                    <div className="flex items-center p-3 bg-green-50 border border-green-100 rounded-md text-green-800">
                      <Trophy className="h-5 w-5 mr-2 text-green-600" />
                      <span className="text-sm">
                        Positive ROI! Your investment is generating returns.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center p-3 bg-amber-50 border border-amber-100 rounded-md text-amber-800">
                      <Info className="h-5 w-5 mr-2 text-amber-600" />
                      <span className="text-sm">
                        Consider adjusting your strategy to improve ROI.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <HelpCircle className="h-4 w-4 mr-1" />
                <span>Need help with your ROI strategy? Contact our support team.</span>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedBrandDashboard;
