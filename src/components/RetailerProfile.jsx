import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db, storage } from '../lib/firebase'
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { signOut } from 'firebase/auth'

export default function RetailerProfile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
  const [showCamera, setShowCamera] = useState(false)
  const [profileImage, setProfileImage] = useState(null)
  const [aboutMe, setAboutMe] = useState({
    interests: '',
    location: '',
    story: ''
  })
  const [uploading, setUploading] = useState(false)
  const [verificationPhoto, setVerificationPhoto] = useState(null)
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)
  
  // Easter egg state
  const [foundEasterEggs, setFoundEasterEggs] = useState([])
  const [showEasterEgg, setShowEasterEgg] = useState(null)
  const [easterEggProgress, setEasterEggProgress] = useState(0)
  
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  const avatarOptions = [
    '👤', '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '👨‍⚕️', '👩‍⚕️', '🧑‍🌾', '👨‍🍳', '👩‍🍳',
    '🌱', '🥬', '🥕', '🍎', '🥑', '🌿', '🌾', '🍯', '🧘‍♀️', '🧘‍♂️'
  ]

  // Updated communities with new structure
  const communities = [
    { 
      id: 'whats-good', 
      name: "What's Good", 
      description: "Check out What's Good for the latest product drops and industry buzz!",
      members: 2500, 
      active: true,
      isPublic: true,
      requiresVerification: false,
      hasEasterEggs: true,
      badge: "🌟 Open to All"
    },
    { 
      id: 'daily-stack', 
      name: 'The Daily Stack', 
      description: "Stop guessing about supplements and start getting insider intel from the pros who sell $10M+ in products every year.",
      members: 850, 
      active: false,
      isPublic: false,
      requiresVerification: true,
      hasEasterEggs: false,
      badge: "🔒 Verification Required"
    },
    { 
      id: 'fresh-finds', 
      name: 'Fresh Finds', 
      description: "Quit losing customers to competitors who know which natural and organic products are trending before you do.",
      members: 1200, 
      active: false,
      isPublic: false,
      requiresVerification: true,
      hasEasterEggs: false,
      badge: "🔒 Verification Required"
    },
    { 
      id: 'good-vibes', 
      name: 'Good Vibes', 
      description: "Stop struggling alone with difficult customers and impossible sales targets while feeling burnt out and disconnected from your purpose. Connect with positive, high-performing natural health retailers who celebrate wins together.",
      members: 1800, 
      active: false,
      isPublic: false,
      requiresVerification: true,
      hasEasterEggs: false,
      badge: "🔒 Verification Required"
    }
  ]

  // Load easter egg progress
  const loadEasterEggProgress = async (userId) => {
    try {
      const q = query(
        collection(db, 'user_easter_eggs'),
        where('userId', '==', userId)
      )
      const querySnapshot = await getDocs(q)
      const foundEggs = []
      querySnapshot.forEach((doc) => {
        foundEggs.push(doc.data().easterEggId)
      })
      setFoundEasterEggs(foundEggs)
      setEasterEggProgress(foundEggs.length)
    } catch (error) {
      console.error('Error loading easter egg progress:', error)
    }
  }

  // Check for easter eggs when joining "What's Good"
  const checkForEasterEgg = async (communityId) => {
    if (communityId === 'whats-good' && user?.uid) {
      // 15% chance to find an easter egg
      if (Math.random() < 0.15) {
        const easterEggs = [
          {
            id: 'insider-discount',
            title: "🎉 Hidden Gem Alert!",
            content: "You found a secret! Use code INSIDER20 for 20% off your next supplement purchase at participating stores!",
            code: "INSIDER20",
            type: "discount"
          },
          {
            id: 'free-sample',
            title: "🌟 Lucky Find!",
            content: "Congratulations! You've unlocked a free product sample. Show this to your store manager!",
            code: "FREESAMPLE",
            type: "sample"
          },
          {
            id: 'bonus-points',
            title: "💎 Treasure Discovered!",
            content: "Amazing! You found 100 bonus points for your account!",
            code: "BONUS100",
            type: "points"
          },
          {
            id: 'exclusive-content',
            title: "🔓 Secret Unlocked!",
            content: "You've discovered exclusive training content! Check your email for special access.",
            code: "EXCLUSIVE",
            type: "content"
          },
          {
            id: 'early-access',
            title: "⚡ Speed Bonus!",
            content: "You get early access to next week's product announcements!",
            code: "EARLYBIRD",
            type: "access"
          }
        ]
        
        // Pick a random easter egg that user hasn't found yet
        const availableEggs = easterEggs.filter(egg => !foundEasterEggs.includes(egg.id))
        
        if (availableEggs.length > 0) {
          const randomEgg = availableEggs[Math.floor(Math.random() * availableEggs.length)]
          
          // Record the find in database
          try {
            await addDoc(collection(db, 'user_easter_eggs'), {
              userId: user.uid,
              easterEggId: randomEgg.id,
              foundAt: new Date(),
              communityId: 'whats-good'
            })
            
            // Update local state
            setFoundEasterEggs(prev => [...prev, randomEgg.id])
            setEasterEggProgress(prev => prev + 1)
            setShowEasterEgg(randomEgg)
            
            // Award points if it's a points egg
            if (randomEgg.type === 'points') {
              await updateDoc(doc(db, 'users', user.uid), {
                points: (user.points || 0) + 100
              })
              setUser(prev => ({ ...prev, points: (prev.points || 0) + 100 }))
            }
            
          } catch (error) {
            console.error('Error recording easter egg find:', error)
          }
        }
      }
    }
  }

  // Copy easter egg code to clipboard
  const copyEasterEggCode = (code) => {
    navigator.clipboard.writeText(code)
    alert('Code copied to clipboard!')
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              ...userData
            })
            setAboutMe({
              interests: userData.interests || '',
              location: userData.location || '',
              story: userData.story || ''
            })
            setProfileImage(userData.profileImage || null)
            
            // Load user's easter egg progress
            await loadEasterEggProgress(currentUser.uid)
          } else {
            // Create new user document
            const newUser = {
              uid: currentUser.uid,
              email: currentUser.email,
              name: currentUser.displayName || 'New User',
              storeName: 'Unknown Store',
              verified: false,
              verificationStatus: 'not_submitted',
              points: 0,
              level: 1,
              profileImage: null,
              interests: '',
              location: '',
              story: '',
              joinedCommunities: ['whats-good'], // Auto-join public community
              foundEasterEggs: []
            }
            await setDoc(doc(db, 'users', currentUser.uid), newUser)
            setUser(newUser)
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

  // Join community function
  const joinCommunity = async (communityId) => {
    const community = communities.find(c => c.id === communityId)
    
    // Check if verification is required
    if (community.requiresVerification && user?.verificationStatus !== 'approved') {
      alert('This community requires verification. Please complete your verification first!')
      setActiveTab('verification')
      return
    }
    
    try {
      // Update user's joined communities
      const currentCommunities = user.joinedCommunities || []
      if (!currentCommunities.includes(communityId)) {
        const updatedCommunities = [...currentCommunities, communityId]
        await updateDoc(doc(db, 'users', user.uid), {
          joinedCommunities: updatedCommunities
        })
        setUser(prev => ({ ...prev, joinedCommunities: updatedCommunities }))
        
        // Check for easter eggs
        await checkForEasterEgg(communityId)
      }
    } catch (error) {
      console.error('Error joining community:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getStatusBadge = () => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
    switch (user?.verificationStatus) {
      case 'approved':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>✓ Verified</span>
      case 'pending':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>⏳ Under Review</span>
      case 'rejected':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>⚠ Rejected</span>
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>🔒 Not Verified</span>
    }
  }

  const getVerificationBenefits = () => {
    const isVerified = user?.verificationStatus === 'approved'
    
    return (
      <div className="bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 rounded-lg p-6 border border-brand-primary/20">
        <h3 className="font-heading text-lg font-semibold mb-4">
          {isVerified ? '🎉 Verified Benefits' : '🔒 Verification Benefits'}
        </h3>
        
        <div className="space-y-3">
          <div className={`flex items-center space-x-3 ${isVerified ? 'text-green-700' : 'text-gray-600'}`}>
            <span>{isVerified ? '✅' : '🔒'}</span>
            <span>Access to premium communities (The Daily Stack, Fresh Finds, Good Vibes)</span>
          </div>
          <div className={`flex items-center space-x-3 ${isVerified ? 'text-green-700' : 'text-gray-600'}`}>
            <span>{isVerified ? '✅' : '🔒'}</span>
            <span>Exclusive product training and insider intel</span>
          </div>
          <div className={`flex items-center space-x-3 ${isVerified ? 'text-green-700' : 'text-gray-600'}`}>
            <span>{isVerified ? '✅' : '🔒'}</span>
            <span>Free product samples and exclusive contests</span>
          </div>
          <div className="flex items-center space-x-3 text-green-700">
            <span>✅</span>
            <span>Access to "What's Good" community (available to all!)</span>
          </div>
        </div>
        
        {!isVerified && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              <strong>Current Status:</strong> You have access to "What's Good" community. Get verified to unlock premium communities!
            </p>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    )
  }

  const TabButton = ({ id, label, icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-brand-primary text-white'
          : 'text-gray-600 hover:text-brand-primary hover:bg-gray-50'
      }`}
    >
      <span className="mr-2">{icon}</span>
      {label}
    </button>
  )

  const CommunityCard = ({ community }) => {
    const isJoined = user?.joinedCommunities?.includes(community.id)
    const canAccess = community.isPublic || (community.requiresVerification && user?.verificationStatus === 'approved')
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-heading text-lg font-semibold text-gray-900">{community.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                community.isPublic 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {community.badge}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-3 line-clamp-3">{community.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>👥 {community.members.toLocaleString()} members</span>
              {community.hasEasterEggs && (
                <span className="text-purple-600">🥚 Hidden treasures inside!</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            {!canAccess && (
              <p className="text-sm text-orange-600 mb-2">
                🔒 Verification required for access
              </p>
            )}
          </div>
          
          <button
            onClick={() => canAccess ? joinCommunity(community.id) : setActiveTab('verification')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isJoined
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : canAccess
                ? 'bg-brand-primary text-white hover:bg-brand-primary/90'
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            }`}
          >
            {isJoined ? 'View Community' : canAccess ? 'Join Community' : 'Get Verified'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-brand-primary hover:text-brand-primary/80 font-medium"
              >
                ← Back to Home
              </button>
              <div>
                <h1 className="text-3xl font-heading font-bold text-gray-900">Welcome back, {user?.name}!</h1>
                <p className="text-gray-600 mt-1">{user?.storeName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-brand-primary">{user?.points || 0} pts</div>
                <div className="text-sm text-gray-600">Level {user?.level || 1}</div>
                {easterEggProgress > 0 && (
                  <div className="text-xs text-purple-600">🥚 {easterEggProgress} eggs found</div>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            <TabButton
              id="profile"
              label="Profile"
              icon="👤"
              isActive={activeTab === 'profile'}
              onClick={setActiveTab}
            />
            <TabButton
              id="verification"
              label="Verification"
              icon="🔐"
              isActive={activeTab === 'verification'}
              onClick={setActiveTab}
            />
            <TabButton
              id="communities"
              label="Communities"
              icon="👥"
              isActive={activeTab === 'communities'}
              onClick={setActiveTab}
            />
            <TabButton
              id="about"
              label="About Me"
              icon="📝"
              isActive={activeTab === 'about'}
              onClick={setActiveTab}
            />
            <TabButton
              id="challenges"
              label="Challenges"
              icon="🎯"
              isActive={activeTab === 'challenges'}
              onClick={setActiveTab}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Profile tab */}
        {activeTab === 'profile' && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl mx-auto mb-4">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                      ) : (
                        '👤'
                      )}
                    </div>
                    <button className="absolute bottom-0 right-0 bg-brand-primary text-white rounded-full p-2 hover:bg-brand-primary/90">
                      📷
                    </button>
                  </div>
                  <h2 className="font-heading text-xl font-semibold text-gray-900">{user?.name}</h2>
                  <p className="text-gray-600">{user?.storeName}</p>
                  <div className="mt-2">{getStatusBadge()}</div>
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              {getVerificationBenefits()}
            </div>
          </div>
        )}

        {/* Communities tab */}
        {activeTab === 'communities' && (
          <div>
            <div className="mb-6">
              <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">Communities</h2>
              <p className="text-gray-600">
                Join communities to connect with fellow retail professionals and access exclusive content!
              </p>
              {easterEggProgress > 0 && (
                <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-purple-800 text-sm">
                    🎉 You've found {easterEggProgress} easter egg{easterEggProgress !== 1 ? 's' : ''}! Keep exploring "What's Good" for more hidden treasures.
                  </p>
                </div>
              )}
            </div>
            
            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
              {communities.map(community => (
                <CommunityCard key={community.id} community={community} />
              ))}
            </div>
          </div>
        )}

        {/* Other tabs - simplified for now */}
        {activeTab === 'verification' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-4">Verification</h2>
            <p className="text-gray-600">Verification functionality coming soon...</p>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-4">About Me</h2>
            <p className="text-gray-600">About me functionality coming soon...</p>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-4">Challenges</h2>
            <p className="text-gray-600">Challenges functionality coming soon...</p>
          </div>
        )}
      </div>

      {/* Easter Egg Modal */}
      {showEasterEgg && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="font-heading text-xl font-bold mb-4">{showEasterEgg.title}</h3>
            <p className="text-gray-700 mb-6">{showEasterEgg.content}</p>
            
            {showEasterEgg.code && (
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">Your Code:</p>
                <div className="flex items-center justify-center space-x-2">
                  <code className="bg-white px-3 py-2 rounded border font-mono text-lg">
                    {showEasterEgg.code}
                  </code>
                  <button
                    onClick={() => copyEasterEggCode(showEasterEgg.code)}
                    className="bg-brand-primary text-white px-3 py-2 rounded hover:bg-brand-primary/90"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            )}
            
            <button
              onClick={() => setShowEasterEgg(null)}
              className="bg-brand-primary text-white px-6 py-2 rounded-lg hover:bg-brand-primary/90"
            >
              Awesome!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

