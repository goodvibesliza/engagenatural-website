import { useState, useEffect } from 'react'
import { signOut } from 'firebase/auth'
import { auth, db } from '../lib/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Textarea } from './ui/textarea'
import { Alert, AlertDescription } from './ui/alert'
import { 
  LogOut, 
  Users, 
  FileText, 
  Trophy, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Trash2,
  UserX,
  Shield,
  BarChart3,
  TrendingUp,
  Activity
} from 'lucide-react'

export default function AdminDashboard() {
  const [verificationRequests, setVerificationRequests] = useState([])
  const [users, setUsers] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingVerifications: 0,
    approvedUsers: 0,
    rejectedRequests: 0
  })

  useEffect(() => {
    // Listen to verification requests
    const verificationsQuery = query(
      collection(db, 'verification_requests'),
      orderBy('submittedAt', 'desc')
    )
    
    const unsubscribeVerifications = onSnapshot(verificationsQuery, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate(),
        reviewedAt: doc.data().reviewedAt?.toDate()
      }))
      setVerificationRequests(requests)
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingVerifications: requests.filter(r => r.status === 'pending').length,
        approvedUsers: requests.filter(r => r.status === 'approved').length,
        rejectedRequests: requests.filter(r => r.status === 'rejected').length
      }))
    })

    // Listen to users
    const usersQuery = query(
      collection(db, 'users'),
      orderBy('lastVerificationRequest', 'desc')
    )
    
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastVerificationRequest: doc.data().lastVerificationRequest?.toDate(),
        approvedAt: doc.data().approvedAt?.toDate(),
        rejectedAt: doc.data().rejectedAt?.toDate()
      }))
      setUsers(usersList)
      
      setStats(prev => ({
        ...prev,
        totalUsers: usersList.length
      }))
    })

    return () => {
      unsubscribeVerifications()
      unsubscribeUsers()
    }
  }, [])

  const handleApproveVerification = async (requestId) => {
    setLoading(true)
    try {
      const requestRef = doc(db, 'verification_requests', requestId)
      await updateDoc(requestRef, {
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: auth.currentUser?.email,
        adminNotes: adminNotes
      })

      // Update user status
      const userRef = doc(db, 'users', requestId)
      await updateDoc(userRef, {
        verificationStatus: 'approved',
        approvedAt: new Date()
      })

      setSelectedRequest(null)
      setAdminNotes('')
      alert('Verification approved successfully!')
    } catch (error) {
      console.error('Error approving verification:', error)
      alert('Failed to approve verification')
    } finally {
      setLoading(false)
    }
  }

  const handleRejectVerification = async (requestId) => {
    if (!adminNotes.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    setLoading(true)
    try {
      const requestRef = doc(db, 'verification_requests', requestId)
      await updateDoc(requestRef, {
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: auth.currentUser?.email,
        adminNotes: adminNotes
      })

      // Update user status
      const userRef = doc(db, 'users', requestId)
      await updateDoc(userRef, {
        verificationStatus: 'rejected',
        rejectedAt: new Date()
      })

      setSelectedRequest(null)
      setAdminNotes('')
      alert('Verification rejected')
    } catch (error) {
      console.error('Error rejecting verification:', error)
      alert('Failed to reject verification')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveUser = async (userId) => {
    if (!confirm('Are you sure you want to remove this user? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    try {
      // Remove user document
      await deleteDoc(doc(db, 'users', userId))
      
      // Remove verification request if exists
      try {
        await deleteDoc(doc(db, 'verification_requests', userId))
      } catch (error) {
        // Verification request might not exist
      }

      alert('User removed successfully')
    } catch (error) {
      console.error('Error removing user:', error)
      alert('Failed to remove user')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-green-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">EngageNatural Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {auth.currentUser?.email}
              </span>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Verifications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingVerifications}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.approvedUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="w-8 h-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejected Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.rejectedRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="verifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="verifications" className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Verifications
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Content
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Verification Requests Tab */}
          <TabsContent value="verifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Verification Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {verificationRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No verification requests found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {verificationRequests.map((request) => (
                      <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarFallback>
                                {request.userEmail?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{request.userEmail}</p>
                              <p className="text-sm text-gray-600">
                                Store: {request.storeName || 'Not specified'}
                              </p>
                              <p className="text-sm text-gray-600">
                                Submitted: {formatDate(request.submittedAt)}
                              </p>
                              <p className="text-sm text-gray-600">
                                Code: {request.verificationCode}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {getStatusBadge(request.status)}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRequest(request)
                                    setAdminNotes(request.adminNotes || '')
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Review
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Verification Request Review</DialogTitle>
                                </DialogHeader>
                                {selectedRequest && (
                                  <div className="space-y-6">
                                    {/* User Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Email</label>
                                        <p className="text-gray-900">{selectedRequest.userEmail}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Store Name</label>
                                        <p className="text-gray-900">{selectedRequest.storeName || 'Not specified'}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Verification Code</label>
                                        <p className="text-gray-900">{selectedRequest.verificationCode}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">Status</label>
                                        <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                                      </div>
                                    </div>

                                    {/* Photo */}
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 block mb-2">
                                        Verification Photo
                                      </label>
                                      <img 
                                        src={selectedRequest.photoUrl} 
                                        alt="Verification photo"
                                        className="max-w-full h-auto rounded-lg border"
                                      />
                                    </div>

                                    {/* User Notes */}
                                    {selectedRequest.userNotes && (
                                      <div>
                                        <label className="text-sm font-medium text-gray-600">User Notes</label>
                                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                                          {selectedRequest.userNotes}
                                        </p>
                                      </div>
                                    )}

                                    {/* Admin Notes */}
                                    <div>
                                      <label className="text-sm font-medium text-gray-600 block mb-2">
                                        Admin Notes
                                      </label>
                                      <Textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="Add notes about this verification request..."
                                        rows={3}
                                      />
                                    </div>

                                    {/* Action Buttons */}
                                    {selectedRequest.status === 'pending' && (
                                      <div className="flex space-x-3">
                                        <Button
                                          onClick={() => handleApproveVerification(selectedRequest.id)}
                                          disabled={loading}
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          Approve
                                        </Button>
                                        <Button
                                          onClick={() => handleRejectVerification(selectedRequest.id)}
                                          disabled={loading}
                                          variant="destructive"
                                        >
                                          <XCircle className="w-4 h-4 mr-2" />
                                          Reject
                                        </Button>
                                      </div>
                                    )}

                                    {selectedRequest.status !== 'pending' && (
                                      <Alert>
                                        <AlertDescription>
                                          This request was {selectedRequest.status} on {formatDate(selectedRequest.reviewedAt)} by {selectedRequest.reviewedBy}
                                          {selectedRequest.adminNotes && (
                                            <div className="mt-2">
                                              <strong>Admin Notes:</strong> {selectedRequest.adminNotes}
                                            </div>
                                          )}
                                        </AlertDescription>
                                      </Alert>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  User Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No users found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarFallback>
                                {user.email?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">{user.email}</p>
                              <p className="text-sm text-gray-600">
                                Status: {getStatusBadge(user.verificationStatus || 'not-submitted')}
                              </p>
                              {user.lastVerificationRequest && (
                                <p className="text-sm text-gray-600">
                                  Last request: {formatDate(user.lastVerificationRequest)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleRemoveUser(user.id)}
                              disabled={loading}
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Remove User
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Management Tab */}
          <TabsContent value="content">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Content Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Button className="h-24 flex flex-col items-center justify-center">
                      <Trophy className="w-8 h-8 mb-2" />
                      Manage Challenges
                    </Button>
                    <Button className="h-24 flex flex-col items-center justify-center">
                      <MessageSquare className="w-8 h-8 mb-2" />
                      Community Posts
                    </Button>
                    <Button className="h-24 flex flex-col items-center justify-center">
                      <FileText className="w-8 h-8 mb-2" />
                      Product Information
                    </Button>
                  </div>
                  <Alert className="mt-6">
                    <AlertDescription>
                      Content management features are coming soon. You'll be able to create and manage challenges, community posts, and product information directly from this dashboard.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Analytics Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">User Engagement</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total Registrations</span>
                          <span className="font-semibold">{stats.totalUsers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Verification Rate</span>
                          <span className="font-semibold">
                            {stats.totalUsers > 0 
                              ? Math.round(((stats.approvedUsers + stats.pendingVerifications) / stats.totalUsers) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Approval Rate</span>
                          <span className="font-semibold">
                            {(stats.approvedUsers + stats.rejectedRequests) > 0
                              ? Math.round((stats.approvedUsers / (stats.approvedUsers + stats.rejectedRequests)) * 100)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Verification Status</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>Pending</span>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            {stats.pendingVerifications}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Approved</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {stats.approvedUsers}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Rejected</span>
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            {stats.rejectedRequests}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Alert className="mt-6">
                    <TrendingUp className="w-4 h-4" />
                    <AlertDescription>
                      Advanced analytics features including charts, user activity tracking, and detailed reports are coming soon.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

