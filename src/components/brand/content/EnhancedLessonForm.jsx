import React, { useState, useEffect } from "react";
import { db } from "../../../lib/firebase";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "sonner";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Card, CardContent } from "../../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Loader2, Save, Plus } from "lucide-react";
import FileUploader from "./FileUploader";
import { storage } from "../../../lib/firebase";

/**
 * Enhanced form component for creating and editing lessons
 * 
 * @param {Object} props
 * @param {string} props.brandId - The brand ID
 * @param {Object} props.lesson - Existing lesson data for editing (null for creation)
 * @param {Function} props.onSuccess - Callback on successful save
 * @param {Function} props.onCancel - Callback on cancel
 */
export default function EnhancedLessonForm({ brandId, lesson = null, onSuccess, onCancel }) {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("article");
  const [status, setStatus] = useState("draft");
  const [featuredImage, setFeaturedImage] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  
  // Form processing state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("details");

  // Editing mode detection
  const isEditMode = !!lesson;

  // Initialize form with lesson data if in edit mode
  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title || "");
      setDescription(lesson.description || "");
      setContent(lesson.content || "");
      setType(lesson.type || "article");
      setStatus(lesson.status || "draft");
      setFeaturedImage(lesson.featuredImage || "");
      
      // If it's a video type, set the video URL
      if (lesson.type === "video" && lesson.content) {
        setVideoUrl(lesson.content);
      }
    }
  }, [lesson]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Prepare lesson data
      const lessonData = {
        title,
        description,
        // For video type, use the video URL as content
        content: type === "video" ? videoUrl : content,
        type,
        status,
        brandId,
        featuredImage,
        updatedAt: serverTimestamp()
      };

      // If creating new lesson, add createdAt timestamp
      if (!isEditMode) {
        lessonData.createdAt = serverTimestamp();
      }

      // Save to Firestore
      if (isEditMode) {
        // Update existing lesson
        const lessonRef = doc(db, "lessons", lesson.id);
        await updateDoc(lessonRef, lessonData);
        toast.success("Lesson updated successfully");
      } else {
        // Create new lesson
        await addDoc(collection(db, "lessons"), lessonData);
        toast.success("Lesson created successfully");
      }

      // Call success callback
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error saving lesson:", err);
      setError(err.message || "Failed to save lesson");
      toast.error(`Error: ${err.message || "Failed to save lesson"}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle featured image upload completion
  const handleFeaturedImageUpload = (url) => {
    setFeaturedImage(url);
  };

  // Handle video upload completion
  const handleVideoUpload = (url) => {
    setVideoUrl(url);
    // For video type, also set the content to the video URL
    if (type === "video") {
      setContent(url);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="details">Basic Details</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        {/* Basic Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Lesson title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
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
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this lesson"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">Content Type</label>
            <Select 
              value={type} 
              onValueChange={(value) => {
                setType(value);
                // If switching to video type and we have a video URL, update content
                if (value === "video" && videoUrl) {
                  setContent(videoUrl);
                }
              }}
            >
              <SelectTrigger id="type">
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
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          {type === "article" ? (
            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">Article Content</label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter the article content here..."
                rows={12}
                className="font-mono"
              />
            </div>
          ) : type === "video" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Video URL</label>
                <Input
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    setContent(e.target.value);
                  }}
                  placeholder="Enter video URL or upload below"
                />
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <FileUploader
                    folder={`brands/${brandId}/lessons/videos`}
                    filePrefix={`lesson-video-${new Date().getTime()}`}
                    defaultValue={videoUrl}
                    onUploadComplete={handleVideoUpload}
                    allowedTypes={["video/mp4", "video/webm"]}
                    maxSizeMB={200}
                  />
                </CardContent>
              </Card>
              
              {videoUrl && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Video Preview</label>
                  <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                    <iframe
                      src={videoUrl}
                      className="w-full h-full"
                      allowFullScreen
                      title="Video preview"
                    ></iframe>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="content" className="text-sm font-medium">Content</label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`Enter ${type} content or URL here...`}
                rows={8}
              />
            </div>
          )}
        </TabsContent>

        {/* Media Tab */}
        <TabsContent value="media" className="space-y-6">
          <div className="space-y-4">
            <label className="text-sm font-medium">Featured Image</label>
            <Card>
              <CardContent className="pt-6">
                <FileUploader
                  folder={`brands/${brandId}/lessons/images`}
                  filePrefix={`lesson-image-${new Date().getTime()}`}
                  defaultValue={featuredImage}
                  onUploadComplete={handleFeaturedImageUpload}
                  allowedTypes={["image/jpeg", "image/png", "image/gif", "image/webp"]}
                  maxSizeMB={10}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          {error}
        </div>
      )}

      {/* Form actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !title.trim()}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEditMode ? "Saving..." : "Creating..."}
            </>
          ) : isEditMode ? (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Create Lesson
            </>
          )}
        </Button>
      </div>
    </form>
  );
}