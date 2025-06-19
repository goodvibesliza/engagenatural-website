import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db, storage } from '../lib/firebase'
import { doc, getDoc, setDoc, updateDoc, collection, addDoc } from 'firebase/firestore'
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
  
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  const avatarOptions = [
    '👤', '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '👨‍⚕️', '👩‍⚕️', '🧑‍🌾', '👨‍🍳', '👩‍🍳',
    '🌱', '🥬', '🥕', '🍎', '🥑', '🌿', '🌾', '🍯', '🧘‍♀️', '🧘‍♂️'
  ]
const [foundEasterEggs, setFoundEasterEggs] = useState([])
const [showEasterEgg, setShowEasterEgg] = useState(null)

// Function to check for easter eggs
const checkForEasterEgg = async (communityId) => {
  if (communityId === 'whats-good') {
    // Random chance to find an easter egg
    if (Math.random() < 0.1) { // 10% chance
      // Show easter egg popup
      setShowEasterEgg({
        title: "🎉 Hidden Gem Alert!",
        content: "You found a secret!(BRANDS INSERT PRIZE HERE) E.G. Use code INSIDER20 for 20% off your next supplement purchase!",
        code: "INSIDER20"
      })
    
  const communities = [
  { 
    id: 'whats-good', 
    name: "What's Good", 
    description: "Check out What's Good for the latest product drops and industry buzz!",
    members: 2500, 
    active: true,
    isPublic: true,
    requiresVerification: false,
    hasEasterEggs: true
  },
  { 
    id: 'daily-stack', 
    name: 'The Daily Stack', 
    description: "Stop guessing what supplements actually work and start getting insider intel from the pros who sell $10M+ in products every year.",
    members: 850, 
    active: false,
    isPublic: false,
    requiresVerification: true,
    hasEasterEggs: false
  },
  { 
    id: 'fresh-finds', 
    name: 'Fresh Finds', 
    description: "Quit losing customers to competitors who know which natural/organic products are trending before you do.",
    members: 1200, 
    active: false,
    isPublic: false,
    requiresVerification: true,
    hasEasterEggs: false
  },
  { 
    id: 'good-vibes', 
    name: 'Good Vibes', 
    description: "Stop struggling alone with difficult customers and impossible sales targets while feeling burnt out and disconnected from your purpose. Connect with positive, high-performing natural health retailers who celebrate wins together.",
    members: 1800, 
    active: false,
    isPublic: false,
    requiresVerification: true,
    hasEasterEggs: false
  }
]

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
            <span>Access to free product samples</span>
          </div>
          <div className={`flex items-center space-x-3 ${isVerified ? 'text-green-700' : 'text-gray-600'}`}>
            <span>{isVerified ? '✅' : '🔒'}</span>
            <span>Exclusive contests and giveaways</span>
          </div>
          <div className={`flex items-center space-x-3 ${isVerified ? 'text-green-700' : 'text-gray-600'}`}>
            <span>{isVerified ? '✅' : '🔒'}</span>
            <span>Premium educational content</span>
          </div>
          <div className={`flex items-center space-x-3 ${isVerified ? 'text-green-700' : 'text-gray-600'}`}>
            <span>{isVerified ? '✅' : '🔒'}</span>
            <span>Full community access and features</span>
          </div>
          <div className={`flex items-center space-x-3 ${isVerified ? 'text-green-700' : 'text-gray-600'}`}>
            <span>{isVerified ? '✅' : '🔒'}</span>
            <span>Priority customer support</span>
          </div>
        </div>
        
        {!isVerified && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              <strong>Current Status:</strong> You have limited access. Get verified to unlock all features!
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
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl overflow-hidden">
                      {profileImage ? (
                        profileImage.startsWith('http') ? (
                          <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span>{profileImage}</span>
                        )
                      ) : (
                        <span>👤</span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowAvatarSelector(true)}
                      className="absolute -bottom-2 -right-2 bg-brand-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm hover:bg-brand-primary/90"
                    >
                      ✏️
                    </button>
                  </div>
                  
                  {showAvatarSelector && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="font-heading text-lg font-semibold mb-4">Choose Profile Picture</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photo</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files[0]) {
                                  uploadProfileImage(e.target.files[0])
                                  setShowAvatarSelector(false)
                                }
                              }}
                              className="w-full"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Or Choose Avatar</label>
                            <div className="grid grid-cols-5 gap-2">
                              {avatarOptions.map((avatar, index) => (
                                <button
                                  key={index}
                                  onClick={() => selectAvatar(avatar)}
                                  className="w-12 h-12 text-2xl hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                  {avatar}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end mt-6">
                          <button
                            onClick={() => setShowAvatarSelector(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
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
                    <p className="text-sm text-gray-500">Verification Status</p>
                    <div className="mt-1">{getStatusBadge()}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Points</p>
                    <p className="font-medium text-brand-primary">{user?.points || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Level</p>
                    <p className="font-medium">{user?.level || 1}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-2">
              {getVerificationBenefits()}
            </div>
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="font-heading text-2xl font-bold mb-6">Verification Center</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-heading text-lg font-semibold mb-4">Current Status</h3>
                  <div className="mb-4">{getStatusBadge()}</div>
                  
                  {user?.verificationStatus === 'not_submitted' && (
                    <div className="space-y-4">
                      <p>To get verified, you need to:</p>
                      <ol className="list-decimal pl-5 space-y-2 text-sm">
                        <li>Take a photo in your store wearing your name tag/apron</li>
                        <li>Include today's verification code: <strong>ENG-{String(new Date().getDate()).padStart(2, '0')}{String(new Date().getMonth() + 1).padStart(2, '0')}</strong></li>
                        <li>Submit the photo for review</li>
                      </ol>
                    </div>
                  )}
                  
                  {user?.verificationStatus === 'pending' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <p className="text-yellow-800">
                        Your verification is under review. We'll notify you within 1-2 business days.
                      </p>
                    </div>
                  )}
                  
                  {user?.verificationStatus === 'approved' && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <p className="text-green-800">
                        🎉 Congratulations! Your account is verified and you have full access to all features.
                      </p>
                    </div>
                  )}
                  
                  {user?.verificationStatus === 'rejected' && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <p className="text-red-800 mb-2">Your verification was rejected:</p>
                      <p className="text-red-700 text-sm">{user?.rejectionReason || "Please ensure your photo meets all requirements and try again."}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  {(user?.verificationStatus === 'not_submitted' || user?.verificationStatus === 'rejected') && (
                    <div className="space-y-4">
                      <h3 className="font-heading text-lg font-semibold">Submit Verification Photo</h3>
                      
                      <div className="space-y-3">
                        <button
                          onClick={startCamera}
                          className="w-full bg-brand-primary text-white py-3 px-4 rounded-lg hover:bg-brand-primary/90 transition-colors"
                        >
                          📷 Take Photo with Camera
                        </button>
                        
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          📁 Upload from Computer
                        </button>
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                      
                      {verificationPhoto && (
                        <div className="space-y-3">
                          <p className="text-sm text-green-600">✓ Photo ready for submission</p>
                          <button
                            onClick={submitVerification}
                            disabled={uploading}
                            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {uploading ? 'Submitting...' : 'Submit Verification'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-8">
                {getVerificationBenefits()}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="font-heading text-2xl font-bold mb-6">About Me</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interests</label>
                  <textarea
                    value={aboutMe.interests}
                    onChange={(e) => setAboutMe(prev => ({ ...prev, interests: e.target.value }))}
                    placeholder="What are you passionate about? (e.g., natural health, organic foods, fitness, etc.)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    rows="3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={aboutMe.location}
                    onChange={(e) => setAboutMe(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, State (e.g., Austin, TX)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">My Story</label>
                  <textarea
                    value={aboutMe.story}
                    onChange={(e) => setAboutMe(prev => ({ ...prev, story: e.target.value }))}
                    placeholder="Tell us about your journey in natural retail, what motivates you, and what you love about helping customers..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    rows="5"
                  />
                </div>
                
                <button
                  onClick={updateAboutMe}
                  className="w-full bg-brand-primary text-white py-3 px-4 rounded-lg hover:bg-brand-primary/90 transition-colors"
                >
                  Save About Me
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'communities' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="font-heading text-2xl font-bold mb-6">My Communities</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {communities.map(community => (
                  <div key={community.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-heading text-lg font-semibold">{community.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        community.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {community.active ? 'Active' : 'Available'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">
                      {community.members.toLocaleString()} members
                    </p>
                    
                    <button
                      className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                        community.active
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-brand-primary text-white hover:bg-brand-primary/90'
                      }`}
                    >
                      {community.active ? 'View Community' : 'Join Community'}
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-heading text-lg font-semibold text-blue-900 mb-2">
                  🌟 Unlock More Communities
                </h3>
                <p className="text-blue-800 text-sm">
                  Get verified to access exclusive communities and connect with top performers in your field!
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h2 className="font-heading text-2xl font-bold mb-6">Challenges</h2>
              <p className="text-gray-600 mb-6">Complete challenges to earn points and unlock exclusive content!</p>
              
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="font-heading text-xl font-semibold mb-2">Challenges Coming Soon!</h3>
                <p className="text-gray-600">
                  We're preparing exciting challenges for you. Get verified to be the first to access them!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="font-heading text-lg font-semibold mb-4">Take Verification Photo</h3>
            
            <div className="space-y-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
              
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={capturePhoto}
                  className="bg-brand-primary text-white px-6 py-2 rounded-lg hover:bg-brand-primary/90"
                >
                  📷 Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

