import React, { useState, useRef, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage, isLocalhost } from '../../../firebase';
import { Button } from '../../ui/button';
import { Progress } from '../../ui/progress';
import { Alert, AlertDescription } from '../../ui/alert';
import { Card, CardContent } from '../../ui/card';
import { Loader2, X, Upload, FileCheck, AlertCircle, RefreshCcw } from 'lucide-react';

const MAX_FILE_SIZE_MB = 10; // 10MB max file size by default
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * FileUploader component for handling file uploads to Firebase Storage
 * with special handling for emulator environment
 */
export default function FileUploader({
  onUploadComplete,
  onUploadError,
  folder = 'uploads',
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  maxSizeMB = MAX_FILE_SIZE_MB,
  buttonText = 'Upload File',
  showPreview = true,
  className = '',
  disabled = false,
  brandId = null, // Optional brandId for organizing files by brand
}) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [storagePath, setStoragePath] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const fileInputRef = useRef(null);
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  // Debug mode when running in localhost
  const debugMode = isLocalhost;
  
  // Clear the current file selection
  const clearFile = useCallback(() => {
    setFile(null);
    setPreview(null);
    setUploadProgress(0);
    setError(null);
    setSuccess(false);
    setUploadedUrl(null);
    setStoragePath(null);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);
  
  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Reset states
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
    setUploadedUrl(null);
    setStoragePath(null);
    
    // Validate file type
    if (allowedTypes && !allowedTypes.includes(selectedFile.type)) {
      setError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
      return;
    }
    
    // Validate file size
    if (selectedFile.size > maxSizeBytes) {
      setError(`File size exceeds the maximum limit of ${maxSizeMB}MB`);
      return;
    }
    
    setFile(selectedFile);
    
    // Create preview for images
    if (selectedFile.type.startsWith('image/') && showPreview) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };
  
  // Generate a unique filename to avoid collisions
  const generateUniqueFilename = (originalName) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const extension = originalName.split('.').pop();
    return `${timestamp}_${randomString}.${extension}`;
  };
  
  // Determine the appropriate storage path based on environment
  const getStoragePath = (fileName) => {
    // Special handling for emulator environment
    if (isLocalhost) {
      // Use a special diagnostics folder for emulator testing
      // This matches the special rule in storage.rules that allows unauthenticated access
      if (debugMode) console.log('Using emulator diagnostics folder for upload');
      return `emulator-diagnostics/${fileName}`;
    }
    
    // In production, use the specified folder structure
    let path = folder;
    
    // Add brandId to path if provided
    if (brandId) {
      path = `${path}/${brandId}`;
    }
    
    return `${path}/${fileName}`;
  };
  
  // Upload the file to Firebase Storage
  const uploadFile = async () => {
    if (!file || isUploading) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(false);
    
    try {
      // Generate unique filename
      const uniqueFileName = generateUniqueFilename(file.name);
      
      // Get storage path
      const path = getStoragePath(uniqueFileName);
      setStoragePath(path);
      
      if (debugMode) {
        console.log(`📤 Uploading file to: ${path}`);
        console.log(`📊 File details:`, {
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
          type: file.type
        });
        
        // Log emulator status
        console.log(`🧪 Using emulator:`, isLocalhost);
      }
      
      // Create storage reference
      const storageRef = ref(storage, path);
      
      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Monitor upload progress
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          
          if (debugMode) {
            console.log(`📤 Upload progress: ${progress.toFixed(1)}%`);
          }
        },
        (error) => {
          console.error('Upload error:', error);
          setError(`Upload failed: ${error.message}`);
          setIsUploading(false);
          
          if (onUploadError) {
            onUploadError(error);
          }
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setUploadedUrl(downloadURL);
            setSuccess(true);
            setIsUploading(false);
            
            if (debugMode) {
              console.log(`✅ Upload complete. Download URL:`, downloadURL);
            }
            
            // Call the onUploadComplete callback with the download URL and storage path
            if (onUploadComplete) {
              onUploadComplete({
                url: downloadURL,
                path: path,
                fileName: uniqueFileName,
                originalName: file.name,
                size: file.size,
                type: file.type
              });
            }
          } catch (urlError) {
            console.error('Error getting download URL:', urlError);
            setError(`Failed to get download URL: ${urlError.message}`);
            setIsUploading(false);
            
            if (onUploadError) {
              onUploadError(urlError);
            }
          }
        }
      );
    } catch (error) {
      console.error('Upload setup error:', error);
      setError(`Failed to start upload: ${error.message}`);
      setIsUploading(false);
      
      if (onUploadError) {
        onUploadError(error);
      }
    }
  };
  
  // Retry upload after failure
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    uploadFile();
  };
  
  // Delete the uploaded file
  const handleDelete = async () => {
    if (!storagePath) return;
    
    try {
      const fileRef = ref(storage, storagePath);
      await deleteObject(fileRef);
      
      if (debugMode) {
        console.log(`🗑️ Deleted file: ${storagePath}`);
      }
      
      clearFile();
    } catch (error) {
      console.error('Error deleting file:', error);
      setError(`Failed to delete file: ${error.message}`);
    }
  };
  
  // Check if storage emulator is connected
  const checkEmulatorConnection = useCallback(async () => {
    if (!isLocalhost) return true;
    
    try {
      // Create a tiny test file
      const testData = new Blob(['test'], { type: 'text/plain' });
      const testPath = `emulator-diagnostics/connection_test_${Date.now()}.txt`;
      const testRef = ref(storage, testPath);
      
      // Try to upload
      const uploadTask = uploadBytesResumable(testRef, testData);
      
      return new Promise((resolve) => {
        uploadTask.on(
          'state_changed',
          null,
          (error) => {
            console.warn('⚠️ Storage emulator connection test failed:', error);
            resolve(false);
          },
          async () => {
            try {
              // Try to get URL
              await getDownloadURL(testRef);
              // Clean up
              await deleteObject(testRef);
              resolve(true);
            } catch (error) {
              console.warn('⚠️ Storage emulator connection test failed:', error);
              resolve(false);
            }
          }
        );
      });
    } catch (error) {
      console.warn('⚠️ Storage emulator connection test failed:', error);
      return false;
    }
  }, []);
  
  // Check emulator connection on component mount
  React.useEffect(() => {
    if (isLocalhost) {
      checkEmulatorConnection().then(connected => {
        if (!connected) {
          console.warn('⚠️ Storage emulator connection not detected');
        } else {
          console.log('✓ Connected to Storage emulator');
        }
      });
    }
  }, [checkEmulatorConnection]);
  
  return (
    <div className={`file-uploader ${className}`}>
      {/* File Input */}
      <div className="mb-4">
        <input
          type="file"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
          accept={allowedTypes.join(',')}
          disabled={isUploading || disabled}
        />
        
        {!file && (
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || disabled}
            variant="outline"
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {buttonText}
          </Button>
        )}
        
        {/* File Preview */}
        {file && (
          <Card className="mt-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileCheck className="h-5 w-5 mr-2 text-green-600" />
                  <div className="truncate max-w-[200px]">{file.name}</div>
                </div>
                
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearFile}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Image Preview */}
              {preview && showPreview && (
                <div className="mt-3 relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-40 max-w-full rounded-md object-contain mx-auto"
                  />
                </div>
              )}
              
              {/* File Size */}
              <div className="text-xs text-muted-foreground mt-2">
                {(file.size / 1024 / 1024).toFixed(2)}MB
              </div>
              
              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-3">
                  <Progress value={uploadProgress} className="h-2" />
                  <div className="text-xs text-center mt-1">
                    {uploadProgress.toFixed(0)}%
                  </div>
                </div>
              )}
              
              {/* Upload Button */}
              {file && !isUploading && !success && (
                <Button
                  onClick={uploadFile}
                  className="w-full mt-3"
                  disabled={isUploading || disabled}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              )}
              
              {/* Upload Status */}
              {isUploading && (
                <div className="flex items-center justify-center mt-3 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Uploading...
                </div>
              )}
              
              {/* Success Message */}
              {success && (
                <Alert className="mt-3 bg-green-50 text-green-800 border-green-200">
                  <AlertDescription className="flex items-center text-sm">
                    <FileCheck className="h-4 w-4 mr-2" />
                    File uploaded successfully
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Error Message */}
              {error && (
                <Alert className="mt-3 bg-red-50 text-red-800 border-red-200">
                  <AlertDescription className="flex flex-col gap-2">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {error}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      className="self-start"
                    >
                      <RefreshCcw className="h-3 w-3 mr-2" />
                      Retry Upload
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Emulator Warning */}
              {isLocalhost && (
                <div className="text-xs text-amber-600 mt-3">
                  Running in emulator mode. Files will be stored in the emulator-diagnostics folder.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
