import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db, storage, isLocalhost } from '../../../firebase';
import { ref, deleteObject } from 'firebase/storage';
import { useAuth } from '../../../contexts/auth-context';
import { toast } from "sonner";

// UI Components
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Label } from '../../ui/label';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { ScrollArea } from '../../ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import FileUploader from './FileUploader';

// Icons
import { Pencil, Trash2, Eye, Plus, Image, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

export default function LessonsManager() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    imageUrl: '',
    published: false,
    brandId: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewLesson, setPreviewLesson] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const { user, brandId } = useAuth();
  
  // Fetch lessons on component mount
  useEffect(() => {
    fetchLessons();
  }, []);
  
  // Fetch lessons from Firestore
  const fetchLessons = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const lessonsCollection = collection(db, 'lessons');
      const lessonsSnapshot = await getDocs(lessonsCollection);
      const lessonsList = lessonsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by creation date if available
      lessonsList.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.seconds - a.createdAt.seconds;
        }
        return 0;
      });
      
      setLessons(lessonsList);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      setError('Failed to fetch lessons. Please try again.');
      toast.error('Failed to fetch lessons.');
    } finally {
      setLoading(false);
    }
  };
  
  // Process image URL to handle both emulator and production URLs
  const processImageUrl = (uploadResult) => {
    // If no URL provided, return empty string
    if (!uploadResult) return '';
    
    // Debug – show exactly what we got from the uploader
    if (isLocalhost) {
      console.debug('[LessonsManager] processImageUrl → raw value:', uploadResult);
    }

    // Handle case where uploadResult is an object with url property
    // This is the format returned by our enhanced FileUploader component
    const url = typeof uploadResult === 'object' && uploadResult.url 
      ? uploadResult.url 
      : uploadResult;
    
    // Now that we have a string URL, we can safely use string methods
    if (typeof url !== 'string') {
      console.warn('Invalid URL format received:', url);
      return '';
    }
    
    // Special handling for emulator URLs
    if (isLocalhost && url.includes('localhost')) {
      // For emulator, we need to use the URL as is
      if (isLocalhost) {
        console.debug('[LessonsManager] processImageUrl → emulator url:', url);
      }
      return url;
    }
    
    // For production URLs, we might need to transform them
    // This is just an example - adjust based on your actual URL format
    if (isLocalhost) {
      console.debug('[LessonsManager] processImageUrl → prod url (no transform):', url);
    }
    return url;
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle image upload completion
  const handleFileUploadComplete = (uploadResult) => {
    try {
      console.debug('File upload complete, result:', uploadResult);
      
      // Process the image URL to handle emulator and production URLs
      const processedUrl = processImageUrl(uploadResult);
      
      if (isLocalhost) {
        console.debug('[LessonsManager] handleFileUploadComplete → processedUrl:', processedUrl);
      }

      setFormData({
        ...formData,
        imageUrl: processedUrl
      });
      
      setUploadingImage(false);
      
      toast.success('Image uploaded successfully.');
    } catch (error) {
      console.error('Error processing upload result:', error);
      setUploadingImage(false);
      toast.error('Failed to process uploaded image.');
    }
  };
  
  // Handle file upload error
  const handleFileUploadError = (error) => {
    console.error('File upload error:', error);
    setUploadingImage(false);
    toast.error(error.message || 'Failed to upload image.');
  };
  
  // Submit form to create or update a lesson
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const lessonData = {
        ...formData,
        brandId: brandId || 'default',
        updatedAt: new Date()
      };
      
      if (!isEditing) {
        // Create new lesson
        lessonData.createdAt = new Date();
        const docRef = await addDoc(collection(db, 'lessons'), lessonData);
        toast.success('Your lesson has been created successfully.');
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          content: '',
          imageUrl: '',
          published: false,
          brandId: brandId || 'default'
        });
      } else {
        // Update existing lesson
        await updateDoc(doc(db, 'lessons', currentLessonId), lessonData);
        toast.success('Your lesson has been updated successfully.');
        
        // Exit edit mode
        setIsEditing(false);
        setCurrentLessonId(null);
      }
      
      // Refresh lessons list
      fetchLessons();
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error('Failed to save lesson. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Delete a lesson
  const handleDeleteLesson = async (lessonId, imageUrl) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    
    try {
      // Delete the lesson document
      await deleteDoc(doc(db, 'lessons', lessonId));
      
      // If there's an image URL, delete the image from storage
      if (imageUrl) {
        try {
          // Extract the path from the URL
          let imagePath;
          
          if (isLocalhost && imageUrl.includes('localhost')) {
            // For emulator URLs, extract path from URL structure
            const urlParts = imageUrl.split('/o/')[1];
            if (urlParts) {
              imagePath = decodeURIComponent(urlParts.split('?')[0]);
            }
          } else {
            // For production URLs, extract path differently
            // This is an example - adjust based on your URL structure
            const urlParts = imageUrl.split('/o/')[1];
            if (urlParts) {
              imagePath = decodeURIComponent(urlParts.split('?')[0]);
            }
          }
          
          if (imagePath) {
            const imageRef = ref(storage, imagePath);
            await deleteObject(imageRef);
          }
        } catch (imageError) {
          console.error('Error deleting image:', imageError);
          // Continue even if image deletion fails
        }
      }
      
      // Update the lessons list
      setLessons(lessons.filter(lesson => lesson.id !== lessonId));
      
      toast.success('The lesson has been deleted successfully.');
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson. Please try again.');
    }
  };
  
  // Edit a lesson
  const handleEditLesson = async (lessonId) => {
    try {
      const lessonDoc = await getDoc(doc(db, 'lessons', lessonId));
      if (lessonDoc.exists()) {
        const lessonData = lessonDoc.data();
        setFormData({
          title: lessonData.title || '',
          description: lessonData.description || '',
          content: lessonData.content || '',
          imageUrl: lessonData.imageUrl || '',
          published: lessonData.published || false,
          brandId: lessonData.brandId || brandId || 'default'
        });
        setIsEditing(true);
        setCurrentLessonId(lessonId);
        
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Error fetching lesson for edit:', error);
      toast.error('Failed to load lesson for editing.');
    }
  };
  
  // Preview a lesson
  const handlePreviewLesson = async (lessonId) => {
    try {
      const lessonDoc = await getDoc(doc(db, 'lessons', lessonId));
      if (lessonDoc.exists()) {
        setPreviewLesson({
          id: lessonId,
          ...lessonDoc.data()
        });
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error fetching lesson for preview:', error);
      toast.error('Failed to load lesson preview.');
    }
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setCurrentLessonId(null);
    setFormData({
      title: '',
      description: '',
      content: '',
      imageUrl: '',
      published: false,
      brandId: brandId || 'default'
    });
  };
  
  // Filter lessons based on active tab
  const filteredLessons = lessons.filter(lesson => {
    if (activeTab === 'all') return true;
    if (activeTab === 'published') return lesson.published;
    if (activeTab === 'drafts') return !lesson.published;
    return true;
  });
  
  return (
    <div className="space-y-6">
      {/* ──────────────────────────────  FORM  +  LIVE PREVIEW  ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ───────────────  FORM  (3 / 5 cols) ─────────────── */}
        <div className="lg:col-span-3">
          <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Lesson' : 'Create New Lesson'}</CardTitle>
          <CardDescription>
            {isEditing 
              ? 'Update the lesson details below' 
              : 'Fill in the details to create a new lesson'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter lesson title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter a short description"
                  rows={2}
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
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="flex flex-col space-y-2">
                  {formData.imageUrl && (
                    <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-md border border-gray-200">
                      <img 
                        src={formData.imageUrl} 
                        alt="Cover" 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://placehold.co/600x400?text=Image+Not+Found';
                        }}
                      />
                    </div>
                  )}

              {/* Debug display for image URL (only visible in emulator mode) */}
              {formData.imageUrl && isLocalhost && (
                <div className="mt-2 p-3 bg-gray-100 rounded-md overflow-hidden text-xs">
                  <p className="font-semibold">Debug - Image URL:</p>
                  <p className="mt-1 break-all font-mono">{formData.imageUrl}</p>
                </div>
              )}
                  
                  <FileUploader
                    onUploadComplete={handleFileUploadComplete}
                    onUploadError={handleFileUploadError}
                    folder="lessons"
                    brandId={brandId}
                    buttonText="Upload Cover Image"
                    allowedTypes={['image/jpeg', 'image/png', 'image/webp']}
                    maxSizeMB={5}
                    /* 🔽 Optimised upload settings */
                    resizeImage={true}
                    maxWidth={1600}     // Recommended width
                    maxHeight={900}     // Recommended height (16:9)
                    quality={0.85}      // Compression quality
                  />
                  {/* Helper text for users */}
                  <p className="text-xs text-muted-foreground">
                    Recommended dimensions&nbsp;≤&nbsp;1600&nbsp;×&nbsp;900&nbsp;px&nbsp;(16:9)
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="published"
                  name="published"
                  checked={formData.published}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="published">Publish this lesson</Label>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {isEditing ? 'Update Lesson' : 'Create Lesson'}
                  </>
                )}
              </Button>
              
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
          </Card>
        </div>

        {/* ───────────────  LIVE PREVIEW  (2 / 5 cols) ─────────────── */}
        <div className="lg:col-span-2">
          <Card className="sticky top-4">
            <CardHeader className="pb-2">
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>See how your lesson will appear</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h2 className="text-2xl font-bold break-words">
                {formData.title || 'Lesson Title'}
              </h2>

              {/* Cover image / placeholder */}
              {formData.imageUrl ? (
                <div className="aspect-video w-full overflow-hidden rounded-md bg-gray-100">
                  <img
                    src={formData.imageUrl}
                    alt={formData.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        'https://placehold.co/600x400?text=Image+Not+Found';
                    }}
                  />
                </div>
              ) : (
                <div className="aspect-video w-full overflow-hidden rounded-md bg-gray-100 flex items-center justify-center">
                  <Image className="h-12 w-12 text-gray-300" />
                </div>
              )}

              <div className="font-medium text-gray-700">
                {formData.description || 'Lesson description will appear here…'}
              </div>

              <ScrollArea className="h-[300px] rounded border p-4">
                <div className="prose max-w-none">
                  {formData.content
                    ? formData.content
                        .split('\n')
                        .map((paragraph, idx) => <p key={idx}>{paragraph}</p>)
                    : (
                      <p className="text-gray-400">
                        Lesson content will appear here…
                      </p>
                    )}
                </div>
              </ScrollArea>

              <Badge variant={formData.published ? 'success' : 'secondary'}>
                {formData.published ? 'Published' : 'Draft'}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Manage Lessons</CardTitle>
          <CardDescription>
            View, edit, and delete existing lessons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Lessons</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="drafts">Drafts</TabsTrigger>
            </TabsList>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading lessons...</span>
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : filteredLessons.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Image className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No lessons found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {activeTab === 'all' 
                    ? 'Get started by creating your first lesson' 
                    : activeTab === 'published' 
                      ? 'No published lessons found' 
                      : 'No draft lessons found'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLessons.map((lesson) => (
                  <Card key={lesson.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      {lesson.imageUrl && (
                        <div className="aspect-video w-full md:w-1/4 overflow-hidden">
                          <img 
                            src={lesson.imageUrl} 
                            alt={lesson.title} 
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://placehold.co/600x400?text=Image+Not+Found';
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">{lesson.title}</h3>
                          <Badge variant={lesson.published ? "success" : "secondary"}>
                            {lesson.published ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {lesson.description || 'No description provided'}
                        </p>
                        
                        <div className="mt-4 flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreviewLesson(lesson.id)}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            Preview
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditLesson(lesson.id)}
                          >
                            <Pencil className="mr-1 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDeleteLesson(lesson.id, lesson.imageUrl)}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Lesson Preview Dialog */}
      {previewLesson && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{previewLesson.title}</DialogTitle>
              <DialogDescription>
                {previewLesson.description}
              </DialogDescription>
            </DialogHeader>
            
            {previewLesson.imageUrl && (
              <div className="aspect-video w-full overflow-hidden rounded-md">
                <img 
                  src={previewLesson.imageUrl} 
                  alt={previewLesson.title} 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/600x400?text=Image+Not+Found';
                  }}
                />
              </div>
            )}
            
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="prose max-w-none">
                {previewLesson.content.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </ScrollArea>
            
            <DialogFooter>
              <Button onClick={() => setShowPreview(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
