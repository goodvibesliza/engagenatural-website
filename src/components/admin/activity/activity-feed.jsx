import { useState, useEffect } from 'react'
import { useRoleAccess } from '../../../hooks/use-role-access'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/input'
import { Badge } from '../../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Bell,
  User,
  Building,
  FileText,
  DollarSign,
  Shield,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  Calendar,
  Activity,
  Zap,
  Target,
  MessageSquare,
  Upload,
  Download,
  Edit,
  Trash2
} from 'lucide-react'

export default function ActivityFeed() {
  const { canAccess, role } = useRoleAccess()
  const [activities, setActivities] = useState([
    {
      id: '1',
      type: 'user_registration',
      title: 'New User Registration',
      description: 'Sarah Johnson registered as a new user',
      actor: {
        id: 'user_123',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        avatar: '/avatars/sarah.jpg',
        role: 'user'
      },
      target: {
        type: 'user',
        id: 'user_123',
        name: 'Sarah Johnson'
      },
      metadata: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ipAddress: '192.168.1.100',
        location: 'New York, NY'
      },
      timestamp: '2024-01-26T14:30:00Z',
      severity: 'info',
      category: 'user_management',
      status: 'completed'
    },
    {
      id: '2',
      type: 'content_upload',
      title: 'Content Upload',
      description: 'GreenLeaf Organics uploaded new lesson "Sustainable Living Basics"',
      actor: {
        id: 'brand_1',
        name: 'GreenLeaf Organics',
        email: 'admin@greenleaf.com',
        avatar: '/avatars/greenleaf.jpg',
        role: 'brand_admin'
      },
      target: {
        type: 'content',
        id: 'content_1',
        name: 'Sustainable Living Basics'
      },
      metadata: {
        fileSize: '45.2 MB',
        fileType: 'video/mp4',
        duration: '25 minutes',
        category: 'Environmental'
      },
      timestamp: '2024-01-26T13:15:00Z',
      severity: 'info',
      category: 'content_management',
      status: 'pending_approval'
    },
    {
      id: '3',
      type: 'verification_submitted',
      title: 'Verification Request',
      description: 'EcoTech Solutions submitted verification documents',
      actor: {
        id: 'brand_2',
        name: 'EcoTech Solutions',
        email: 'verify@ecotech.com',
        avatar: '/avatars/ecotech.jpg',
        role: 'brand_admin'
      },
      target: {
        type: 'verification',
        id: 'verify_456',
        name: 'Business License Verification'
      },
      metadata: {
        documentCount: 3,
        documentTypes: ['business_license', 'tax_id', 'insurance'],
        submissionMethod: 'web_upload'
      },
      timestamp: '2024-01-26T12:45:00Z',
      severity: 'warning',
      category: 'verification',
      status: 'pending_review'
    },
    {
      id: '4',
      type: 'payment_received',
      title: 'Payment Received',
      description: 'Monthly payment received from GreenLeaf Organics',
      actor: {
        id: 'system',
        name: 'Payment System',
        email: 'payments@engagenatural.com',
        avatar: '/avatars/system.jpg',
        role: 'system'
      },
      target: {
        type: 'payment',
        id: 'payment_789',
        name: 'Monthly Subscription - January 2024'
      },
      metadata: {
        amount: '$5,500.00',
        paymentMethod: 'Credit Card',
        transactionId: 'txn_abc123',
        brandId: 'brand_1'
      },
      timestamp: '2024-01-26T11:30:00Z',
      severity: 'success',
      category: 'financial',
      status: 'completed'
    },
    {
      id: '5',
      type: 'security_alert',
      title: 'Security Alert',
      description: 'Multiple failed login attempts detected',
      actor: {
        id: 'security_system',
        name: 'Security Monitor',
        email: 'security@engagenatural.com',
        avatar: '/avatars/security.jpg',
        role: 'system'
      },
      target: {
        type: 'security',
        id: 'alert_001',
        name: 'Failed Login Attempts'
      },
      metadata: {
        attemptCount: 5,
        ipAddress: '203.0.113.42',
        targetAccount: 'admin@greenleaf.com',
        timeWindow: '10 minutes'
      },
      timestamp: '2024-01-26T10:15:00Z',
      severity: 'critical',
      category: 'security',
      status: 'investigating'
    },
    {
      id: '6',
      type: 'brand_contract_signed',
      title: 'Contract Signed',
      description: 'Pure Beauty Co signed annual partnership contract',
      actor: {
        id: 'brand_3',
        name: 'Pure Beauty Co',
        email: 'contracts@purebeauty.com',
        avatar: '/avatars/purebeauty.jpg',
        role: 'brand_admin'
      },
      target: {
        type: 'contract',
        id: 'contract_456',
        name: 'Annual Partnership Agreement 2024'
      },
      metadata: {
        contractValue: '$60,000',
        contractType: 'yearly',
        startDate: '2024-02-01',
        endDate: '2025-01-31'
      },
      timestamp: '2024-01-26T09:45:00Z',
      severity: 'success',
      category: 'business',
      status: 'completed'
    },
    {
      id: '7',
      type: 'system_maintenance',
      title: 'System Maintenance',
      description: 'Scheduled database optimization completed',
      actor: {
        id: 'system',
        name: 'System Administrator',
        email: 'admin@engagenatural.com',
        avatar: '/avatars/admin.jpg',
        role: 'super_admin'
      },
      target: {
        type: 'system',
        id: 'maintenance_001',
        name: 'Database Optimization'
      },
      metadata: {
        duration: '45 minutes',
        affectedServices: ['content_delivery', 'user_analytics'],
        performanceImprovement: '15%'
      },
      timestamp: '2024-01-26T08:00:00Z',
      severity: 'info',
      category: 'system',
      status: 'completed'
    },
    {
      id: '8',
      type: 'content_approved',
      title: 'Content Approved',
      description: 'Lesson "Eco-Tech Innovation Workshop" approved for publication',
      actor: {
        id: 'admin_1',
        name: 'Admin User',
        email: 'admin@engagenatural.com',
        avatar: '/avatars/admin.jpg',
        role: 'super_admin'
      },
      target: {
        type: 'content',
        id: 'content_4',
        name: 'Eco-Tech Innovation Workshop'
      },
      metadata: {
        reviewTime: '2 hours',
        approvalNotes: 'High quality content, approved for immediate publication',
        brandId: 'brand_2'
      },
      timestamp: '2024-01-26T07:30:00Z',
      severity: 'success',
      category: 'content_management',
      status: 'completed'
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterTimeRange, setFilterTimeRange] = useState('24h')
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  // Calculate summary metrics
  const summaryMetrics = {
    totalActivities: activities.length,
    criticalAlerts: activities.filter(a => a.severity === 'critical').length,
    pendingActions: activities.filter(a => a.status === 'pending_review' || a.status === 'pending_approval').length,
    recentUsers: activities.filter(a => a.type === 'user_registration' && isWithinTimeRange(a.timestamp, '24h')).length,
    revenueEvents: activities.filter(a => a.category === 'financial').length,
    securityEvents: activities.filter(a => a.category === 'security').length
  }

  function isWithinTimeRange(timestamp, range) {
    const now = new Date()
    const activityTime = new Date(timestamp)
    const diffHours = (now - activityTime) / (1000 * 60 * 60)
    
    switch (range) {
      case '1h': return diffHours <= 1
      case '24h': return diffHours <= 24
      case '7d': return diffHours <= 168
      case '30d': return diffHours <= 720
      default: return true
    }
  }

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.actor.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || activity.category === filterCategory
    const matchesSeverity = filterSeverity === 'all' || activity.severity === filterSeverity
    const matchesTimeRange = filterTimeRange === 'all' || isWithinTimeRange(activity.timestamp, filterTimeRange)
    
    return matchesSearch && matchesCategory && matchesSeverity && matchesTimeRange
  })

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 border-red-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Critical
        </Badge>
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Warning
        </Badge>
      case 'success':
        return <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Success
        </Badge>
      case 'info':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <Activity className="w-3 h-3 mr-1" />
          Info
        </Badge>
      default:
        return <Badge variant="secondary">{severity}</Badge>
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      case 'pending_review':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending Review
        </Badge>
      case 'pending_approval':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending Approval
        </Badge>
      case 'investigating':
        return <Badge className="bg-red-100 text-red-800 border-red-200">
          <Search className="w-3 h-3 mr-1" />
          Investigating
        </Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registration':
        return <User className="h-4 w-4" />
      case 'content_upload':
        return <Upload className="h-4 w-4" />
      case 'verification_submitted':
        return <Shield className="h-4 w-4" />
      case 'payment_received':
        return <DollarSign className="h-4 w-4" />
      case 'security_alert':
        return <AlertTriangle className="h-4 w-4" />
      case 'brand_contract_signed':
        return <Building className="h-4 w-4" />
      case 'system_maintenance':
        return <Settings className="h-4 w-4" />
      case 'content_approved':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const handleActivityAction = (action, activityId) => {
    console.log(`${action} activity:`, activityId)
    // Implement activity actions here
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Feed</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of system activities, user actions, and business events
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Activity Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.totalActivities}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summaryMetrics.criticalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summaryMetrics.pendingActions}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review/approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.recentUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Events</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summaryMetrics.revenueEvents}</div>
            <p className="text-xs text-muted-foreground">
              Payment activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.securityEvents}</div>
            <p className="text-xs text-muted-foreground">
              Security-related activities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>
            Monitor all system activities, user actions, and business events in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities by title, description, or actor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="user_management">User Management</SelectItem>
                  <SelectItem value="content_management">Content</SelectItem>
                  <SelectItem value="verification">Verification</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterTimeRange} onValueChange={setFilterTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Time Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-900">{activity.title}</h3>
                      {getSeverityBadge(activity.severity)}
                      {getStatusBadge(activity.status)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => {
                            setSelectedActivity(activity)
                            setDetailsDialogOpen(true)
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {canAccess(['manage_all_users', 'approve_verifications']) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleActivityAction('investigate', activity.id)}>
                                <Search className="mr-2 h-4 w-4" />
                                Investigate
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleActivityAction('resolve', activity.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark Resolved
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={activity.actor.avatar} alt={activity.actor.name} />
                        <AvatarFallback>{activity.actor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{activity.actor.name}</span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {activity.category.replace('_', ' ').toUpperCase()}
                    </div>
                    
                    {activity.target && (
                      <div className="text-xs text-muted-foreground">
                        → {activity.target.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredActivities.length === 0 && (
            <div className="text-center py-8">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No activities found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedActivity && getActivityIcon(selectedActivity.type)}
              {selectedActivity?.title}
            </DialogTitle>
            <DialogDescription>
              Detailed information about this activity
            </DialogDescription>
          </DialogHeader>
          
          {selectedActivity && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-2">Activity Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Type:</span> {selectedActivity.type.replace('_', ' ')}
                    </div>
                    <div>
                      <span className="font-medium">Category:</span> {selectedActivity.category.replace('_', ' ')}
                    </div>
                    <div>
                      <span className="font-medium">Timestamp:</span> {new Date(selectedActivity.timestamp).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Severity:</span> {getSeverityBadge(selectedActivity.severity)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Status:</span> {getStatusBadge(selectedActivity.status)}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Actor Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={selectedActivity.actor.avatar} alt={selectedActivity.actor.name} />
                        <AvatarFallback>{selectedActivity.actor.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{selectedActivity.actor.name}</div>
                        <div className="text-muted-foreground">{selectedActivity.actor.email}</div>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Role:</span> {selectedActivity.actor.role.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedActivity.description}</p>
              </div>

              {selectedActivity.target && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Target</h4>
                  <div className="text-sm">
                    <div><span className="font-medium">Type:</span> {selectedActivity.target.type}</div>
                    <div><span className="font-medium">Name:</span> {selectedActivity.target.name}</div>
                    <div><span className="font-medium">ID:</span> {selectedActivity.target.id}</div>
                  </div>
                </div>
              )}

              {selectedActivity.metadata && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Additional Details</h4>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedActivity.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

