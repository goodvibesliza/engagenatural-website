import { useState, useEffect } from 'react'
import { useRoleAccess } from '../../../hooks/use-role-access'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/Button'
import { Badge } from '../../ui/badge'
import { Progress } from '../../ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Building, 
  DollarSign,
  ShoppingCart,
  Eye,
  UserCheck,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

export default function AnalyticsDashboard() {
  const { canViewAnalytics, role } = useRoleAccess()
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('overview')

  // Sample analytics data
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalUsers: 12847,
      activeUsers: 8923,
      newUsers: 1247,
      userGrowth: 12.3,
      totalBrands: 45,
      activeBrands: 38,
      brandGrowth: 8.7,
      totalRevenue: 425000,
      revenueGrowth: 15.2,
      conversionRate: 3.4,
      conversionGrowth: 0.8
    },
    userMetrics: {
      dailyActiveUsers: 2847,
      weeklyActiveUsers: 6234,
      monthlyActiveUsers: 8923,
      userRetention: 78.5,
      avgSessionDuration: '4m 32s',
      bounceRate: 23.4
    },
    brandMetrics: {
      topPerformingBrands: [
        { name: 'GreenLeaf Organics', revenue: 125000, growth: 18.5 },
        { name: 'EcoTech Solutions', revenue: 98000, growth: 22.1 },
        { name: 'Pure Beauty Co', revenue: 87000, growth: 15.3 },
        { name: 'Sustainable Living', revenue: 65000, growth: -5.2 }
      ],
      categoryPerformance: [
        { category: 'Organic Foods', revenue: 185000, share: 43.5 },
        { category: 'Technology', revenue: 125000, share: 29.4 },
        { category: 'Beauty & Wellness', revenue: 87000, share: 20.5 },
        { category: 'Home & Garden', revenue: 28000, share: 6.6 }
      ]
    },
    verificationMetrics: {
      totalVerifications: 1847,
      pendingVerifications: 23,
      approvedVerifications: 1756,
      rejectedVerifications: 68,
      approvalRate: 96.3,
      avgProcessingTime: '2.4 hours'
    }
  })

  const getMetricCard = (title, value, change, trend, icon) => {
    const IconComponent = icon
    const isPositive = trend === 'up'
    
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <IconComponent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-xs text-muted-foreground flex items-center">
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
              {change}
            </span>
            <span className="ml-1">from last period</span>
          </p>
        </CardContent>
      </Card>
    )
  }

  const getTimeRangeLabel = (range) => {
    switch (range) {
      case '7d': return 'Last 7 days'
      case '30d': return 'Last 30 days'
      case '90d': return 'Last 90 days'
      case '1y': return 'Last year'
      default: return 'Last 30 days'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      {canViewAnalytics('all') && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {getMetricCard(
            'Total Users', 
            analyticsData.overview.totalUsers.toLocaleString(), 
            `+${analyticsData.overview.userGrowth}%`, 
            'up', 
            Users
          )}
          {getMetricCard(
            'Active Brands', 
            analyticsData.overview.activeBrands, 
            `+${analyticsData.overview.brandGrowth}%`, 
            'up', 
            Building
          )}
          {getMetricCard(
            'Total Revenue', 
            `$${analyticsData.overview.totalRevenue.toLocaleString()}`, 
            `+${analyticsData.overview.revenueGrowth}%`, 
            'up', 
            DollarSign
          )}
          {getMetricCard(
            'Conversion Rate', 
            `${analyticsData.overview.conversionRate}%`, 
            `+${analyticsData.overview.conversionGrowth}%`, 
            'up', 
            TrendingUp
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* User Analytics */}
        {canViewAnalytics('all') || canViewAnalytics('retail') && (
          <Card>
            <CardHeader>
              <CardTitle>User Analytics</CardTitle>
              <CardDescription>
                User engagement and activity metrics for {getTimeRangeLabel(timeRange)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Daily Active</span>
                    <span className="text-sm text-muted-foreground">
                      {analyticsData.userMetrics.dailyActiveUsers.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Weekly Active</span>
                    <span className="text-sm text-muted-foreground">
                      {analyticsData.userMetrics.weeklyActiveUsers.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Monthly Active</span>
                    <span className="text-sm text-muted-foreground">
                      {analyticsData.userMetrics.monthlyActiveUsers.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Retention Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {analyticsData.userMetrics.userRetention}%
                    </span>
                  </div>
                  <Progress value={analyticsData.userMetrics.userRetention} className="h-2" />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Avg Session Duration</span>
                    <div className="font-medium">{analyticsData.userMetrics.avgSessionDuration}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Bounce Rate</span>
                    <div className="font-medium">{analyticsData.userMetrics.bounceRate}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Brand Performance */}
        {(canViewAnalytics('all') || canViewAnalytics('brand')) && (
          <Card>
            <CardHeader>
              <CardTitle>Brand Performance</CardTitle>
              <CardDescription>
                Top performing brands and category breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-3">Top Performing Brands</h4>
                  <div className="space-y-3">
                    {analyticsData.brandMetrics.topPerformingBrands.map((brand, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                          <span className="text-sm font-medium">{brand.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">
                            ${brand.revenue.toLocaleString()}
                          </span>
                          <div className={`flex items-center ${brand.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {brand.growth > 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            <span className="text-xs">{Math.abs(brand.growth)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Category Performance</h4>
                  <div className="space-y-3">
                    {analyticsData.brandMetrics.categoryPerformance.map((category, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{category.category}</span>
                          <span className="text-sm text-muted-foreground">{category.share}%</span>
                        </div>
                        <Progress value={category.share} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Verification Analytics */}
      {canViewAnalytics('all') && (
        <Card>
          <CardHeader>
            <CardTitle>Verification Analytics</CardTitle>
            <CardDescription>
              User verification processing and approval metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {analyticsData.verificationMetrics.approvalRate}%
                  </div>
                  <div className="text-sm text-muted-foreground">Approval Rate</div>
                </div>
                <Progress value={analyticsData.verificationMetrics.approvalRate} className="h-3" />
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {analyticsData.verificationMetrics.avgProcessingTime}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Processing Time</div>
                </div>
                <div className="text-center">
                  <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                    {analyticsData.verificationMetrics.pendingVerifications} Pending
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Processed</span>
                  <span className="text-sm text-muted-foreground">
                    {analyticsData.verificationMetrics.totalVerifications}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Approved</span>
                  <span className="text-sm text-green-600">
                    {analyticsData.verificationMetrics.approvedVerifications}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rejected</span>
                  <span className="text-sm text-red-600">
                    {analyticsData.verificationMetrics.rejectedVerifications}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pending</span>
                  <span className="text-sm text-yellow-600">
                    {analyticsData.verificationMetrics.pendingVerifications}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role-based Access Message */}
      {!canViewAnalytics('all') && !canViewAnalytics('brand') && !canViewAnalytics('retail') && (
        <Card>
          <CardContent className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Analytics Access Required</h3>
            <p className="text-muted-foreground">
              You don't have permission to view analytics data. Contact your administrator for access.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
