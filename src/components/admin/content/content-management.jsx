import { useState, useEffect } from 'react'
import { useRoleAccess } from '../../../hooks/use-role-access'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/input'
import { Badge } from '../../ui/badge'
import { Progress } from '../../ui/progress'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../ui/tabs'
import { Label } from '../../ui/label'
import { Textarea } from '../../ui/textarea'
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  Upload,
  FileText,
  Video,
  Image,
  Download,
  Calendar,
  User,
  Building,
  CheckCircle,
  Clock,
  XCircle,
  Play,
  BookOpen,
  Target,
  TrendingUp,
  DollarSign,
  Users,
  Star,
  BarChart3
} from 'lucide-react'

export default function ContentManagement() {
  const { canAccess } = useRoleAccess()
  const [content, setContent] = useState([
    {
      id: '1',
      title: 'Sustainable Living Basics',
      type: 'lesson',
      brandId: '1',
      brandName: 'GreenLeaf Organics',
      description: 'Introduction to sustainable living practices and eco-friendly choices',
      status: 'published',
      createdDate: '2024-01-15',
      publishedDate: '2024-01-20',
      lastModified: '2024-01-18',
      duration: 25, // minutes
      fileSize: 45.2, // MB
      fileType: 'video/mp4',
      thumbnailUrl: '/content/thumbnails/sustainable-living.jpg',
      contentUrl: '/content/videos/sustainable-living-basics.mp4',
      
      // Engagement metrics
      metrics: {
        totalViews: 1247,
        completions: 973,
        completionRate: 78.1,
        avgRating: 4.6,
        totalRevenue: 3500, // Revenue attributed to this content
        userEngagement: 85.3
      },
      
      // Pricing info
      pricing: {
        isAdditional: true, // Beyond base plan
        priceCharged: 1000, // Monthly plan additional content price
        billingCycle: 'monthly'
      },
      
      tags: ['sustainability', 'beginner', 'lifestyle'],
      category: 'Environmental',
      targetAudience: 'General Public'
    },
    {
      id: '2',
      title: 'Zero Waste Challenge',
      type: 'challenge',
      brandId: '1',
      brandName: 'GreenLeaf Organics',
      description: '30-day challenge to reduce household waste to zero',
      status: 'published',
      createdDate: '2024-01-10',
      publishedDate: '2024-01-15',
      lastModified: '2024-01-12',
      duration: 30, // days
      fileSize: 12.8,
      fileType: 'application/pdf',
      thumbnailUrl: '/content/thumbnails/zero-waste.jpg',
      contentUrl: '/content/challenges/zero-waste-30day.pdf',
      
      metrics: {
        totalViews: 892,
        completions: 234,
        completionRate: 26.2,
        avgRating: 4.8,
        totalRevenue: 7020, // 3x sales multiplier effect
        userEngagement: 92.1
      },
      
      pricing: {
        isAdditional: true,
        priceCharged: 1000,
        billingCycle: 'monthly'
      },
      
      tags: ['challenge', 'waste-reduction', 'advanced'],
      category: 'Environmental',
      targetAudience: 'Eco Enthusiasts'
    },
    {
      id: '3',
      title: 'Organic Nutrition Guide',
      type: 'lesson',
      brandId: '1',
      brandName: 'GreenLeaf Organics',
      description: 'Complete guide to organic nutrition and healthy eating',
      status: 'draft',
      createdDate: '2024-01-25',
      publishedDate: null,
      lastModified: '2024-01-26',
      duration: 35,
      fileSize: 67.4,
      fileType: 'video/mp4',
      thumbnailUrl: '/content/thumbnails/nutrition-guide.jpg',
      contentUrl: '/content/videos/organic-nutrition-guide.mp4',
      
      metrics: {
        totalViews: 0,
        completions: 0,
        completionRate: 0,
        avgRating: 0,
        totalRevenue: 0,
        userEngagement: 0
      },
      
      pricing: {
        isAdditional: true,
        priceCharged: 1000,
        billingCycle: 'monthly'
      },
      
      tags: ['nutrition', 'health', 'organic'],
      category: 'Health & Wellness',
      targetAudience: 'Health Conscious'
    },
    {
      id: '4',
      title: 'Eco-Tech Innovation Workshop',
      type: 'lesson',
      brandId: '2',
      brandName: 'EcoTech Solutions',
      description: 'Interactive workshop on sustainable technology solutions',
      status: 'pending_approval',
      createdDate: '2024-01-20',
      publishedDate: null,
      lastModified: '2024-01-22',
      duration: 45,
      fileSize: 89.1,
      fileType: 'video/mp4',
      thumbnailUrl: '/content/thumbnails/ecotech-workshop.jpg',
      contentUrl: '/content/videos/ecotech-innovation.mp4',
      
      metrics: {
        totalViews: 0,
        completions: 0,
        completionRate: 0,
        avgRating: 0,
        totalRevenue: 0,
        userEngagement: 0
      },
      
      pricing: {
        isAdditional: false, // Part of base plan
        priceCharged: 0,
        billingCycle: 'yearly'
      },
      
      tags: ['technology', 'innovation', 'workshop'],
      category: 'Technology',
      targetAudience: 'Tech Professionals'
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterBrand, setFilterBrand] = useState('all')
  const [selectedContent, setSelectedContent] = useState(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  // Get unique brands for filtering
  const brands = [...new Set(content.map(item => ({ id: item.brandId, name: item.brandName })))]

  // Calculate summary metrics
  const summaryMetrics = {
    totalContent: content.length,
    publishedContent: content.filter(item => item.status === 'published').length,
    totalViews: content.reduce((sum, item) => sum + item.metrics.totalViews, 0),
    totalRevenue: content.reduce((sum, item) => sum + item.metrics.totalRevenue, 0),
    avgCompletionRate: content.filter(item => item.metrics.totalViews > 0)
                             .reduce((sum, item, _, arr) => sum + item.metrics.completionRate / arr.length, 0),
    additionalContentRevenue: content.filter(item => item.pricing.isAdditional && item.status === 'published')
                                    .reduce((sum, item) => sum + item.pricing.priceCharged, 0)
  }

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === 'all' || item.type === filterType
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus
    const matchesBrand = filterBrand === 'all' || item.brandId === filterBrand
    
    return matchesSearch && matchesType && matchesStatus && matchesBrand
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Published
        </Badge>
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">
          <Edit className="w-3 h-3 mr-1" />
          Draft
        </Badge>
      case 'pending_approval':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending Approval
        </Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'lesson':
        return <BookOpen className="h-4 w-4" />
      case 'challenge':
        return <Target className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const formatFileSize = (sizeInMB) => {
    if (sizeInMB < 1) {
      return `${(sizeInMB * 1024).toFixed(0)} KB`
    }
    return `${sizeInMB.toFixed(1)} MB`
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleContentAction = (action, contentId) => {
    console.log(`${action} content:`, contentId)
    // Implement content actions here
  }

  const handleApproveContent = (contentId) => {
    setContent(prev => prev.map(item => 
      item.id === contentId 
        ? { ...item, status: 'published', publishedDate: new Date().toISOString().split('T')[0] }
        : item
    ))
  }

  const handleRejectContent = (contentId) => {
    setContent(prev => prev.map(item => 
      item.id === contentId 
        ? { ...item, status: 'rejected' }
        : item
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
          <p className="text-muted-foreground">
            Manage lessons, challenges, and educational content for all brands
          </p>
        </div>
        {canAccess(['manage_content', 'manage_brand_content']) && (
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Content
          </Button>
        )}
      </div>

      {/* Content Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.totalContent}</div>
            <p className="text-xs text-muted-foreground">
              {summaryMetrics.publishedContent} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all content
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Total attributed revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.avgCompletionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Average completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Additional Revenue</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.additionalContentRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From additional content
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brands</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands.length}</div>
            <p className="text-xs text-muted-foreground">
              With content
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Table */}
      <Card>
        <CardHeader>
          <CardTitle>Content Library</CardTitle>
          <CardDescription>
            Manage all lessons and challenges across your brand partnerships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content by title, description, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="lesson">Lessons</SelectItem>
                  <SelectItem value="challenge">Challenges</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterBrand} onValueChange={setFilterBrand}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands.map(brand => (
                    <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Revenue Impact</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContent.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          {getTypeIcon(item.type)}
                        </div>
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.type} • {item.duration} {item.type === 'challenge' ? 'days' : 'min'} • {formatFileSize(item.fileSize)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.brandName}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.pricing.isAdditional ? 'Additional Content' : 'Base Plan'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(item.status)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {item.metrics.totalViews.toLocaleString()} views
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.metrics.completionRate.toFixed(1)}% completion
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-green-600">
                          {formatCurrency(item.metrics.totalRevenue)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.pricing.isAdditional ? `+${formatCurrency(item.pricing.priceCharged)}` : 'Base plan'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(item.lastModified)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
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
                            setSelectedContent(item)
                            setDetailsDialogOpen(true)
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(item.contentUrl, '_blank')}>
                            <Play className="mr-2 h-4 w-4" />
                            Preview Content
                          </DropdownMenuItem>
                          {canAccess(['manage_content', 'approve_verifications']) && (
                            <>
                              <DropdownMenuSeparator />
                              {item.status === 'pending_approval' && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => handleApproveContent(item.id)}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleRejectContent(item.id)}
                                    className="text-red-600"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem onClick={() => handleContentAction('edit', item.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Content
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleContentAction('download', item.id)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleContentAction('delete', item.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredContent.length === 0 && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No content found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedContent && getTypeIcon(selectedContent.type)}
              {selectedContent?.title}
            </DialogTitle>
            <DialogDescription>
              Detailed content information and performance metrics
            </DialogDescription>
          </DialogHeader>
          
          {selectedContent && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Content Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Title</Label>
                        <p className="text-sm text-muted-foreground">{selectedContent.title}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Description</Label>
                        <p className="text-sm text-muted-foreground">{selectedContent.description}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Brand</Label>
                        <p className="text-sm text-muted-foreground">{selectedContent.brandName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Category</Label>
                        <p className="text-sm text-muted-foreground">{selectedContent.category}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Target Audience</Label>
                        <p className="text-sm text-muted-foreground">{selectedContent.targetAudience}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Tags</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedContent.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Technical Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Type</Label>
                        <p className="text-sm text-muted-foreground capitalize">{selectedContent.type}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Duration</Label>
                        <p className="text-sm text-muted-foreground">
                          {selectedContent.duration} {selectedContent.type === 'challenge' ? 'days' : 'minutes'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">File Size</Label>
                        <p className="text-sm text-muted-foreground">{formatFileSize(selectedContent.fileSize)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">File Type</Label>
                        <p className="text-sm text-muted-foreground">{selectedContent.fileType}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="mt-1">
                          {getStatusBadge(selectedContent.status)}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Created</Label>
                        <p className="text-sm text-muted-foreground">{formatDate(selectedContent.createdDate)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Published</Label>
                        <p className="text-sm text-muted-foreground">{formatDate(selectedContent.publishedDate)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="metrics" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedContent.metrics.totalViews.toLocaleString()}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completions</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedContent.metrics.completions.toLocaleString()}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedContent.metrics.completionRate.toFixed(1)}%</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                      <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedContent.metrics.avgRating.toFixed(1)}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {formatCurrency(selectedContent.metrics.totalRevenue)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total revenue attributed to this content piece
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="pricing" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Content Type</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedContent.pricing.isAdditional ? 'Additional Content (Beyond Base Plan)' : 'Base Plan Content'}
                      </p>
                    </div>
                    
                    {selectedContent.pricing.isAdditional && (
                      <>
                        <div>
                          <Label className="text-sm font-medium">Price Charged</Label>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(selectedContent.pricing.priceCharged)} per {selectedContent.pricing.billingCycle}
                          </p>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium">Billing Cycle</Label>
                          <p className="text-sm text-muted-foreground capitalize">
                            {selectedContent.pricing.billingCycle}
                          </p>
                        </div>
                      </>
                    )}
                    
                    <div>
                      <Label className="text-sm font-medium">Revenue Performance</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Direct Revenue:</span>
                          <span className="text-sm font-medium">{formatCurrency(selectedContent.metrics.totalRevenue)}</span>
                        </div>
                        {selectedContent.pricing.isAdditional && (
                          <div className="flex justify-between">
                            <span className="text-sm">Monthly Charge:</span>
                            <span className="text-sm font-medium">{formatCurrency(selectedContent.pricing.priceCharged)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Visibility</Label>
                      <Select defaultValue="published">
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Access Level</Label>
                      <Select defaultValue="brand_users">
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all_users">All Users</SelectItem>
                          <SelectItem value="brand_users">Brand Users Only</SelectItem>
                          <SelectItem value="premium_users">Premium Users</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="featured" className="rounded" />
                      <Label htmlFor="featured" className="text-sm font-medium">
                        Featured Content
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="notifications" className="rounded" />
                      <Label htmlFor="notifications" className="text-sm font-medium">
                        Send Notifications on Publish
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Content Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload New Content</DialogTitle>
            <DialogDescription>
              Add a new lesson or challenge to the content library
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="content-title">Title</Label>
                <Input id="content-title" placeholder="Enter content title" />
              </div>
              <div>
                <Label htmlFor="content-type">Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lesson">Lesson</SelectItem>
                    <SelectItem value="challenge">Challenge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="content-description">Description</Label>
              <Textarea 
                id="content-description" 
                placeholder="Describe the content and learning objectives"
                rows={3}
              />
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="content-brand">Brand</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map(brand => (
                      <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="content-category">Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="environmental">Environmental</SelectItem>
                    <SelectItem value="health">Health & Wellness</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="content-file">Content File</Label>
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  <Button variant="outline">
                    Choose File
                  </Button>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Upload video, PDF, or other content files
                </p>
              </div>
            </div>
            
            <div>
              <Label htmlFor="content-tags">Tags</Label>
              <Input 
                id="content-tags" 
                placeholder="Enter tags separated by commas"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setUploadDialogOpen(false)}>
              Upload Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

