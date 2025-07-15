import React, { useEffect, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import analyticsService, { getDateRangeFromPreset, formatMetricValue } from "../services/analytics-service";
import { useAuth } from '../contexts/auth-context';


// UI Components from shadcn/ui
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";

// Icons from lucide-react
import {
  Users,
  TrendingUp,
  Target,
  Trophy,
  RefreshCw,
  Download,
  AlertCircle,
  BarChart,
  Eye,
  Heart,
  MessageSquare,
  DollarSign,
  Upload,
  Menu,
  Settings,
  Video,
  FileText,
  MessageCircle,
  Share2,
  ThumbsUp,
  Calculator,
  TrendingDown,
  ChevronRight,
  /* unused icons removed */
} from "lucide-react";

// Charting Library
import {
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  AreaChart as RechartsAreaChart,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar as RechartsBar,
  Line as RechartsLine,
  Area as RechartsArea,
  Pie as RechartsPie,
  Cell,
} from "recharts";

const CHART_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F"];

// Metric Card Sub-component
const MetricCard = ({ title, value, change, icon: Icon, description }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">
        {change !== null && (
          <span className={change >= 0 ? "text-green-500" : "text-red-500"}>
            {change >= 0 ? "+" : ""}{change}%
          </span>
        )}
        {description}
      </p>
    </CardContent>
  </Card>
);

// Chart Card Sub-component
const ChartCard = ({ title, description, children }) => (
  <Card className="col-span-full lg:col-span-1">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="pl-2">
      <ResponsiveContainer width="100%" height={300}>
        {children}
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

// Engagement Card Component
const EngagementCard = ({ title, icon: Icon, color, views, likes, comments, shares, engagementRate }) => (
  <Card className="overflow-hidden">
    <CardHeader className={`bg-${color}-50 border-b flex flex-row items-center gap-2`}>
      <Icon className={`h-5 w-5 text-${color}-500`} />
      <CardTitle className="text-md">{title}</CardTitle>
    </CardHeader>
    <CardContent className="pt-4 pb-2">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Eye className="h-4 w-4" /> Views
          </span>
          <span className="font-medium">{formatMetricValue(views, 'compact')}</span>
        </div>
        <Progress value={85} className="h-2" />
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" /> Likes
          </span>
          <span className="font-medium">{formatMetricValue(likes, 'compact')}</span>
        </div>
        <Progress value={likes / views * 100} className="h-2" />
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <MessageCircle className="h-4 w-4" /> Comments
          </span>
          <span className="font-medium">{formatMetricValue(comments, 'compact')}</span>
        </div>
        <Progress value={comments / views * 100} className="h-2" />
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Share2 className="h-4 w-4" /> Shares
          </span>
          <span className="font-medium">{formatMetricValue(shares, 'compact')}</span>
        </div>
        <Progress value={shares / views * 100} className="h-2" />
      </div>
    </CardContent>
    <CardFooter className="bg-muted/30 border-t">
      <div className="w-full flex justify-between items-center">
        <span className="text-sm font-medium">Engagement Rate</span>
        <Badge variant={engagementRate > 5 ? "success" : "default"} className="bg-green-100 text-green-800 hover:bg-green-200">
          {engagementRate}%
        </Badge>
      </div>
    </CardFooter>
  </Card>
);

export default function FixedBrandDashboard({ brandId: propBrandId }) {
  const { brandId: paramBrandId } = useParams();
  const brandId = propBrandId || paramBrandId;

  const [brandInfo, setBrandInfo] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for ROI Calculator
  const [roiData, setRoiData] = useState({
    totalInvestment: '10000', // Default value
    employeesTrained: 50,
    avgProfitPerItem: 5
  });

  // ROI Calculation Logic
  const handleRoiChange = (e) => {
    const { name, value } = e.target;
    // Validate input to ensure it's a positive number
    if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
      setRoiData(prev => ({ ...prev, [name]: value }));
    }
  };

  const calculateROI = () => {
    const totalInvestment = parseFloat(roiData.totalInvestment) || 0;
    const employeesTrained = parseInt(roiData.employeesTrained) || 0;
    const avgProfitPerItem = parseFloat(roiData.avgProfitPerItem) || 0;
    
    const additionalProductsSold = employeesTrained * 3;
    const additionalRevenue = additionalProductsSold * avgProfitPerItem;
    const roi = totalInvestment > 0
      ? ((additionalRevenue - totalInvestment) / totalInvestment) * 100
      : 0;
    
    return {
      additionalProductsSold,
      additionalRevenue,
      roi: roi.toFixed(1)
    };
  };

  const roiResults = calculateROI();

  const fetchData = useCallback(async () => {
    if (!brandId) {
      setError("Brand ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { startDate, endDate } = getDateRangeFromPreset('30d');

      const brandInfoPromise = getDoc(doc(db, "brands", brandId));
      // This call will now be handled gracefully
      const analyticsPromise = analyticsService.getAllAnalytics(startDate, endDate, 'brand', brandId);

      const [brandSnap, analytics] = await Promise.all([brandInfoPromise, analyticsPromise]);

      if (brandSnap.exists()) {
        setBrandInfo(brandSnap.data());
      } else {
        throw new Error("Brand not found.");
      }

      setAnalyticsData(analytics);
    } catch (err) {
      console.error("Failed to fetch brand data:", err);
      setError("Could not load live data from Firebase. This is likely due to missing database indexes. Showing sample data instead.");
      // Set fallback data so the component doesn't crash
      setAnalyticsData(analyticsService.getFallbackData());
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // We check for analyticsData to be truthy before rendering.
  if (!brandInfo || !analyticsData) {
     return (
      <div className="p-8 text-center">
        <div className="p-4 border border-red-300 bg-red-50 rounded-md">
            <h3 className="font-bold text-red-800">Error</h3>
            <p className="text-red-700">A critical error occurred and the dashboard could not be loaded.</p>
            <button onClick={fetchData} className="text-red-800 underline mt-2">
              Try again
            </button>
        </div>
      </div>
    );
  }

  // Sample content engagement data
  const contentEngagementData = {
    videos: {
      views: 45200,
      likes: 3800,
      comments: 1240,
      shares: 780,
      engagementRate: 12.9
    },
    articles: {
      views: 32800,
      likes: 2100,
      comments: 845,
      shares: 620,
      engagementRate: 10.8
    },
    posts: {
      views: 68500,
      likes: 5200,
      comments: 2300,
      shares: 1850,
      engagementRate: 13.7
    },
    socialMedia: {
      views: 29700,
      likes: 3400,
      comments: 980,
      shares: 2100,
      engagementRate: 21.8
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          {brandInfo.logoURL && (
            <img
              src={brandInfo.logoURL}
              alt={`${brandInfo.name} Logo`}
              className="h-16 w-16 rounded-full object-cover border-2 border-background shadow-sm"
            />
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {brandInfo.name} Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Analytics and management tools for your brand.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </header>

      {/* Display Error/Warning if Firebase failed */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Live Data Unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Navigation Links */}
      <nav className="flex flex-wrap gap-2">
        <Button asChild variant="secondary" size="sm">
          <Link to={`/brand/${brandId}/challenges`}>
            <Trophy className="h-4 w-4 mr-2" />
            Manage Challenges
          </Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link to={`/brand/${brandId}/upload`}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Content
          </Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link to={`/brand/${brandId}/menu`}>
            <Menu className="h-4 w-4 mr-2" />
            Brand Menu
          </Link>
        </Button>
         <Button asChild variant="outline" size="sm">
          <Link to={`/brand/${brandId}/configuration`}>
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </Link>
        </Button>
      </nav>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Community Members"
          value={formatMetricValue(analyticsData.communityMetrics?.topCommunities.reduce((sum, c) => sum + c.members, 0), 'compact')}
          change={analyticsData.communityMetrics?.communityGrowth}
          icon={Users}
          description=" in the last 30 days"
        />
        <MetricCard
          title="Engagement Rate"
          value={formatMetricValue(analyticsData.contentMetrics?.engagementRate, 'percent')}
          change={5.2}
          icon={Heart}
          description=" across all content"
        />
        <MetricCard
          title="Challenges Completed"
          value={formatMetricValue(156, 'compact')}
          change={18.1}
          icon={Trophy}
          description=" this month"
        />
        <MetricCard
          title="Content Views"
          value={formatMetricValue(analyticsData.contentMetrics?.topPerformingContent.reduce((sum, c) => sum + c.views, 0), 'compact')}
          change={22.4}
          icon={Eye}
          description=" total views"
        />
        <MetricCard
          title="Calculated ROI"
          value={`${roiResults.roi}%`}
          change={null}
          icon={DollarSign}
          description=" based on your inputs"
        />
      </div>

      {/* Tabbed Analytics */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="h-auto p-1 bg-muted rounded-lg inline-flex items-center justify-center">
          <TabsTrigger value="overview" className="px-3 py-1.5 text-sm font-medium">Overview</TabsTrigger>
          <TabsTrigger value="audience" className="px-3 py-1.5 text-sm font-medium">Audience</TabsTrigger>
          <TabsTrigger value="content" className="px-3 py-1.5 text-sm font-medium">Content</TabsTrigger>
          <TabsTrigger value="engagement" className="px-3 py-1.5 text-sm font-medium">Engagement</TabsTrigger>
          <TabsTrigger value="roi" className="px-3 py-1.5 text-sm font-medium">ROI Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Community Growth" description="Daily active members in your communities.">
              <RechartsAreaChart data={analyticsData.communityMetrics?.activityTrend}>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip />
                <RechartsArea type="monotone" dataKey="posts" stroke={CHART_COLORS[0]} fillOpacity={1} fill="url(#colorUv)" />
              </RechartsAreaChart>
            </ChartCard>
            <ChartCard title="Content Engagement" description="Views vs. engagement over the last 30 days.">
              <RechartsLineChart data={analyticsData.contentMetrics?.topPerformingContent}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value.substring(0, 10) + '...'} />
                <YAxis yAxisId="left" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <RechartsLine yAxisId="left" type="monotone" dataKey="views" stroke={CHART_COLORS[1]} />
                <RechartsLine yAxisId="right" type="monotone" dataKey="engagement" stroke={CHART_COLORS[2]} />
              </RechartsLineChart>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="audience" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="User Demographics" description="Breakdown of your audience by location.">
              <RechartsPieChart>
                <RechartsPie data={analyticsData.userMetrics?.usersByLocation} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {analyticsData.userMetrics?.usersByLocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </RechartsPie>
                <Tooltip />
                <Legend />
              </RechartsPieChart>
            </ChartCard>
            <ChartCard title="Device Usage" description="What devices your audience uses to engage.">
              <RechartsBarChart data={analyticsData.userMetrics?.usersByDevice} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <RechartsBar dataKey="value" fill={CHART_COLORS[3]} barSize={30}>
                   {analyticsData.userMetrics?.usersByDevice.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </RechartsBar>
              </RechartsBarChart>
            </ChartCard>
          </div>
        </TabsContent>

        <TabsContent value="content" className="mt-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Content</CardTitle>
                <CardDescription>Your most viewed and engaged content pieces.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.contentMetrics?.topPerformingContent.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                         <BarChart className="h-5 w-5 text-muted-foreground" />
                         <div>
                           <p className="font-semibold">{item.title}</p>
                           <Badge variant="outline">{item.type}</Badge>
                         </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatMetricValue(item.views, 'compact')} views</p>
                        <p className="text-sm text-green-500">{item.engagement}% engagement</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Content Engagement Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <EngagementCard 
                  title="Videos" 
                  icon={Video} 
                  color="blue" 
                  views={contentEngagementData.videos.views}
                  likes={contentEngagementData.videos.likes}
                  comments={contentEngagementData.videos.comments}
                  shares={contentEngagementData.videos.shares}
                  engagementRate={contentEngagementData.videos.engagementRate}
                />
                
                <EngagementCard 
                  title="Articles" 
                  icon={FileText} 
                  color="green" 
                  views={contentEngagementData.articles.views}
                  likes={contentEngagementData.articles.likes}
                  comments={contentEngagementData.articles.comments}
                  shares={contentEngagementData.articles.shares}
                  engagementRate={contentEngagementData.articles.engagementRate}
                />
                
                <EngagementCard 
                  title="Posts" 
                  icon={MessageSquare} 
                  color="purple" 
                  views={contentEngagementData.posts.views}
                  likes={contentEngagementData.posts.likes}
                  comments={contentEngagementData.posts.comments}
                  shares={contentEngagementData.posts.shares}
                  engagementRate={contentEngagementData.posts.engagementRate}
                />
                
                <EngagementCard 
                  title="Social Media" 
                  icon={Share2} 
                  color="orange" 
                  views={contentEngagementData.socialMedia.views}
                  likes={contentEngagementData.socialMedia.likes}
                  comments={contentEngagementData.socialMedia.comments}
                  shares={contentEngagementData.socialMedia.shares}
                  engagementRate={contentEngagementData.socialMedia.engagementRate}
                />
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="engagement" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Community Activity" description="Posts, comments, and likes over time.">
              <RechartsBarChart data={analyticsData.communityMetrics?.activityTrend} stackOffset="sign">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <RechartsBar dataKey="posts" fill={CHART_COLORS[0]} stackId="a" />
                <RechartsBar dataKey="comments" fill={CHART_COLORS[1]} stackId="a" />
              </RechartsBarChart>
            </ChartCard>
            
            <Card>
              <CardHeader>
                <CardTitle>Community Engagement Summary</CardTitle>
                <CardDescription>Key metrics about your community's activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.communityMetrics?.topCommunities.map((community, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{community.name}</span>
                        <Badge variant="outline">{community.members} members</Badge>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Engagement Rate</span>
                        <span>{community.engagement}%</span>
                      </div>
                      <Progress value={community.engagement} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roi" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Return on Investment (ROI) Calculator</CardTitle>
                  <CardDescription className="mt-2 text-base">
                    <strong>ROI = Return on Investment.</strong> This tool estimates the increase in items sold as a result of your brand's challenges and engagement campaigns.
                  </CardDescription>
                </div>
                <Calculator className="h-10 w-10 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Input Form */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                  Enter Your Investment Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="totalInvestment" className="text-base">Total Investment ($)</Label>
                    <div className="relative mt-1.5">
                      <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="totalInvestment"
                        name="totalInvestment"
                        type="text" // Changed to text for better control
                        value={roiData.totalInvestment}
                        onChange={handleRoiChange}
                        placeholder="e.g., 10000"
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Total amount invested in training and engagement</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="employeesTrained" className="text-base">Number of Employees Trained</Label>
                    <div className="relative mt-1.5">
                      <Users className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="employeesTrained"
                        name="employeesTrained"
                        type="text" // Changed to text for better control
                        value={roiData.employeesTrained}
                        onChange={handleRoiChange}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Number of retail staff who completed training</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="avgProfitPerItem" className="text-base">Average Profit per Item ($)</Label>
                    <div className="relative mt-1.5">
                      <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="avgProfitPerItem"
                        name="avgProfitPerItem"
                        type="text" // Changed to text for better control
                        value={roiData.avgProfitPerItem}
                        onChange={handleRoiChange}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Average profit margin per product sold</p>
                  </div>
                </div>
              </div>
              
              {/* Calculation Breakdown */}
              <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                  <span className="bg-primary/10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                  View Your ROI Results
                </h3>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Based on our research, each trained employee sells an average of 3 additional products</span>
                    </div>
                    
                    <div className="flex items-center gap-2 p-3 bg-background rounded-md">
                      <Users className="h-5 w-5 text-primary" />
                      <span className="font-medium">{roiData.employeesTrained} employees</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
                      <span className="font-medium">{roiResults.additionalProductsSold} additional products</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Additional Products Sold</span>
                      <span className="font-semibold">{roiResults.additionalProductsSold}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Profit per Item</span>
                      <span className="font-semibold">${roiData.avgProfitPerItem}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Additional Revenue</span>
                      <span className="font-semibold">${roiResults.additionalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Investment</span>
                      <span className="font-semibold">${parseFloat(roiData.totalInvestment).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center p-4 bg-background rounded-md">
                    <div>
                      <span className="text-lg font-bold">Estimated ROI</span>
                      <p className="text-sm text-muted-foreground">Return on investment</p>
                    </div>
                    <div className={`text-2xl font-bold ${parseFloat(roiResults.roi) >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center gap-1`}>
                      {parseFloat(roiResults.roi) >= 0 ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                      {roiResults.roi}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
