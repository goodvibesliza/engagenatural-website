import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { CheckCircle, Clock, AlertCircle, Lock } from 'lucide-react'

export default function RetailerProfile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
          if (userDoc.exists()) {
            setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              ...userDoc.data()
            })
          } else {
            setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              name: 'New User',
              storeName: 'Unknown Store',
              verified: false,
              verificationStatus: 'not_submitted'
            })
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        }
      } else {
        navigate('/login')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    )
  }

  const getStatusBadge = () => {
    switch (user?.verificationStatus) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="w-4 h-4 mr-1" /> Verified</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="w-4 h-4 mr-1" /> Under Review</Badge>
      case 'rejected':
        return <Badge className="bg-red-500"><AlertCircle className="w-4 h-4 mr-1" /> Rejected</Badge>
      default:
        return <Badge className="bg-gray-500"><Lock className="w-4 h-4 mr-1" /> Not Verified</Badge>
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 font-heading">Retailer Profile</h1>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{user?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Store</p>
                  <p className="font-medium">{user?.storeName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <Tabs defaultValue="content">
            <TabsList className="mb-4">
              <TabsTrigger value="content">Available Content</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Content Access</CardTitle>
                  <CardDescription>
                    {user?.verified 
                      ? "You have access to exclusive content and features." 
                      : "Get verified to access exclusive content and features."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user?.verified ? (
                    <div className="space-y-4">
                      <p>Welcome to the exclusive content section! Here you can access:</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Product training materials</li>
                        <li>Educational resources</li>
                        <li>Exclusive challenges</li>
                        <li>Community features</li>
                      </ul>
                      <Button className="mt-4">Explore Content</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p>You need to be verified to access exclusive content.</p>
                      <Button 
                        onClick={() => navigate('/verification')}
                        className="mt-4"
                      >
                        Start Verification
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="verification">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Verification Status</CardTitle>
                  <CardDescription>
                    {user?.verificationStatus === 'not_submitted' && "Submit your verification to access exclusive content."}
                    {user?.verificationStatus === 'pending' && "Your verification is under review."}
                    {user?.verificationStatus === 'approved' && "Your account is verified!"}
                    {user?.verificationStatus === 'rejected' && "Your verification was rejected. Please try again."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user?.verificationStatus === 'not_submitted' && (
                    <div className="space-y-4">
                      <p>To get verified, you need to:</p>
                      <ol className="list-decimal pl-5 space-y-2">
                        <li>Take a photo in your store wearing your name tag/apron</li>
                        <li>Include today's verification code in the photo</li>
                        <li>Submit the photo for review</li>
                      </ol>
                      <Button 
                        onClick={() => navigate('/verification')}
                        className="mt-4"
                      >
                        Start Verification
                      </Button>
                    </div>
                  )}
                  
                  {user?.verificationStatus === 'pending' && (
                    <div className="space-y-4">
                      <p>Your verification is currently under review. This typically takes 1-2 business days.</p>
                      <div className="flex items-center justify-center py-8">
                        <div className="flex flex-col items-center">
                          <Clock className="w-16 h-16 text-yellow-500 mb-4" />
                          <p className="text-lg font-medium">Under Review</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {user?.verificationStatus === 'approved' && (
                    <div className="space-y-4">
                      <p>Congratulations! Your account is verified and you have full access to all features.</p>
                      <div className="flex items-center justify-center py-8">
                        <div className="flex flex-col items-center">
                          <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                          <p className="text-lg font-medium">Verified</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {user?.verificationStatus === 'rejected' && (
                    <div className="space-y-4">
                      <p>Your verification was rejected for the following reason:</p>
                      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
                        {user?.rejectionReason || "The photo did not meet our verification requirements."}
                      </div>
                      <p>Please try again with a new photo that meets all requirements.</p>
                      <Button 
                        onClick={() => navigate('/verification')}
                        className="mt-4"
                      >
                        Try Again
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

