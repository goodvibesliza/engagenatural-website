import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export default function RetailerProfile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile')
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
              verificationStatus: 'not_submitted',
              points: 0,
              level: 1
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

  const challenges = [
    {
      id: 1,
      title: "Share Product Knowledge",
      description: "Help 3 customers learn about natural products",
      points: 50,
      progress: 2,
      total: 3,
      status: "active",
      category: "Customer Service"
    },
    {
      id: 2,
      title: "Store Display Excellence",
      description: "Create an eye-catching product display",
      points: 100,
      progress: 0,
      total: 1,
      status: "available",
      category: "Visual Merchandising"
    },
    {
      id: 3,
      title: "Health & Wellness Expert",
      description: "Complete 5 product training modules",
      points: 200,
      progress: 5,
      total: 5,
      status: "completed",
      category: "Education"
    },
    {
      id: 4,
      title: "Social Media Star",
      description: "Share store content on social media",
      points: 60,
      progress: 0,
      total: 1,
      status: "locked",
      category: "Marketing"
    }
  ]

  const communityPosts = [
    {
      id: 1,
      author: "Sarah M.",
      store: "Whole Foods Market",
      content: "Just helped a customer find the perfect probiotic for their digestive health! Love seeing their excitement when they find exactly what they need. 🌱",
      likes: 12,
      comments: 3,
      time: "2 hours ago",
      verified: true
    },
    {
      id: 2,
      author: "Mike R.",
      store: "Sprouts Farmers Market",
      content: "Our new organic produce display is getting amazing feedback from customers! The key is making it colorful and accessible. 🥬🥕",
      likes: 8,
      comments: 5,
      time: "4 hours ago",
      verified: true
    },
    {
      id: 3,
      author: "Emma L.",
      store: "Natural Grocers",
      content: "Completed my first product knowledge challenge today! Learned so much about adaptogens and how they can help with stress management.",
      likes: 15,
      comments: 2,
      time: "1 day ago",
      verified: true
    }
  ]

  const learningResources = [
    {
      id: 1,
      title: "Supplement Basics Certification",
      description: "Learn the fundamentals of vitamins, minerals, and supplements",
      progress: 75,
      modules: 8,
      completed: 6,
      points: 150
    },
    {
      id: 2,
      title: "Organic Product Knowledge",
      description: "Understanding organic certifications and benefits",
      progress: 100,
      modules: 5,
      completed: 5,
      points: 100
    },
    {
      id: 3,
      title: "Customer Service Excellence",
      description: "Advanced techniques for helping health-conscious customers",
      progress: 30,
      modules: 10,
      completed: 3,
      points: 200
    }
  ]

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

  const ChallengeCard = ({ challenge }) => {
    const getStatusColor = () => {
      switch (challenge.status) {
        case 'completed': return 'bg-green-500'
        case 'active': return 'bg-blue-500'
        case 'available': return 'bg-gray-400'
        case 'locked': return 'bg-gray-300'
        default: return 'bg-gray-400'
      }
    }

    const getStatusText = () => {
      switch (challenge.status) {
        case 'completed': return 'Completed'
        case 'active': return 'In Progress'
        case 'available': return 'Start Challenge'
        case 'locked': return 'Locked'
        default: return 'Available'
      }
    }

    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-heading text-lg font-semibold text-gray-900 mb-2">{challenge.title}</h3>
            <p className="text-gray-600 text-sm mb-2">{challenge.description}</p>
            <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
              {challenge.category}
            </span>
          </div>
          <div className="text-right">
            <div className="bg-brand-primary text-white px-3 py-1 rounded-full text-sm font-medium">
              {challenge.points} pts
            </div>
          </div>
        </div>
        
        {challenge.status === 'active' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{challenge.progress}/{challenge.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(challenge.progress / challenge.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <button 
          className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${getStatusColor()} text-white`}
          disabled={challenge.status === 'locked' || challenge.status === 'completed'}
        >
          {getStatusText()}
        </button>
      </div>
    )
  }

  const CommunityPost = ({ post }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center text-white font-medium">
          {post.author.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-medium text-gray-900">{post.author}</h4>
            {post.verified && <span className="text-green-500">✓</span>}
            <span className="text-gray-500 text-sm">•</span>
            <span className="text-gray-500 text-sm">{post.store}</span>
            <span className="text-gray-500 text-sm">•</span>
            <span className="text-gray-500 text-sm">{post.time}</span>
          </div>
          <p className="text-gray-700 mb-3">{post.content}</p>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <button className="flex items-center space-x-1 hover:text-brand-primary">
              <span>❤️</span>
              <span>{post.likes}</span>
            </button>
            <button className="flex items-center space-x-1 hover:text-brand-primary">
              <span>💬</span>
              <span>{post.comments}</span>
            </button>
            <button className="hover:text-brand-primary">Share</button>
          </div>
        </div>
      </div>
    </div>
  )

  const LearningCard = ({ resource }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="font-heading text-lg font-semibold text-gray-900 mb-2">{resource.title}</h3>
      <p className="text-gray-600 text-sm mb-4">{resource.description}</p>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{resource.completed}/{resource.modules} modules</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-brand-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${resource.progress}%` }}
          ></div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-brand-primary font-medium">{resource.points} points</span>
        <button className="bg-brand-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-brand-primary/90 transition-colors">
          {resource.progress === 100 ? 'Review' : 'Continue'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-gray-900">Welcome back, {user?.name}!</h1>
              <p className="text-gray-600 mt-1">{user?.storeName}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-brand-primary">{user?.points || 0} pts</div>
              <div className="text-sm text-gray-600">Level {user?.level || 1}</div>
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
              id="challenges"
              label="Challenges"
              icon="🎯"
              isActive={activeTab === 'challenges'}
              onClick={setActiveTab}
            />
            <TabButton
              id="community"
              label="Community"
              icon="👥"
              isActive={activeTab === 'community'}
              onClick={setActiveTab}
            />
            <TabButton
              id="learning"
              label="Learning"
              icon="📚"
              isActive={activeTab === 'learning'}
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
              <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                <h2 className="font-heading text-xl font-semibold mb-4">Verification Status</h2>
                
                {user?.verificationStatus === 'not_submitted' && (
                  <div className="space-y-4">
                    <p>To get verified and access exclusive content, you need to:</p>
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>Take a photo in your store wearing your name tag/apron</li>
                      <li>Include today's verification code in the photo</li>
                      <li>Submit the photo for review</li>
                    </ol>
                    <button 
                      onClick={() => navigate('/verification')}
                      className="bg-brand-primary text-white px-6 py-2 rounded-lg hover:bg-brand-primary/90 transition-colors"
                    >
                      Start Verification
                    </button>
                  </div>
                )}
                
                {user?.verificationStatus === 'pending' && (
                  <div className="space-y-4">
                    <p>Your verification is currently under review. This typically takes 1-2 business days.</p>
                    <div className="flex items-center justify-center py-8">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 text-2xl mb-4">
                          ⏳
                        </div>
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
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-2xl mb-4">
                          ✅
                        </div>
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
                    <button 
                      onClick={() => navigate('/verification')}
                      className="bg-brand-primary text-white px-6 py-2 rounded-lg hover:bg-brand-primary/90 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div>
            <div className="mb-6">
              <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">Challenges</h2>
              <p className="text-gray-600">Complete challenges to earn points and unlock exclusive content!</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges.map(challenge => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <div>
            <div className="mb-6">
              <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">Community</h2>
              <p className="text-gray-600">Connect with fellow retail professionals and share your experiences!</p>
            </div>
            
            <div className="space-y-6">
              {communityPosts.map(post => (
                <CommunityPost key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'learning' && (
          <div>
            <div className="mb-6">
              <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">Learning Resources</h2>
              <p className="text-gray-600">Expand your knowledge with our comprehensive training modules!</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {learningResources.map(resource => (
                <LearningCard key={resource.id} resource={resource} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

