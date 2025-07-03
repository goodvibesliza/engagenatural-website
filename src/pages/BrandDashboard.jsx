import React, { useEffect, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import analyticsService, { getDateRangeFromPreset, formatMetricValue } from "../services/analytics-service";
import { useAuth } from '../contexts/auth-context';


// UI Components from shadcn/ui
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

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
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Eye,
  Heart,
  MessageSquare,
  DollarSign,
  Upload,
  Menu,
  Settings,
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

export default function FixedBrandDashboard({ brandId: propBrandId }) {
  const { brandId: paramBrandId } = useParams();
  const brandId = propBrandId || paramBrandId;

  const [brandInfo, setBrandInfo] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for ROI Calculator
  const [roiData, setRoiData] = useState({
    totalInvestment: '1000', // Default value
    employeesTrained: 50,
    avgProfitPerItem: 5
  });

  // ROI Calculation Logic
  const handleRoiChange = (e) => {
    const { name, value } = e.target;
    setRoiData(prev => ({ ...prev, [name]: value }));
  };

  const additionalProductsSold = roiData.employeesTrained * 3;
  const additionalRevenue = additionalProductsSold * roiData.avgProfitPerItem;
  const roiPercentage = roiData.totalInvestment > 0
    ? (((additionalRevenue - parseFloat(roiData.totalInvestment)) / parseFloat(roiData.totalInvestment)) * 100).toFixed(1)
    : 0;

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
          value={`${roiPercentage}%`}
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
        </TabsContent>
        
        <TabsContent value="engagement" className="mt-4">
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
        </TabsContent>

        <TabsContent value="roi" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Return on Investment (ROI) Calculator</CardTitle>
              <CardDescription>
                <strong>ROI = Return on Investment.</strong> This tool estimates the increase in items sold as a result of your brand’s challenges and engagement campaigns. Track how your efforts are driving real sales!
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Input Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="totalInvestment">Total Investment ($)</Label>
                  <Input
                    id="totalInvestment"
                    name="totalInvestment"
                    type="number"
                    value={roiData.totalInvestment}
                    onChange={handleRoiChange}
                    placeholder="e.g., 1000"
                  />
                </div>
                <div>
                  <Label htmlFor="employeesTrained">Number of Employees Trained</Label>
                  <Input
                    id="employeesTrained"
                    name="employeesTrained"
                    type="number"
                    value={roiData.employeesTrained}
                    onChange={handleRoiChange}
                  />
                </div>
                <div>
                  <Label htmlFor="avgProfitPerItem">Average Profit per Item ($)</Label>
                  <Input
                    id="avgProfitPerItem"
                    name="avgProfitPerItem"
                    type="number"
                    value={roiData.avgProfitPerItem}
                    onChange={handleRoiChange}
                  />
                </div>
              </div>
              {/* Calculation Breakdown */}
              <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                <h3 className="font-semibold text-lg">Calculation Breakdown</h3>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Additional Products Sold:</span>
                  <span className="font-semibold">{additionalProductsSold}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Additional Revenue:</span>
                  <span className="font-semibold">${additionalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-4 mt-4">
                  <span className="text-lg font-bold">Estimated ROI:</span>
                  <span className={`text-lg font-bold ${roiPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {roiPercentage}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
