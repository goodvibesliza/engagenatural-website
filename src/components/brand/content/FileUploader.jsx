import React, { useState, useRef, useEffect } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage, isLocalhost } from "../../../firebase";
import { toast } from "sonner";

// UI Components
import { Button } from "../../ui/button";
import { Progress } from "../../ui/progress";
import { Card, CardContent } from "../../ui/card";
import { Label } from "../../ui/label";
import { Alert, AlertDescription } from "../../ui/alert";

// Icons
import { Upload, X, FileUp, CheckCircle, AlertCircle, Loader2, Info } from "lucide-react";

/**
 * FileUploader Component
 * 
 * @param {Object} props
 * @param {string} props.folder - Storage folder path to upload to (e.g., "lessons", "communities")
 * @param {Function} props.onUploadComplete - Callback function with download URL when upload completes
 * @param {string[]} props.acceptedTypes - Array of accepted MIME types (e.g., ["image/jpeg", "image/png"])
 * @param {number} props.maxSizeMB - Maximum file size in MB
 * @param {string} props.buttonText - Custom button text
 * @param {boolean} props.debug - Enable debug mode with additional logging
 */
export default function FileUploader({
  folder = "uploads",
  onUploadComplete,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"],
  maxSizeMB = 5,
  buttonText = "Upload File",
  debug = isLocalhost // Enable debug by default in local/emulator mode
}) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [emulatorStatus, setEmulatorStatus] = useState(null);
  const fileInputRef = useRef(null);
  const uploadTaskRef = useRef(null);

  // Check if Storage emulator is connected on mount
  useEffect(() => {
    if (isLocalhost) {
      try {
        const testRef = ref(storage, '_emulator_test');
        if (testRef && testRef.toString().includes('localhost')) {
          setEmulatorStatus('connected');
          console.log('✅ Storage emulator appears to be connected');
        } else {
          setEmulatorStatus('not-detected');
          console.warn('⚠️ Storage emulator connection not detected');
        }
      } catch (err) {
        setEmulatorStatus('error');
        console.error('❌ Error checking Storage emulator:', err);
      }
    }
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  // Validate file type and size
  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    setUploadError(null);

    // Check file type
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(selectedFile.type)) {
      const error = `Invalid file type: ${selectedFile.type}. Accepted types: ${acceptedTypes.join(", ")}`;
      setUploadError(error);
      if (debug) console.warn('❌ File validation failed:', error);
      return;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      const error = `File size (${(selectedFile.size / 1024 / 1024).toFixed(2)}MB) exceeds the maximum allowed size (${maxSizeMB}MB)`;
      setUploadError(error);
      if (debug) console.warn('❌ File validation failed:', error);
      return;
    }

    if (debug) console.log('✅ File validated successfully:', selectedFile.name);
    setFile(selectedFile);
  };

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  // Upload file to Firebase Storage
  const uploadFile = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    try {
      // Create a unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split(".").pop();
      const fileName = `${timestamp}-${file.name.substring(0, 20).replace(/[^a-zA-Z0-9]/g, "-")}.${fileExtension}`;
      
      // Create storage reference
      const storageRef = ref(storage, `${folder}/${fileName}`);
      
      if (debug) {
        console.log('📤 Starting upload to Firebase Storage:');
        console.log('- File:', file.name);
        console.log('- Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
        console.log('- Type:', file.type);
        console.log('- Destination:', `${folder}/${fileName}`);
        console.log('- Emulator mode:', isLocalhost ? 'Yes' : 'No');
        console.log('- Storage reference:', storageRef.toString());
      }
      
      // Start upload
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTaskRef.current = uploadTask;
      
      // Monitor upload progress
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Update progress
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setUploadProgress(progress);
          
          if (debug && progress % 20 === 0) {
            console.log(`📊 Upload progress: ${progress}%`);
          }
          
          // Log state changes
          switch (snapshot.state) {
            case 'paused':
              if (debug) console.log('⏸️ Upload paused');
              break;
            case 'running':
              if (debug && progress === 0) console.log('▶️ Upload started');
              break;
            default:
              if (debug) console.log(`🔄 Upload state: ${snapshot.state}`);
          }
        },
        (error) => {
          // Handle specific Firebase Storage errors
          let errorMessage = "Failed to upload file";
          
          if (debug) {
            console.error('❌ Upload error:', error);
            console.error('- Code:', error.code);
            console.error('- Message:', error.message);
            console.error('- serverResponse:', error.serverResponse);
          }
          
          switch(error.code) {
            case 'storage/unauthorized':
              errorMessage = "You don't have permission to upload files";
              break;
            case 'storage/canceled':
              errorMessage = "Upload was canceled";
              break;
            case 'storage/unknown':
              errorMessage = "An unknown error occurred during upload";
              break;
            case 'storage/retry-limit-exceeded':
              errorMessage = "Upload failed after multiple attempts";
              break;
            case 'storage/invalid-checksum':
              errorMessage = "File integrity check failed";
              break;
            case 'storage/server-file-wrong-size':
              errorMessage = "File size mismatch occurred";
              break;
            default:
              // Handle emulator-specific errors
              if (isLocalhost && error.message?.includes('Connection failed')) {
                errorMessage = "Connection to Storage emulator failed. Is it running?";
              } else if (error.message) {
                errorMessage = `Upload failed: ${error.message}`;
              }
          }
          
          setUploadError(errorMessage);
          setIsUploading(false);
          toast.error(errorMessage, {
            description: isLocalhost ? "Check if Firebase Storage emulator is running" : undefined,
            duration: 5000
          });
        },
        async () => {
          // Upload completed successfully
          try {
            if (debug) console.log('✅ Upload completed successfully, getting download URL...');
            
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            if (debug) console.log('✅ Download URL obtained:', downloadURL);
            
            // Call the callback with the download URL
            if (onUploadComplete) {
              onUploadComplete(downloadURL);
            }
            
            toast.success("File uploaded successfully", {
              description: file.name,
              duration: 3000
            });
            
            setFile(null);
            setIsUploading(false);
            setUploadProgress(0);
            
            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          } catch (error) {
            if (debug) {
              console.error('❌ Error getting download URL:', error);
              console.error('- Code:', error.code);
              console.error('- Message:', error.message);
            }
            
            const errorMessage = isLocalhost 
              ? "Failed to get download URL from emulator. This is a common issue with the Storage emulator."
              : "Failed to get download URL";
              
            setUploadError(errorMessage);
            setIsUploading(false);
            toast.error(errorMessage);
          }
        }
      );
    } catch (error) {
      if (debug) {
        console.error('❌ Upload setup error:', error);
        console.error('- Message:', error.message);
      }
      
      const errorMessage = isLocalhost 
        ? "Failed to start upload to emulator: " + error.message
        : "Failed to start upload: " + error.message;
        
      setUploadError(errorMessage);
      setIsUploading(false);
      toast.error(errorMessage);
    }
  };

  // Cancel upload
  const handleCancel = () => {
    if (isUploading && uploadTaskRef.current) {
      try {
        uploadTaskRef.current.cancel();
        if (debug) console.log('⏹️ Upload canceled by user');
      } catch (error) {
        if (debug) console.error('❌ Error canceling upload:', error);
      }
    }
    
    setFile(null);
    setUploadError(null);
    setUploadProgress(0);
    setIsUploading(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
      {/* Emulator status warning */}
      {isLocalhost && emulatorStatus === 'not-detected' && (
        <Alert variant="warning" className="mb-4 bg-yellow-50 text-yellow-800 border-yellow-200">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Storage emulator connection not detected. Make sure Firebase emulators are running.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Drag and drop area */}
      <div
        className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept={acceptedTypes.join(",")}
          disabled={isUploading}
        />
        
        <div className="flex flex-col items-center justify-center py-4">
          {!file ? (
            <>
              <FileUp className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm font-medium mb-1">
                Drag & drop a file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                {acceptedTypes.length > 0
                  ? `Accepted formats: ${acceptedTypes
                      .map((type) => type.split("/")[1])
                      .join(", ")}`
                  : "All file types accepted"}
                {maxSizeMB && ` • Max size: ${maxSizeMB}MB`}
              </p>
            </>
          ) : (
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm font-medium truncate max-w-[200px]">
                    {file.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)}MB
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {uploadError && (
        <div className="mt-2 text-sm text-red-500 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {uploadError}
        </div>
      )}

      {/* Upload progress */}
      {isUploading && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1">
            <Label className="text-xs">Uploading...</Label>
            <span className="text-xs font-medium">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end space-x-2 mt-4">
        {(file || isUploading) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
          >
            <X className="h-4 w-4 mr-1" />
            {isUploading ? "Cancel Upload" : "Cancel"}
          </Button>
        )}
        
        <Button
          type="button"
          size="sm"
          onClick={uploadFile}
          disabled={!file || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {buttonText}
            </>
          )}
        </Button>
      </div>
      
      {/* Debug info for emulator mode */}
      {debug && isLocalhost && (
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Storage Emulator: {emulatorStatus || 'checking...'}</p>
          <p>Upload Folder: {folder}</p>
        </div>
      )}
    </div>
  );
}
