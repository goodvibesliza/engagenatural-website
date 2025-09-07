import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../contexts/auth-context";
import { db } from "../../../lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
  limit
} from "firebase/firestore";
import { toast } from "sonner";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Separator } from "../../ui/separator";
import { ScrollArea } from "../../ui/scroll-area";
import { Switch } from "../../ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../ui/alert-dialog";

// Icons
import { Plus, Edit, Trash2, Users, Tag, RefreshCw, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function CommunitiesManager({ brandId }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  // Determine the brand context once so it's reused consistently
  const activeBrandId = brandId || user?.brandId;
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCommunity, setCurrentCommunity] = useState(null);
  // Track if brand already owns a community (brand managers limited to one)
  const [hasBrandOwned, setHasBrandOwned] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    topics: [],
    status: "draft",
    memberCount: 0,
    image: "",
    brandId: brandId || ""
  });
  const [topicInput, setTopicInput] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [communityToDelete, setCommunityToDelete] = useState(null);
  /* ---------- post-creation dialog state ---------- */
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [postCommunity, setPostCommunity] = useState(null);
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  
  // New state for real-time viewer
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const postsUnsubRef = useRef(null);
  const [viewerPostContent, setViewerPostContent] = useState("");
  
  // Add state for tracking user display names
  const [userNames, setUserNames] = useState({});

  // Add state for community metrics
  const [communityMetrics, setCommunityMetrics] = useState({ totalPosts: 0, totalComments: 0, totalLikes: 0 });
  const commentsUnsubRef = useRef(null);

  // Fetch communities for the brand
  useEffect(() => {
    fetchCommunities();
  }, [brandId]);
  
  // Cleanup on unmount
  useEffect(() => () => { 
    if (postsUnsubRef.current) { 
      try { 
        postsUnsubRef.current(); 
      } catch {} 
    }
    
    // Clean up comments subscription
    if (commentsUnsubRef.current) {
      try {
        commentsUnsubRef.current();
      } catch {}
    }
  }, []);
  
  // Fetch user display names for posts without userName
  useEffect(() => {
    if (!posts.length) return;
    
    const fetchMissingUserNames = async () => {
      // Find posts that have userId but no userName
      const missingUserIds = posts
        .filter(post => post.userId && !post.userName && !userNames[post.userId])
        .map(post => post.userId);
      
      // Remove duplicates
      const uniqueUserIds = [...new Set(missingUserIds)];
      
      if (uniqueUserIds.length === 0) return;
      
      try {
        // Fetch all missing user documents in parallel
        const userDocs = await Promise.all(
          uniqueUserIds.map(userId => getDoc(doc(db, 'users', userId)))
        );
        
        // Build a map of userId -> display name
        const newUserNames = {};
        userDocs.forEach((userDoc, index) => {
          const userId = uniqueUserIds[index];
          if (userDoc.exists()) {
            const userData = userDoc.data();
            newUserNames[userId] = userData.name || userData.displayName || userData.email || 'Anonymous';
          } else {
            newUserNames[userId] = 'Anonymous';
          }
        });
        
        // Update state with new user names
        setUserNames(prev => ({ ...prev, ...newUserNames }));
      } catch (err) {
        console.error('Error fetching user display names:', err);
      }
    };
    
    fetchMissingUserNames();
  }, [posts]);

  const fetchCommunities = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!activeBrandId) {
        throw new Error("No brand ID available");
      }
      
      const q = query(
        collection(db, "communities"),
        where("brandId", "==", activeBrandId),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const communitiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      
      // Does this brand already have its own community?
      const brandOwned = communitiesData.some(
        (c) =>
          c.createdByRole === "brand_manager" &&
          c.brandId === activeBrandId
      );
      setHasBrandOwned(brandOwned);

      setCommunities(communitiesData);
    } catch (err) {
      console.error("Error fetching communities:", err);
      setError(err.message);
      toast.error("Failed to load communities");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleStatusChange = (value) => {
    setFormData({
      ...formData,
      status: value
    });
  };

  const handleAddTopic = () => {
    if (topicInput.trim() === "") return;
    
    // Convert to kebab-case and lowercase
    const formattedTopic = topicInput.trim().toLowerCase().replace(/\s+/g, '-');
    
    if (!formData.topics.includes(formattedTopic)) {
      setFormData({
        ...formData,
        topics: [...formData.topics, formattedTopic]
      });
    }
    
    setTopicInput("");
  };

  /* ---------- Post helpers ---------- */
  const openPostDialog = (community) => {
    setPostCommunity(community);
    setPostContent("");
    setPostDialogOpen(true);
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() || !postCommunity) return;
    setPosting(true);
    try {
      await addDoc(collection(db, "community_posts"), {
        brandId: activeBrandId,
        communityId: postCommunity.id,
        userId: user?.uid || null,
        userName: user?.name || user?.displayName || user?.email || 'Anonymous',
        content: postContent.trim(),
        visibility: "public",
        likeCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Posted to community");
      setPostDialogOpen(false);
      setPostCommunity(null);
      setPostContent("");
    } catch (err) {
      console.error("Error creating post:", err);
      toast.error("Failed to create post");
    } finally {
      setPosting(false);
    }
  };
  
  // Helper to start/stop the posts listener
  const startPostsListener = (community) => {
    // Clean up existing posts subscription
    if (postsUnsubRef.current) { 
      try { 
        postsUnsubRef.current(); 
      } catch {} 
      postsUnsubRef.current = null; 
    }
    
    // Clean up existing comments subscription
    if (commentsUnsubRef.current) {
      try {
        commentsUnsubRef.current();
      } catch {}
      commentsUnsubRef.current = null;
    }
    
    if (!community) { 
      setPosts([]);
      setCommunityMetrics({ totalPosts: 0, totalComments: 0, totalLikes: 0 });
      return; 
    }
    
    setPostsLoading(true);
    
    try {
      const base = query(
        collection(db, 'community_posts'),
        where('brandId', '==', activeBrandId),
        where('communityId', '==', community.id),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      postsUnsubRef.current = onSnapshot(
        base,
        (snap) => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setPosts(list);
          
          // Compute metrics
          const totalPosts = list.length;
          const totalLikes = list.reduce((sum, p) => sum + (p.likeCount || 0), 0);
          setCommunityMetrics(prev => ({ ...prev, totalPosts, totalLikes }));
          
          setPostsLoading(false);
        },
        (err) => {
          console.error('Posts listener error:', err);
          setPostsLoading(false);
          toast.error('Failed to load posts');
        }
      );
      
      // Start comments subscription
      const commentsQuery = query(
        collection(db, 'community_comments'),
        where('communityId', '==', community.id)
      );
      
      commentsUnsubRef.current = onSnapshot(
        commentsQuery,
        (snapshot) => {
          setCommunityMetrics(prev => ({ ...prev, totalComments: snapshot.size }));
        },
        (err) => {
          console.error('Comments listener error:', err);
        }
      );
    } catch (err) {
      console.warn('Falling back to unordered posts query:', err?.message);
      const fallback = query(
        collection(db, 'community_posts'),
        where('brandId', '==', activeBrandId),
        where('communityId', '==', community.id)
      );
      
      postsUnsubRef.current = onSnapshot(
        fallback,
        (snap) => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          // naive sort newest first
          list.sort((a,b) => (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
          setPosts(list);
          
          // Compute metrics
          const totalPosts = list.length;
          const totalLikes = list.reduce((sum, p) => sum + (p.likeCount || 0), 0);
          setCommunityMetrics(prev => ({ ...prev, totalPosts, totalLikes }));
          
          setPostsLoading(false);
        },
        () => setPostsLoading(false)
      );
      
      // Start comments subscription (same as above)
      const commentsQuery = query(
        collection(db, 'community_comments'),
        where('communityId', '==', community.id)
      );
      
      commentsUnsubRef.current = onSnapshot(
        commentsQuery,
        (snapshot) => {
          setCommunityMetrics(prev => ({ ...prev, totalComments: snapshot.size }));
        },
        (err) => {
          console.error('Comments listener error:', err);
        }
      );
    }
  };
  
  // Handler to select a community
  const handleViewCommunity = (community) => {
    setSelectedCommunity(community);
    startPostsListener(community);
  };
  
  // Handler for quick post from viewer
  const handleQuickPost = async () => {
    if (!viewerPostContent.trim() || !selectedCommunity) return;
    setPosting(true);
    try {
      await addDoc(collection(db, 'community_posts'), {
        brandId: activeBrandId,
        communityId: selectedCommunity.id,
        userId: user?.uid || null,
        userName: user?.name || user?.displayName || user?.email || 'Anonymous',
        content: viewerPostContent.trim(),
        visibility: 'public',
        likeCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setViewerPostContent('');
    } catch (e) {
      toast.error('Failed to post');
    } finally {
      setPosting(false);
    }
  };

  const handleRemoveTopic = (topicToRemove) => {
    setFormData({
      ...formData,
      topics: formData.topics.filter(topic => topic !== topicToRemove)
    });
  };

  const openCreateDialog = () => {
    // Only super_admin may create unlimited; brand managers limited to one
    if (!isSuperAdmin && hasBrandOwned) {
      toast.error("Your brand already has a community. You can edit that one or post to existing communities.");
      return;
    }
    setFormData({
      name: "",
      description: "",
      topics: [],
      status: "draft",
      memberCount: 0,
      image: "",
      brandId: brandId || user?.brandId || ""
    });
    setIsEditing(false);
    setDialogOpen(true);
  };

  const openEditDialog = (community) => {
    const canEdit =
      isSuperAdmin ||
      (community.createdByRole === "brand_manager" &&
        community.brandId === (brandId || user?.brandId));
    if (!canEdit) {
      toast.error("You don't have permission to edit this community");
      return;
    }
    setCurrentCommunity(community);
    setFormData({
      name: community.name || "",
      description: community.description || "",
      topics: community.topics || [],
      status: community.status || "draft",
      memberCount: community.memberCount || 0,
      image: community.image || "",
      brandId: community.brandId || brandId || user?.brandId || ""
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const openDeleteDialog = (community) => {
    if (!isSuperAdmin) {
      toast.error("Only super administrators can delete communities.");
      return;
    }
    setCommunityToDelete(community);
    setDeleteDialogOpen(true);
  };

  const handleCreateCommunity = async () => {
    if (!formData.name || !formData.description) {
      toast.error("Name and description are required");
      return;
    }

    setLoading(true);
    
    try {
      const newCommunity = {
        ...formData,
        createdBy: user?.uid || null,
        createdByRole: isSuperAdmin ? "super_admin" : "brand_manager",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, "communities"), newCommunity);
      toast.success("Community created successfully");
      setDialogOpen(false);
      fetchCommunities();
    } catch (err) {
      console.error("Error creating community:", err);
      toast.error("Failed to create community");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCommunity = async () => {
    if (!currentCommunity || !formData.name || !formData.description) {
      toast.error("Name and description are required");
      return;
    }

    setLoading(true);
    
    try {
      const communityRef = doc(db, "communities", currentCommunity.id);
      
      const updatedData = {
        ...formData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(communityRef, updatedData);
      toast.success("Community updated successfully");
      setDialogOpen(false);
      fetchCommunities();
    } catch (err) {
      console.error("Error updating community:", err);
      toast.error("Failed to update community");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!communityToDelete) return;
    
    setLoading(true);
    
    try {
      const communityRef = doc(db, "communities", communityToDelete.id);
      await deleteDoc(communityRef);
      toast.success("Community deleted successfully");
      setDeleteDialogOpen(false);
      setCommunityToDelete(null);
      fetchCommunities();
    } catch (err) {
      console.error("Error deleting community:", err);
      toast.error("Failed to delete community");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (loading && communities.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Communities</h2>
          <p className="text-muted-foreground">
            Manage your brand's communities and topics
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCommunities}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Community
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {communities.length === 0 && !loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              No communities found for this brand.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Community
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {communities.map((community) => (
            <Card key={community.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{community.name}</CardTitle>
                    <CardDescription>
                      {community.memberCount || 0} members
                    </CardDescription>
                  </div>
                  <Badge
                    variant={community.status === "active" ? "success" : "outline"}
                    className={
                      community.status === "active"
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : ""
                    }
                  >
                    {community.status === "active" ? "Active" : "Draft"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {community.image && (
                  <img src={community.image} alt={community.name} className="w-full h-28 object-cover rounded mb-3" onError={(e)=>e.currentTarget.style.display='none'} />
                )}
                <p className="text-sm mb-4">{community.description}</p>
                
                {community.topics && community.topics.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Topics:</p>
                    <div className="flex flex-wrap gap-2">
                      {community.topics.map((topic) => (
                        <Badge key={topic} variant="secondary">
                          <Tag className="h-3 w-3 mr-1" />
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  Created: {formatDate(community.createdAt)}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 pt-0">
                <Button variant="outline" size="sm" onClick={() => handleViewCommunity(community)}>View</Button>
                {/* Always allow posting */}
                <Button
                  size="sm"
                  onClick={() => openPostDialog(community)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Post
                </Button>
                {(() => {
                  const canEdit =
                    isSuperAdmin ||
                    (community.createdByRole === "brand_manager" &&
                      community.brandId === activeBrandId);
                  const canDelete = isSuperAdmin;
                  return (
                    <>
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(community)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog(community)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </>
                  );
                })()}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {selectedCommunity && (
        <Card className="mt-6 ring-1 ring-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Community Feed — {selectedCommunity.name}
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Live Feed
                  </span>
                </CardTitle>
                <CardDescription>Live updates</CardDescription>
              </div>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => window.open(`/community/${selectedCommunity.id}`, '_blank')}>Open</Button>
                <Button size="sm" onClick={() => openPostDialog(selectedCommunity)}>Post</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedCommunity.image && (
              <img src={selectedCommunity.image} alt={selectedCommunity.name} className="w-full h-32 object-cover rounded mb-3" onError={(e)=>e.currentTarget.style.display='none'} />
            )}
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white/70 rounded border p-3 text-center">
                <div className="text-xs text-muted-foreground">Posts</div>
                <div className="text-lg font-semibold">{communityMetrics.totalPosts}</div>
              </div>
              <div className="bg-white/70 rounded border p-3 text-center">
                <div className="text-xs text-muted-foreground">Comments</div>
                <div className="text-lg font-semibold">{communityMetrics.totalComments}</div>
              </div>
              <div className="bg-white/70 rounded border p-3 text-center">
                <div className="text-xs text-muted-foreground">Likes</div>
                <div className="text-lg font-semibold">{communityMetrics.totalLikes}</div>
              </div>
            </div>
            
            <div className="space-y-4 bg-muted/20 p-4 rounded-md border">
              <div className="space-y-2">
                <Label htmlFor="viewerPost">Quick Post</Label>
                <Textarea id="viewerPost" rows={3} value={viewerPostContent} onChange={(e) => setViewerPostContent(e.target.value)} placeholder="Share an update..." />
                <div className="flex justify-end">
                  <Button onClick={handleQuickPost} disabled={posting || !viewerPostContent.trim()}>{posting ? 'Posting…' : 'Post'}</Button>
                </div>
              </div>
              <Separator />
              {postsLoading ? (
                <div className="flex justify-center py-6 text-muted-foreground">Loading posts…</div>
              ) : posts.length === 0 ? (
                <div className="text-muted-foreground">No posts yet.</div>
              ) : (
                <div className="space-y-4">
                  {posts.map(p => (
                    <div key={p.id} className="border rounded-md p-3">
                      <div className="text-sm text-muted-foreground mb-1">
                        <span className="font-medium">{p.userName || userNames[p.userId] || 'Anonymous'}</span> · {new Date((p.createdAt?.seconds||0)*1000).toLocaleString()}
                      </div>
                      <div className="whitespace-pre-wrap">{p.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Community Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Community" : "Create New Community"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the details of your community"
                : "Create a new community for your brand"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Community Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter community name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter community description"
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="topics">Topics</Label>
                <div className="flex space-x-2">
                  <Input
                    id="topicInput"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="Add topic (press Enter)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTopic();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTopic}>
                    Add
                  </Button>
                </div>
                
                {formData.topics.length > 0 && (
                  <div className="mt-2">
                    <ScrollArea className="h-20 w-full rounded-md border p-2">
                      <div className="flex flex-wrap gap-2">
                        {formData.topics.map((topic) => (
                          <Badge
                            key={topic}
                            variant="secondary"
                            className="flex items-center space-x-1"
                          >
                            <span>{topic}</span>
                            <button
                              type="button"
                              className="ml-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                              onClick={() => handleRemoveTopic(topic)}
                            >
                              <XCircle className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="Enter image URL (optional)"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="memberCount">Initial Member Count</Label>
                  <Input
                    id="memberCount"
                    name="memberCount"
                    type="number"
                    min="0"
                    value={formData.memberCount}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={isEditing ? handleUpdateCommunity : handleCreateCommunity}
              disabled={loading || !formData.name || !formData.description}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Community" : "Create Community"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the community "
              {communityToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCommunity}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Post Dialog */}
      <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              New Post {postCommunity ? `— ${postCommunity.name}` : ""}
            </DialogTitle>
            <DialogDescription>
              Share an update with this community.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="postContent">Content</Label>
            <Textarea
              id="postContent"
              rows={5}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Write your post..."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPostDialogOpen(false)}
              disabled={posting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePost}
              disabled={posting || !postContent.trim()}
            >
              {posting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
