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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu'
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
  Phone
} from 'lucide-react'

export default function BrandManagement() {
  const { canAccess } = useRoleAccess()
  const [brands, setBrands] = useState([
    {
      id: '1',
      name: 'GreenLeaf Organics',
      logo: '/api/brands/greenleaf-logo.png',
      status: 'active',
      category: 'Organic Foods',
      partnershipDate: '2023-06-15',
      contactEmail: 'partnerships@greenleaf.com',
      contactPhone: '+1 (555) 123-4567',
      website: 'https://greenleaf.com',
      description: 'Premium organic food products sourced from sustainable farms',
      metrics: {
        totalProducts: 45,
        activeRetailers: 23,
        monthlyRevenue: 45000,
        conversionRate: 4.2,
        customerSatisfaction: 4.8
      },
      performance: {
        salesGrowth: 15.3,
        retailerGrowth: 8.7,
        customerRetention: 92.1
      }
    },
    {
      id: '2',
      name: 'EcoTech Solutions',
      logo: '/api/brands/ecotech-logo.png',
      status: 'active',
      category: 'Technology',
      partnershipDate: '2023-08-22',
      contactEmail: 'hello@ecotech.com',
      contactPhone: '+1 (555 ) 987-6543',
      website: 'https://ecotech.com',
      description: 'Sustainable technology solutions for modern living',
      metrics: {
        totalProducts: 28,
        activeRetailers: 15,
        monthlyRevenue: 32000,
        conversionRate: 3.8,
        customerSatisfaction: 4.6
      },
      performance: {
        salesGrowth: 22.1,
        retailerGrowth: 12.4,
        customerRetention: 88.5
      }
    },
    {
      id: '3',
      name: 'Pure Beauty Co',
      logo: '/api/brands/purebeauty-logo.png',
      status: 'pending_approval',
      category: 'Beauty & Wellness',
      partnershipDate: '2024-01-10',
      contactEmail: 'partnerships@purebeauty.com',
      contactPhone: '+1 (555 ) 456-7890',
      website: 'https://purebeauty.com',
      description: 'Natural beauty products with zero harmful chemicals',
      metrics: {
        totalProducts: 0,
        activeRetailers: 0,
        monthlyRevenue: 0,
        conversionRate: 0,
        customerSatisfaction: 0
      },
      performance: {
        salesGrowth: 0,
        retailerGrowth: 0,
        customerRetention: 0
      }
    },
    {
      id: '4',
      name: 'Sustainable Living',
      logo: '/api/brands/sustainable-logo.png',
      status: 'inactive',
      category: 'Home & Garden',
      partnershipDate: '2023-03-08',
      contactEmail: 'info@sustainableliving.com',
      contactPhone: '+1 (555 ) 321-0987',
      website: 'https://sustainableliving.com',
      description: 'Eco-friendly home and garden products for conscious consumers',
      metrics: {
        totalProducts: 67,
        activeRetailers: 8,
        monthlyRevenue: 12000,
        conversionRate: 2.1,
        customerSatisfaction: 4.2
      },
      performance: {
        salesGrowth: -5.2,
        retailerGrowth: -15.3,
        customerRetention: 76.8
      }
    }
  ] )

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  const filteredBrands = brands.filter(brand => {
    const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         brand.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         brand.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || brand.status === filterStatus
    const matchesCategory = filterCategory === 'all' || brand.category === filterCategory
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>
      case 'pending_approval':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pending</Badge>
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPerformanceIndicator = (value, isPositive = true) => {
    const color = (isPositive && value > 0) || (!isPositive && value < 0) ? 'text-green-600' : 'text-red-600'
    const icon = (isPositive && value > 0) || (!isPositive && value < 0) ? TrendingUp : TrendingDown
    const IconComponent = icon
    
    return (
      <div className={`flex items-center ${color}`}>
        <IconComponent className="h-3 w-3 mr-1" />
        <span className="text-xs font-medium">{Math.abs(value)}%</span>
      </div>
    )
  }

  const handleBrandAction = (action, brandId) => {
    console.log(`${action} brand:`, brandId)
    // Implement brand actions here
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const categories = [...new Set(brands.map(brand => brand.category))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brand Management</h1>
          <p className="text-muted-foreground">
            Manage brand partnerships and monitor performance
          </p>
        </div>
        {canAccess(['manage_all_brands']) && (
          <Button onClick={() => handleBrandAction('create', null)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Brand
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Brands</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands.length}</div>
            <p className="text-xs text-muted-foreground">
              {brands.filter(b => b.status === 'active').length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {brands.reduce((sum, brand) => sum + brand.metrics.totalProducts, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all brands
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${brands.reduce((sum, brand) => sum + brand.metrics.monthlyRevenue, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Combined total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Retailers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {brands.reduce((sum, brand) => sum + brand.metrics.activeRetailers, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total partnerships
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Brands Table */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Directory</CardTitle>
          <CardDescription>
            Manage brand partnerships and track performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search brands by name, category, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Status: {filterStatus === 'all' ? 'All' : filterStatus}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                    All Statuses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('active')}>
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('inactive')}>
                    Inactive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('pending_approval')}>
                    Pending Approval
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('suspended')}>
                    Suspended
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Category: {filterCategory === 'all' ? 'All' : filterCategory}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterCategory('all')}>
                    All Categories
                  </DropdownMenuItem>
                  {categories.map(category => (
                    <DropdownMenuItem key={category} onClick={() => setFilterCategory(category)}>
                      {category}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Partnership Date</TableHead>
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
                            {brand.metrics.totalProducts} products
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{brand.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(brand.status)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Sales</span>
                          {getPerformanceIndicator(brand.performance.salesGrowth)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Retailers</span>
                          {getPerformanceIndicator(brand.performance.retailerGrowth)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        ${brand.metrics.monthlyRevenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {brand.metrics.activeRetailers} retailers
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(brand.partnershipDate)}
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
                          <DropdownMenuItem onClick={() => handleBrandAction('view', brand.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(brand.website, '_blank')}>
                            <Globe className="mr-2 h-4 w-4" />
                            Visit Website
                          </DropdownMenuItem>
                          {canAccess(['manage_all_brands', 'manage_brand_content']) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleBrandAction('edit', brand.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Brand
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleBrandAction('contact', brand.id)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Contact Brand
                              </DropdownMenuItem>
                              {canAccess(['manage_all_brands']) && (
                                <DropdownMenuItem 
                                  onClick={() => handleBrandAction('delete', brand.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove Brand
                                </DropdownMenuItem>
                              )}
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
    </div>
  )
}
