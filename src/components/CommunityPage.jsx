import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { auth, db } from '../lib/firebase'
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, where, orderBy, arrayUnion, arrayRemove } from 'firebase/firestore'

// Font styles matching the updated App.css
const fontStyles = {
  mainTitle: {
    fontFamily: 'Playfair Display, serif',
    fontWeight: '900',
    letterSpacing: '-0.015em',
    lineHeight: '1.1',
    color: '#000000'
  },
  sectionHeading: {
    fontFamily: 'Playfair Display, serif',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
    color: '#000000'
  },
  subsectionTitle: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: '700',
    letterSpacing: '-0.005em',
    lineHeight: '1.3',
    color: '#000000'
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

  // Sample posts for "What's Good" community
  const samplePosts = [
    {
      id: 'post-1',
      author: 'Sarah M.',
      authorRole: 'Supplement Specialist',
      authorAvatar: '👩‍⚕️',
      verified: true,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      content: "🔥 JUST IN: New Nordic Naturals Omega-3 formula just dropped! The bioavailability is incredible - customers are already asking for it by name. Stock up now!",
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
      content: "Industry insider tip: Adaptogenic herbs are about to EXPLODE this quarter. Stock up on ashwagandha, rhodiola, and holy basil NOW. You heard it here first! 📈",
      likes: 45,
      comments: 12,
      shares: 18,
      tags: ['#IndustryBuzz', '#Adaptogens', '#StockTip'],
      type: 'industry-buzz'
    },
    {
      id: 'post-3',
      author: 'Jessica L.',
      authorRole: 'Brand Ambassador',
      authorAvatar: '🌟',
      verified: true,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      content: "Shoutout to everyone crushing their Q1 goals! 💪 Remember: we're not just selling supplements, we're changing lives. Every customer interaction matters. Keep being amazing! ✨",
      likes: 67,
      comments: 15,
      shares: 22,
      tags: ['#Motivation', '#TeamWork', '#Q1Goals'],
      type: 'community-shoutout'
    },
    {
      id: 'post-4',
      author: 'Garden of Life',
      authorRole: 'Brand Partner',
      authorAvatar: '🌱',
      verified: true,
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      content: "NEW LAUNCH ALERT! 🚨 Our Raw Organic Perfect Food Green Superfood is now available with enhanced digestive enzymes. Perfect for customers looking to boost their daily nutrition naturally!",
      likes: 89,
      comments: 24,
      shares: 31,
      tags: ['#NewLaunch', '#GreenSuperfood', '#Organic'],
      type: 'brand-announcement'
    }
  ]

  // Community data
  const communities = {
    'whats-good': {
      id: 'whats-good',
      name: "What's Good",
      description: "Check out What's Good for the latest product drops and industry buzz!",
      members: 2500,
      isPublic: true,
      requiresVerification: false,
      hasEasterEggs: true,
      badge: "🌟 Open to All",
      rules: [
        "Share the latest product drops and industry news",
        "Be respectful and professional",
        "No spam or self-promotion",
        "Keep posts relevant to natural health retail"
      ],
      allowedPostTypes: ['product-drop', 'industry-buzz', 'community-shoutout', 'brand-announcement'],
      viewOnlyForUnverified: true // NEW: View-only for unverified users
    },
    'supplement-scoop': {
      id: 'supplement-scoop',
      name: 'Supplement Scoop',
      description: "Stop guessing what supplements actually work and start getting insider intel from the pros who sell $10M+ in products every year.",
      members: 850,
      isPublic: false,
      requiresVerification: true,
      hasEasterEggs: false,
      badge: "🔒 Verification Required",
      rules: [
        "Share proven supplement strategies",
        "Back claims with sales data",
        "Respect competitor information",
        "Focus on customer success stories"
      ],
      allowedPostTypes: ['strategy', 'data-insight', 'success-story'],
      viewOnlyForUnverified: false
    }
  }

  // Get post type icon
  const getPostTypeIcon = (type) => {
    const icons = {
      'product-drop': '🔥',
      'industry-buzz': '📈',
      'community-shoutout': '💪',
      'brand-announcement': '🚨',
      'strategy': '🎯',
      'data-insight': '📊',
      'success-story': '🏆'
    }
    return icons[type] || '💬'
  }

  // Get post type label
  const getPostTypeLabel = (type) => {
    const labels = {
      'product-drop': 'Product Drop',
      'industry-buzz': 'Industry Buzz',
      'community-shoutout': 'Community Shoutout',
      'brand-announcement': 'Brand Announcement',
      'strategy': 'Strategy',
      'data-insight': 'Data Insight',
      'success-story': 'Success Story'
    }
    return labels[type] || 'Post'
  }

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  // Handle like
  const handleLike = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, likes: post.likes + 1 }
        : post
    ))
  }

  // Handle share
  const handleShare = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, shares: post.shares + 1 }
        : post
    ))
  }

  // Check if user can post in this community
  const canUserPost = () => {
    if (!user || !community) return false
    
    // For "What's Good" community - only verified users and admins can post
    if (community.id === 'whats-good') {
      return user.verified || user.role === 'admin' || user.role === 'brand'
    }
    
    // For other communities, check verification requirements
    if (community.requiresVerification) {
      return user.verified || user.verificationStatus === 'approved'
    }
    
    return true
  }

  // Submit new post
  const submitPost = async () => {
    if (!newPost.trim() || !canUserPost()) return

    try {
      const post = {
        content: newPost,
        author: user.name,
        authorRole: user.role || 'Community Member',
        authorAvatar: user.profileImage || '👤',
        verified: user.verified || false,
        timestamp: new Date(),
        likes: 0,
        comments: 0,
        shares: 0,
        communityId: communityId,
        userId: user.uid,
        type: 'general'
      }

      await addDoc(collection(db, 'posts'), post)
      
      // Add to local state
      setPosts([{ ...post, id: Date.now().toString() }, ...posts])
      setNewPost('')
      setShowNewPost(false)
      
    } catch (error) {
      console.error('Error posting:', error)
      alert('Error posting. Please try again.')
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
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
        }
      } else {
        navigate('/login')
      }
    })

    return () => unsubscribe()
  }, [navigate])

  useEffect(() => {
    if (communityId) {
      const communityData = communities[communityId]
      if (communityData) {
        setCommunity(communityData)
        
        // For "What's Good", use sample posts
        if (communityId === 'whats-good') {
          setPosts(samplePosts)
        } else {
          // For other communities, load from database
          loadCommunityPosts()
        }
      } else {
        navigate('/profile')
      }
      setLoading(false)
    }
  }, [communityId, navigate])

  const loadCommunityPosts = async () => {
    try {
      const q = query(
        collection(db, 'posts'),
        where('communityId', '==', communityId),
        orderBy('timestamp', 'desc')
      )
      const querySnapshot = await getDocs(q)
      const communityPosts = []
      querySnapshot.forEach((doc) => {
        communityPosts.push({ id: doc.id, ...doc.data() })
      })
      setPosts(communityPosts)
    } catch (error) {
      console.error('Error loading posts:', error)
      setPosts([])
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community...</p>
        </div>
      </div>
    )
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Community Not Found</h2>
          <button
            onClick={() => navigate('/profile')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
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
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => navigate('/profile')}
            >
              <span>←</span>
              <span>Back to Profile</span>
            </button>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="font-bold text-lg">{user?.points || 0} pts</div>
                <div className="text-sm text-gray-500">Level {user?.level || 1}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <button
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            onClick={() => navigate('/profile')}
          >
            <span>←</span>
            <span>← Back to Profile</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            {/* Community Header */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="text-4xl">🌟</div>
                <div>
                  <h1 className="text-2xl mb-2" style={fontStyles.mainTitle}>{community.name}</h1>
                  <p className="text-gray-600 mb-3">{community.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>👥 {community.members.toLocaleString()} members</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      {community.badge}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* New Post Section - Only show if user can post */}
            {user && canUserPost() && (
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
                {!showNewPost ? (
                  <button
                    onClick={() => setShowNewPost(true)}
                    className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {user.profileImage ? (
                          <img 
                            src={user.profileImage} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center text-lg ${user.profileImage ? 'hidden' : ''}`}>
                          👤
                        </div>
                      </div>
                      <span className="text-gray-500">What's good in your store today?</span>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {user.profileImage ? (
                          <img 
                            src={user.profileImage} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center text-lg ${user.profileImage ? 'hidden' : ''}`}>
                          👤
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.role || 'Community Member'}</div>
                      </div>
                    </div>
                    <textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder="Share the latest product drops, industry buzz, or what's working in your store..."
                      className="w-full p-4 border border-gray-300 rounded-lg resize-none"
                      rows="4"
                    />
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        {community.id === 'whats-good' ? 'Posts are curated for quality content' : 'Share your insights with the community'}
                      </div>
                      <div className="flex space-x-3">
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
                          onClick={submitPost}
                          disabled={!newPost.trim()}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* View-only message for unverified users in What's Good */}
            {user && community.id === 'whats-good' && !canUserPost() && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600">ℹ️</span>
                  <div>
                    <p className="text-blue-800 font-medium">View-Only Access</p>
                    <p className="text-blue-700 text-sm">
                      Complete your verification to post in this community. For now, enjoy the latest product drops and industry buzz!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                  {/* Post Header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {typeof post.authorAvatar === 'string' && post.authorAvatar.startsWith('http') ? (
                            <img 
                              src={post.authorAvatar} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div className={`w-full h-full flex items-center justify-center text-lg ${typeof post.authorAvatar === 'string' && post.authorAvatar.startsWith('http') ? 'hidden' : ''}`}>
                            {post.authorAvatar || '👤'}
                          </div>
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
                    <span className="text-gray-600">Total Members</span>
                    <span className="font-medium">{community.members.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Posts Today</span>
                    <span className="font-medium">{posts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Now</span>
                    <span className="font-medium">{Math.floor(community.members * 0.05).toLocaleString()}</span>
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

