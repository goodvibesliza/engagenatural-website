import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit
} from 'firebase/firestore';
import { brandCommunitiesView, brandCommunityOpen } from '../../lib/analytics';
import { computeCommunityMetrics, formatRelativeTime, findBrandCommunity } from '../../lib/communityAdapter';
import CommunityReport from '../../components/brands/CommunityReport';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

// Icons
import { 
  Plus, 
  Search, 
  Users, 
  MessageSquare, 
  Heart, 
  Calendar,
  MoreHorizontal,
  Eye,
  ExternalLink,
  ArrowUpDown,
  Building
} from 'lucide-react';

/**
 * Desktop-only Communities List page for brand managers
 * Shows table view with stats and management actions
 */
export default function CommunitiesList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [communityMetrics, setCommunityMetrics] = useState({});
  const [sortBy, setSortBy] = useState('lastActivity');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [allPosts, setAllPosts] = useState([]);
  const [allComments, setAllComments] = useState([]);
  const [allLikes, setAllLikes] = useState([]);
  const unsubRef = useRef(null);
  const postsUnsubRef = useRef(null);
  const commentsUnsubRef = useRef(null);

  // Desktop breakpoint check
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track page view
  useEffect(() => {
    brandCommunitiesView();

    // Persist route in localStorage
    localStorage.setItem('en.brand.lastRoute', '/brands/communities');
  }, [user]);

  // Fetch posts and comments for metrics computation
  useEffect(() => {
    if (!user?.brandId || communities.length === 0) return;

    const communityIds = communities.map(c => c.id);
    const unsubscribers = []; // Track all unsubscribe functions
    let allPosts = [];
    let allComments = [];
    let postsReceived = 0;
    let commentsReceived = 0;
    
    // Helper to create batches of max 10 items for Firestore 'in' queries
    const createBatches = (array, batchSize = 10) => {
      const batches = [];
      for (let i = 0; i < array.length; i += batchSize) {
        batches.push(array.slice(i, i + batchSize));
      }
      return batches;
    };

    // Helper to process collected data
    const processCollectedData = () => {
      // Compute metrics for each community
      const metricsData = {};
      communities.forEach(community => {
        const communityPosts = allPosts.filter(p => p.communityId === community.id);
        const communityComments = allComments.filter(c => 
          communityPosts.some(p => p.id === c.postId)
        );

        metricsData[community.id] = computeCommunityMetrics({
          posts: communityPosts,
          comments: communityComments,
          likes: [] // We'll use like counts from posts
        });
      });

      setCommunityMetrics(metricsData);
      
      // Store data for CommunityReport
      setAllPosts(allPosts);
      setAllComments(allComments);
      setAllLikes([]); // We'll use embedded likes from posts
    };

    // Create batches for community IDs
    const communityBatches = createBatches(communityIds);
    
    // Fetch posts from all community batches
    communityBatches.forEach((batch, batchIndex) => {
      const postsQuery = query(
        collection(db, 'posts'),
        where('communityId', 'in', batch),
        orderBy('createdAt', 'desc'),
        limit(1000) // Reasonable limit for client-side processing
      );

      const postsUnsub = onSnapshot(postsQuery, (snapshot) => {
        const batchPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt
        }));

        // Merge this batch's posts with existing posts
        allPosts = allPosts.filter(p => !batch.includes(p.communityId)).concat(batchPosts);
        postsReceived++;

        // Process comments for this batch of posts
        if (batchPosts.length > 0) {
          const postIds = batchPosts.map(p => p.id);
          const postBatches = createBatches(postIds);

          postBatches.forEach((postBatch, postBatchIndex) => {
            // Unsubscribe previous comments listener if it exists
            if (commentsUnsubRef.current) {
              commentsUnsubRef.current();
              commentsUnsubRef.current = null;
            }

            const commentsQuery = query(
              collection(db, 'comments'),
              where('postId', 'in', postBatch),
              orderBy('createdAt', 'desc'),
              limit(1000)
            );

            const commentsUnsub = onSnapshot(commentsQuery, (commentsSnapshot) => {
              const batchComments = commentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt
              }));

              // Merge this batch's comments with existing comments
              allComments = allComments.filter(c => !postBatch.includes(c.postId)).concat(batchComments);
              commentsReceived++;

              // Process collected data when all batches are received
              if (postsReceived === communityBatches.length) {
                processCollectedData();
              }
            });

            // Store the last comments unsubscriber
            commentsUnsubRef.current = commentsUnsub;
            unsubscribers.push(commentsUnsub);
          });
        } else {
          // No posts in this batch, check if we can process data
          if (postsReceived === communityBatches.length) {
            processCollectedData();
          }
        }
      });

      unsubscribers.push(postsUnsub);
    });

    // Store reference for cleanup
    postsUnsubRef.current = () => {
      unsubscribers.forEach(unsub => unsub());
    };

    return () => {
      // Clean up all listeners
      unsubscribers.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
      if (commentsUnsubRef.current) {
        commentsUnsubRef.current();
        commentsUnsubRef.current = null;
      }
    };
  }, [communities, user?.brandId]);

  // Fetch communities for the brand
  useEffect(() => {
    if (!user?.brandId) return;

    const q = query(
      collection(db, 'communities'),
      where('brandId', '==', user.brandId),
      orderBy('createdAt', 'desc')
    );

    unsubRef.current = onSnapshot(q, 
      (snapshot) => {
        const communitiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        setCommunities(communitiesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching communities:', error);
        setLoading(false);
      }
    );

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
      }
    };
  }, [user?.brandId]);

  const handleCreateCommunity = () => {
    // Check if brand already has a community
    const existingCommunity = findBrandCommunity(communities, user?.brandId);
    
    if (existingCommunity) {
      // Track open existing community
      if (window.analytics?.track) {
        window.analytics.track('Community Open Existing', {
          community_id: existingCommunity.id,
          brand_id: user?.brandId,
          user_id: user?.uid
        });
      }
      navigate(`/brands/communities/${existingCommunity.id}`);
    } else {
      // Track create new community
      if (window.analytics?.track) {
        window.analytics.track('Community Create Click', {
          brand_id: user?.brandId,
          user_id: user?.uid
        });
      }
      navigate('/brands/communities/new');
    }
  };

  const handleEditCommunity = (community) => {
    // Track community open
    brandCommunityOpen({ communityId: community.id });
    navigate(`/brands/communities/${community.id}`);
  };

  const handleViewAsStaff = (community) => {
    // Track preview as staff
    if (window.analytics?.track) {
      window.analytics.track('Community Preview As Staff', {
        community_id: community.id,
        brand_id: user?.brandId,
        user_id: user?.uid,
        community_name: community.name,
        community_status: community.status
      });
    }
    // Open community in staff view (new tab for QA)
    window.open(`/community/${community.id}`, '_blank');
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Filter communities by search query
  const filteredCommunities = communities.filter(community =>
    community.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    community.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort communities based on current sort criteria
  const getSortedCommunities = () => {
    const sorted = [...filteredCommunities].sort((a, b) => {
      const aMetrics = communityMetrics[a.id] || {};
      const bMetrics = communityMetrics[b.id] || {};
      
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'status':
          aValue = a.status || 'draft';
          bValue = b.status || 'draft';
          break;
        case 'lastActivity':
          aValue = aMetrics.lastActivity || new Date(0);
          bValue = bMetrics.lastActivity || new Date(0);
          break;
        case 'posts30d':
          aValue = aMetrics.posts30d || 0;
          bValue = bMetrics.posts30d || 0;
          break;
        case 'uniqueStaff30d':
          aValue = aMetrics.uniqueStaff30d || 0;
          bValue = bMetrics.uniqueStaff30d || 0;
          break;
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return sorted;
  };

  // Get paginated results
  const getPaginatedCommunities = () => {
    const sorted = getSortedCommunities();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredCommunities.length / itemsPerPage);
  const shouldShowPagination = filteredCommunities.length > itemsPerPage;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Mobile blocking banner
  if (!isDesktop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto text-center border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-orange-800">Desktop Required</CardTitle>
            <CardDescription className="text-orange-600">
              Brand tools are desktop-only. Please use a larger screen (1024px or wider) to access community management features.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Communities</h1>
              <p className="text-gray-600 mt-1">
                Manage your brand's communities and engage with your audience
              </p>
            </div>
            <Button onClick={handleCreateCommunity} className="bg-brand-primary hover:bg-brand-primary/90" data-testid="community-create">
              {communities.length > 0 ? (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Open Community
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  New Community
                </>
              )}
            </Button>
          </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search communities..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  // Track search usage with debounced analytics
                  if (e.target.value && window.analytics?.track) {
                    clearTimeout(window._searchTimeout);
                    window._searchTimeout = setTimeout(() => {
                      window.analytics.track('Communities Search', {
                        search_query: e.target.value,
                        brand_id: user?.brandId,
                        user_id: user?.uid
                      });
                    }, 1000);
                  }
                }}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-brand-primary">
              {communities.length}
            </div>
            <div className="text-sm text-gray-600">Total Communities</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {communities.filter(c => c.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active Communities</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {communities.reduce((sum, c) => sum + (c.memberCount || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Members</div>
          </CardContent>
        </Card>
      </div>

      {/* Communities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Communities</CardTitle>
          <CardDescription>
            {filteredCommunities.length} of {communities.length} communities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary"></div>
            </div>
          ) : filteredCommunities.length === 0 ? (
            <div className="text-center py-8">
              {searchQuery ? (
                <div>
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No communities match your search</p>
                  <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="py-12">
                  <div className="text-center">
                    <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No community found</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Your brand doesn't have a community yet. Create your first community to start engaging with your audience.
                    </p>
                    <Button onClick={handleCreateCommunity} className="bg-brand-primary hover:bg-brand-primary/90">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Community
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto" data-testid="communities-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">
                      <button
                        onClick={() => handleSort('name')}
                        className="flex items-center space-x-1 font-medium hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1 rounded"
                        aria-label="Sort by community name"
                        aria-pressed={sortBy === 'name'}
                      >
                        <span>Community Name</span>
                        <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </TableHead>
                    <TableHead scope="col">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center space-x-1 font-medium hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1 rounded"
                        aria-label="Sort by status"
                        aria-pressed={sortBy === 'status'}
                      >
                        <span>Status</span>
                        <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </TableHead>
                    <TableHead scope="col">Posts (7/30 days)</TableHead>
                    <TableHead scope="col">Unique Staff (7/30 days)</TableHead>
                    <TableHead scope="col">Likes (7/30 days)</TableHead>
                    <TableHead scope="col">Comments (7/30 days)</TableHead>
                    <TableHead scope="col">
                      <button
                        onClick={() => handleSort('lastActivity')}
                        className="flex items-center space-x-1 font-medium hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1 rounded"
                        aria-label="Sort by last activity"
                        aria-pressed={sortBy === 'lastActivity'}
                      >
                        <span>Last Activity</span>
                        <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </TableHead>
                    <TableHead scope="col" className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPaginatedCommunities().map((community) => {
                    const metrics = communityMetrics[community.id] || {};
                    return (
                      <TableRow key={community.id} className="hover:bg-gray-50" data-testid={`community-row-${community.id}`}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">
                              {community.name}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {community.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={community.status === 'active' ? 'default' : 'secondary'}
                            className={community.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {community.status === 'active' ? 'Active' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{metrics.posts7d || 0} / {metrics.posts30d || 0}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{metrics.uniqueStaff7d || 0} / {metrics.uniqueStaff30d || 0}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{metrics.likes7d || 0} / {metrics.likes30d || 0}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{metrics.comments7d || 0} / {metrics.comments30d || 0}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {formatRelativeTime(metrics.lastActivity)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditCommunity(community)} data-testid={`community-open-${community.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                Open (Editor)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewAsStaff(community)} data-testid={`view-as-staff-${community.id}`}>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View as Staff
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination Controls */}
          {shouldShowPagination && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredCommunities.length)} of {filteredCommunities.length} communities
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page, and pages around current
                    return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => {
                    // Add ellipsis if there's a gap
                    const showEllipsis = index > 0 && page - array[index - 1] > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <span className="px-3 py-1 text-gray-500">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      </React.Fragment>
                    );
                  })}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
        </div>
        
        {/* Right Rail - Community Report */}
        <div className="w-80 p-6 pl-0 border-l border-gray-200 bg-white">
          <CommunityReport 
            posts={allPosts}
            comments={allComments}
            likes={allLikes}
            className="sticky top-6"
          />
        </div>
      </div>
    </div>
  );
}