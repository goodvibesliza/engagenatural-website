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
  Activity,
  Camera,
  Image,
  Heart,
  Share2,
  Play,
  Target
} from 'lucide-react'

export default function AdminDashboard() {
  const [verificationRequests, setVerificationRequests] = useState([])
  const [users, setUsers] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingVerifications: 0,
    approvedUsers: 0,
    rejectedRequests: 0
  })

  // Enhanced engagement tracking data
  const [engagementData, setEngagementData] = useState({
    content: [
      { id: 1, type: 'video', title: 'Supplement Basics Training', views: 1250, likes: 89, shares: 23, comments: 45, engagement: 12.6 },
      { id: 2, type: 'activity', title: 'Daily Check-in Challenge', participants: 340, completions: 287, engagement: 84.4 },
      { id: 3, type: 'challenge', title: 'Vitamin D Knowledge Quiz', attempts: 156, completions: 134, avgScore: 87, engagement: 85.9 },
      { id: 4, type: 'social', title: 'Share Your Success Story', posts: 67, likes: 234, comments: 89, shares: 45, engagement: 15.2 },
      { id: 5, type: 'video', title: 'Probiotic Product Deep Dive', views: 890, likes: 67, shares: 12, comments: 34, engagement: 12.7 },
      { id: 6, type: 'activity', title: 'Weekly Sales Goal Tracker', participants: 245, completions: 198, engagement: 80.8 },
      { id: 7, type: 'challenge', title: 'Omega-3 Expert Certification', attempts: 89, completions: 76, avgScore: 92, engagement: 85.4 },
      { id: 8, type: 'social', title: 'Product Recommendation Post', posts: 123, likes: 456, comments: 178, shares: 67, engagement: 18.9 }
    ],
    totalEngagement: 15.7,
    topPerformers: [
      { type: 'challenge', title: 'Vitamin D Knowledge Quiz', engagement: 85.9 },
      { type: 'activity', title: 'Daily Check-in Challenge', engagement: 84.4 },
      { type: 'challenge', title: 'Omega-3 Expert Certification', engagement: 85.4 }
    ]
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
        adminNotes: adminNotes
      })

      // Update user status
      const request = verificationRequests.find(r => r.id === requestId)
      if (request) {
        const userRef = doc(db, 'users', request.userId)
        await updateDoc(userRef, {
          verificationStatus: 'approved',
          verified: true,
          approvedAt: new Date()
        })
      }

      setSelectedRequest(null)
      setAdminNotes('')
    } catch (error) {
      console.error('Error approving verification:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRejectVerification = async (requestId) => {
    setLoading(true)
    try {
      const requestRef = doc(db, 'verification_requests', requestId)
      await updateDoc(requestRef, {
        status: 'rejected',
        reviewedAt: new Date(),
        adminNotes: adminNotes
      })

      // Update user status
      const request = verificationRequests.find(r => r.id === requestId)
      if (request) {
        const userRef = doc(db, 'users', request.userId)
        await updateDoc(userRef, {
          verificationStatus: 'rejected',
          verified: false,
          rejectedAt: new Date()
        })
      }

      setSelectedRequest(null)
      setAdminNotes('')
    } catch (error) {
      console.error('Error rejecting verification:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this verification request?')) {
      try {
        await deleteDoc(doc(db, 'verification_requests', requestId))
      } catch (error) {
        console.error('Error deleting request:', error)
      }
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    }
  }

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4 text-blue-600" />
      case 'activity':
        return <Activity className="h-4 w-4 text-green-600" />
      case 'challenge':
        return <Target className="h-4 w-4 text-purple-600" />
      case 'social':
        return <Share2 className="h-4 w-4 text-pink-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const getEngagementColor = (engagement) => {
    if (engagement >= 80) return 'text-green-600'
    if (engagement >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EngageNatural Admin</h1>
              <p className="text-gray-600">Manage users, verifications, and content engagement</p>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="verifications">Verifications</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="gallery">Photo Gallery</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingVerifications}</div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting review
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.approvedUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    +8% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{engagementData.totalEngagement}%</div>
                  <p className="text-xs text-muted-foreground">
                    +2.1% from last week
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Verification Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {verificationRequests.slice(0, 5).map((request) => (
                      <div key={request.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{request.userName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{request.userName}</p>
                            <p className="text-xs text-gray-500">{request.storeName}</p>
                          </div>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {engagementData.topPerformers.map((content, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getContentTypeIcon(content.type)}
                          <div>
                            <p className="text-sm font-medium">{content.title}</p>
                            <p className="text-xs text-gray-500 capitalize">{content.type}</p>
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${getEngagementColor(content.engagement)}`}>
                          {content.engagement}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Verifications Tab */}
          <TabsContent value="verifications">
            <Card>
              <CardHeader>
                <CardTitle>Verification Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {verificationRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>{request.userName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{request.userName}</h3>
                            <p className="text-sm text-gray-500">{request.userEmail}</p>
                            <p className="text-sm text-gray-500">{request.storeName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
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
                                <Eye className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Verification Request Details</DialogTitle>
                              </DialogHeader>
                              {selectedRequest && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium">User</label>
                                      <p className="text-sm">{selectedRequest.userName}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Store</label>
                                      <p className="text-sm">{selectedRequest.storeName}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Submitted</label>
                                      <p className="text-sm">{selectedRequest.submittedAt?.toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium">Status</label>
                                      <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                                    </div>
                                  </div>

                                  {selectedRequest.photoURL && (
                                    <div>
                                      <label className="text-sm font-medium">Verification Photo</label>
                                      <img 
                                        src={selectedRequest.photoURL} 
                                        alt="Verification" 
                                        className="mt-2 max-w-full h-64 object-cover rounded-lg"
                                      />
                                    </div>
                                  )}

                                  {selectedRequest.brandCode && (
                                    <div>
                                      <label className="text-sm font-medium">Brand Code</label>
                                      <p className="text-sm">{selectedRequest.brandCode}</p>
                                    </div>
                                  )}

                                  <div>
                                    <label className="text-sm font-medium">Admin Notes</label>
                                    <Textarea
                                      value={adminNotes}
                                      onChange={(e) => setAdminNotes(e.target.value)}
                                      placeholder="Add notes about this verification..."
                                      className="mt-1"
                                    />
                                  </div>

                                  {selectedRequest.status === 'pending' && (
                                    <div className="flex space-x-2">
                                      <Button 
                                        onClick={() => handleApproveVerification(selectedRequest.id)}
                                        disabled={loading}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Approve
                                      </Button>
                                      <Button 
                                        onClick={() => handleRejectVerification(selectedRequest.id)}
                                        disabled={loading}
                                        variant="destructive"
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Reject
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRequest(request.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        Submitted: {request.submittedAt?.toLocaleDateString()} at {request.submittedAt?.toLocaleTimeString()}
                      </div>
                      
                      {request.verificationCode && (
                        <div className="text-sm text-gray-500 mt-1">
                          Verification Code: {request.verificationCode}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={user.profileImage} />
                            <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{user.name}</h3>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <p className="text-sm text-gray-500">{user.storeName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(user.verificationStatus || 'not_submitted')}
                          <Badge variant="outline">
                            {user.points || 0} pts
                          </Badge>
                          <Badge variant="outline">
                            Level {user.level || 1}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Content Engagement Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {engagementData.content.map((content) => (
                      <div key={content.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {getContentTypeIcon(content.type)}
                            <div>
                              <h3 className="font-medium">{content.title}</h3>
                              <p className="text-sm text-gray-500 capitalize">{content.type}</p>
                            </div>
                          </div>
                          <div className={`text-lg font-bold ${getEngagementColor(content.engagement)}`}>
                            {content.engagement}%
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {content.type === 'video' && (
                            <>
                              <div>
                                <span className="text-gray-500">Views:</span>
                                <span className="ml-1 font-medium">{content.views?.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Likes:</span>
                                <span className="ml-1 font-medium">{content.likes}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Shares:</span>
                                <span className="ml-1 font-medium">{content.shares}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Comments:</span>
                                <span className="ml-1 font-medium">{content.comments}</span>
                              </div>
                            </>
                          )}
                          
                          {content.type === 'activity' && (
                            <>
                              <div>
                                <span className="text-gray-500">Participants:</span>
                                <span className="ml-1 font-medium">{content.participants}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Completions:</span>
                                <span className="ml-1 font-medium">{content.completions}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Completion Rate:</span>
                                <span className="ml-1 font-medium">{((content.completions / content.participants) * 100).toFixed(1)}%</span>
                              </div>
                            </>
                          )}
                          
                          {content.type === 'challenge' && (
                            <>
                              <div>
                                <span className="text-gray-500">Attempts:</span>
                                <span className="ml-1 font-medium">{content.attempts}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Completions:</span>
                                <span className="ml-1 font-medium">{content.completions}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Avg Score:</span>
                                <span className="ml-1 font-medium">{content.avgScore}%</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Success Rate:</span>
                                <span className="ml-1 font-medium">{((content.completions / content.attempts) * 100).toFixed(1)}%</span>
                              </div>
                            </>
                          )}
                          
                          {content.type === 'social' && (
                            <>
                              <div>
                                <span className="text-gray-500">Posts:</span>
                                <span className="ml-1 font-medium">{content.posts}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Likes:</span>
                                <span className="ml-1 font-medium">{content.likes}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Comments:</span>
                                <span className="ml-1 font-medium">{content.comments}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Shares:</span>
                                <span className="ml-1 font-medium">{content.shares}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Photo Gallery Tab */}
          <TabsContent value="gallery">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Photo Gallery - Social Media Content Creator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Sidebar Navigation */}
                  <div className="lg:col-span-1">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium mb-4">Gallery Tools</h3>
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start">
                          <Image className="h-4 w-4 mr-2" />
                          Brand Product Photos
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          User Comments
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Heart className="h-4 w-4 mr-2" />
                          Top Testimonials
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <Share2 className="h-4 w-4 mr-2" />
                          Create Collage
                        </Button>
                      </div>
                      
                      <div className="mt-6">
                        <h4 className="font-medium mb-2">Quick Actions</h4>
                        <div className="space-y-2">
                          <Button size="sm" className="w-full">
                            Generate Instagram Post
                          </Button>
                          <Button size="sm" variant="outline" className="w-full">
                            Create Facebook Story
                          </Button>
                          <Button size="sm" variant="outline" className="w-full">
                            Export for LinkedIn
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Gallery Area */}
                  <div className="lg:col-span-2">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Social Media Content Creator
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Create branded social media posts using retailer comments and product photos
                      </p>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-blue-900 mb-2">Coming Soon Features:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Drag & drop product photo collages</li>
                          <li>• Overlay retailer testimonials and comments</li>
                          <li>• Auto-brand with EngageNatural logo</li>
                          <li>• Export in multiple social media formats</li>
                          <li>• Template library for different brands</li>
                        </ul>
                      </div>
                      
                      <Button disabled className="mb-2">
                        <Image className="h-4 w-4 mr-2" />
                        Upload Product Photos
                      </Button>
                      <p className="text-xs text-gray-500">
                        Widget ready for development - functionality coming soon
                      </p>
                    </div>

                    {/* Sample Gallery Preview */}
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Recent Social Media Posts</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-100 rounded-lg p-4 text-center">
                          <div className="bg-gray-200 h-32 rounded mb-2 flex items-center justify-center">
                            <Image className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-600">Sample Instagram Post</p>
                        </div>
                        <div className="bg-gray-100 rounded-lg p-4 text-center">
                          <div className="bg-gray-200 h-32 rounded mb-2 flex items-center justify-center">
                            <Image className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-600">Sample Facebook Story</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}


