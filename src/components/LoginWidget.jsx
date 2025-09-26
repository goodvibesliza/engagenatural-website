import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, getAuth } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db, app } from '../lib/firebase'
import getLandingRouteFor from '../utils/landing'
import { Button } from './ui/Button'
import { Input } from './ui/input'
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { LogIn, UserPlus, AlertCircle } from 'lucide-react'

export default function LoginWidget({ buttonText = "Login", buttonVariant = "default", className = "" }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [storeName, setStoreName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Admin email whitelist
  const adminEmails = [
    'admin@engagenatural.com',
    'liza@engagenatural.com'
  ]

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Attempting to sign in with email:', email)
      const userCredential = await signInWithEmailAndPassword(
        auth || getAuth(app),
        email,
        password
      )
      const user = userCredential.user
      console.log('User authenticated successfully:', user.uid)
      
      // Get user document from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid))

      if (userDoc.exists()) {
        const userData = userDoc.data()
        
        // Extract role - handle both array and string formats
        let userRole = userData.role
        
        // If role is an array, take the first element
        if (Array.isArray(userRole)) {
          console.log('User role is an array:', userRole)
          userRole = userRole[0] || 'staff'
        }
        
        console.log('User profile loaded, normalized role:', userRole)

        // Use shared helper to find the correct landing page for this role
        const landingRoute = getLandingRouteFor({
          uid: user.uid,
          email: user.email,
          role: userRole,
          verified: userData.verified || false,
          approved: userData.approved || false,
        })

        console.log('Redirecting to landing route:', landingRoute)
        navigate(landingRoute)
      } else {
        console.log('No user profile found, navigating to root')
        navigate('/')
      }
      
      setIsOpen(false)
    } catch (error) {
      console.error('Sign in error:', error.code, error.message)
      
      // User-friendly error messages
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Invalid email address format.')
          break
        case 'auth/user-not-found':
          setError('No account found with this email.')
          break
        case 'auth/wrong-password':
          setError('Incorrect password.')
          break
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later.')
          break
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection and try again.')
          break
        default:
          setError(`Failed to sign in: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!name || !email || !password || !storeName) {
      setError('Please fill in all fields.')
      setLoading(false)
      return
    }

    try {
      console.log('Attempting to create account for:', email)
      const userCredential = await createUserWithEmailAndPassword(
        auth || getAuth(app),
        email,
        password
      )
      const user = userCredential.user
      console.log('User account created successfully:', user.uid)
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        storeName,
        verified: false,
        verificationStatus: 'not_submitted',
        createdAt: new Date(),
        role: 'retailer'
      })
      
      console.log('User profile created, navigating to profile page')
      navigate('/retailer/profile')
      setIsOpen(false)
    } catch (error) {
      console.error('Sign up error:', error.code, error.message)
      
      // User-friendly error messages
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('An account with this email already exists.')
          break
        case 'auth/invalid-email':
          setError('Invalid email address format.')
          break
        case 'auth/weak-password':
          setError('Password should be at least 6 characters.')
          break
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection and try again.')
          break
        default:
          setError(`Failed to create account: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={buttonVariant} 
          className={`flex items-center ${className}`}
        >
          <LogIn className="w-4 h-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {/* Added DialogTitle for accessibility */}
        <DialogTitle className="sr-only">Authentication</DialogTitle>
        {/* Visually-hidden description for screen-readers */}
        <DialogDescription className="sr-only">
          Sign in to your account or create a new account
        </DialogDescription>
        
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin" className="font-body">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="font-body">Create Account</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <LogIn className="w-8 h-8 text-brand-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 font-heading text-brand-primary">Welcome Back</h3>
                <p className="text-gray-600 mb-6 font-body">
                  Sign in to access your profile, challenges, and community features.
                </p>
              </div>
              
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-body">{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label htmlFor="signin-email" className="block text-sm font-medium text-brand-primary mb-1 font-body">
                    Email
                  </label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="border-gray-300 focus:border-brand-primary focus:ring-brand-primary font-body"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label htmlFor="signin-password" className="block text-sm font-medium text-brand-primary mb-1 font-body">
                    Password
                  </label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="border-gray-300 focus:border-brand-primary focus:ring-brand-primary font-body"
                    disabled={loading}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-brand-primary hover:bg-brand-primary/90 font-body"
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 font-body">
                  Don't have an account?{' '}
                  <button 
                    onClick={() => setActiveTab('signup')}
                    className="text-brand-secondary hover:underline font-medium"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="signup">
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <UserPlus className="w-8 h-8 text-brand-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 font-heading text-brand-primary">Join EngageNatural</h3>
                <p className="text-gray-600 mb-6 font-body">
                  Create your account to access challenges, community content, and exclusive features.
                </p>
              </div>
              
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-body">{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label htmlFor="signup-name" className="block text-sm font-medium text-brand-primary mb-1 font-body">
                    Full Name
                  </label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className="border-gray-300 focus:border-brand-primary focus:ring-brand-primary font-body"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label htmlFor="signup-email" className="block text-sm font-medium text-brand-primary mb-1 font-body">
                    Email
                  </label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="border-gray-300 focus:border-brand-primary focus:ring-brand-primary font-body"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label htmlFor="signup-password" className="block text-sm font-medium text-brand-primary mb-1 font-body">
                    Password
                  </label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    required
                    className="border-gray-300 focus:border-brand-primary focus:ring-brand-primary font-body"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label htmlFor="signup-store" className="block text-sm font-medium text-brand-primary mb-1 font-body">
                    Store Name
                  </label>
                  <Input
                    id="signup-store"
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Where do you work?"
                    required
                    className="border-gray-300 focus:border-brand-primary focus:ring-brand-primary font-body"
                    disabled={loading}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-brand-secondary hover:bg-brand-secondary/90 font-body"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
              
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 font-body">
                  Already have an account?{' '}
                  <button 
                    onClick={() => setActiveTab('signin')}
                    className="text-brand-secondary hover:underline font-medium"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
