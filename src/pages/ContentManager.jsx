import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  deleteDoc,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  uploadBytesResumable,
  getDownloadURL 
} from 'firebase/storage';
import { db, storage } from '../lib/firebase';

// Import existing components
import ChallengeEditor2 from '../components/brand/ChallengeEditor2';

// Import UI components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

// Import icons
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  Users, 
  Award, 
  FileText, 
  Image, 
  Video, 
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ClipboardList,
  BarChart3,
  Library,
  Upload
} from 'lucide-react';

// Helper function to format dates
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    console.error("Date formatting error:", error);
    return 'Invalid date';
  }
};

// Status badge component
const StatusBadge = ({ status }) => {
  let color;
  
  switch (status) {
    case 'published':
      color = 'bg-green-100 text-green-800 border-green-200';
      break;
    case 'draft':
      color = 'bg-amber-100 text-amber-800 border-amber-200';
      break;
    case 'archived':
      color = 'bg-gray-100 text-gray-800 border-gray-200';
      break;
    default:
      color = 'bg-blue-100 text-blue-800 border-blue-200';
  }
  
  return (
    <Badge className={`${color} capitalize`} variant="outline">
      {status}
    </Badge>
  );
};

// Content type icon component
const ContentTypeIcon = ({ type }) => {
  switch (type) {
    case 'article':
      return <FileText className="h-4 w-4 text-blue-500" />;
    case 'image':
      return <Image className="h-4 w-4 text-green-500" />;
    case 'video':
      return <Video className="h-4 w-4 text-red-500" />;
    case 'document':
      return <FileText className="h-4 w-4 text-amber-500" />;
    default:
      return <FileText className="h-4 w-4 text-gray-500" />;
  }
};

// Content uploader component (based on existing BrandContentUploader)
const ContentUploader = ({ brandId, onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [fileSuccess, setFileSuccess] = useState("");
  const [videoInfo, setVideoInfo] = useState("");
  
  const MAX_SIZE_MB = {
    image: 5,
    video: 50,
    document: 10,
    other: 10
  };
  
  const validateFile = (file) => {
    let fileType = "other";
    if (file.type.startsWith("image/")) fileType = "image";
    if (file.type.startsWith("video/")) fileType = "video";
    if (file.type.startsWith("application/pdf") || file.type.includes("document")) fileType = "document";
    
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_SIZE_MB[fileType]) {
      setFileError(
        `File too large! ${fileType} files must be under ${MAX_SIZE_MB[fileType]}MB`
      );
      setFileSuccess("");
      setVideoInfo("");
      return false;
    }
    
    setFileError("");
    setFileSuccess(`✓ File size OK (${fileSizeMB.toFixed(2)}MB)`);
    
    if (fileType === "video") {
      analyzeVideo(file);
    } else {
      setVideoInfo("");
    }
    
    return true;
  };
  
  const analyzeVideo = (file) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = function () {
      const duration = Math.round(video.duration);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      if (duration > 300) {
        setVideoInfo(
          `⚠️ Video is ${minutes}:${seconds
            .toString()
            .padStart(2, "0")} - consider keeping under 5:00 for optimal performance`
        );
      } else {
        setVideoInfo(
          `✓ Video: ${minutes}:${seconds
            .toString()
            .padStart(2, "0")} duration - good length for mobile viewing`
        );
      }
      URL.revokeObjectURL(video.src);
    };
    video.src = URL.createObjectURL(file);
  };
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      validateFile(selectedFile);
    } else {
      setFileError("");
      setFileSuccess("");
      setVideoInfo("");
    }
  };
  
  const handleUpload = async () => {
    if (!file || !title || !type) {
      setFileError("Please provide a title, select content type, and choose a file");
      return;
    }
    
    if (!validateFile(file)) {
      return;
    }
    
    setUploading(true);
    setProgress(0);
    
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `brands/${brandId}/content/${fileName}`);
      
      // Use resumable upload to track progress
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setProgress(progress);
        },
        (error) => {
          setFileError(`Upload error: ${error.message}`);
          setUploading(false);
        },
        async () => {
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Save content metadata to Firestore
          const contentData = {
            title,
            description,
            type,
            mediaUrl: downloadURL,
            isPublished,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            size: file.size,
            fileName: file.name
          };
          
          await addDoc(collection(db, "brands", brandId, "content"), contentData);
          
          // Reset form
          setTitle("");
          setDescription("");
          setType("");
          setIsPublished(false);
          setFile(null);
          setFileSuccess("");
          setVideoInfo("");
          setUploading(false);
          setProgress(0);
          
          if (onUploadComplete) {
            onUploadComplete();
          }
        }
      );
    } catch (error) {
      setFileError(`Error: ${error.message}`);
      setUploading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload New Content</CardTitle>
        <CardDescription>
          Add videos, images, articles, or documents to your brand's content library
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title *
            </label>
            <Input
              id="title"
              placeholder="Enter content title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              className="w-full min-h-[100px] p-2 border rounded-md"
              placeholder="Enter content description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              Content Type *
            </label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video (720p recommended)</SelectItem>
                <SelectItem value="document">Document</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="file" className="text-sm font-medium">
              Upload File *
            </label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept="image/*,video/mp4,video/mov,video/avi,.pdf,.doc,.docx"
            />
            {fileError && (
              <p className="text-sm text-red-500">{fileError}</p>
            )}
            {fileSuccess && (
              <p className="text-sm text-green-500">{fileSuccess}</p>
            )}
            {videoInfo && (
              <p className={`text-sm ${videoInfo.startsWith("✓") ? "text-green-500" : "text-amber-500"}`}>
                {videoInfo}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublished"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="isPublished" className="text-sm">
              Publish immediately
            </label>
          </div>
          
          {progress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
              <p className="text-xs text-center mt-1">{progress}% uploaded</p>
            </div>
          )}
          
          <Button 
            onClick={handleUpload} 
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Content
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const ContentManager = ({ brandId: propBrandId }) => {
  // Get brandId from props or URL params
  const { brandId: urlBrandId } = useParams();
  const brandId = propBrandId || urlBrandId || 'default-brand';
  
  // State for challenges
  const [challenges, setChallenges] = useState([]);
  const [filteredChallenges, setFilteredChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for editing
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editorMode, setEditorMode] = useState('create');
  
  // State for filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  
  // State for content library
  const [contentItems, setContentItems] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);
  
  // Fetch challenges
  const fetchChallenges = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const challengesRef = collection(db, 'brands', brandId, 'challenges');
      const q = query(challengesRef, orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const challengesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setChallenges(challengesList);
      applyFilters(challengesList, searchQuery, statusFilter);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching challenges:", err);
      setError("Failed to load challenges. Please try again.");
      setLoading(false);
    }
  };
  
  // Fetch content library items
  const fetchContentLibrary = async () => {
    setContentLoading(true);
    
    try {
      const contentRef = collection(db, 'brands', brandId, 'content');
      const q = query(contentRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const contentList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setContentItems(contentList);
      setContentLoading(false);
    } catch (err) {
      console.error("Error fetching content library:", err);
      setContentLoading(false);
      // Use empty array instead of error state for content to avoid disrupting the UI
      setContentItems([]);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchChallenges();
    fetchContentLibrary();
  }, [brandId]);
  
  // Apply filters and search
  const applyFilters = (challengesList, query, status) => {
    let filtered = [...(challengesList || challenges)];
    
    // Apply search query
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(challenge => 
        challenge.title?.toLowerCase().includes(lowerQuery) ||
        challenge.description?.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Apply status filter
    if (status && status !== 'all') {
      filtered = filtered.filter(challenge => challenge.status === status);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (sortBy === 'startDate') {
        const dateA = a.startDate ? a.startDate.toDate?.() || new Date(a.startDate) : new Date(0);
        const dateB = b.startDate ? b.startDate.toDate?.() || new Date(b.startDate) : new Date(0);
        return dateB - dateA;
      } else {
        // Default to updatedAt
        const dateA = a.updatedAt ? a.updatedAt.toDate?.() || new Date(a.updatedAt) : new Date(0);
        const dateB = b.updatedAt ? b.updatedAt.toDate?.() || new Date(b.updatedAt) : new Date(0);
        return dateB - dateA;
      }
    });
    
    setFilteredChallenges(filtered);
  };
  
  // Handle search
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    applyFilters(null, query, statusFilter);
  };
  
  // Handle status filter
  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    applyFilters(null, searchQuery, value);
  };
  
  // Handle sort change
  const handleSortChange = (value) => {
    setSortBy(value);
    applyFilters(null, searchQuery, statusFilter);
  };
  
  // Open editor for creating a new challenge
  const handleCreateChallenge = () => {
    setSelectedChallenge(null);
    setEditorMode('create');
    setShowEditor(true);
  };
  
  // Open editor for editing an existing challenge
  const handleEditChallenge = (challenge) => {
    setSelectedChallenge(challenge);
    setEditorMode('edit');
    setShowEditor(true);
  };

  // Open editor for duplicating an existing challenge
  const handleDuplicateChallenge = (challenge) => {
    setSelectedChallenge({
      ...challenge,
      title: `${challenge.title} (Copy)`,
      status: 'draft'
    });
    setEditorMode('duplicate');
    setShowEditor(true);
  };
  
  // Handle challenge deletion
  const handleDeleteChallenge = async (challengeId) => {
    if (!confirm("Are you sure you want to delete this challenge?")) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'brands', brandId, 'challenges', challengeId));
      setChallenges(challenges.filter(c => c.id !== challengeId));
      setFilteredChallenges(filteredChallenges.filter(c => c.id !== challengeId));
    } catch (err) {
      console.error("Error deleting challenge:", err);
      setError("Failed to delete challenge. Please try again.");
    }
  };
  
  // Handle editor save
  const handleEditorSave = () => {
    setShowEditor(false);
    fetchChallenges(); // Refresh the list
  };
  
  // Handle editor cancel
  const handleEditorCancel = () => {
    setShowEditor(false);
  };
  
  // Handle content deletion
  const handleDeleteContent = async (contentId) => {
    if (!confirm("Are you sure you want to delete this content item?")) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'brands', brandId, 'content', contentId));
      setContentItems(contentItems.filter(c => c.id !== contentId));
    } catch (err) {
      console.error("Error deleting content:", err);
      alert("Failed to delete content. Please try again.");
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Content Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Create and manage challenges, content, and analytics for {brandId}
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="challenges" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            <span>Challenges</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            <span>Content Library</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Challenges Tab */}
        <TabsContent value="challenges" className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <CardTitle>Challenges</CardTitle>
                  <CardDescription>
                    Create and manage challenges for your brand
                  </CardDescription>
                </div>
                <Button onClick={handleCreateChallenge} className="sm:self-end">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Challenge
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search challenges..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={handleStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="updatedAt">Last Updated</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="startDate">Start Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    {error}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2" 
                      onClick={fetchChallenges}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              {loading ? (
                <div className="flex justify-center items-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : filteredChallenges.length === 0 ? (
                <div className="text-center p-12 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                    <ClipboardList className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No challenges found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {searchQuery || statusFilter !== 'all' 
                      ? "Try adjusting your search or filters"
                      : "Get started by creating your first challenge"}
                  </p>
                  {searchQuery || statusFilter !== 'all' ? (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('all');
                        applyFilters(null, '', 'all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  ) : (
                    <Button onClick={handleCreateChallenge}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Challenge
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredChallenges.map(challenge => (
                    <div 
                      key={challenge.id} 
                      className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-lg">{challenge.title}</h3>
                            <StatusBadge status={challenge.status} />
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 line-clamp-2">
                            {challenge.description || "No description provided"}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                            {challenge.startDate && (
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>{formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}</span>
                              </div>
                            )}
                            {challenge.communityId && (
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                <span>{challenge.communityId}</span>
                              </div>
                            )}
                            {challenge.points > 0 && (
                              <div className="flex items-center">
                                <Award className="h-4 w-4 mr-1" />
                                <span>{challenge.points} points</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditChallenge(challenge)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleEditChallenge(challenge)}
                                className="cursor-pointer"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDuplicateChallenge(challenge)}
                                className="cursor-pointer"
                              >
                                <ClipboardList className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteChallenge(challenge.id)}
                                className="text-red-600 cursor-pointer focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      {challenge.activities && challenge.activities.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium mb-2">Activities ({challenge.activities.length})</p>
                          <div className="flex flex-wrap gap-2">
                            {challenge.activities.map((activity, i) => (
                              <Badge key={i} variant="secondary">
                                {activity.type || 'Activity'} {i + 1}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Content Library Tab */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                      <CardTitle>Content Library</CardTitle>
                      <CardDescription>
                        Manage and organize your brand content
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={fetchContentLibrary}
                      className="sm:self-end"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search content library..."
                      className="pl-10"
                    />
                  </div>
                  
                  {contentLoading ? (
                    <div className="flex justify-center items-center p-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : contentItems.length === 0 ? (
                    <div className="text-center p-12 border rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                        <Library className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Content library is empty</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Add content items to your library to get started
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                      {contentItems.map(item => (
                        <Card key={item.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <div className="flex items-center gap-2">
                                <ContentTypeIcon type={item.type} />
                                <CardTitle className="text-base">{item.title}</CardTitle>
                              </div>
                              <StatusBadge status={item.isPublished ? 'published' : 'draft'} />
                            </div>
                          </CardHeader>
                          <CardContent className="pb-2">
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {item.description || item.body || "No description provided"}
                            </p>
                            {item.mediaUrl && (
                              <div className="mt-2">
                                <a 
                                  href={item.mediaUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex items-center"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View content
                                </a>
                              </div>
                            )}
                          </CardContent>
                          <CardFooter className="flex justify-between pt-2 border-t">
                            <span className="text-xs text-gray-500">
                              {formatDate(item.createdAt)}
                            </span>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteContent(item.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Content Uploader */}
            <div>
              <ContentUploader 
                brandId={brandId} 
                onUploadComplete={fetchContentLibrary} 
              />
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Upload Guidelines</CardTitle>
                  <CardDescription>
                    Follow these guidelines for optimal content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm">
                    <div>
                      <h3 className="font-semibold mb-1">File Size Limits</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Images: Max 5MB (JPG, PNG, GIF)</li>
                        <li>Videos: Max 50MB, 5 minutes (MP4, MOV)</li>
                        <li>Documents: Max 10MB (PDF, DOC)</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-1">Video Tips</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Use 720p resolution for mobile screens</li>
                        <li>Keep videos under 5 minutes</li>
                        <li>Use MP4 format with H.264 codec</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-1">Content Retention</h3>
                      <p>
                        All uploaded content is tied to your active subscription. 
                        Upon contract expiration, content will be removed within 30 days.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Analytics</CardTitle>
              <CardDescription>
                Track performance of your challenges and content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-12">
                <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Analytics Coming Soon
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  This feature is currently in development
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Challenge Editor Modal */}
      {showEditor && (
        <ChallengeEditor2
          brandId={brandId}
          challenge={selectedChallenge}
          mode={editorMode}
          onSaved={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      )}
    </div>
  );
};

export default ContentManager;
