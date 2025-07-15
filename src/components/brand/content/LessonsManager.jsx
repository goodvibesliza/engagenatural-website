import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/auth-context";
import { db, isLocalhost } from "../../../firebase";
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
  serverTimestamp
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
import { Alert, AlertDescription } from "../../ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../ui/alert-dialog";

// Icons
import { Plus, Edit, Trash2, BookOpen, FileText, Video, Music, Calendar, RefreshCw, Loader2, ImageIcon, Info } from "lucide-react";

// File Uploader
import FileUploader from "./FileUploader";

// Default fallback image
const FALLBACK_IMAGE = "https://placehold.co/600x400?text=Image+Not+Available";
const PREVIEW_FALLBACK = "https://placehold.co/600x400?text=Preview+Not+Available";

export default function LessonsManager({ brandId }) {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    type: "article",
    status: "draft",
    featuredImage: "",
    brandId: brandId || ""
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");
  const [previewError, setPreviewError] = useState(false);

  // Process image URL for emulator compatibility
  const processImageUrl = (url) => {
    if (!url) return "";
    
    // Handle emulator storage URLs which might have localhost:9199 in them
    if (isLocalhost && url.includes('localhost:9199')) {
      // For emulator URLs, ensure they're properly formatted
      return url;
    }
    
    return url;
  };

  // Fetch lessons for the brand
  useEffect(() => {
    fetchLessons();
  }, [brandId]);

  const fetchLessons = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // If no brandId is provided, use the current user's brandId
      const activeBrandId = brandId || user?.brandId;
      
      if (!activeBrandId) {
        throw new Error("No brand ID available");
      }
      
      const q = query(
        collection(db, "lessons"),
        where("brandId", "==", activeBrandId),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const lessonsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      
      setLessons(lessonsData);
    } catch (err) {
      console.error("Error fetching lessons:", err);
      setError(err.message);
      toast.error("Failed to load lessons");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Reset preview error when changing the image URL manually
    if (name === 'featuredImage') {
      setPreviewError(false);
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleTypeChange = (value) => {
    setFormData({
      ...formData,
      type: value
    });
  };

  const handleStatusChange = (value) => {
    setFormData({
      ...formData,
      status: value
    });
  };

  const openCreateDialog = () => {
    setFormData({
      title: "",
      description: "",
      content: "",
      type: "article",
      status: "draft",
      featuredImage: "",
      brandId: brandId || user?.brandId || ""
    });
    setUploadedFileUrl("");
    setPreviewError(false);
    setIsEditing(false);
    setDialogOpen(true);
  };

  const openEditDialog = (lesson) => {
    setCurrentLesson(lesson);
    setPreviewError(false);
    
    // Process the image URL for proper display
    const processedImageUrl = processImageUrl(lesson.featuredImage);
    
    setFormData({
      title: lesson.title || "",
      description: lesson.description || "",
      content: lesson.content || "",
      type: lesson.type || "article",
      status: lesson.status || "draft",
      featuredImage: processedImageUrl || "",
      brandId: lesson.brandId || brandId || user?.brandId || ""
    });
    
    setUploadedFileUrl(processedImageUrl || "");
    setIsEditing(true);
    setDialogOpen(true);
  };

  const openDeleteDialog = (lesson) => {
    setLessonToDelete(lesson);
    setDeleteDialogOpen(true);
  };

  const handleCreateLesson = async () => {
    if (!formData.title || !formData.description) {
      toast.error("Title and description are required");
      return;
    }

    setLoading(true);
    
    try {
      // Use the most recent image URL (either uploaded or entered manually)
      const finalImageUrl = uploadedFileUrl || formData.featuredImage;
      
      const newLesson = {
        ...formData,
        featuredImage: finalImageUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, "lessons"), newLesson);
      toast.success("Lesson created successfully");
      setDialogOpen(false);
      fetchLessons();
    } catch (err) {
      console.error("Error creating lesson:", err);
      toast.error("Failed to create lesson");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLesson = async () => {
    if (!currentLesson || !formData.title || !formData.description) {
      toast.error("Title and description are required");
      return;
    }

    setLoading(true);
    
    try {
      const lessonRef = doc(db, "lessons", currentLesson.id);
      
      // Use the most recent image URL (either uploaded or entered manually)
      const finalImageUrl = uploadedFileUrl || formData.featuredImage;
      
      const updatedData = {
        ...formData,
        featuredImage: finalImageUrl,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(lessonRef, updatedData);
      toast.success("Lesson updated successfully");
      setDialogOpen(false);
      fetchLessons();
    } catch (err) {
      console.error("Error updating lesson:", err);
      toast.error("Failed to update lesson");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!lessonToDelete) return;
    
    setLoading(true);
    
    try {
      const lessonRef = doc(db, "lessons", lessonToDelete.id);
      await deleteDoc(lessonRef);
      toast.success("Lesson deleted successfully");
      setDeleteDialogOpen(false);
      setLessonToDelete(null);
      fetchLessons();
    } catch (err) {
      console.error("Error deleting lesson:", err);
      toast.error("Failed to delete lesson");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploadComplete = (fileUrl) => {
    if (!fileUrl) {
      toast.error("File upload failed to return a valid URL");
      return;
    }
    
    // Process the URL for emulator compatibility
    const processedUrl = processImageUrl(fileUrl);
    
    // Update both state variables to keep them in sync
    setUploadedFileUrl(processedUrl);
    setFormData({
      ...formData,
      featuredImage: processedUrl
    });
    
    // Reset preview error state
    setPreviewError(false);
    
    toast.success("File uploaded successfully");
    
    if (isLocalhost) {
      console.log("📸 Image URL from emulator:", processedUrl);
    }
  };

  const handleImageError = (e, fallbackUrl = FALLBACK_IMAGE) => {
    console.warn("Image failed to load:", e.target.src);
    e.target.onerror = null; // Prevent infinite loop
    e.target.src = fallbackUrl;
    
    if (e.target.dataset.preview) {
      setPreviewError(true);
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

  const getLessonTypeIcon = (type) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "audio":
        return <Music className="h-4 w-4" />;
      case "event":
        return <Calendar className="h-4 w-4" />;
      case "article":
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get the current image URL for preview, prioritizing the uploaded file
  const getCurrentImageUrl = () => {
    return uploadedFileUrl || formData.featuredImage || "";
  };

  if (loading && lessons.length === 0) {
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
          <h2 className="text-2xl font-semibold">Lessons</h2>
          <p className="text-muted-foreground">
            Manage your brand's lessons and educational content
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLessons}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Lesson
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {lessons.length === 0 && !loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              No lessons found for this brand.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Lesson
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lessons.map((lesson) => (
            <Card key={lesson.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {getLessonTypeIcon(lesson.type)}
                    <CardTitle className="text-xl">{lesson.title}</CardTitle>
                  </div>
                  <Badge
                    variant={lesson.status === "published" ? "success" : "outline"}
                    className={
                      lesson.status === "published"
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : ""
                    }
                  >
                    {lesson.status === "published" ? "Published" : "Draft"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {lesson.featuredImage ? (
                  <div className="mb-4 aspect-video bg-muted rounded-md overflow-hidden">
                    <img
                      src={processImageUrl(lesson.featuredImage)}
                      alt={lesson.title}
                      className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e, FALLBACK_IMAGE)}
                    />
                  </div>
                ) : (
                  <div className="mb-4 aspect-video bg-muted rounded-md flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground opacity-30" />
                  </div>
                )}
                
                <p className="text-sm mb-4 line-clamp-2">{lesson.description}</p>
                
                <div className="text-xs text-muted-foreground">
                  Created: {formatDate(lesson.createdAt)}
                  {lesson.updatedAt && lesson.updatedAt !== lesson.createdAt && (
                    <> • Updated: {formatDate(lesson.updatedAt)}</>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(lesson)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openDeleteDialog(lesson)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Lesson Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Lesson" : "Create New Lesson"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the details of your lesson"
                : "Create a new lesson for your brand"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Lesson Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter lesson title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter lesson description"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Enter lesson content"
                  rows={6}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Lesson Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={handleTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
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
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="featuredImage">Featured Image</Label>
                <div className="grid grid-cols-1 gap-4">
                  <Input
                    id="featuredImage"
                    name="featuredImage"
                    value={formData.featuredImage}
                    onChange={handleInputChange}
                    placeholder="Enter image URL or upload below"
                  />
                  
                  <div className="space-y-2">
                    <Label>Upload Image</Label>
                    <FileUploader
                      folder={`lessons/${formData.brandId || 'default'}`}
                      onUploadComplete={handleFileUploadComplete}
                    />
                  </div>
                  
                  {/* Image Preview Section */}
                  {getCurrentImageUrl() && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-2">
                        <Label>Preview</Label>
                        {isLocalhost && (
                          <Badge variant="outline" className="text-xs">
                            Emulator Mode
                          </Badge>
                        )}
                      </div>
                      
                      {previewError ? (
                        <div className="mt-2 aspect-video bg-muted rounded-md flex flex-col items-center justify-center p-4">
                          <ImageIcon className="h-12 w-12 text-muted-foreground opacity-30 mb-2" />
                          <p className="text-sm text-muted-foreground text-center">
                            Image preview not available
                          </p>
                          {isLocalhost && (
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                              This is common with Firebase Storage emulator URLs
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 aspect-video bg-muted rounded-md overflow-hidden">
                          <img
                            src={getCurrentImageUrl()}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            data-preview="true"
                            onError={(e) => handleImageError(e, PREVIEW_FALLBACK)}
                          />
                        </div>
                      )}
                      
                      {isLocalhost && getCurrentImageUrl() && (
                        <div className="mt-2 text-xs text-muted-foreground break-all">
                          <p>URL: {getCurrentImageUrl()}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Emulator info */}
                  {isLocalhost && (
                    <Alert variant="info" className="bg-blue-50 text-blue-800 border-blue-200 mt-2">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        In emulator mode, images may not display correctly in the preview,
                        but they will be stored correctly in the database.
                      </AlertDescription>
                    </Alert>
                  )}
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
              onClick={isEditing ? handleUpdateLesson : handleCreateLesson}
              disabled={loading || !formData.title || !formData.description}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Lesson" : "Create Lesson"}
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
              This will permanently delete the lesson "{lessonToDelete?.title}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLesson}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
