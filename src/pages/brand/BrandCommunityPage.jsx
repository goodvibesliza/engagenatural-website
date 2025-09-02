import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc, 
  orderBy, 
  limit,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import BrandManagerLayout from '../../components/brand/BrandManagerLayout';
import CommunityMetricsChart from '../../components/brand/CommunityMetricsChart';

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
};

export default function BrandCommunityPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [communityData, setCommunityData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    engagementRate: 0,
    discussionCount: 0
  });
  const [posts, setPosts] = useState([]);
  const [flaggedContent, setFlaggedContent] = useState([]);
  const [featuredContent, setFeaturedContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCommunity, setSelectedCommunity] = useState('all');
  const [communities, setCommunities] = useState([
    { id: 'whats-good', name: "What's Good", members: 2500 },
    { id: 'daily-stack', name: 'The Daily Stack', members: 850 }
  ]);
  const [brandId, setBrandId] = useState('sample-brand-id'); // Will be replaced with actual brand ID from context
  
  // Fetch community data
  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, these would be Firebase queries
        // For now, we'll use sample data
        
        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Sample community metrics
        setCommunityData({
          totalUsers: 3350,
          activeUsers: 1275,
          engagementRate: 38,
          discussionCount: 428
        });
        
        // Sample posts
        const samplePosts = [
          {
            id: 'post-1',
            title: 'New Nordic Naturals Omega-3 formula',
            author: 'Sarah M.',
            authorId: 'user-1',
            authorRole: 'Supplement Specialist',
            verified: true,
            communityId: 'whats-good',
            community: "What's Good",
            content: "JUST IN: New Nordic Naturals Omega-3 formula just dropped! The bioavailability is incredible - customers are already asking for it by name. Anyone else seeing the buzz?",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            likes: 23,
            comments: 12,
            shares: 5,
            status: 'published',
            category: 'product-drop',
            featured: true
          },
          {
            id: 'post-2',
            title: 'Adaptogenic herbs trend',
            author: 'Mike R.',
            authorId: 'user-2',
            authorRole: 'Store Manager',
            verified: true,
            communityId: 'whats-good',
            community: "What's Good",
            content: "Industry insider tip: Adaptogenic herbs are about to EXPLODE this quarter. Stock up on ashwagandha, rhodiola, and holy basil now. Trust me on this one!",
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            likes: 45,
            comments: 28,
            shares: 18,
            status: 'published',
            category: 'industry-buzz',
            featured: false
          },
          {
            id: 'post-3',
            title: 'Hidden discount code',
            author: 'Jessica L.',
            authorId: 'user-3',
            authorRole: 'Natural Health Advisor',
            verified: true,
            communityId: 'whats-good',
            community: "What's Good",
            content: "EASTER EGG ALERT! Found a hidden discount code in the new Garden of Life display - SPRING25 for 25% off! Shh... don't tell everyone.",
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
            likes: 67,
            comments: 34,
            shares: 31,
            status: 'published',
            category: 'easter-egg',
            featured: true
          },
          {
            id: 'post-4',
            title: 'FDA approves new health claims',
            author: 'David K.',
            authorId: 'user-4',
            authorRole: 'Vitamin Specialist',
            verified: true,
            communityId: 'daily-stack',
            community: "The Daily Stack",
            content: "Breaking: FDA just approved new health claims for Vitamin D3. This is HUGE for our sales pitch! Customers can now legally hear about immune support benefits. Game changer!",
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
            likes: 89,
            comments: 56,
            shares: 42,
            status: 'published',
            category: 'industry-buzz',
            featured: false
          },
          {
            id: 'post-5',
            title: 'Collagen peptides review',
            author: 'Amanda T.',
            authorId: 'user-5',
            authorRole: 'Organic Produce Expert',
            verified: false,
            communityId: 'whats-good',
            community: "What's Good",
            content: "NEW PRODUCT SPOTLIGHT: Just tried the new collagen peptides from Vital Proteins. The vanilla flavor is incredible and mixes perfectly in coffee. Customers are going to love this!",
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
            likes: 34,
            comments: 12,
            shares: 9,
            status: 'published',
            category: 'product-drop',
            featured: false
          }
        ];
        
        // Sample flagged content
        const sampleFlagged = [
          {
            id: 'flag-1',
            postId: 'flagged-post-1',
            title: 'Suspicious health claim',
            author: 'Unknown User',
            authorId: 'user-99',
            communityId: 'whats-good',
            community: "What's Good",
            content: "This supplement CURES all diseases! Buy now at my website: scam-supplements.com",
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
            reason: 'spam',
            reportedBy: 'user-1',
            reportedByName: 'Sarah M.',
            status: 'pending'
          },
          {
            id: 'flag-2',
            postId: 'flagged-post-2',
            title: 'Inappropriate language',
            author: 'Angry Customer',
            authorId: 'user-100',
            communityId: 'daily-stack',
            community: "The Daily Stack",
            content: "This product is terrible! [inappropriate language removed]",
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
            reason: 'inappropriate',
            reportedBy: 'user-2',
            reportedByName: 'Mike R.',
            status: 'pending'
          }
        ];
        
        // Sample featured content
        const sampleFeatured = [
          {
            id: 'post-1',
            title: 'New Nordic Naturals Omega-3 formula',
            author: 'Sarah M.',
            authorId: 'user-1',
            communityId: 'whats-good',
            community: "What's Good",
            excerpt: "JUST IN: New Nordic Naturals Omega-3 formula just dropped! The bioavailability is incredible...",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            engagement: 40,
            featuredSince: new Date(Date.now() - 1 * 60 * 60 * 1000)
          },
          {
            id: 'post-3',
            title: 'Hidden discount code',
            author: 'Jessica L.',
            authorId: 'user-3',
            communityId: 'whats-good',
            community: "What's Good",
            excerpt: "EASTER EGG ALERT! Found a hidden discount code in the new Garden of Life display...",
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
            engagement: 132,
            featuredSince: new Date(Date.now() - 4 * 60 * 60 * 1000)
          }
        ];
        
        setPosts(samplePosts);
        setFlaggedContent(sampleFlagged);
        setFeaturedContent(sampleFeatured);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching community data:', err);
        setError('Failed to load community data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommunityData();
  }, [brandId, selectedCommunity]);
  
  // Filter posts based on search term and filter status
  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchTerm === '' || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || post.status === filterStatus;
    
    const matchesCommunity = selectedCommunity === 'all' || post.communityId === selectedCommunity;
    
    return matchesSearch && matchesStatus && matchesCommunity;
  });
  
  // Handle post status change
  const handleStatusChange = async (postId, newStatus) => {
    try {
      // In a real app, update the post status in Firestore
      // await updateDoc(doc(db, 'posts', postId), {
      //   status: newStatus,
      //   updatedAt: Timestamp.now()
      // });
      
      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, status: newStatus } 
            : post
        )
      );
      
      alert(`Post ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating post status:', error);
      alert('Failed to update post status');
    }
  };
  
  // Handle post deletion
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    try {
      // In a real app, delete the post from Firestore
      // await deleteDoc(doc(db, 'posts', postId));
      
      // Update local state
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      
      alert('Post deleted successfully');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };
  
  // Handle flagged content resolution
  const handleResolveFlagged = async (flagId, action) => {
    try {
      // In a real app, update the flag status in Firestore
      // await updateDoc(doc(db, 'flags', flagId), {
      //   status: 'resolved',
      //   resolution: action,
      //   resolvedAt: Timestamp.now()
      // });
      
      // Update local state
      setFlaggedContent(prevFlags => 
        prevFlags.filter(flag => flag.id !== flagId)
      );
      
      alert(`Flagged content ${action} successfully`);
    } catch (error) {
      console.error('Error resolving flagged content:', error);
      alert('Failed to resolve flagged content');
    }
  };
  
  // Handle featuring/unfeaturing content
  const handleFeatureContent = async (postId, featured) => {
    try {
      // In a real app, update the post in Firestore
      // await updateDoc(doc(db, 'posts', postId), {
      //   featured: featured,
      //   featuredAt: featured ? Timestamp.now() : null
      // });
      
      // Update local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, featured } 
            : post
        )
      );
      
      // Update featured content list
      if (featured) {
        const postToFeature = posts.find(post => post.id === postId);
        if (postToFeature) {
          setFeaturedContent(prev => [...prev, {
            id: postToFeature.id,
            title: postToFeature.title,
            author: postToFeature.author,
            authorId: postToFeature.authorId,
            communityId: postToFeature.communityId,
            community: postToFeature.community,
            excerpt: postToFeature.content.substring(0, 100) + '...',
            timestamp: postToFeature.timestamp,
            engagement: postToFeature.likes + postToFeature.comments + postToFeature.shares,
            featuredSince: new Date()
          }]);
        }
      } else {
        setFeaturedContent(prev => prev.filter(item => item.id !== postId));
      }
      
      alert(`Post ${featured ? 'featured' : 'unfeatured'} successfully`);
    } catch (error) {
      console.error('Error featuring/unfeaturing post:', error);
      alert(`Failed to ${featured ? 'feature' : 'unfeature'} post`);
    }
  };
  
  // Format date
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };
  
  // Handle community change
  const handleCommunityChange = (e) => {
    setSelectedCommunity(e.target.value);
  };

  return (
    <BrandManagerLayout>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900" style={fontStyles.mainTitle}>
            Community Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor, manage, and moderate your brand's community engagement
          </p>
        </div>
        
        {/* Community Selector */}
        <div className="mb-6">
          <label htmlFor="community-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select Community
          </label>
          <select
            id="community-select"
            value={selectedCommunity}
            onChange={handleCommunityChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">All Communities</option>
            {communities.map(community => (
              <option key={community.id} value={community.id}>
                {community.name} ({community.members} members)
              </option>
            ))}
          </select>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`${
                activeTab === 'content'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Content Management
            </button>
            <button
              onClick={() => setActiveTab('moderation')}
              className={`${
                activeTab === 'moderation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm relative`}
            >
              Moderation
              {flaggedContent.length > 0 && (
                <span className="absolute top-3 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                  {flaggedContent.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('featured')}
              className={`${
                activeTab === 'featured'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Featured Content
            </button>
          </nav>
        </div>
        
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="text-sm text-gray-500 mb-1">Total Community Members</div>
                    <div className="text-3xl font-bold text-gray-900">{communityData.totalUsers.toLocaleString()}</div>
                    <div className="text-xs text-green-600 mt-1">+12% from last month</div>
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="text-sm text-gray-500 mb-1">Active Members (30d)</div>
                    <div className="text-3xl font-bold text-gray-900">{communityData.activeUsers.toLocaleString()}</div>
                    <div className="text-xs text-green-600 mt-1">+8% from last month</div>
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="text-sm text-gray-500 mb-1">Engagement Rate</div>
                    <div className="text-3xl font-bold text-gray-900">{communityData.engagementRate}%</div>
                    <div className="text-xs text-green-600 mt-1">+3% from last month</div>
                  </div>
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="text-sm text-gray-500 mb-1">Total Discussions</div>
                    <div className="text-3xl font-bold text-gray-900">{communityData.discussionCount.toLocaleString()}</div>
                    <div className="text-xs text-green-600 mt-1">+15% from last month</div>
                  </div>
                </div>
                
                {/* Community Metrics Chart */}
                <CommunityMetricsChart brandId={brandId} />
                
                {/* Recent Activity */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900" style={fontStyles.subsectionTitle}>Recent Activity</h3>
                  </div>
                  <div className="px-6 py-5">
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {posts.slice(0, 5).map((post, postIdx) => (
                          <li key={post.id}>
                            <div className="relative pb-8">
                              {postIdx !== posts.slice(0, 5).length - 1 ? (
                                <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                              ) : null}
                              <div className="relative flex items-start space-x-3">
                                <div className="relative">
                                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center ring-8 ring-white">
                                    <span className="text-sm font-medium text-gray-500">
                                      {post.author.charAt(0)}
                                    </span>
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div>
                                    <div className="text-sm">
                                      <a href="#" className="font-medium text-gray-900">
                                        {post.author}
                                      </a>
                                    </div>
                                    <p className="mt-0.5 text-sm text-gray-500">
                                      Posted in {post.community} • {formatDate(post.timestamp)}
                                    </p>
                                  </div>
                                  <div className="mt-2 text-sm text-gray-700">
                                    <p>{post.content.substring(0, 150)}...</p>
                                  </div>
                                  <div className="mt-2 flex space-x-4 text-sm">
                                    <span className="text-gray-500">{post.likes} likes</span>
                                    <span className="text-gray-500">{post.comments} comments</span>
                                    <span className="text-gray-500">{post.shares} shares</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Content Management Tab */}
            {activeTab === 'content' && (
              <div className="space-y-6">
                {/* Search and Filter */}
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                        Search Content
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input
                          type="text"
                          name="search"
                          id="search"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-4 pr-12 sm:text-sm border-gray-300 rounded-md"
                          placeholder="Search by title, content, or author..."
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        Filter by Status
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="all">All Status</option>
                        <option value="published">Published</option>
                        <option value="pending">Pending</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Content Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900" style={fontStyles.subsectionTitle}>
                      Community Content
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Post
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Author
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Community
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Posted
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Engagement
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPosts.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                              No posts found matching your criteria
                            </td>
                          </tr>
                        ) : (
                          filteredPosts.map((post) => (
                            <tr key={post.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{post.title}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">{post.content.substring(0, 50)}...</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="text-sm font-medium text-gray-900">{post.author}</div>
                                  {post.verified && (
                                    <span className="ml-1 text-green-500">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">{post.authorRole}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {post.community}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(post.timestamp)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="flex space-x-2">
                                  <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                    </svg>
                                    {post.likes}
                                  </span>
                                  <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                                    </svg>
                                    {post.comments}
                                  </span>
                                  <span className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                                    </svg>
                                    {post.shares}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  post.status === 'published' ? 'bg-green-100 text-green-800' :
                                  post.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleFeatureContent(post.id, !post.featured)}
                                    className={`${
                                      post.featured ? 'text-yellow-600 hover:text-yellow-900' : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                  >
                                    {post.featured ? 'Unfeature' : 'Feature'}
                                  </button>
                                  {post.status !== 'archived' && (
                                    <button
                                      onClick={() => handleStatusChange(post.id, 'archived')}
                                      className="text-gray-600 hover:text-gray-900"
                                    >
                                      Archive
                                    </button>
                                  )}
                                  {post.status === 'archived' && (
                                    <button
                                      onClick={() => handleStatusChange(post.id, 'published')}
                                      className="text-blue-600 hover:text-blue-900"
                                    >
                                      Restore
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {/* Moderation Tab */}
            {activeTab === 'moderation' && (
              <div className="space-y-6">
                {/* Flagged Content */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900" style={fontStyles.subsectionTitle}>
                      Flagged Content
                    </h3>
                  </div>
                  
                  {flaggedContent.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No flagged content</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        There are no reports that need your attention right now.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Content
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Author
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reported By
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Reason
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {flaggedContent.map((flag) => (
                            <tr key={flag.id}>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">{flag.title}</div>
                                <div className="text-sm text-gray-500 max-w-xs">{flag.content}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {flag.author}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {flag.reportedByName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  flag.reason === 'spam' ? 'bg-red-100 text-red-800' :
                                  flag.reason === 'inappropriate' ? 'bg-orange-100 text-orange-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {flag.reason.charAt(0).toUpperCase() + flag.reason.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(flag.timestamp)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleResolveFlagged(flag.id, 'approved')}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleResolveFlagged(flag.id, 'removed')}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                
                {/* Community Guidelines */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900" style={fontStyles.subsectionTitle}>
                      Community Guidelines
                    </h3>
                  </div>
                  <div className="px-6 py-5">
                    <div className="prose max-w-none">
                      <p>
                        These are the guidelines that all community members must follow. You can edit these guidelines to set clear expectations for your community.
                      </p>
                      <h4>General Rules</h4>
                      <ul>
                        <li>Be respectful and professional in all interactions</li>
                        <li>No spam or self-promotion outside of designated areas</li>
                        <li>Keep posts relevant to natural health retail</li>
                        <li>Provide evidence for health claims when possible</li>
                        <li>No brand bashing or unfounded claims</li>
                      </ul>
                      <h4>Content Moderation</h4>
                      <p>
                        Content that violates these guidelines will be removed, and repeat offenders may lose posting privileges.
                      </p>
                    </div>
                    <div className="mt-5">
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Edit Guidelines
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Featured Content Tab */}
            {activeTab === 'featured' && (
              <div className="space-y-6">
                {/* Featured Content Management */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900" style={fontStyles.subsectionTitle}>
                      Featured Content
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Featured content appears prominently in community feeds and emails
                    </p>
                  </div>
                  
                  {featuredContent.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No featured content</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Feature your best community content to increase engagement.
                      </p>
                      <div className="mt-6">
                        <button
                          type="button"
                          onClick={() => setActiveTab('content')}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Browse Content to Feature
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Content
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Author
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Community
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Featured Since
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Engagement
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {featuredContent.map((item) => (
                            <tr key={item.id}>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">{item.title}</div>
                                <div className="text-sm text-gray-500 max-w-xs">{item.excerpt}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.author}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.community}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(item.featuredSince)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {item.engagement} interactions
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => handleFeatureContent(item.id, false)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Remove from Featured
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                
                {/* Featured Content Settings */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900" style={fontStyles.subsectionTitle}>
                      Featured Content Settings
                    </h3>
                  </div>
                  <div className="px-6 py-5">
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Maximum Featured Posts</label>
                        <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                          <option>3</option>
                          <option>5</option>
                          <option>10</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Auto-Rotate Featured Content</label>
                        <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                          <option>Weekly</option>
                          <option>Every 2 Weeks</option>
                          <option>Monthly</option>
                          <option>Never (Manual Only)</option>
                        </select>
                      </div>
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="auto-feature"
                            name="auto-feature"
                            type="checkbox"
                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="auto-feature" className="font-medium text-gray-700">Auto-Feature High Engagement Posts</label>
                          <p className="text-gray-500">Automatically feature posts with high engagement</p>
                        </div>
                      </div>
                      <div>
                        <button
                          type="button"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Save Settings
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </BrandManagerLayout>
  );
}
