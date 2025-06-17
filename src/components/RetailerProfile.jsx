import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db, storage } from '../lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { signOut } from 'firebase/auth'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Alert, AlertDescription } from './ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Separator } from './ui/separator'
import { 
  User, Store, Camera, Upload, CheckCircle, AlertCircle, 
  LogOut, Clock, ShieldCheck, ShieldAlert, Calendar, 
  Award, Trophy, Star, Lock, Unlock, BookOpen
} from 'lucide-react'

export default function RetailerProfile() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('profile')
  const navigate = useNavigate()
  
  // Verification status states
  const [verificationStatus, setVerificationStatus] = useState('not_submitted')
  const [verificationDate, setVerificationDate] = useState(null)
  const [verificationFeedback, setVerificationFeedback] = useState('')
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    storeName: '',
    bio: '',
    position: ''
  })
  
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user)
        
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid))
          if (userDoc.exists()) {
            const data = userDoc.data()
            setUserData(data)
            setProfileForm({
              name: data.name || '',
              email: data.email || '',
              storeName: data.storeName || '',
              bio: data.bio || '',
              position: data.position || ''
            })
            
            // Set verification status
            setVerificationStatus(data.verificationStatus || 'not_submitted')
            setVerificationDate(data.verificationDate?.toDate() || null)
            setVerificationFeedback(data.verificationFeedback || '')
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          setError('Failed to load your profile data. Please try again.')
        }
      } else {
        navigate('/')
      }
      
      setLoading(false)
    })
    
    return () => unsubscribe()
  }, [navigate])
  
  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: profileForm.name,
        storeName: profileForm.storeName,
        bio: profileForm.bio,
        position: profileForm.position,
        updatedAt: new Date()
      })
      
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Failed to update profile. Please try again.')
    }
  }
  
  const handleInputChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    })
  }
  
  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
      setError('Failed to sign out. Please try again.')
    }
  }
  
  // Helper function to render verification status badge
  const renderVerificationBadge = () => {
    switch (verificationStatus) {
      case 'verified':
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-500 text-white">
            <ShieldAlert className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-500 text-white">
            <Clock className="w-3 h-3 mr-1" />
            Under Review
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-500 text-white">
            <Lock className="w-3 h-3 mr-1" />
            Not Verified
          </Badge>
        )
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-body">Loading your profile...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold text-brand-primary font-heading">EngageNatural</div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 font-body">
                {userData?.name || user?.email}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-gray-600 hover:text-brand-primary font-body"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto mb-4 flex items-center justify-center">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-lg text-brand-primary font-heading">{userData?.name}</h3>
                  <p className="text-gray-600 text-sm font-body">{userData?.storeName}</p>
                  <div className="mt-2">
                    {renderVerificationBadge()}
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <nav className="space-y-1">
                  <Button 
                    variant={activeTab === 'profile' ? 'default' : 'ghost'} 
                    className={`w-full justify-start ${activeTab === 'profile' ? 'bg-brand-primary text-white' : 'text-gray-600'} font-body`}
                    onClick={() => setActiveTab('profile')}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                  <Button 
                    variant={activeTab === 'verification' ? 'default' : 'ghost'} 
                    className={`w-full justify-start ${activeTab === 'verification' ? 'bg-brand-primary text-white' : 'text-gray-600'} font-body`}
                    onClick={() => setActiveTab('verification')}
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Verification
                  </Button>
                  <Button 
                    variant={activeTab === 'content' ? 'default' : 'ghost'} 
                    className={`w-full justify-start ${activeTab === 'content' ? 'bg-brand-primary text-white' : 'text-gray-600'} font-body`}
                    onClick={() => setActiveTab('content')}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Content
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-3">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-body">{error}</AlertDescription>
              </Alert>
            )}
            
            <TabsContent value="profile" className="mt-0" hidden={activeTab !== 'profile'}>
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-brand-primary">Profile Information</CardTitle>
                  <CardDescription className="font-body">Update your personal information and store details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-brand-primary mb-1 font-body">
                          Full Name
                        </label>
                        <Input
                          id="name"
                          name="name"
                          value={profileForm.name}
                          onChange={handleInputChange}
                          className="border-gray-300 focus:border-brand-primary focus:ring-brand-primary font-body"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-brand-primary mb-1 font-body">
                          Email
                        </label>
                        <Input
                          id="email"
                          name="email"
                          value={profileForm.email}
                          disabled
                          className="bg-gray-100 border-gray-300 font-body"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="storeName" className="block text-sm font-medium text-brand-primary mb-1 font-body">
                        Store Name
                      </label>
                      <Input
                        id="storeName"
                        name="storeName"
                        value={profileForm.storeName}
                        onChange={handleInputChange}
                        className="border-gray-300 focus:border-brand-primary focus:ring-brand-primary font-body"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="position" className="block text-sm font-medium text-brand-primary mb-1 font-body">
                        Position/Role
                      </label>
                      <Input
                        id="position"
                        name="position"
                        value={profileForm.position}
                        onChange={handleInputChange}
                        placeholder="e.g., Wellness Department Manager"
                        className="border-gray-300 focus:border-brand-primary focus:ring-brand-primary font-body"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium text-brand-primary mb-1 font-body">
                        Bio
                      </label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={profileForm.bio}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Tell us about yourself and your experience in natural products..."
                        className="border-gray-300 focus:border-brand-primary focus:ring-brand-primary font-body"
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        className="bg-brand-primary hover:bg-brand-primary/90 font-body"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="verification" className="mt-0" hidden={activeTab !== 'verification'}>
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-brand-primary">Verification Status</CardTitle>
                  <CardDescription className="font-body">
                    Verify your retail staff status to access exclusive content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-brand-primary font-heading">Current Status:</div>
                      <div>{renderVerificationBadge()}</div>
                    </div>
                    
                    {verificationStatus === 'verified' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-green-800 font-heading">Verification Approved</h4>
                            <p className="text-green-700 text-sm font-body">
                              Your retail staff status has been verified. You now have access to all exclusive content.
                            </p>
                            {verificationDate && (
                              <p className="text-green-700 text-sm mt-1 font-body">
                                Verified on: {verificationDate.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {verificationStatus === 'pending' && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start">
                          <Clock className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-yellow-800 font-heading">Verification In Progress</h4>
                            <p className="text-yellow-700 text-sm font-body">
                              Your verification request is currently being reviewed. This typically takes 1-2 business days.
                            </p>
                            {verificationDate && (
                              <p className="text-yellow-700 text-sm mt-1 font-body">
                                Submitted on: {verificationDate.toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {verificationStatus === 'rejected' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start">
                          <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-red-800 font-heading">Verification Rejected</h4>
                            <p className="text-red-700 text-sm font-body">
                              Your verification request was not approved. Please review the feedback below and submit a new request.
                            </p>
                            {verificationFeedback && (
                              <div className="mt-2 p-2 bg-red-100 rounded text-red-800 text-sm font-body">
                                <strong>Feedback:</strong> {verificationFeedback}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {verificationStatus === 'not_submitted' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start">
                          <ShieldCheck className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-blue-800 font-heading">Not Yet Verified</h4>
                            <p className="text-blue-700 text-sm font-body">
                              Submit a verification request to access exclusive content for retail staff.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Limited Content Preview */}
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-brand-primary mb-4 font-heading">Available Content</h3>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <Card className="bg-white">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-brand-primary font-heading">Basic Product Knowledge</h4>
                              <Badge className="bg-green-500">Available</Badge>
                            </div>
                            <p className="text-sm text-gray-600 font-body">
                              Learn about natural product basics and industry terminology.
                            </p>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-white">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-brand-primary font-heading">Community Forum</h4>
                              <Badge className="bg-green-500">Available</Badge>
                            </div>
                            <p className="text-sm text-gray-600 font-body">
                              Connect with other retail professionals in the industry.
                            </p>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-white border-dashed border-2 border-gray-300">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-500 font-heading">Brand Partner Content</h4>
                              <Badge className="bg-gray-500">
                                <Lock className="w-3 h-3 mr-1" />
                                Locked
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 font-body">
                              Exclusive content from premium brand partners.
                            </p>
                            <div className="mt-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white font-body"
                                disabled={verificationStatus !== 'verified'}
                              >
                                {verificationStatus === 'verified' ? 'Access Content' : 'Verification Required'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-white border-dashed border-2 border-gray-300">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-500 font-heading">Advanced Training</h4>
                              <Badge className="bg-gray-500">
                                <Lock className="w-3 h-3 mr-1" />
                                Locked
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 font-body">
                              In-depth product training and certification courses.
                            </p>
                            <div className="mt-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-xs border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white font-body"
                                disabled={verificationStatus !== 'verified'}
                              >
                                {verificationStatus === 'verified' ? 'Access Training' : 'Verification Required'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                    
                    {/* Verification Request Button */}
                    {verificationStatus !== 'verified' && verificationStatus !== 'pending' && (
                      <div className="mt-6 text-center">
                        <Button 
                          className="bg-brand-primary hover:bg-brand-primary/90 font-body"
                          onClick={() => navigate('/verification/photo')}
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Submit Verification Request
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="content" className="mt-0" hidden={activeTab !== 'content'}>
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-brand-primary">Available Content</CardTitle>
                  <CardDescription className="font-body">
                    {verificationStatus === 'verified' 
                      ? 'Access all exclusive content for verified retail staff' 
                      : 'Limited content available until verification is complete'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Content based on verification status */}
                  {verificationStatus === 'verified' ? (
                    <div className="space-y-6">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start">
                          <Unlock className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-green-800 font-heading">Full Access Unlocked</h4>
                            <p className="text-green-700 text-sm font-body">
                              You have complete access to all exclusive content, including brand partner materials and advanced training.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Featured Content */}
                      <div>
                        <h3 className="text-lg font-semibold text-brand-primary mb-4 font-heading">Featured Brand Content</h3>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <Card className="bg-white hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="h-32 bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                                <BookOpen className="w-8 h-8 text-gray-400" />
                              </div>
                              <h4 className="font-semibold text-brand-primary font-heading">Fish Oil Benefits & Research</h4>
                              <p className="text-sm text-gray-600 mt-1 font-body">
                                Comprehensive guide to omega-3 fatty acids and their health benefits.
                              </p>
                              <div className="mt-3">
                                <Button 
                                  size="sm" 
                                  className="bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-body"
                                >
                                  View Content
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="bg-white hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="h-32 bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                                <BookOpen className="w-8 h-8 text-gray-400" />
                              </div>
                              <h4 className="font-semibold text-brand-primary font-heading">Probiotics Selection Guide</h4>
                              <p className="text-sm text-gray-600 mt-1 font-body">
                                How to recommend the right probiotic based on customer needs.
                              </p>
                              <div className="mt-3">
                                <Button 
                                  size="sm" 
                                  className="bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-body"
                                >
                                  View Content
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      
                      {/* Advanced Training */}
                      <div>
                        <h3 className="text-lg font-semibold text-brand-primary mb-4 font-heading">Advanced Training</h3>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <Card className="bg-white hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-brand-primary font-heading">Supplement Quality Certification</h4>
                                <Badge className="bg-blue-500">New</Badge>
                              </div>
                              <p className="text-sm text-gray-600 font-body">
                                Learn how to evaluate supplement quality and manufacturing standards.
                              </p>
                              <div className="mt-3 flex items-center justify-between">
                                <Button 
                                  size="sm" 
                                  className="bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-body"
                                >
                                  Start Course
                                </Button>
                                <div className="text-xs text-gray-500 font-body">45 min</div>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="bg-white hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-brand-primary font-heading">Customer Consultation Skills</h4>
                                <Badge className="bg-purple-500">Popular</Badge>
                              </div>
                              <p className="text-sm text-gray-600 font-body">
                                Advanced techniques for effective customer consultations.
                              </p>
                              <div className="mt-3 flex items-center justify-between">
                                <Button 
                                  size="sm" 
                                  className="bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-body"
                                >
                                  Start Course
                                </Button>
                                <div className="text-xs text-gray-500 font-body">60 min</div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start">
                          <Lock className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-yellow-800 font-heading">Limited Access</h4>
                            <p className="text-yellow-700 text-sm font-body">
                              Complete the verification process to unlock all exclusive content.
                            </p>
                            {verificationStatus === 'pending' && (
                              <p className="text-yellow-700 text-sm mt-1 font-body">
                                Your verification is currently under review.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Available Content */}
                      <div>
                        <h3 className="text-lg font-semibold text-brand-primary mb-4 font-heading">Available Content</h3>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <Card className="bg-white hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="h-32 bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                                <BookOpen className="w-8 h-8 text-gray-400" />
                              </div>
                              <h4 className="font-semibold text-brand-primary font-heading">Natural Products Basics</h4>
                              <p className="text-sm text-gray-600 mt-1 font-body">
                                Introduction to natural products and industry terminology.
                              </p>
                              <div className="mt-3">
                                <Button 
                                  size="sm" 
                                  className="bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-body"
                                >
                                  View Content
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="bg-white hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="h-32 bg-gray-200 rounded-md mb-3 flex items-center justify-center">
                                <BookOpen className="w-8 h-8 text-gray-400" />
                              </div>
                              <h4 className="font-semibold text-brand-primary font-heading">Customer Service Essentials</h4>
                              <p className="text-sm text-gray-600 mt-1 font-body">
                                Basic customer service skills for retail staff.
                              </p>
                              <div className="mt-3">
                                <Button 
                                  size="sm" 
                                  className="bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-body"
                                >
                                  View Content
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      
                      {/* Locked Content */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-500 mb-4 font-heading">Locked Content</h3>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <Card className="bg-white border-dashed border-2 border-gray-300">
                            <CardContent className="p-4">
                              <div className="h-32 bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                                <Lock className="w-8 h-8 text-gray-300" />
                              </div>
                              <h4 className="font-semibold text-gray-500 font-heading">Brand Partner Content</h4>
                              <p className="text-sm text-gray-500 mt-1 font-body">
                                Exclusive content from premium brand partners.
                              </p>
                              <div className="mt-3">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-xs border-gray-300 text-gray-500 font-body"
                                  disabled
                                >
                                  Verification Required
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="bg-white border-dashed border-2 border-gray-300">
                            <CardContent className="p-4">
                              <div className="h-32 bg-gray-100 rounded-md mb-3 flex items-center justify-center">
                                <Lock className="w-8 h-8 text-gray-300" />
                              </div>
                              <h4 className="font-semibold text-gray-500 font-heading">Advanced Training</h4>
                              <p className="text-sm text-gray-500 mt-1 font-body">
                                In-depth product training and certification courses.
                              </p>
                              <div className="mt-3">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="text-xs border-gray-300 text-gray-500 font-body"
                                  disabled
                                >
                                  Verification Required
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                      
                      {/* Verification CTA */}
                      {verificationStatus !== 'pending' && (
                        <div className="mt-8 text-center">
                          <Button 
                            className="bg-brand-primary hover:bg-brand-primary/90 font-body"
                            onClick={() => navigate('/verification/photo')}
                          >
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Complete Verification
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </div>
      </main>
    </div>
  )
}

