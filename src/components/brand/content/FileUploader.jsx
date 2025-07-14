import React, { useState, useRef } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../../firebase";
import { toast } from "sonner";

// UI Components
import { Button } from "../../ui/button";
import { Progress } from "../../ui/progress";
import { Card, CardContent } from "../../ui/card";
import { Label } from "../../ui/label";

// Icons
import { Upload, X, FileUp, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

/**
 * FileUploader Component
 * 
 * @param {Object} props
 * @param {string} props.folder - Storage folder path to upload to (e.g., "lessons", "communities")
 * @param {Function} props.onUploadComplete - Callback function with download URL when upload completes
 * @param {string[]} props.acceptedTypes - Array of accepted MIME types (e.g., ["image/jpeg", "image/png"])
 * @param {number} props.maxSizeMB - Maximum file size in MB
 * @param {string} props.buttonText - Custom button text
 */
export default function FileUploader({
  folder = "uploads",
  onUploadComplete,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"],
  maxSizeMB = 5,
  buttonText = "Upload File"
}) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

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
      setUploadError(`Invalid file type. Accepted types: ${acceptedTypes.join(", ")}`);
      return;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      setUploadError(`File size exceeds the maximum allowed size (${maxSizeMB}MB)`);
      return;
    }

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
      
      // Start upload
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Monitor upload progress
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Update progress
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setUploadProgress(progress);
        },
        (error) => {
          // Handle error
          console.error("Upload error:", error);
          setUploadError("Failed to upload file: " + error.message);
          setIsUploading(false);
          toast.error("Upload failed");
        },
        async () => {
          // Upload completed successfully
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Call the callback with the download URL
            if (onUploadComplete) {
              onUploadComplete(downloadURL);
            }
            
            toast.success("File uploaded successfully");
            setFile(null);
            setIsUploading(false);
            setUploadProgress(0);
            
            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          } catch (error) {
            console.error("Error getting download URL:", error);
            setUploadError("Failed to get download URL");
            setIsUploading(false);
            toast.error("Failed to get download URL");
          }
        }
      );
    } catch (error) {
      console.error("Upload setup error:", error);
      setUploadError("Failed to start upload: " + error.message);
      setIsUploading(false);
      toast.error("Upload failed to start");
    }
  };

  // Cancel upload
  const handleCancel = () => {
    setFile(null);
    setUploadError(null);
    setUploadProgress(0);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full">
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
        {file && !isUploading && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
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
    </div>
  );
}
