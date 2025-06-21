import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db, storage } from '../lib/firebase'
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, where } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { signOut } from 'firebase/auth'
import { moderateHealthContent, filterPostContent } from '../ContentModeration'

// FIXED font styles - Headlines thicker, subheadings Inter
const fontStyles = {
  mainTitle: {
    fontFamily: 'Playfair Display, serif',
    fontWeight: '900', // Increased to 900 for thicker headlines
    letterSpacing: '-0.015em',
    lineHeight: '1.1',
    color: '#000000'
  },
  sectionHeading: {
    fontFamily: 'Playfair Display, serif',
    fontWeight: '800', // Thick but not as thick as main titles
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
    color: '#000000'
  },
  subsectionTitle: {
    fontFamily: 'Inter, sans-serif', // FIXED: Back to Inter for subheadings
    fontWeight: '700',
    letterSpacing: '-0.005em',
    lineHeight: '1.3',
    color: '#000000'
  }
}

export default function CompleteRetailerProfile() {
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
  const [userInfo, setUserInfo] = useState({
    name: '',
    storeName: ''
  })
  const [uploading, setUploading] = useState(false)
  const [verificationPhoto, setVerificationPhoto] = useState(null)
  const [showAvatarSelector, setShowAvatarSelector] = useState(false)
  const [editingAboutMe, setEditingAboutMe] = useState(false)
  const [editingUserInfo, setEditingUserInfo] = useState(false) // NEW: For editing names
  const [verificationCode, setVerificationCode] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  
  // Easter egg state
  const [foundEasterEggs, setFoundEasterEggs] = useState([])
  const [showEasterEgg, setShowEasterEgg] = useState(null)
  const [easterEggProgress, setEasterEggProgress] = useState(0)
  
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const avatarFileInputRef = useRef(null)

  const avatarOptions = [
    '👤', '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '👨‍⚕️', '👩‍⚕️', '🧑‍🌾', '👨‍🍳', '👩‍🍳',
    '🌱', '🥬', '🥕', '🍎', '🥑', '🌿', '🌾', '🍯', '🧘‍♀️', '🧘‍♂️'
  ]

  // Brand verification codes
  const brandCodes = [
    { id: 'nature-made', name: 'Nature Made', description: 'Get your code from your Nature Made brand representative' },
    { id: 'garden-of-life', name: 'Garden of Life', description: 'Request code from Garden of Life regional manager' },
    { id: 'new-chapter', name: 'New Chapter', description: 'Contact New Chapter sales team for verification code' },
    { id: 'rainbow-light', name: 'Rainbow Light', description: 'Get code from Rainbow Light territory manager' },
    { id: 'nordic-naturals', name: 'Nordic Naturals', description: 'Request from Nordic Naturals brand ambassador' },
    { id: 'store-manager', name: 'Store Manager', description: 'Get verification code from your store manager' }
  ]

  // UPDATED communities with new names and descriptions
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
      id: 'supplement-scoop', // UPDATED: Changed from 'daily-stack'
      name: 'Supplement Scoop', // UPDATED: New name
      description: "Stop guessing what supplements actually work and start getting insider intel from the pros who sell $10M+ in products every year.",
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
      description: "Stop struggling alone with difficult customers and impossible sales targets while feeling burnt out and disconnected from your purpose. Connect with positive, high-performing natural health retailers.", // UPDATED: New description
      members: 1800, 
      active: false,
      isPublic: false,
      requiresVerification: true,
      hasEasterEggs: false,
      badge: "🔒 Verification Required"
    }
  ]

  // Example challenges for verified users
  const exampleChallenges = [
    {
      id: 'nature-made-quiz',
      brand: 'Nature Made',
      title: 'Vitamin D Knowledge Challenge',
      description: 'Test your knowledge about Vitamin D benefits and dosing recommendations',
      points: 150,
      difficulty: 'Intermediate',
      timeLimit: '10 minutes',
      questions: 15,
      badge: '🏆 Vitamin D Expert',
      requiresVerification: true
    },
    {
      id: 'garden-of-life-product',
      brand: 'Garden of Life',
      title: 'Probiotic Product Training',
      description: 'Learn about the latest probiotic formulations and customer recommendations',
      points: 200,
      difficulty: 'Advanced',
      timeLimit: '15 minutes',
      questions: 20,
      badge: '🌱 Probiotic Pro',
      requiresVerification: true
    },
    {
      id: 'nordic-naturals-omega',
      brand: 'Nordic Naturals',
      title: 'Omega-3 Sales Mastery',
      description: 'Master the art of selling omega-3 supplements with confidence',
      points: 175,
      difficulty: 'Intermediate',
      timeLimit: '12 minutes',
      questions: 18,
      badge: '🐟 Omega Expert',
      requiresVerification: true
    },
    {
      id: 'new-chapter-herbs',
      brand: 'New Chapter',
      title: 'Herbal Supplement Specialist',
      description: 'Become an expert in herbal supplements and their traditional uses',
      points: 225,
      difficulty: 'Advanced',
      timeLimit: '20 minutes',
      questions: 25,
      badge: '🌿 Herb Master',
      requiresVerification: true
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

  // Function to check for easter eggs - only when actually joining
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
    }
  }

  // Copy easter egg code to clipboard
  const copyEasterEggCode = (code) => {
    navigator.clipboard.writeText(code)
    alert('Code copied to clipboard!')
  }

  // Join community function - navigate to community page
  const joinCommunity = async (communityId) => {
    const community = communities.find(c => c.id === communityId)
    
    // Check if verification is required
    if (community.requiresVerification && user?.verificationStatus !== 'approved') {
      alert('This community requires verification. Please complete your verification first!')
      setActiveTab('verification')
      return
    }
    
    try {
      // Check if user is already a member
      const currentCommunities = user.joinedCommunities || []
      if (currentCommunities.includes(communityId)) {
        // Already a member, navigate to community page
        navigate(`/community/${communityId}`)
        return
      }
      
      // Actually join the community
      const updatedCommunities = [...currentCommunities, communityId]
      await updateDoc(doc(db, 'users', user.uid), {
        joinedCommunities: updatedCommunities
      })
      setUser(prev => ({ ...prev, joinedCommunities: updatedCommunities }))
      
      // Only check for easter eggs when actually joining for the first time
      await checkForEasterEgg(communityId)
      
      // Navigate to the community page
      navigate(`/community/${communityId}`)
      
    } catch (error) {
      console.error('Error joining community:', error)
      alert('Error joining community. Please try again.')
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
            setUserInfo({
              name: userData.name || currentUser.displayName || 'New User',
              storeName: userData.storeName || 'Unknown Store'
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
              joinedCommunities: []
            }
            await setDoc(doc(db, 'users', currentUser.uid), newUser)
            setUser(newUser)
            setUserInfo({
              name: newUser.name,
              storeName: newUser.storeName
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

  // IMPROVED: Avatar upload function with better error handling
  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0]
    if (file) {
      setUploading(true)
      try {
        // Check if storage is available
        if (!storage) {
          throw new Error('Firebase Storage not initialized')
        }

        // Upload to Firebase Storage
        const imageRef = ref(storage, `profile_images/${user.uid}/${Date.now()}_${file.name}`)
        console.log('Uploading to:', imageRef.fullPath)
        
        const uploadResult = await uploadBytes(imageRef, file)
        console.log('Upload successful:', uploadResult)
        
        const imageURL = await getDownloadURL(uploadResult.ref)
        console.log('Download URL:', imageURL)
        
        // Update user profile
        await updateDoc(doc(db, 'users', user.uid), {
          profileImage: imageURL
        })
        
        setProfileImage(imageURL)
        setUser(prev => ({ ...prev, profileImage: imageURL }))
        setShowAvatarSelector(false)
        alert('Profile photo uploaded successfully!')
        
      } catch (error) {
        console.error('Error uploading avatar:', error)
        alert(`Error uploading photo: ${error.message}. Please check Firebase Storage setup.`)
      } finally {
        setUploading(false)
      }
    }
  }

 const submitVerification = async () => {
  if (!verificationPhoto && !verificationCode) {
    alert('Please take a photo/upload an image OR enter a verification code.')
    return
  }

  setUploading(true)
  try {
    let photoURL = null
    
    // Upload photo if provided
    if (verificationPhoto) {
      console.log('Starting photo upload...')
      
      if (!storage) {
        throw new Error('Firebase Storage not initialized. Please check your Firebase configuration.')
      }
      
      if (!auth.currentUser) {
        throw new Error('User not authenticated. Please log in again.')
      }
      
      console.log('User authenticated:', auth.currentUser.uid)
      
      const fileName = `${Date.now()}_verification.jpg`
      const photoRef = ref(storage, `verification/${auth.currentUser.uid}/${fileName}`)
      
      console.log('Upload path:', photoRef.fullPath)
      console.log('File size:', verificationPhoto.size, 'bytes')
      console.log('File type:', verificationPhoto.type)
      
      // Add file size check
      if (verificationPhoto.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size too large. Please choose a file smaller than 10MB.')
      }
      
      // Add file type check
      if (!verificationPhoto.type.startsWith('image/')) {
        throw new Error('Please select a valid image file.')
      }
      
      console.log('Uploading file...')
      const uploadResult = await uploadBytes(photoRef, verificationPhoto)
      console.log('Upload successful:', uploadResult)
      
      console.log('Getting download URL...')
      photoURL = await getDownloadURL(photoRef)
      console.log('Download URL obtained:', photoURL)
    }
    
    // Generate daily verification code
    const today = new Date()
    const dailyCode = `ENG-${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}`
    
    console.log('Creating verification request...')
    
    // Create verification request
    const verificationRequest = {
      userId: auth.currentUser.uid,
      userEmail: auth.currentUser.email,
      userName: user.name,
      storeName: user.storeName,
      photoURL: photoURL,
      verificationCode: dailyCode,
      brandCode: verificationCode,
      selectedBrand: selectedBrand,
      submittedAt: new Date(),
      status: 'pending',
      adminNotes: ''
    }
    
    console.log('Adding to Firestore...')
    await addDoc(collection(db, 'verification_requests'), verificationRequest)
    
    console.log('Updating user status...')
    // Update user status
    await updateDoc(doc(db, 'users', auth.currentUser.uid), {
      verificationStatus: 'pending',
      lastVerificationSubmission: new Date()
    })
    
    setUser(prev => ({ ...prev, verificationStatus: 'pending' }))
    setVerificationPhoto(null)
    setVerificationCode('')
    setSelectedBrand('')
    
    console.log('Verification submitted successfully!')
    alert('Verification submitted successfully! We\'ll review your submission within 1-2 business days.')
    
  } catch (error) {
    console.error('Detailed error submitting verification:', error)
    
    // Provide specific error messages based on error type
    let errorMessage = 'Error submitting verification: '
    
    if (error.code === 'storage/unauthorized') {
      errorMessage += 'Permission denied. Please check your authentication status.'
    } else if (error.code === 'storage/canceled') {
      errorMessage += 'Upload was canceled. Please try again.'
    } else if (error.code === 'storage/unknown') {
      errorMessage += 'Unknown storage error. Please check your internet connection and try again.'
    } else if (error.message.includes('Firebase Storage not initialized')) {
      errorMessage += 'Storage configuration error. Please contact support.'
    } else if (error.message.includes('not authenticated')) {
      errorMessage += 'Please log out and log back in, then try again.'
    } else {
      errorMessage += error.message
    }
    
    alert(errorMessage)
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
      setEditingAboutMe(false)
      alert('About Me section updated successfully!')
    } catch (error) {
      console.error('Error updating about me:', error)
      alert('Error updating information. Please try again.')
    }
  }

  // NEW: Update user info (name and store name)
  const updateUserInfo = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: userInfo.name,
        storeName: userInfo.storeName
      })
      
      setUser(prev => ({ ...prev, name: userInfo.name, storeName: userInfo.storeName }))
      setEditingUserInfo(false)
      alert('Profile information updated successfully!')
    } catch (error) {
      console.error('Error updating user info:', error)
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
        <h3 className="text-lg font-semibold mb-4" style={fontStyles.sectionHeading}>
          {isVerified ? '🎉 Verified Benefits' : '🔒 Verification Benefits'}
        </h3>
        
        <div className="space-y-3">
          <div className={`flex items-center space-x-3 ${isVerified ? 'text-green-700' : 'text-gray-600'}`}>
            <span>{isVerified ? '✅' : '🔒'}</span>
            <span>Access to premium communities (Supplement Scoop, Fresh Finds, Good Vibes)</span>
          </div>
          <div className={`flex items-center space-x-3 ${isVerified ? 'text-green-700' : 'text-gray-600'}`}>
            <span>{isVerified ? '✅' : '🔒'}</span>
            <span>Exclusive brand challenges and training content</span>
          </div>
          <div className={`flex items-center space-x-3 ${isVerified ? 'text-green-700' : 'text-gray-600'}`}>
            <span>{isVerified ? '✅' : '🔒'}</span>
            <span>Earn points to stand out to brands and become a super user</span>
          </div>
          <div className={`flex items-center space-x-3 ${isVerified ? 'text-green-700' : 'text-gray-600'}`}>
            <span>{isVerified ? '✅' : '🔒'}</span>
            <span>Special access to prizes and exclusive product launches</span>
          </div>
          <div className={`flex items-center space-x-3 ${isVerified ? 'text-green-700' : 'text-gray-600'}`}>
            <span>{isVerified ? '✅' : '🔒'}</span>
            <span>Career advancement - status follows you to help get jobs and negotiate raises</span>
          </div>
          <div className="flex items-center space-x-3 text-green-700">
            <span>✅</span>
            <span>Access to "What's Good" community (available to all!)</span>
          </div>
        </div>
        
        {!isVerified && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              <strong>Current Status:</strong> You have access to "What's Good" community. Get verified to unlock premium communities and advance your career!
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
              <h3 className="text-lg font-semibold text-gray-900" style={fontStyles.subsectionTitle}>{community.name}</h3>
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

  const ChallengeCard = ({ challenge }) => {
    const canAccess = user?.verificationStatus === 'approved'
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900" style={fontStyles.subsectionTitle}>{challenge.title}</h3>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {challenge.brand}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-3">{challenge.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
              <span>🏆 {challenge.points} points</span>
              <span>⏱️ {challenge.timeLimit}</span>
              <span>❓ {challenge.questions} questions</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                challenge.difficulty === 'Advanced' ? 'bg-red-100 text-red-800' :
                challenge.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {challenge.difficulty}
              </span>
              <span className="text-xs text-gray-500">{challenge.badge}</span>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            {!canAccess && (
              <p className="text-sm text-orange-600 mb-2">
                🔒 Verification required to access brand challenges
              </p>
            )}
          </div>
          
          <button
            onClick={() => canAccess ? alert('Challenge feature coming soon!') : setActiveTab('verification')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              canAccess
                ? 'bg-brand-primary text-white hover:bg-brand-primary/90'
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            }`}
          >
            {canAccess ? 'Start Challenge' : 'Get Verified'}
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
                <h1 className="text-3xl text-gray-900" style={fontStyles.mainTitle}>Welcome back, {user?.name}!</h1>
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
                <h2 className="text-xl mb-4" style={fontStyles.sectionHeading}>Profile Information</h2>
                
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
                        onChange={handleAvatarUpload}
                        ref={avatarFileInputRef}
                        className="hidden"
                      />
                      <button
                        onClick={() => avatarFileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full bg-brand-primary text-white py-2 px-4 rounded-lg hover:bg-brand-primary/90 mb-2 disabled:opacity-50"
                      >
                        {uploading ? '⏳ Uploading...' : '📁 Upload Custom Photo'}
                      </button>
                      <button
                        onClick={() => setShowAvatarSelector(false)}
                        className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  
                  {/* NEW: Editable User Info */}
                  {editingUserInfo ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={userInfo.name}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded text-center font-medium"
                        placeholder="Your Name"
                      />
                      <input
                        type="text"
                        value={userInfo.storeName}
                        onChange={(e) => setUserInfo(prev => ({ ...prev, storeName: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded text-center text-gray-600"
                        placeholder="Store Name"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={updateUserInfo}
                          className="flex-1 bg-brand-primary text-white py-1 px-3 rounded text-sm hover:bg-brand-primary/90"
                        >
                          💾 Save
                        </button>
                        <button
                          onClick={() => setEditingUserInfo(false)}
                          className="flex-1 bg-gray-100 text-gray-700 py-1 px-3 rounded text-sm hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-center space-x-2">
                        <h2 className="text-xl text-gray-900" style={fontStyles.subsectionTitle}>{user?.name}</h2>
                        <button
                          onClick={() => setEditingUserInfo(true)}
                          className="text-brand-primary hover:text-brand-primary/80 text-sm"
                        >
                          ✏️
                        </button>
                      </div>
                      <p className="text-gray-600">{user?.storeName}</p>
                      <div className="mt-2">{getStatusBadge()}</div>
                    </div>
                  )}
                </div>

                {/* About Me Section - Integrated */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg" style={fontStyles.subsectionTitle}>About Me</h3>
                    <button
                      onClick={() => setEditingAboutMe(!editingAboutMe)}
                      className="text-brand-primary hover:text-brand-primary/80 text-sm"
                    >
                      {editingAboutMe ? 'Cancel' : 'Edit'}
                    </button>
                  </div>
                  
                  {editingAboutMe ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Interests</label>
                        <textarea
                          value={aboutMe.interests}
                          onChange={(e) => setAboutMe(prev => ({ ...prev, interests: e.target.value }))}
                          placeholder="What products are you passionate about?"
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <input
                          type="text"
                          value={aboutMe.location}
                          onChange={(e) => setAboutMe(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="City, State"
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Your Story</label>
                        <textarea
                          value={aboutMe.story}
                          onChange={(e) => setAboutMe(prev => ({ ...prev, story: e.target.value }))}
                          placeholder="Tell us about your journey..."
                          className="w-full p-2 border border-gray-300 rounded text-sm"
                          rows={3}
                        />
                      </div>
                      <button
                        onClick={updateAboutMe}
                        className="w-full bg-brand-primary text-white py-2 px-4 rounded-lg hover:bg-brand-primary/90 text-sm"
                      >
                        💾 Save Changes
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 text-sm">
                      {aboutMe.interests && (
                        <div>
                          <span className="font-medium text-gray-700">Interests:</span>
                          <p className="text-gray-600 mt-1">{aboutMe.interests}</p>
                        </div>
                      )}
                      {aboutMe.location && (
                        <div>
                          <span className="font-medium text-gray-700">Location:</span>
                          <p className="text-gray-600 mt-1">{aboutMe.location}</p>
                        </div>
                      )}
                      {aboutMe.story && (
                        <div>
                          <span className="font-medium text-gray-700">Story:</span>
                          <p className="text-gray-600 mt-1">{aboutMe.story}</p>
                        </div>
                      )}
                      {!aboutMe.interests && !aboutMe.location && !aboutMe.story && (
                        <p className="text-gray-500 italic">Click "Edit" to add your information</p>
                      )}
                    </div>
                  )}
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
              <h2 className="text-2xl mb-4" style={fontStyles.sectionHeading}>Verification Options</h2>
              
              <div className="space-y-6">
                {/* Photo Verification */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg mb-3" style={fontStyles.subsectionTitle}>📸 Photo Verification</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-blue-800 text-sm">
                      Take a photo of yourself <strong>in-store with your name tag or apron visible</strong>. 
                      Include today's verification code <strong>ENG-{String(new Date().getDate()).padStart(2, '0')}{String(new Date().getMonth() + 1).padStart(2, '0')}</strong> 
                      written on a piece of paper in the photo.
                    </p>
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
                    </div>
                  )}
                </div>

                {/* Code Verification */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg mb-3" style={fontStyles.subsectionTitle}>🔑 Brand/Manager Code Verification</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Get a verification code from your store manager or brand representative.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Brand/Source</label>
                      <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                      >
                        <option value="">Choose brand or source...</option>
                        {brandCodes.map(brand => (
                          <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    {selectedBrand && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">
                          {brandCodes.find(b => b.id === selectedBrand)?.description}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Enter your verification code"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={submitVerification}
                  disabled={uploading || (!verificationPhoto && !verificationCode)}
                  className="w-full bg-brand-primary text-white py-3 px-4 rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? '⏳ Submitting...' : '✅ Submit Verification'}
                </button>
                
                {verificationPhoto && (
                  <button
                    onClick={() => setVerificationPhoto(null)}
                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                  >
                    🔄 Clear Photo
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'communities' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl text-gray-900 mb-2" style={fontStyles.sectionHeading}>Communities</h2>
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
          <div>
            <div className="mb-6">
              <h2 className="text-2xl text-gray-900 mb-2" style={fontStyles.sectionHeading}>Brand Challenges</h2>
              <p className="text-gray-600">
                Complete brand challenges to earn points, badges, and advance your career in natural health retail!
              </p>
              {user?.verificationStatus !== 'approved' && (
                <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-orange-800 text-sm">
                    🔒 Get verified to unlock exclusive brand challenges and training content!
                  </p>
                </div>
              )}
            </div>
            
            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
              {exampleChallenges.map(challenge => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Easter Egg Modal */}
      {showEasterEgg && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl mb-4" style={fontStyles.subsectionTitle}>{showEasterEgg.title}</h3>
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

