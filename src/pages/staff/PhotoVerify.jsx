import { useState, useRef } from 'react'

export const useWebCamera = () => {
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const startCamera = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setIsActive(true)
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Unable to access camera. Please check permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks()
      tracks.forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsActive(false)
    setError(null)
  }

  const capturePhoto = () => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !canvasRef.current) {
        reject(new Error('Camera not ready'))
        return
      }

      const video = videoRef.current
      const canvas = canvasRef.current
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      
      // Convert to blob
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to capture photo'))
        }
      }, 'image/jpeg', 0.8)
    })
  }

  return {
    isActive,
    error,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    capturePhoto
  }
}

export const PhotoUploadComponent = ({ onPhotoCapture, onFileUpload }) => {
  const camera = useWebCamera()
  const [showCamera, setShowCamera] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState(null)
  const fileInputRef = useRef(null)

  const handleCameraCapture = async () => {
    try {
      const photoBlob = await camera.capturePhoto()
      setCapturedPhoto(photoBlob)
      onPhotoCapture(photoBlob)
      setShowCamera(false)
      camera.stopCamera()
    } catch (error) {
      console.error('Error capturing photo:', error)
      alert('Error capturing photo. Please try again.')
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      setCapturedPhoto(file)
      onFileUpload(file)
    }
  }

  const openCamera = async () => {
    setShowCamera(true)
    await camera.startCamera()
  }

  const closeCamera = () => {
    setShowCamera(false)
    camera.stopCamera()
  }

  return (
    <div className="space-y-4">
      {/* Upload Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={openCamera}
          className="flex items-center justify-center space-x-2 bg-brand-primary text-white py-3 px-4 rounded-lg hover:bg-brand-primary/90 transition-colors"
        >
          <span>📷</span>
          <span>Take Photo</span>
        </button>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <span>📁</span>
          <span>Upload File</span>
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-heading text-lg font-semibold">Take Verification Photo</h3>
              <button
                onClick={closeCamera}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>
            
            {camera.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-red-800 text-sm">{camera.error}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={camera.videoRef}
                  autoPlay
                  playsInline
                  className="w-full rounded-lg bg-gray-100"
                  style={{ maxHeight: '400px' }}
                />
                
                {/* Overlay with instructions */}
                <div className="absolute top-4 left-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg">
                  <p className="text-sm">
                    📋 Make sure to include:
                  </p>
                  <ul className="text-xs mt-1 space-y-1">
                    <li>• Your name tag or apron</li>
                    <li>• Store environment in background</li>
                    <li>• Today's code: <strong>ENG-{String(new Date().getDate()).padStart(2, '0')}{String(new Date().getMonth() + 1).padStart(2, '0')}</strong></li>
                  </ul>
                </div>
              </div>
              
              <canvas ref={camera.canvasRef} className="hidden" />
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleCameraCapture}
                  disabled={!camera.isActive}
                  className="bg-brand-primary text-white px-6 py-2 rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📷 Capture Photo
                </button>
                <button
                  onClick={closeCamera}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview */}
      {capturedPhoto && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✓</span>
            <span className="text-green-800 font-medium">Photo ready for submission</span>
          </div>
          <p className="text-green-700 text-sm mt-1">
            Photo captured successfully. You can now submit your verification.
          </p>
        </div>
      )}
    </div>
  )
}

export default PhotoUploadComponent

