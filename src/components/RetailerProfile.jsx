import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db, storage } from '../lib/firebase'
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { signOut } from 'firebase/auth'

export default function EnhancedRetailerProfile() {
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
  
  // Easter egg state - FIXED: Added missing imports and proper placement
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

  // FIXED: Moved communities array to proper location with updated structure
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
      id: 'supplement-scoop', 
      name: 'The Supplement Scoop',
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
      description: "Quit losing customers to competitors who know which natural/organic products are trending before you do.",
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

  // FIXED: Function to check for easter eggs - added missing closing braces
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
            
          } catch (error) {
            console.error('Error recording easter egg find:', error)
          }
        }
      }
    } // FIXED: Added missing closing brace
  } // FIXED: Added missing closing brace

  // Copy easter egg code to clipboard
  const copyEasterEggCode = (code) => {
    navigator.clipboard.writeText(code)
    alert('Code copied to clipboard!')
  }

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
              joinedCommunities: ['whats-good'] // Auto-join public community
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

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      navigate('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setShowCamera(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Unable to access camera. Please check permissions or use file upload instead.')
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      
      canvas.toBlob((blob) => {
        setVerificationPhoto(blob)
        stopCamera()
      }, 'image/jpeg', 0.8)
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setShowCamera(false)
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      setVerificationPhoto(file)
    }
  }

  const submitVerification = async () => {
    if (!verificationPhoto) {
      alert('Please take a photo or upload an image first.')
      return
    }

    setUploading(true)
    try {
      // Generate daily verification code
      const today = new Date()
      const verificationCode = `ENG-${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}`
      
      // Upload photo to Firebase Storage
      const photoRef = ref(storage, `verification/${user.uid}/${Date.now()}.jpg`)
      await uploadBytes(photoRef, verificationPhoto)
      const photoURL = await getDownloadURL(photoRef)
      
      // Create verification request
      const verificationRequest = {
        userId: user.uid,
        userEmail: user.email,
        userName: user.name,
        storeName: user.storeName,
        photoURL: photoURL,
        verificationCode: verificationCode,
        submittedAt: new Date(),
        status: 'pending',
        adminNotes: ''
      }
      
      await addDoc(collection(db, 'verification_requests'), verificationRequest)
      
      // Update user status
      await updateDoc(doc(db, 'users', user.uid), {
        verificationStatus: 'pending',
        lastVerificationSubmission: new Date()
      })
      
      setUser(prev => ({ ...prev, verificationStatus: 'pending' }))
      setVerificationPhoto(null)
      alert('Verification submitted successfully! We\'ll review your submission within 1-2 business days.')
      
    } catch (error) {
      console.error('Error submitting verification:', error)
      alert('Error submitting verification. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const uploadProfileImage = async (file) => {
    setUploading(true)
    try {
      const imageRef = ref(storage, `profile_images/${user.uid}/${Date.now()}.jpg`)
      await uploadBytes(imageRef, file)
      const imageURL = await getDownloadURL(imageRef)
      
      await updateDoc(doc(db, 'users', user.uid), {
        profileImage: imageURL
      })
      
      setProfileImage(imageURL)
      setUser(prev => ({ ...prev, profileImage: imageURL }))
    } catch (error) {
      console.error('Error uploading profile image:', error)
      alert('Error uploading image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const selectAvatar = async (avatar) => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        profileImage: avatar
      })
      
      setProfileImage(avatar)
      setUser(prev => ({ ...prev, profileImage: avatar }))
      setShowAvatarSelector(false)
    } catch (error) {
      console.error('Error selecting avatar:', error)
    }
  }

  const updateAboutMe = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        interests: aboutMe.interests,
        location: aboutMe.location,
        story: aboutMe.story
      })
      
      setUser(prev => ({ ...prev, ...aboutMe }))
      alert('About Me section updated successfully!')
    } catch (error) {
      console.error('Error updating about me:', error)
      alert('Error updating information. Please try again.')
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
              id="about"
              label="About Me"
              icon="📝"
              isActive={activeTab === 'about'}
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
        {activeTab === 'profile' && (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h2 className="font-heading text-xl font-semibold mb-4">Profile Information</h2>
                
                {/* Profile Image Section */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl mx-auto mb-4">
                      {profileImage ? (
                        typeof profileImage === 'string' && profileImage.startsWith('http') ? (
                          <img src={profileImage} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                        ) : (
                          <span>{profileImage}</span>
                        )
                      ) : (
                        '👤'
                      )}
                    </div>
                    <button
                      onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                      className="absolute bottom-0 right-0 bg-brand-primary text-white rounded-full p-2 hover:bg-brand-primary/90"
                    >
                      📷
                    </button>
                  </div>
                  
                  {showAvatarSelector && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <h3 className="text-sm font-medium mb-3">Choose Avatar or Upload Photo</h3>
                      <div className="grid grid-cols-5 gap-2 mb-4">
                        {avatarOptions.map((avatar, index) => (
                          <button
                            key={index}
                            onClick={() => selectAvatar(avatar)}
                            className="text-2xl p-2 hover:bg-gray-200 rounded"
                          >
                            {avatar}
                          </button>
                        ))}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0]
                          if (file) uploadProfileImage(file)
                        }}
                        className="text-sm"
                      />
                    </div>
                  )}
                  
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

        {activeTab === 'verification' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="font-heading text-2xl font-semibold mb-4">Photo Verification</h2>
              
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-medium text-blue-900 mb-2">📸 Verification Instructions</h3>
                  <p className="text-blue-800 text-sm">
                    Take a photo of yourself <strong>in-store with your name tag or apron visible</strong>. 
                    Include today's verification code <strong>ENG-{String(new Date().getDate()).padStart(2, '0')}{String(new Date().getMonth() + 1).padStart(2, '0')}</strong> 
                    written on a piece of paper in the photo.
                  </p>
                </div>
              </div>

              {!showCamera && !verificationPhoto && (
                <div className="space-y-4">
                  <button
                    onClick={startCamera}
                    className="w-full bg-brand-primary text-white py-3 px-4 rounded-lg hover:bg-brand-primary/90 transition-colors"
                  >
                    📷 Take Photo with Camera
                  </button>
                  
                  <div className="text-center text-gray-500">or</div>
                  
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      ref={fileInputRef}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      📁 Upload from Computer
                    </button>
                  </label>
                </div>
              )}

              {showCamera && (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex space-x-4">
                    <button
                      onClick={capturePhoto}
                      className="flex-1 bg-brand-primary text-white py-2 px-4 rounded-lg hover:bg-brand-primary/90"
                    >
                      📸 Capture Photo
                    </button>
                    <button
                      onClick={stopCamera}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                    >
                      ❌ Cancel
                    </button>
                  </div>
                </div>
              )}

              {verificationPhoto && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-green-600 font-medium mb-2">✅ Photo ready for submission</p>
                    {verificationPhoto instanceof File && (
                      <img
                        src={URL.createObjectURL(verificationPhoto)}
                        alt="Verification preview"
                        className="max-w-full h-48 object-cover rounded-lg mx-auto"
                      />
                    )}
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={submitVerification}
                      disabled={uploading}
                      className="flex-1 bg-brand-primary text-white py-2 px-4 rounded-lg hover:bg-brand-primary/90 disabled:opacity-50"
                    >
                      {uploading ? '⏳ Submitting...' : '✅ Submit Verification'}
                    </button>
                    <button
                      onClick={() => setVerificationPhoto(null)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                    >
                      🔄 Retake Photo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="font-heading text-2xl font-semibold mb-4">About Me</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interests & Specialties
                  </label>
                  <textarea
                    value={aboutMe.interests}
                    onChange={(e) => setAboutMe(prev => ({ ...prev, interests: e.target.value }))}
                    placeholder="What products or areas are you most passionate about?"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={aboutMe.location}
                    onChange={(e) => setAboutMe(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, State or Region"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Story
                  </label>
                  <textarea
                    value={aboutMe.story}
                    onChange={(e) => setAboutMe(prev => ({ ...prev, story: e.target.value }))}
                    placeholder="Tell us about your journey in natural health retail..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    rows={4}
                  />
                </div>
                
                <button
                  onClick={updateAboutMe}
                  className="w-full bg-brand-primary text-white py-3 px-4 rounded-lg hover:bg-brand-primary/90 transition-colors"
                >
                  💾 Save About Me
                </button>
              </div>
            </div>
          </div>
        )}

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

        {activeTab === 'challenges' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="font-heading text-2xl font-bold text-gray-900 mb-4">Challenges Coming Soon!</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              We're working on exciting challenges that will help you earn points, learn new skills, and compete with other retailers.
            </p>
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

