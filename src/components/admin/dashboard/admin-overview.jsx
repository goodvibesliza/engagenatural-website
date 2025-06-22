import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/auth-context'
import { useRoleAccess } from '../../../hooks/use-role-access'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { Progress } from '../../ui/progress'
import { 
  Users, 
  UserCheck, 
  Building, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  ShoppingCart,
  Activity
} from 'lucide-react'

export default function AdminOverview() {
  const { userProfile, role } = useAuth()
  const { canAccess, canViewAnalytics } = useRoleAccess()
  const [metrics, setMetrics] = useState({
    totalUsers: 1247,
    activeUsers: 892,
    pendingVerifications: 23,
    totalBrands: 45,
    activeBrands: 38,
    monthlyRevenue: 125000,
    conversionRate: 3.2,
    avgOrderValue: 89.50
  })

  const [recentActivity, setRecentActivity] = useState([
    { id: 1, type: 'verification', message: 'New verification request from Sarah Johnson', time: '2 minutes ago', status: 'pending' },
    { id: 2, type: 'brand', message: 'GreenLeaf Co. partnership approved', time: '15 minutes ago', status: 'approved' },
    { id: 3, type: 'user', message: 'Mike Chen completed profile verification', time: '1 hour ago', status: 'completed' },
    { id: 4, type: 'system', message: 'Monthly analytics report generated', time: '2 hours ago', status: 'info' }
  ])

  const getStatCard = (title, value, change, icon, trend = 'up') => {
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
            <span className="ml-1">from last month</span>
          </p>
        </CardContent>
      </Card>
    )
  }

  const getQuickActions = () => {
    const actions = []
    
    if (canAccess(['manage_all_users', 'manage_brand_users', 'manage_retail_users'])) {
      actions.push({
        title: 'Add New User',
        description: 'Create a new user account',
        icon: Plus,
        action: () => console.log('Add user'),
        variant: 'default'
      })
    }
    
    if (canAccess(['approve_verifications'])) {
      actions.push({
        title: 'Review Verifications',
        description: `${metrics.pendingVerifications} pending`,
        icon: UserCheck,
        action: () => console.log('Review verifications'),
        variant: 'secondary'
      })
    }
    
    if (canAccess(['manage_all_brands', 'manage_brand_content'])) {
      actions.push({
        title: 'Manage Brands',
        description: 'View brand partnerships',
        icon: Building,
        action: () => console.log('Manage brands'),
        variant: 'outline'
      })
    }
    
    if (canViewAnalytics('all') || canViewAnalytics('brand') || canViewAnalytics('retail')) {
      actions.push({
        title: 'View Analytics',
        description: 'Detailed insights',
        icon: TrendingUp,
        action: () => console.log('View analytics'),
        variant: 'outline'
      })
    }
    
    return actions
  }

  const getActivityIcon = (type, status) => {
    switch (type) {
      case 'verification':
        return status === 'pending' ? Clock : status === 'approved' ? CheckCircle : XCircle
      case 'brand':
        return Building
      case 'user':
        return Users
      case 'system':
        return Activity
      default:
        return Activity
    }
  }

  const getActivityColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-500'
      case 'approved':
      case 'completed':
        return 'text-green-500'
      case 'rejected':
        return 'text-red-500'
      default:
        return 'text-blue-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {userProfile?.firstName || 'Admin'}! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            {role === 'super_admin' ? 'Super Admin' : 
             role === 'brand_admin' ? 'Brand Admin' : 
             role === 'retail_admin' ? 'Retail Admin' : 'User'}
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {canAccess(['manage_all_users', 'manage_brand_users', 'manage_retail_users']) && 
          getStatCard('Total Users', metrics.totalUsers.toLocaleString(), '+12%', Users)
        }
        
        {canAccess(['manage_all_users', 'manage_brand_users', 'manage_retail_users']) && 
          getStatCard('Active Users', metrics.activeUsers.toLocaleString(), '+8%', Activity)
        }
        
        {canAccess(['approve_verifications']) && 
          getStatCard('Pending Verifications', metrics.pendingVerifications, '+3', UserCheck, 'down')
        }
        
        {canAccess(['manage_all_brands', 'manage_brand_content']) && 
          getStatCard('Active Brands', metrics.activeBrands, '+5%', Building)
        }
        
        {canViewAnalytics('all') && 
          getStatCard('Monthly Revenue', `$${metrics.monthlyRevenue.toLocaleString()}`, '+15%', DollarSign)
        }
        
        {canViewAnalytics('all') && 
          getStatCard('Conversion Rate', `${metrics.conversionRate}%`, '+0.3%', TrendingUp)
        }
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {getQuickActions().map((action, index) => {
              const IconComponent = action.icon
              return (
                <Button
                  key={index}
                  variant={action.variant}
                  className="w-full justify-start h-auto p-4"
                  onClick={action.action}
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-sm text-muted-foreground">{action.description}</div>
                    </div>
                  </div>
                </Button>
              )
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const IconComponent = getActivityIcon(activity.type, activity.status)
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <IconComponent className={`h-5 w-5 mt-0.5 ${getActivityColor(activity.status)}`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.message}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      {canViewAnalytics('all') && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              Key performance indicators for this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">User Growth</span>
                  <span className="text-sm text-muted-foreground">85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Brand Partnerships</span>
                  <span className="text-sm text-muted-foreground">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verification Rate</span>
                  <span className="text-sm text-muted-foreground">78%</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
