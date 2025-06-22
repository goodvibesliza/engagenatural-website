import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { auth, db } from '../lib/firebase'
import { doc, getDoc, collection, addDoc, getDocs, query, where, orderBy, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'

// Font styles matching the updated App.css
const fontStyles = {
  mainTitle: {
    fontFamily: 'Playfair Display, serif',
    fontWeight: '800',
    letterSpacing: '-0.015em',
    lineHeight: '1.1'
  },
  sectionHeading: {
    fontFamily: 'Playfair Display, serif',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    lineHeight: '1.2'
  },
  subsectionTitle: {
    fontFamily: 'Playfair Display, serif',
    fontWeight: '600',
    letterSpacing: '-0.01em',
    lineHeight: '1.3'
  }
}

export default function CommunityPage() {
  const [user, setUser] = useState(null)
  const [community, setCommunity] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [showNewPost, setShowNewPost] = useState(false)
  const navigate = useNavigate()
  const { communityId } = useParams()

  // Helper function to display profile image properly
  const getProfileImageDisplay = (user) => {
    if (!user) return '👤'
    
    // If profileImage is a URL, return an img element
    if (user.profileImage && (user.profileImage.startsWith('http') || user.profileImage.startsWith('data:'))) {
      return (
        <img 
          src={user.profileImage} 
          alt="Profile" 
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
        />
      )
    }
    
    // If it's just a filename or emoji, return the emoji or default
    return user.profileImage || '👤'
  }

  // ENHANCED navigation function with multiple fallback methods
  const handleBackToProfile = () => {
    console.log('Attempting to navigate to profile...')
    
    // Method 1: Try React Router navigate first
    try {
      navigate('/profile', { replace: true })
      console.log('React Router navigation attempted')
      return
    } catch (error) {
      console.error('React Router navigation failed:', error)
    }
    
    // Method 2: If React Router fails, try window.location
    try {
      window.location.href = '/profile'
      console.log('Window location navigation attempted')
      return
    } catch (error) {
      console.error('Window location navigation failed:', error)
    }
    
    // Method 3: Last resort - try relative path
    try {
      window.location.pathname = '/profile'
      console.log('Pathname navigation attempted')
    } catch (error) {
      console.error('All navigation methods failed:', error)
      // If all else fails, at least log the issue
      alert('Navigation failed. Please manually navigate to your profile.')
    }
  }

  // Sample posts for "What's Good" community
  const samplePosts = [
    {
      id: 'post-1',
      author: 'Sarah M.',
      authorRole: 'Supplement Specialist',
      authorAvatar: '👩‍💼',
      verified: true,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      content: "🔥 JUST IN: New Nordic Naturals Omega-3 formula just dropped! The bioavailability is incredible - customers are already asking for it by name. Anyone else seeing the buzz?",
      likes: 23,
      comments: 8,
      shares: 5,
      tags: ['#ProductDrop', '#Omega3', '#NordicNaturals'],
      type: 'product-drop'
    },
    {
      id: 'post-2',
      author: 'Mike R.',
      authorRole: 'Store Manager',
      authorAvatar: '👨‍💼',
      verified: true,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      content: "Industry insider tip: Adaptogenic herbs are about to EXPLODE this quarter. Stock up on ashwagandha, rhodiola, and holy basil now. Trust me on this one! 📈",
      likes: 45,
      comments: 12,
      shares: 18,
      tags: ['#IndustryBuzz', '#Adaptogens', '#StockTip'],
      type: 'industry-buzz'
    },
    {
      id: 'post-3',
      author: 'Jessica L.',
      authorRole: 'Natural Health Advisor',
      authorAvatar: '🌿',
      verified: true,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      content: "🎉 EASTER EGG ALERT! 🥚 Found a hidden discount code in the new Garden of Life display - SPRING25 for 25% off! Shh... don't tell everyone 😉",
      likes: 67,
      comments: 24,
      shares: 31,
      tags: ['#EasterEgg', '#DiscountCode', '#GardenOfLife'],
      type: 'easter-egg',
      isEasterEgg: true
    },
    {
      id: 'post-4',
      author: 'David K.',
      authorRole: 'Vitamin Specialist',
      authorAvatar: '💊',
      verified: true,
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      content: "Breaking: FDA just approved new health claims for Vitamin D3. This is HUGE for our sales pitch! Customers can now legally hear about immune support benefits. Game changer! 🚀",
      likes: 89,
      comments: 34,
      shares: 42,
      tags: ['#FDA', '#VitaminD3', '#HealthClaims', '#GameChanger'],
      type: 'industry-buzz'
    },
    {
      id: 'post-5',
      author: 'Amanda T.',
      authorRole: 'Organic Produce Expert',
      authorAvatar: '🥬',
      verified: true,
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      content: "🌟 NEW PRODUCT SPOTLIGHT: Just tried the new collagen peptides from Vital Proteins. The vanilla flavor is incredible and mixes perfectly in coffee. Customers are going to love this!",
      likes: 34,
      comments: 15,
      shares: 9,
      tags: ['#ProductSpotlight', '#Collagen', '#VitalProteins'],
      type: 'product-drop'
    }
  ]

  // Community data with updated restrictions for "What's Good"
  const communityData = {
    'whats-good': {
      id: 'whats-good',
      name: "What's Good",
      description: "Check out What's Good for the latest product drops and industry buzz!",
      members: 2500,
      isPublic: true,
      requiresVerification: false,
      hasEasterEggs: true,
      badge: "🌟 Open to All",
      coverImage: "🌟",
      viewOnlyForUnverified: true, // NEW: View-only for unverified users
      allowedPostTypes: ['product-drop', 'industry-buzz', 'community-shoutout', 'affirmation'], // NEW: Restricted post types
      adminOnly: false, // NEW: Will be set to true for admin-only posting
      rules: [
        "Share the latest product drops and industry news",
        "Community shout-outs and affirmations welcome",
        "Verified users and brands can post about products",
        "Be respectful and professional",
        "No spam or self-promotion",
        "Keep posts relevant to natural health retail"
      ]
    },
    'daily-stack': {
      id: 'daily-stack',
      name: 'The Daily Stack',
      description: "Stop guessing what supplements actually work and start getting insider intel from the pros.",
      members: 850,
      isPublic: false,
      requiresVerification: true,
      hasEasterEggs: false,
      badge: "🔒 Verification Required",
      viewOnlyForUnverified: false,
      allowedPostTypes: ['all'],
      adminOnly: false
    }
  }

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
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          // Don't redirect on error, just log it
        }
      } else {
        // Only redirect to login if we're not on a public page
        if (window.location.pathname !== '/') {
          navigate('/login')
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [navigate])

  useEffect(() => {
    if (communityId) {
      const communityInfo = communityData[communityId]
      if (communityInfo) {
        setCommunity(communityInfo)
        // For demo purposes, use sample posts for "What's Good"
        if (communityId === 'whats-good') {
          setPosts(samplePosts)
        }
      }
    }
  }, [communityId])

  // Check if user can post in this community
  const canUserPost = () => {
    if (!user || !community) return false
    
    // Admin can always post
    if (user.role === 'admin') return true
    
    // If community is admin-only, only admins can post
    if (community.adminOnly) return false
    
    // For "What's Good" community - check verification status
    if (community.id === 'whats-good') {
      // Unverified users can only view
      if (community.viewOnlyForUnverified && !user.verified) {
        return false
      }
      
      // Verified users and brands can post
      if (user.verified || user.role === 'brand') {
        return true
      }
      
      return false
    }
    
    // For other communities, check verification requirements
    if (community.requiresVerification && !user.verified) {
      return false
    }
    
    return true
  }

  // Get posting restrictions message
  const getPostingRestrictionMessage = () => {
    if (!user || !community) return ''
    
    if (community.id === 'whats-good') {
      if (!user.verified && user.role !== 'brand') {
        return "This community is view-only for unverified users. Get verified to share product drops and industry buzz!"
      }
      if (community.adminOnly) {
        return "Only admins can post in this community."
      }
    }
    
    if (community.requiresVerification && !user.verified) {
      return "Verification required to post in this community."
    }
    
    return ''
  }

  const handleLike = async (postId) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, likes: post.likes + 1 }
          : post
      )
    )
  }

  const handleShare = async (postId) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, shares: post.shares + 1 }
          : post
      )
    )
    alert('Post shared! (Feature coming soon)')
  }

  const createPost = async () => {
    if (!newPost.trim()) return

    const post = {
      id: `post-${Date.now()}`,
      author: user.name,
      authorRole: user.role || 'Community Member',
      authorAvatar: user.profileImage || '👤',
      verified: user.verified || false,
      timestamp: new Date(),
      content: newPost,
      likes: 0,
      comments: 0,
      shares: 0,
      tags: [],
      type: 'user-post'
    }

    setPosts(prevPosts => [post, ...prevPosts])
    setNewPost('')
    setShowNewPost(false)
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const diff = now - timestamp
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ago`
    } else if (minutes > 0) {
      return `${minutes}m ago`
    } else {
      return 'Just now'
    }
  }

  const getPostTypeIcon = (type) => {
    switch (type) {
      case 'product-drop': return '🔥'
      case 'industry-buzz': return '📈'
      case 'easter-egg': return '🥚'
      case 'community-shoutout': return '📣'
      case 'affirmation': return '💪'
      case 'user-post': return '💬'
      default: return '📝'
    }
  }

  const getPostTypeLabel = (type) => {
    switch (type) {
      case 'product-drop': return 'Product Drop'
      case 'industry-buzz': return 'Industry Buzz'
      case 'easter-egg': return 'Easter Egg'
      case 'community-shoutout': return 'Community Shoutout'
      case 'affirmation': return 'Affirmation'
      case 'user-post': return 'Community Post'
      default: return 'Post'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-gray-900 mb-4" style={fontStyles.sectionHeading}>Community Not Found</h1>
          <button
            onClick={handleBackToProfile}
            className="bg-brand-primary text-white px-6 py-2 rounded-lg hover:bg-brand-primary/90"
          >
            Back to Profile
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
                onClick={handleBackToProfile}
                className="text-brand-primary hover:text-brand-primary/80 font-medium transition-colors"
                style={{ textDecoration: 'none' }}
              >
                ← Back to Profile
              </button>
              <div>
                <div className="flex items-center space-x-3">
                  <div className="text-4xl">{community.coverImage}</div>
                  <div>
                    <h1 className="text-3xl text-gray-900" style={fontStyles.mainTitle}>{community.name}</h1>
                    <p className="text-gray-600 mt-1">{community.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-sm text-gray-500">👥 {community.members.toLocaleString()} members</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        community.isPublic 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {community.badge}
                      </span>
                      {community.viewOnlyForUnverified && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          📖 View-Only for Unverified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-brand-primary">{user?.points || 0} pts</div>
              <div className="text-sm text-gray-600">Level {user?.level || 1}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* New Post Section */}
            {user && canUserPost() && (
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
                {!showNewPost ? (
                  <button
                    onClick={() => setShowNewPost(true)}
                    className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {typeof getProfileImageDisplay(user) === 'string' ? (
                          getProfileImageDisplay(user)
                        ) : (
                          <>
                            {getProfileImageDisplay(user)}
                            <span className="hidden">👤</span>
                          </>
                        )}
                      </div>
                      <span className="text-gray-500">
                        {community.id === 'whats-good' 
                          ? "Share product drops, industry buzz, or community shout-outs..."
                          : "What's good in your store today?"
                        }
                      </span>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {typeof getProfileImageDisplay(user) === 'string' ? (
                          getProfileImageDisplay(user)
                        ) : (
                          <>
                            {getProfileImageDisplay(user)}
                            <span className="hidden">👤</span>
                          </>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.role || 'Community Member'}</div>
                      </div>
                    </div>
                    <textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder={
                        community.id === 'whats-good'
                          ? "Share the latest product drops, industry buzz, community shout-outs, or affirmations..."
                          : "Share the latest product drops, industry buzz, or what's working in your store..."
                      }
                      className="w-full p-4 border border-gray-300 rounded-lg resize-none"
                      rows={4}
                    />
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setShowNewPost(false)
                          setNewPost('')
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createPost}
                        disabled={!newPost.trim()}
                        className="bg-brand-primary text-white px-6 py-2 rounded-lg hover:bg-brand-primary/90 disabled:opacity-50"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Posting Restriction Message */}
            {user && !canUserPost() && getPostingRestrictionMessage() && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-orange-600">ℹ️</span>
                  <p className="text-orange-800 text-sm">{getPostingRestrictionMessage()}</p>
                </div>
              </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post.id} className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${
                  post.isEasterEgg ? 'ring-2 ring-purple-200 bg-gradient-to-r from-purple-50 to-pink-50' : ''
                }`}>
                  {/* Post Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl overflow-hidden">
                          {typeof post.authorAvatar === 'string' && (post.authorAvatar.startsWith('http') || post.authorAvatar.startsWith('data:')) ? (
                            <>
                              <img 
                                src={post.authorAvatar} 
                                alt="Profile" 
                                className="w-full h-full object-cover rounded-full"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  e.target.nextSibling.style.display = 'flex'
                                }}
                              />
                              <span className="hidden">👤</span>
                            </>
                          ) : (
                            post.authorAvatar
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{post.author}</span>
                            {post.verified && <span className="text-green-600">✓</span>}
                          </div>
                          <div className="text-sm text-gray-500">{post.authorRole}</div>
                          <div className="text-xs text-gray-400">{formatTimeAgo(post.timestamp)}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getPostTypeIcon(post.type)}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {getPostTypeLabel(post.type)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="px-6 pb-4">
                    <p className="text-gray-800 leading-relaxed">{post.content}</p>
                    
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {post.tags.map((tag, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Post Actions */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <button
                          onClick={() => handleLike(post.id)}
                          className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors"
                        >
                          <span>❤️</span>
                          <span className="text-sm">{post.likes}</span>
                        </button>
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                          <span>💬</span>
                          <span className="text-sm">{post.comments}</span>
                        </button>
                        <button
                          onClick={() => handleShare(post.id)}
                          className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors"
                        >
                          <span>🔄</span>
                          <span className="text-sm">{post.shares}</span>
                        </button>
                      </div>
                      {post.isEasterEgg && (
                        <div className="text-xs text-purple-600 font-medium">
                          🥚 Easter Egg Found!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Community Info */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h3 className="text-lg mb-4" style={fontStyles.subsectionTitle}>Community Guidelines</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  {community.rules?.map((rule, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Easter Egg Tracker */}
              {community.hasEasterEggs && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-md p-6 border border-purple-200">
                  <h3 className="text-lg mb-4" style={fontStyles.subsectionTitle}>🥚 Easter Egg Hunt</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Hidden treasures are scattered throughout this community! Keep an eye out for special posts and codes.
                  </p>
                  <div className="text-xs text-purple-600">
                    Found: {posts.filter(p => p.isEasterEgg).length} eggs in this community
                  </div>
                </div>
              )}

              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h3 className="text-lg mb-4" style={fontStyles.subsectionTitle}>Community Stats</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Posts</span>
                    <span className="font-medium">{posts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Today</span>
                    <span className="font-medium">{Math.floor(community.members * 0.15)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Product Drops</span>
                    <span className="font-medium">{posts.filter(p => p.type === 'product-drop').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Industry Buzz</span>
                    <span className="font-medium">{posts.filter(p => p.type === 'industry-buzz').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Community Shoutouts</span>
                    <span className="font-medium">{posts.filter(p => p.type === 'community-shoutout').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Affirmations</span>
                    <span className="font-medium">{posts.filter(p => p.type === 'affirmation').length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

