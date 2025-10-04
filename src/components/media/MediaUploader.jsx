import React, { useState, useRef, useEffect } from 'react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Button } from '../ui/Button';
import { Progress } from '../ui/progress';
import { X, Upload, AlertCircle } from 'lucide-react';

/**
 * MediaUploader - Resumable image upload with progress and size limits
 * @param {string} brandId - Brand ID for storage path
 * @param {string} [postId] - Post ID (generated if not provided)
 * @param {number} [maxMB=5] - Max file size in MB
 * @param {function} onComplete - Callback when all uploads complete with downloadURLs
 * @param {function} [onUploadingChange] - Callback when upload count changes
 */
export default function MediaUploader({
  brandId,
  postId,
  maxMB,
  onComplete,
  onUploadingChange
}) {
  const fileInputRef = useRef(null);
  const [uploads, setUploads] = useState([]);
  const [error, setError] = useState('');
  const uploadTasksRef = useRef(new Map());
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      uploadTasksRef.current.forEach((task) => task.cancel?.());
      uploadTasksRef.current.clear();
    };
  }, []);
  
  const maxBytes = (maxMB || Number(import.meta.env.VITE_MAX_IMAGE_MB) || 5) * 1024 * 1024;
  const currentPostId = postId || `temp_${Date.now()}`;

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setError('');

    files.forEach(file => {
      // Validate image type
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`);
        return;
      }

      // Validate file size
      if (file.size > maxBytes) {
        setError(`${file.name} exceeds max file size: ${maxMB || 5}MB`);
        return;
      }

      // Start upload
      startUpload(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startUpload = (file) => {
    const uploadId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `brands/${brandId}/community/${currentPostId}/${filename}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTasksRef.current.set(uploadId, uploadTask);

    // Create upload entry
    const newUpload = {
      id: uploadId,
      name: file.name,
      progress: 0,
      status: 'uploading', // uploading | success | error
      downloadURL: null,
      error: null,
      uploadTask
    };

    setUploads(prev => {
      const updated = [...prev, newUpload];
      updateUploadingCount(updated);
      return updated;
    });

    // Monitor upload progress
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (isMountedRef.current) {
          setUploads(prev => prev.map(u => 
            u.id === uploadId 
              ? { ...u, progress: Math.round(progress) }
              : u
          ));
        }
      },
      (error) => {
        // Remove from tracking
        uploadTasksRef.current.delete(uploadId);
        
        // Handle error
        if (isMountedRef.current) {
          setUploads(prev => {
            const updated = prev.map(u =>
              u.id === uploadId
                ? { ...u, status: 'error', error: error.message }
                : u
            );
            updateUploadingCount(updated);
            notifyComplete(updated);
            return updated;
          });
        }
      },
      async () => {
        // Handle successful upload
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Remove from tracking
          uploadTasksRef.current.delete(uploadId);
          
          if (isMountedRef.current) {
            setUploads(prev => {
              const updated = prev.map(u =>
                u.id === uploadId
                  ? { ...u, status: 'success', progress: 100, downloadURL }
                  : u
              );
              updateUploadingCount(updated);
              notifyComplete(updated);
              return updated;
            });
          }
        } catch (error) {
          // Remove from tracking
          uploadTasksRef.current.delete(uploadId);
          
          if (isMountedRef.current) {
            setUploads(prev => {
              const updated = prev.map(u =>
                u.id === uploadId
                  ? { ...u, status: 'error', error: 'Failed to get download URL' }
                  : u
              );
              updateUploadingCount(updated);
              notifyComplete(updated);
              return updated;
            });
          }
        }
      }
    );
  };

  const updateUploadingCount = (currentUploads) => {
    const uploadingCount = currentUploads.filter(u => u.status === 'uploading').length;
    if (onUploadingChange) {
      onUploadingChange(uploadingCount);
    }
  };

  const notifyComplete = (currentUploads) => {
    const uploadingCount = currentUploads.filter(u => u.status === 'uploading').length;
    
    // Notify when all uploads are done
    if (uploadingCount === 0) {
      if (currentUploads.length === 0) {
        // Empty list - notify parent with empty array
        if (onComplete) {
          onComplete([]);
        }
      } else {
        // Non-empty list - collect successful URLs
        const successfulUrls = currentUploads
          .filter(u => u.status === 'success' && u.downloadURL)
          .map(u => u.downloadURL);
        
        if (onComplete) {
          onComplete(successfulUrls);
        }
      }
    }
  };

  const handleRemove = (uploadId) => {
    // Cancel upload task if exists
    const task = uploadTasksRef.current.get(uploadId);
    if (task && task.cancel) {
      task.cancel();
    }
    uploadTasksRef.current.delete(uploadId);
    
    if (isMountedRef.current) {
      setUploads(prev => {
        const updated = prev.filter(u => u.id !== uploadId);
        updateUploadingCount(updated);
        notifyComplete(updated);
        return updated;
      });
    }
  };

  const handleRetry = (uploadId) => {
    const upload = uploads.find(u => u.id === uploadId);
    if (upload) {
      // Remove failed upload and start new one
      setUploads(prev => prev.filter(u => u.id !== uploadId));
      // Note: We'd need to store the original file to retry. For now, user needs to re-select.
      setError('Please select the file again to retry');
    }
  };

  return (
    <div className="space-y-4">
      {/* File Input */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="media-upload-input"
        />
        <label htmlFor="media-upload-input">
          <Button
            type="button"
            variant="outline"
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Select Images
          </Button>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          Max file size: {maxMB || 5}MB per image
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Upload List */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map(upload => (
            <div
              key={upload.id}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-md"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {upload.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(upload.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {upload.status === 'uploading' && (
                  <div className="space-y-1">
                    <Progress value={upload.progress} className="h-2" />
                    <p className="text-xs text-gray-500">{upload.progress}%</p>
                  </div>
                )}

                {upload.status === 'success' && (
                  <p className="text-xs text-green-600">✓ Upload complete</p>
                )}

                {upload.status === 'error' && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-red-600">✗ {upload.error || 'Upload failed'}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRetry(upload.id)}
                      className="h-6 text-xs"
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
