import { useState, useEffect } from 'react'
import { useRoleAccess } from '../../../hooks/use-role-access'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/input'
import { Badge } from '../../ui/badge'
import { Textarea } from '../../ui/textarea'
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
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  MoreHorizontal,
  Camera,
  Building,
  Mail,
  Calendar,
  User
} from 'lucide-react'

export default function VerificationManagement() {
  const { canAccess } = useRoleAccess()
  const [verifications, setVerifications] = useState([
    {
      id: '1',
      userId: 'user_123',
      userName: 'Sarah Johnson',
      userEmail: 'sarah.johnson@email.com',
      method: 'photo_badge',
      status: 'pending',
      submittedAt: '2024-01-15T10:30:00Z',
      reviewedAt: null,
      reviewedBy: null,
      documents: [
        { type: 'employee_badge', url: '/api/documents/badge_123.jpg' },
        { type: 'store_photo', url: '/api/documents/store_123.jpg' }
      ],
      retailLocation: 'Target - Downtown Seattle',
      notes: 'Employee badge clearly visible, store location confirmed',
      reviewNotes: ''
    },
    {
      id: '2',
      userId: 'user_456',
      userName: 'Mike Chen',
      userEmail: 'mike.chen@email.com',
      method: 'manager_code',
      status: 'approved',
      submittedAt: '2024-01-14T15:45:00Z',
      reviewedAt: '2024-01-14T16:20:00Z',
      reviewedBy: 'admin_789',
      documents: [],
      retailLocation: 'Walmart - San Francisco Bay Area',
      notes: 'Manager verification code confirmed',
      reviewNotes: 'Code verified with store manager. Approved.'
    },
    {
      id: '3',
      userId: 'user_789',
      userName: 'Emily Rodriguez',
      userEmail: 'emily.r@email.com',
      method: 'store_verification',
      status: 'rejected',
      submittedAt: '2024-01-13T09:15:00Z',
      reviewedAt: '2024-01-13T14:30:00Z',
      reviewedBy: 'admin_456',
      documents: [
        { type: 'store_receipt', url: '/api/documents/receipt_789.jpg' }
      ],
      retailLocation: 'Best Buy - Austin Central',
      notes: 'Recent purchase receipt provided',
      reviewNotes: 'Receipt does not clearly show employment relationship. Please provide employee badge or manager verification.'
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMethod, setFilterMethod] = useState('all')
  const [selectedVerification, setSelectedVerification] = useState(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')

  const filteredVerifications = verifications.filter(verification => {
    const matchesSearch = verification.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         verification.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         verification.retailLocation.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || verification.status === filterStatus
    const matchesMethod = filterMethod === 'all' || verification.method === filterMethod
    
    return matchesSearch && matchesStatus && matchesMethod
  })

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pending</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getMethodDisplayName = (method) => {
    switch (method) {
      case 'photo_badge':
        return 'Photo Badge'
      case 'manager_code':
        return 'Manager Code'
      case 'store_verification':
        return 'Store Verification'
      case 'invitation':
        return 'Invitation'
      default:
        return method
    }
  }

  const getMethodIcon = (method) => {
    switch (method) {
      case 'photo_badge':
        return Camera
      case 'manager_code':
        return User
      case 'store_verification':
        return Building
      case 'invitation':
        return Mail
      default:
        return Clock
    }
  }

  const handleReview = (verification, action) => {
    if (!canAccess(['approve_verifications'])) {
      console.log('Insufficient permissions')
      return
    }

    setSelectedVerification(verification)
    setReviewNotes(verification.reviewNotes || '')
    setReviewDialogOpen(true)
  }

  const submitReview = (action) => {
    if (!selectedVerification) return

    const updatedVerifications = verifications.map(v => 
      v.id === selectedVerification.id 
        ? {
            ...v,
            status: action,
            reviewedAt: new Date().toISOString(),
            reviewedBy: 'current_admin', // Would be actual admin ID
            reviewNotes: reviewNotes
          }
        : v
    )

    setVerifications(updatedVerifications)
    setReviewDialogOpen(false)
    setSelectedVerification(null)
    setReviewNotes('')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Verification Management</h1>
          <p className="text-muted-foreground">
            Review and approve user verification requests
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
            {verifications.filter(v => v.status === 'pending').length} Pending
          </Badge>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Requests</CardTitle>
          <CardDescription>
            Review user verification submissions and supporting documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user name, email, or location..."
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
                  <DropdownMenuItem onClick={() => setFilterStatus('pending')}>
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('approved')}>
                    Approved
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('rejected')}>
                    Rejected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Method: {filterMethod === 'all' ? 'All' : getMethodDisplayName(filterMethod)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterMethod('all')}>
                    All Methods
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterMethod('photo_badge')}>
                    Photo Badge
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterMethod('manager_code')}>
                    Manager Code
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterMethod('store_verification')}>
                    Store Verification
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterMethod('invitation')}>
                    Invitation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Verifications Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVerifications.map((verification) => {
                  const MethodIcon = getMethodIcon(verification.method)
                  return (
                    <TableRow key={verification.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium">{verification.userName}</div>
                          <div className="text-sm text-muted-foreground">
                            {verification.userEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <MethodIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{getMethodDisplayName(verification.method)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {verification.retailLocation}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(verification.status)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(verification.submittedAt)}
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
                            <DropdownMenuItem onClick={() => handleReview(verification, 'view')}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {canAccess(['approve_verifications']) && verification.status === 'pending' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleReview(verification, 'approved')}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleReview(verification, 'rejected')}
                                  className="text-red-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredVerifications.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No verification requests found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Verification Request</DialogTitle>
            <DialogDescription>
              Review the verification details and provide feedback
            </DialogDescription>
          </DialogHeader>
          
          {selectedVerification && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">User</label>
                  <p className="text-sm text-muted-foreground">{selectedVerification.userName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Method</label>
                  <p className="text-sm text-muted-foreground">{getMethodDisplayName(selectedVerification.method)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <p className="text-sm text-muted-foreground">{selectedVerification.retailLocation}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Submitted</label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedVerification.submittedAt)}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">User Notes</label>
                <p className="text-sm text-muted-foreground mt-1">{selectedVerification.notes}</p>
              </div>

              {selectedVerification.documents.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Documents</label>
                  <div className="mt-2 space-y-2">
                    {selectedVerification.documents.map((doc, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Camera className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{doc.type.replace('_', ' ')}</span>
                        <Button variant="outline" size="sm">View</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Review Notes</label>
                <Textarea
                  placeholder="Add your review notes here..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            {selectedVerification?.status === 'pending' && canAccess(['approve_verifications']) && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={() => submitReview('rejected')}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button 
                  onClick={() => submitReview('approved')}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
