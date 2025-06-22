import { useState, useEffect } from 'react'
import { useRoleAccess } from '../../../hooks/use-role-access'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Badge } from '../../ui/badge'
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
  UserCheck,
  UserX,
  Mail,
  Phone
} from 'lucide-react'

export default function UserManagement() {
  const { canAccess } = useRoleAccess()
  const [users, setUsers] = useState([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      role: 'retail_admin',
      status: 'active',
      verificationStatus: 'verified',
      lastLogin: '2024-01-15',
      joinDate: '2023-12-01',
      location: 'New York, NY'
    },
    {
      id: '2',
      name: 'Mike Chen',
      email: 'mike.chen@brandco.com',
      role: 'brand_admin',
      status: 'active',
      verificationStatus: 'verified',
      lastLogin: '2024-01-14',
      joinDate: '2023-11-15',
      location: 'San Francisco, CA'
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      email: 'emily.r@email.com',
      role: 'user',
      status: 'pending_verification',
      verificationStatus: 'pending',
      lastLogin: '2024-01-13',
      joinDate: '2024-01-10',
      location: 'Austin, TX'
    },
    {
      id: '4',
      name: 'David Kim',
      email: 'david.kim@retailstore.com',
      role: 'retail_admin',
      status: 'inactive',
      verificationStatus: 'verified',
      lastLogin: '2024-01-05',
      joinDate: '2023-10-20',
      location: 'Seattle, WA'
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRole, setFilterRole] = useState('all')

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    const matchesRole = filterRole === 'all' || user.role === filterRole
    
    return matchesSearch && matchesStatus && matchesRole
  })

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin'
      case 'brand_admin':
        return 'Brand Admin'
      case 'retail_admin':
        return 'Retail Admin'
      case 'user':
        return 'User'
      default:
        return role
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>
      case 'pending_verification':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pending</Badge>
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getVerificationBadge = (status) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Verified</Badge>
      case 'pending':
        return <Badge variant="outline" className="border-orange-500 text-orange-700">Pending</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleUserAction = (action, userId) => {
    console.log(`${action} user:`, userId)
    // Implement user actions here
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        {canAccess(['manage_all_users', 'manage_brand_users']) && (
          <Button onClick={() => handleUserAction('create', null)}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>
            Search and filter users by status, role, or other criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
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
                  <DropdownMenuItem onClick={() => setFilterStatus('pending_verification')}>
                    Pending Verification
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
                    Role: {filterRole === 'all' ? 'All' : getRoleDisplayName(filterRole)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterRole('all')}>
                    All Roles
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterRole('super_admin')}>
                    Super Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterRole('brand_admin')}>
                    Brand Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterRole('retail_admin')}>
                    Retail Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterRole('user')}>
                    User
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Mail className="mr-1 h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.status)}
                    </TableCell>
                    <TableCell>
                      {getVerificationBadge(user.verificationStatus)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.lastLogin).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.location}
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
                          <DropdownMenuItem onClick={() => handleUserAction('view', user.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {canAccess(['manage_all_users', 'manage_brand_users']) && (
                            <>
                              <DropdownMenuItem onClick={() => handleUserAction('edit', user.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === 'active' ? (
                                <DropdownMenuItem onClick={() => handleUserAction('suspend', user.id)}>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Suspend User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleUserAction('activate', user.id)}>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activate User
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleUserAction('delete', user.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
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

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No users found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
