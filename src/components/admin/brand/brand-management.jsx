import { useState, useEffect } from 'react'
import { useRoleAccess } from '../../../hooks/use-role-access'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
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
  Building,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  DollarSign,
  Calendar,
  Globe,
  Mail,
  Phone,
  Clock,
  Target,
  BarChart3,
  FileText,
  CreditCard,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'

export default function BrandManagement() {
  const { canAccess } = useRoleAccess()
  const [brands, setBrands] = useState([
    {
      id: '1',
      name: 'GreenLeaf Organics',
      logo: '/api/brands/greenleaf-logo.png',
      contactEmail: 'partnerships@greenleaf.com',
      contactPhone: '+1 (555) 123-4567',
      website: 'https://greenleaf.com',
      description: 'Premium organic food products sourced from sustainable farms',
      
      // Contract & Pipeline Info
      pipelineStatus: 'paid',
      contractType: 'monthly', // 'monthly' or 'yearly'
      contractStartDate: '2023-06-15',
      contractEndDate: '2024-06-15',
      daysInCurrentStage: 180,
      
      // Pricing & Revenue
      basePlan: {
        type: 'monthly',
        price: 2500,
        includedLessons: 1
      },
      additionalLessons: 3,
      additionalLessonPrice: 1000,
      totalMonthlyValue: 5500,
      totalYearlyValue: 66000,
      
      // Content & Usage
      contentStorage: {
        used: 2.3, // GB
        limit: 10, // GB
        lessons: 4,
        challenges: 2
      },
      
      // Performance Metrics
      metrics: {
        totalUsers: 1247,
        activeUsers: 892,
        completionRate: 78.5,
        avgROI: 3.2, // 3.2x sales increase
        monthlyRevenue: 45000,
        userGrowth: 15.3
      }
    },
    {
      id: '2',
      name: 'EcoTech Solutions',
      logo: '/api/brands/ecotech-logo.png',
      contactEmail: 'hello@ecotech.com',
      contactPhone: '+1 (555 ) 987-6543',
      website: 'https://ecotech.com',
      description: 'Sustainable technology solutions for modern living',
      
      pipelineStatus: 'sales_funnel',
      contractType: 'yearly',
      contractStartDate: null,
      contractEndDate: null,
      daysInCurrentStage: 23,
      
      basePlan: {
        type: 'yearly',
        price: 4000,
        includedLessons: 1
      },
      additionalLessons: 2,
      additionalLessonPrice: 500,
      totalMonthlyValue: 0,
      totalYearlyValue: 5000,
      
      contentStorage: {
        used: 0,
        limit: 0,
        lessons: 0,
        challenges: 0
      },
      
      metrics: {
        totalUsers: 0,
        activeUsers: 0,
        completionRate: 0,
        avgROI: 0,
        monthlyRevenue: 0,
        userGrowth: 0
      }
    },
    {
      id: '3',
      name: 'Pure Beauty Co',
      logo: '/api/brands/purebeauty-logo.png',
      contactEmail: 'partnerships@purebeauty.com',
      contactPhone: '+1 (555 ) 456-7890',
      website: 'https://purebeauty.com',
      description: 'Natural beauty products with zero harmful chemicals',
      
      pipelineStatus: 'negotiations',
      contractType: 'monthly',
      contractStartDate: null,
      contractEndDate: null,
      daysInCurrentStage: 45,
      
      basePlan: {
        type: 'monthly',
        price: 2500,
        includedLessons: 1
      },
      additionalLessons: 1,
      additionalLessonPrice: 1000,
      totalMonthlyValue: 0,
      totalYearlyValue: 0,
      
      contentStorage: {
        used: 0,
        limit: 0,
        lessons: 0,
        challenges: 0
      },
      
      metrics: {
        totalUsers: 0,
        activeUsers: 0,
        completionRate: 0,
        avgROI: 0,
        monthlyRevenue: 0,
        userGrowth: 0
      }
    }
  ] )

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPlan, setFilterPlan] = useState('all')
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  // Calculate summary metrics
  const summaryMetrics = {
    totalBrands: brands.length,
    paidBrands: brands.filter(b => b.pipelineStatus === 'paid').length,
    totalMRR: brands.filter(b => b.pipelineStatus === 'paid' && b.contractType === 'monthly')
                   .reduce((sum, b) => sum + b.totalMonthlyValue, 0),
    totalARR: brands.filter(b => b.pipelineStatus === 'paid')
                   .reduce((sum, b) => sum + (b.contractType === 'yearly' ? b.totalYearlyValue : b.totalMonthlyValue * 12), 0),
    pipelineValue: brands.filter(b => b.pipelineStatus !== 'paid')
                         .reduce((sum, b) => sum + (b.contractType === 'yearly' ? b.totalYearlyValue : b.totalMonthlyValue * 12), 0)
  }

  const filteredBrands = brands.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         brand.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || brand.pipelineStatus === filterStatus
    const matchesPlan = filterPlan === 'all' || brand.contractType === filterPlan
    
    return matchesSearch && matchesStatus && matchesPlan
  })

  const getPipelineStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Paid
        </Badge>
      case 'sales_funnel':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <Target className="w-3 h-3 mr-1" />
          Sales Funnel
        </Badge>
      case 'negotiations':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Negotiations
        </Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPlanBadge = (contractType) => {
    return contractType === 'yearly' ? (
      <Badge className="bg-purple-100 text-purple-800 border-purple-200">
        <Calendar className="w-3 h-3 mr-1" />
        Yearly
      </Badge>
    ) : (
      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
        <Calendar className="w-3 h-3 mr-1" />
        Monthly
      </Badge>
    )
  }

  const calculateRevenue = (brand) => {
    if (brand.pipelineStatus !== 'paid') return 0
    
    const basePrice = brand.basePlan.price
    const additionalCost = brand.additionalLessons * brand.additionalLessonPrice
    
    return basePrice + additionalCost
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

  const handleBrandAction = (action, brandId) => {
    console.log(`${action} brand:`, brandId)
    // Implement brand actions here
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brand Management</h1>
          <p className="text-muted-foreground">
            Manage brand partnerships, pricing, and revenue pipeline
          </p>
        </div>
        {canAccess(['manage_all_brands']) && (
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Brand
          </Button>
        )}
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryMetrics.totalBrands}</div>
            <p className="text-xs text-muted-foreground">
              {summaryMetrics.paidBrands} paying customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalMRR)}</div>
            <p className="text-xs text-muted-foreground">
              MRR from monthly plans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalARR)}</div>
            <p className="text-xs text-muted-foreground">
              Total ARR from all plans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.pipelineValue)}</div>
            <p className="text-xs text-muted-foreground">
              Potential annual revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryMetrics.totalBrands > 0 ? Math.round((summaryMetrics.paidBrands / summaryMetrics.totalBrands) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Pipeline to paid conversion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Brands Table */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Pipeline</CardTitle>
          <CardDescription>
            Track brand partnerships through negotiations, sales funnel, and paid contracts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search brands by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Pipeline Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="negotiations">Negotiations</SelectItem>
                  <SelectItem value="sales_funnel">Sales Funnel</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPlan} onValueChange={setFilterPlan}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Plan Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Pipeline Status</TableHead>
                  <TableHead>Plan Type</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Content Usage</TableHead>
                  <TableHead>Days in Stage</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Building className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">{brand.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {brand.contentStorage.lessons + brand.contentStorage.challenges} content items
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPipelineStatusBadge(brand.pipelineStatus)}
                    </TableCell>
                    <TableCell>
                      {getPlanBadge(brand.contractType)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {brand.pipelineStatus === 'paid' ? (
                          <>
                            <div>{formatCurrency(calculateRevenue(brand))}</div>
                            <div className="text-sm text-muted-foreground">
                              {brand.contractType === 'yearly' ? 'per year' : 'per month'}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Potential: {formatCurrency(brand.basePlan.price + (brand.additionalLessons * brand.additionalLessonPrice))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {brand.contentStorage.used}GB / {brand.contentStorage.limit}GB
                        </div>
                        <Progress 
                          value={brand.contentStorage.limit > 0 ? (brand.contentStorage.used / brand.contentStorage.limit) * 100 : 0} 
                          className="h-1" 
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                        {brand.daysInCurrentStage} days
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
                            setSelectedBrand(brand)
                            setEditDialogOpen(true)
                          }}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(brand.website, '_blank')}>
                            <Globe className="mr-2 h-4 w-4" />
                            Visit Website
                          </DropdownMenuItem>
                          {canAccess(['manage_all_brands']) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleBrandAction('edit', brand.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Contract
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleBrandAction('contact', brand.id)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Contact Brand
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleBrandAction('delete', brand.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove Brand
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

          {filteredBrands.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No brands found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Brand Details Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Brand Details: {selectedBrand?.name}</DialogTitle>
            <DialogDescription>
              Complete brand information, contract details, and performance metrics
            </DialogDescription>
          </DialogHeader>
          
          {selectedBrand && (
            <div className="grid gap-6 py-4">
              {/* Contract Information */}
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">Contract Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Pipeline Status</Label>
                    <div className="mt-1">
                      {getPipelineStatusBadge(selectedBrand.pipelineStatus)}
                    </div>
                  </div>
                  <div>
                    <Label>Plan Type</Label>
                    <div className="mt-1">
                      {getPlanBadge(selectedBrand.contractType)}
                    </div>
                  </div>
                  <div>
                    <Label>Contract Start</Label>
                    <div className="mt-1 text-sm">{formatDate(selectedBrand.contractStartDate)}</div>
                  </div>
                  <div>
                    <Label>Contract End</Label>
                    <div className="mt-1 text-sm">{formatDate(selectedBrand.contractEndDate)}</div>
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">Pricing & Revenue</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Base Plan</Label>
                    <div className="mt-1 text-sm">
                      {formatCurrency(selectedBrand.basePlan.price)} / {selectedBrand.contractType}
                      <br />
                      <span className="text-muted-foreground">
                        Includes {selectedBrand.basePlan.includedLessons} lesson/challenge
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label>Additional Content</Label>
                    <div className="mt-1 text-sm">
                      {selectedBrand.additionalLessons} × {formatCurrency(selectedBrand.additionalLessonPrice)}
                      <br />
                      <span className="text-muted-foreground">
                        = {formatCurrency(selectedBrand.additionalLessons * selectedBrand.additionalLessonPrice)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label>Total Revenue</Label>
                    <div className="mt-1 text-lg font-semibold text-green-600">
                      {selectedBrand.pipelineStatus === 'paid' ? 
                        formatCurrency(calculateRevenue(selectedBrand)) : 
                        `Potential: ${formatCurrency(selectedBrand.basePlan.price + (selectedBrand.additionalLessons * selectedBrand.additionalLessonPrice))}`
                      }
                    </div>
                  </div>
                  <div>
                    <Label>Annual Value</Label>
                    <div className="mt-1 text-lg font-semibold">
                      {selectedBrand.contractType === 'yearly' ? 
                        formatCurrency(calculateRevenue(selectedBrand)) :
                        formatCurrency(calculateRevenue(selectedBrand) * 12)
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Usage */}
              <div className="grid gap-4">
                <h3 className="text-lg font-semibold">Content & Usage</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Storage Used</Label>
                    <div className="mt-1">
                      <div className="text-sm">{selectedBrand.contentStorage.used}GB / {selectedBrand.contentStorage.limit}GB</div>
                      <Progress 
                        value={selectedBrand.contentStorage.limit > 0 ? (selectedBrand.contentStorage.used / selectedBrand.contentStorage.limit) * 100 : 0} 
                        className="h-2 mt-1" 
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Lessons</Label>
                    <div className="mt-1 text-2xl font-bold">{selectedBrand.contentStorage.lessons}</div>
                  </div>
                  <div>
                    <Label>Challenges</Label>
                    <div className="mt-1 text-2xl font-bold">{selectedBrand.contentStorage.challenges}</div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              {selectedBrand.pipelineStatus === 'paid' && (
                <div className="grid gap-4">
                  <h3 className="text-lg font-semibold">Performance Metrics</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Total Users</Label>
                      <div className="mt-1 text-2xl font-bold">{selectedBrand.metrics.totalUsers.toLocaleString()}</div>
                    </div>
                    <div>
                      <Label>Active Users</Label>
                      <div className="mt-1 text-2xl font-bold">{selectedBrand.metrics.activeUsers.toLocaleString()}</div>
                    </div>
                    <div>
                      <Label>Completion Rate</Label>
                      <div className="mt-1 text-2xl font-bold">{selectedBrand.metrics.completionRate}%</div>
                    </div>
                    <div>
                      <Label>Avg ROI Multiplier</Label>
                      <div className="mt-1 text-2xl font-bold text-green-600">{selectedBrand.metrics.avgROI}x</div>
                    </div>
                    <div>
                      <Label>Monthly Revenue</Label>
                      <div className="mt-1 text-2xl font-bold">{formatCurrency(selectedBrand.metrics.monthlyRevenue)}</div>
                    </div>
                    <div>
                      <Label>User Growth</Label>
                      <div className="mt-1 text-2xl font-bold text-green-600">+{selectedBrand.metrics.userGrowth}%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Close
            </Button>
            {canAccess(['manage_all_brands']) && (
              <Button onClick={() => {
                // Handle edit action
                setEditDialogOpen(false)
              }}>
                Edit Contract
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
