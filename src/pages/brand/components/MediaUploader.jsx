import React, { useState } from 'react';
import { storage } from '../../../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { X, Image as ImageIcon, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

/**
 * MediaUploader Component
 * Handles image uploads with validation, progress tracking, and resumable uploads
 * 
 * @param {string} brandId - Brand identifier for storage path
 * @param {string} postId - Post identifier for storage path (generated if not provided)
 * @param {number} maxMB - Maximum file size in MB (default from env or 5)
 * @param {function} onImagesChange - Callback when images array changes
 * @param {function} onUploadingChange - Callback when uploading count changes
 */
const MediaUploader = ({ 
  brandId, 
  postId, 
  maxMB = parseInt(import.meta.env.VITE_MAX_IMAGE_MB) || 5,
  onImagesChange,
  onUploadingChange
}) => {
  const [images, setImages] = useState([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [errors, setErrors] = useState({});

  // Update parent components when state changes
  const updateImages = (newImages) => {
    setImages(newImages);
    if (onImagesChange) {
      onImagesChange(newImages);
    }
  };

  const updateUploadingCount = (count) => {
    setUploadingCount(count);
    if (onUploadingChange) {
      onUploadingChange(count);
    }
  };

  // Validate file before upload
  const validateFile = (file) => {
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      return `Only image files are allowed. ${file.name} is ${file.type}`;
    }

    // Check file size
    const maxBytes = maxMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return `Max file size is ${maxMB}MB. ${file.name} is ${(file.size / (1024 * 1024)).toFixed(2)}MB`;
    }

    return null;
  };

  // Generate unique ID for tracking
  const generateId = () => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Clear file input
    e.target.value = '';

    // Validate and upload each file
    files.forEach(file => {
      const error = validateFile(file);
      const fileId = generateId();

      if (error) {
        // Show error for this file
        setErrors(prev => ({ ...prev, [fileId]: error }));
        
        // Add to images array with error state
        updateImages(prev => [...prev, {
          id: fileId,
          name: file.name,
          error: error,
          progress: 0
        }]);

        // Auto-remove error after 5 seconds
        setTimeout(() => {
          removeImage(fileId);
        }, 5000);
      } else {
        // Create preview
        const preview = URL.createObjectURL(file);

        // Add to images array with uploading state
        updateImages(prev => [...prev, {
          id: fileId,
          name: file.name,
          preview: preview,
          progress: 0,
          uploading: true
        }]);

        // Start upload
        uploadFile(file, fileId);
      }
    });
  };

  // Upload file to Firebase Storage with resumable upload
  const uploadFile = async (file, fileId) => {
    try {
      // Increment uploading count
      updateUploadingCount(prev => prev + 1);

      // Generate storage path
      const timestamp = Date.now();
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `brands/${brandId}/community/${postId || 'temp'}/${timestamp}_${safeFileName}`;
      
      // Create storage reference
      const storageRef = ref(storage, storagePath);

      // Start resumable upload
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Monitor upload progress
      uploadTask.on('state_changed',
        (snapshot) => {
          // Calculate progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          
          // Update progress in images array
          updateImages(prev => prev.map(img => 
            img.id === fileId 
              ? { ...img, progress: Math.round(progress) }
              : img
          ));
        },
        (error) => {
          // Handle upload error
          const errorMessage = getErrorMessage(error);
          
          // Update image with error state
          updateImages(prev => prev.map(img => 
            img.id === fileId 
              ? { ...img, error: errorMessage, uploading: false, progress: 0 }
              : img
          ));

          setErrors(prev => ({ ...prev, [fileId]: errorMessage }));

          // Decrement uploading count
          updateUploadingCount(prev => Math.max(0, prev - 1));

          // Auto-remove error after 5 seconds
          setTimeout(() => {
            removeImage(fileId);
          }, 5000);
        },
        async () => {
          // Upload complete - get download URL
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Update image with final URL
            updateImages(prev => prev.map(img => 
              img.id === fileId 
                ? { 
                    ...img, 
                    downloadURL, 
                    path: storagePath,
                    uploading: false, 
                    progress: 100,
                    complete: true
                  }
                : img
            ));

            // Decrement uploading count
            updateUploadingCount(prev => Math.max(0, prev - 1));

            // Clear any previous errors
            setErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors[fileId];
              return newErrors;
            });
          } catch (error) {
            const errorMessage = 'Failed to get download URL';
            
            updateImages(prev => prev.map(img => 
              img.id === fileId 
                ? { ...img, error: errorMessage, uploading: false }
                : img
            ));

            setErrors(prev => ({ ...prev, [fileId]: errorMessage }));
            updateUploadingCount(prev => Math.max(0, prev - 1));
          }
        }
      );
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      
      updateImages(prev => prev.map(img => 
        img.id === fileId 
          ? { ...img, error: errorMessage, uploading: false }
          : img
      ));

      setErrors(prev => ({ ...prev, [fileId]: errorMessage }));
      updateUploadingCount(prev => Math.max(0, prev - 1));
    }
  };

  // Get user-friendly error message
  const getErrorMessage = (error) => {
    if (error.code === 'storage/unauthorized') {
      return 'You do not have permission to upload files';
    } else if (error.code === 'storage/canceled') {
      return 'Upload was canceled';
    } else if (error.code === 'storage/quota-exceeded') {
      return 'Storage quota exceeded';
    } else {
      return error.message || 'Upload failed. Please try again.';
    }
  };

  // Remove image from list
  const removeImage = (fileId) => {
    updateImages(prev => {
      const image = prev.find(img => img.id === fileId);
      
      // Revoke preview URL if exists
      if (image?.preview) {
        URL.revokeObjectURL(image.preview);
      }

      return prev.filter(img => img.id !== fileId);
    });

    // Clear error
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fileId];
      return newErrors;
    });
  };

  // Retry failed upload
  const retryUpload = (fileId) => {
    // This would require storing the original file object
    // For now, just remove the failed upload
    removeImage(fileId);
  };

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition">
          <ImageIcon className="w-4 h-4 text-gray-600" />
          <span className="text-sm text-gray-700">Add Images</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </label>
        <span className="text-xs text-gray-500">
          Max {maxMB}MB per image
        </span>
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map(image => (
            <div 
              key={image.id} 
              className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
            >
              {/* Preview image */}
              {image.preview && !image.error && (
                <img
                  src={image.preview}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Error state */}
              {image.error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 p-2">
                  <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                  <p className="text-xs text-red-600 text-center line-clamp-3">
                    {image.error}
                  </p>
                </div>
              )}

              {/* Progress overlay */}
              {image.uploading && !image.error && (
                <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                  <div className="w-3/4 bg-gray-300 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${image.progress}%` }}
                    />
                  </div>
                  <p className="text-white text-xs mt-1">{image.progress}%</p>
                </div>
              )}

              {/* Complete indicator */}
              {image.complete && !image.uploading && (
                <div className="absolute top-2 left-2 bg-green-500 rounded-full p-1">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Remove button */}
              <button
                onClick={() => removeImage(image.id)}
                disabled={image.uploading}
                className="absolute top-2 right-2 bg-black bg-opacity-70 text-white rounded-full p-1 hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Retry button for errors */}
              {image.error && (
                <button
                  onClick={() => retryUpload(image.id)}
                  className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded hover:bg-blue-600 transition"
                >
                  Retry
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload status message */}
      {uploadingCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Uploading {uploadingCount} {uploadingCount === 1 ? 'image' : 'images'}...</span>
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
