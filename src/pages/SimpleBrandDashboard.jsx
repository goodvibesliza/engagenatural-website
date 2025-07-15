import React, { useState } from "react";
import { useParams } from "react-router-dom";

// UI Components from shadcn/ui - minimal imports
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";

// Icons from lucide-react - minimal imports
import {
  Users,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calculator,
  Video,
  FileText,
  MessageSquare,
  Share2,
  Eye,
  MessageCircle,
  ThumbsUp,
  ChevronRight
} from "lucide-react";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-bold text-red-700 mb-4">Something went wrong</h2>
          <details className="whitespace-pre-wrap text-sm">
            <summary className="text-red-600 font-medium cursor-pointer mb-2">View error details</summary>
            <p className="text-red-800 font-mono bg-red-50 p-4 rounded overflow-auto">
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </p>
          </details>
          <Button 
            className="mt-4 bg-red-600 hover:bg-red-700" 
            onClick={() => this.setState({ hasError: false })}
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Engagement Card Component
const EngagementCard = ({ title, icon: Icon, color, views, likes, comments, shares, engagementRate }) => (
  <Card className="overflow-hidden">
    <CardHeader className="border-b flex flex-row items-center gap-2">
      <Icon className="h-5 w-5" />
      <CardTitle className="text-md">{title}</CardTitle>
    </CardHeader>
    <CardContent className="pt-4 pb-2">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Eye className="h-4 w-4" /> Views
          </span>
          <span className="font-medium">{views.toLocaleString()}</span>
        </div>
        <Progress value={85} className="h-2" />
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <ThumbsUp className="h-4 w-4" /> Likes
          </span>
          <span className="font-medium">{likes.toLocaleString()}</span>
        </div>
        <Progress value={likes / views * 100} className="h-2" />
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <MessageCircle className="h-4 w-4" /> Comments
          </span>
          <span className="font-medium">{comments.toLocaleString()}</span>
        </div>
        <Progress value={comments / views * 100} className="h-2" />
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Share2 className="h-4 w-4" /> Shares
          </span>
          <span className="font-medium">{shares.toLocaleString()}</span>
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

// Main Component
export default function SimpleBrandDashboard({ brandId: propBrandId }) {
  const { brandId: paramBrandId } = useParams();
  const brandId = propBrandId || paramBrandId || "sample-brand";

  // Sample brand info - no Firebase fetching
  const brandInfo = {
    id: brandId,
    name: "Sample Brand",
    description: "This is a sample brand for testing",
    logoURL: null,
    website: "https://example.com",
    createdAt: new Date().toISOString(),
    isActive: true
  };

  // State for ROI Calculator
  const [roiData, setRoiData] = useState({
    totalInvestment: '10000',
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

  // Sample community data
  const communityData = [
    { name: "Sustainability Champions", members: 4560, engagement: 78 },
    { name: "Product Training Hub", members: 3420, engagement: 85 },
    { name: "Retail Excellence", members: 2490, engagement: 72 }
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-muted/40 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {brandInfo.name} Dashboard (Simplified)
            </h1>
            <p className="text-sm text-muted-foreground">
              This is a simplified dashboard for testing purposes.
            </p>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Community Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,847</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">+12.5%</span> in the last 30 days
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8.5%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">+2.1%</span> across all content
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Content Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">176.2K</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">+22.4%</span> total views
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calculated ROI</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{roiResults.roi}%</div>
              <p className="text-xs text-muted-foreground">
                based on your inputs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Analytics */}
        <Tabs defaultValue="roi" className="w-full">
          <TabsList className="h-auto p-1 bg-muted rounded-lg inline-flex items-center justify-center">
            <TabsTrigger value="roi" className="px-3 py-1.5 text-sm font-medium">ROI Calculator</TabsTrigger>
            <TabsTrigger value="content" className="px-3 py-1.5 text-sm font-medium">Content</TabsTrigger>
            <TabsTrigger value="community" className="px-3 py-1.5 text-sm font-medium">Community</TabsTrigger>
          </TabsList>

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
                          type="text"
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
                          type="text"
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
                          type="text"
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

          <TabsContent value="content" className="mt-4">
            <div className="space-y-6">
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
          </TabsContent>
          
          <TabsContent value="community" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Community Engagement Summary</CardTitle>
                <CardDescription>Key metrics about your community's activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {communityData.map((community, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{community.name}</span>
                        <Badge variant="outline">{community.members.toLocaleString()} members</Badge>
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
          </TabsContent>
        </Tabs>
      </div>
    </ErrorBoundary>
  );
}
