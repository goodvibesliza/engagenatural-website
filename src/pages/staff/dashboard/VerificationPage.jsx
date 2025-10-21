import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/auth-context';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import PhotoUploadComponent from '../PhotoVerify';
import { Link } from 'react-router-dom';

/**
 * Render the Verification Center UI and manage photo- and code-based verification flows, including metadata collection, optional geolocation, photo upload, and submitting verification requests to the backend.
 *
 * @returns {JSX.Element} The rendered VerificationPage component. 
 */
export default function VerificationPage() {
  const { user } = useAuth();
  const [verificationPhoto, setVerificationPhoto] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState({});
  const [geolocationStatus, setGeolocationStatus] = useState('');
  const [deviceLoc, setDeviceLoc] = useState(null);
  const [storeInfo, setStoreInfo] = useState({ storeLoc: null, storeAddressText: '' });

  // Load user's saved store location so we can show CTA/link here
  useEffect(() => {
    (async () => {
      if (!user?.uid) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setStoreInfo({ storeLoc: d.storeLoc || null, storeAddressText: d.storeAddressText || '' });
        }
      } catch (e) {
        // non-blocking
      }
    })();
  }, [user?.uid]);

  // Brand verification codes/sources
  const brandSources = [
    { id: 'nature-made', name: 'Nature Made' },
    { id: 'garden-of-life', name: 'Garden of Life' },
    { id: 'new-chapter', name: 'New Chapter' },
    { id: 'nordic-naturals', name: 'Nordic Naturals' },
    { id: 'store-manager', name: 'Store Manager' }
  ];

  // Generate daily verification code
  const getDailyCode = () => {
    const today = new Date();
    return `ENG-${String(today.getDate()).padStart(2, '0')}${String(today.getMonth() + 1).padStart(2, '0')}`;
  };

  // Extract image dimensions
  const getImageDimensions = async (blob) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height
        });
      };
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(blob);
    });
  };

  // Handle photo selection
  const handlePhotoSelected = async (photo) => {
    if (!photo) return;
    
    setVerificationPhoto(photo);
    setPhotoPreviewUrl(URL.createObjectURL(photo));
    
    try {
      // Build rich metadata
      const fileMetadata = {
        fileName: photo.name || `capture-${Date.now()}.jpg`,
        mimeType: photo.type || 'image/jpeg',
        size: photo.size,
        capturedViaCamera: !photo.name, // If no name, likely from camera
        clientInfo: {
          userAgent: navigator.userAgent,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          hardwareConcurrency: navigator.hardwareConcurrency,
          platform: navigator.platform,
          memory: navigator.deviceMemory || 'unknown'
        },
        aiPlaceholders: {
          pending: true,
          confidence: null,
          moderation: null
        }
      };
      
      // Get image dimensions if possible
      const dimensions = await getImageDimensions(photo);
      if (dimensions) {
        fileMetadata.dimensions = dimensions;
      }
      
      setMetadata(fileMetadata);
    } catch (err) {
      console.error('Error processing metadata:', err);
    }
  };

  // Request geolocation
  const requestGeolocation = () => {
    setGeolocationStatus('requesting');
    
    if (!navigator.geolocation) {
      setGeolocationStatus('unavailable');
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMetadata(prev => ({
          ...prev,
          geolocation: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          }
        }));
        setDeviceLoc({ lat: position.coords.latitude, lng: position.coords.longitude, obtainedAt: Date.now() });
        setGeolocationStatus('granted');
      },
      (err) => {
        console.error('Geolocation error:', err);
        setGeolocationStatus('denied');
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  // Clear photo
  const clearPhoto = () => {
    if (photoPreviewUrl) {
      URL.revokeObjectURL(photoPreviewUrl);
    }
    setVerificationPhoto(null);
    setPhotoPreviewUrl(null);
    setMetadata(prev => ({
      ...prev,
      fileName: undefined,
      mimeType: undefined,
      size: undefined,
      dimensions: undefined,
      capturedViaCamera: undefined
    }));
  };

  // Submit verification
  const submitVerification = async () => {
    // Validate input
    if (!verificationPhoto && !verificationCode) {
      setError('Please provide a photo or verification code');
      return;
    }

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      let photoURL = null;
      
      // Upload photo if provided
      if (verificationPhoto) {
        const photoRef = ref(storage, `verification/${user.uid}/${Date.now()}_${metadata.fileName || 'verification.jpg'}`);
        await uploadBytes(photoRef, verificationPhoto);
        photoURL = await getDownloadURL(photoRef);
      }
      
      // Daily verification code
      const dailyCode = getDailyCode();
      
      // Create verification request
      const verificationRequest = {
        userId: user.uid,
        userEmail: user.email,
        userName: user.name || user.displayName || 'New User',
        storeName: user.storeName || user.storeCode || 'Unknown Store',
        verificationCodeDaily: dailyCode,
        providedCode: verificationCode,
        selectedBrand: selectedBrand,
        photoURL: photoURL,
        metadata: metadata,
        deviceLoc: deviceLoc || null,
        deviceLocDenied: geolocationStatus === 'denied' ? true : false,
        status: 'pending',
        submittedAt: serverTimestamp(),
        aiPendingAnalysis: true
      };
      
      await addDoc(collection(db, 'verification_requests'), verificationRequest);
      
      // Update user status
      await updateDoc(doc(db, 'users', user.uid), {
        verificationStatus: 'pending',
        lastVerificationSubmission: serverTimestamp()
      });
      
      setSuccess('Verification submitted successfully! We\'ll review your submission within 1-2 business days.');
      
      // Reset form
      clearPhoto();
      setVerificationCode('');
      setSelectedBrand('');
      
    } catch (error) {
      console.error('Error submitting verification:', error);
      setError(`Error submitting verification: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verification Center</h1>
        <p className="text-gray-600">
          Submit your verification to unlock premium features and communities.
        </p>
      </div>

      {/* Current Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Current Status</h2>
        <div className="flex items-center space-x-2 mb-4">
          {user?.verificationStatus === 'approved' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              ✓ Verified
            </span>
          )}
          {user?.verificationStatus === 'pending' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              ⏳ Under Review
            </span>
          )}
          {user?.verificationStatus === 'rejected' && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              ⚠ Rejected
            </span>
          )}
          {(!user?.verificationStatus || user?.verificationStatus === 'not_submitted') && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              🔒 Not Verified
            </span>
          )}
        </div>

        {user?.verificationStatus === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <p className="text-yellow-800">
              Your verification is under review. We'll notify you within 1-2 business days.
            </p>
          </div>
        )}

        {user?.verificationStatus === 'approved' && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
            <p className="text-green-800">
              🎉 Congratulations! Your account is verified and you have full access to all features.
            </p>
          </div>
        )}

        {user?.verificationStatus === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-800 mb-2">Your verification was rejected:</p>
            <p className="text-red-700 text-sm">{user?.rejectionReason || "Please ensure your photo meets all requirements and try again."}</p>
          </div>
        )}

        {(!user?.verificationStatus || user?.verificationStatus === 'not_submitted' || user?.verificationStatus === 'rejected') && (
          <div className="space-y-6">
            {/* Store Location prompt (so users coming from /community can find it) */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Store Location</div>
                  {storeInfo.storeLoc?.lat != null ? (
                    <div className="mt-1 text-sm text-gray-700">
                      Saved at: {storeInfo.storeAddressText || '—'}
                      <div className="text-xs text-gray-600">Lat: {storeInfo.storeLoc.lat}, Lng: {storeInfo.storeLoc.lng}</div>
                      <a
                        href={`https://maps.google.com/?q=${storeInfo.storeLoc.lat},${storeInfo.storeLoc.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  ) : (
                    <div className="mt-1 text-sm text-gray-700">Save your store location once to help us verify in-store photos.</div>
                  )}
                </div>
                <Link
                  to="/staff/profile/store-location"
                  className="shrink-0 rounded bg-brand-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-primary/90"
                >
                  {storeInfo.storeLoc?.lat != null ? 'Edit' : 'Set Store Location'}
                </Link>
              </div>
            </div>
            {/* Photo Verification */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Photo Verification</h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-blue-800 text-sm">
                  Take a photo of yourself <strong>in-store with your name tag or apron visible</strong>. 
                  Include today's verification code <strong>{getDailyCode()}</strong> written on a piece of paper in the photo.
                </p>
              </div>

              {!verificationPhoto ? (
                <PhotoUploadComponent 
                  onPhotoCapture={handlePhotoSelected}
                  onFileUpload={handlePhotoSelected}
                  className="mb-4"
                />
              ) : (
                <div className="space-y-4 mb-4">
                  <div className="text-center">
                    <p className="text-green-600 font-medium mb-2">✅ Photo ready for submission</p>
                    {photoPreviewUrl && (
                      <img
                        src={photoPreviewUrl}
                        alt="Verification preview"
                        className="max-w-full h-48 object-cover rounded-lg mx-auto"
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                  >
                    Clear Photo
                  </button>

                  {/* Geolocation */}
                  {!metadata.geolocation && (
                    <button
                      type="button"
                      onClick={requestGeolocation}
                      disabled={geolocationStatus === 'requesting'}
                      className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                      {geolocationStatus === 'requesting' ? 'Requesting Location...' : '📍 Add Location (Optional)'}
                    </button>
                  )}
                  
                  {geolocationStatus === 'granted' && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-2 text-sm text-green-800">
                      ✓ Location added to verification
                    </div>
                  )}
                  
                  {geolocationStatus === 'denied' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-2 text-sm text-gray-600">
                      Location access denied - that's okay, it's optional
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Code Verification */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Brand/Manager Code Verification</h3>
              <p className="text-gray-600 text-sm mb-4">
                Get a verification code from your store manager or brand representative.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Brand/Source</label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  >
                    <option value="">Choose brand or source...</option>
                    {brandSources.map(brand => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter your verification code"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              onClick={submitVerification}
              disabled={uploading || (!verificationPhoto && !verificationCode)}
              className="w-full bg-brand-primary text-white py-3 px-4 rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? '⏳ Submitting...' : '✅ Submit Verification'}
            </button>
            
            {/* Success/Error Messages */}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mt-4">
                <p className="text-green-800">{success}</p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}