import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/auth-context';
import { db, storage } from '@/lib/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp, getDoc, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import PhotoUploadComponent from '../PhotoVerify';
import { useLocation } from 'react-router-dom';
import { getVerifyStrings } from '@/lib/i18nVerification';
import { geocodeAddress } from '@/lib/geocoding';

/**
 * Render the Verification Center UI and manage photo- and code-based verification flows, including metadata collection, optional geolocation, photo upload, and submitting verification requests to the backend.
 *
 * @returns {JSX.Element} The rendered VerificationPage component. 
 */
export default function VerificationPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navState = location?.state || {};
  const strings = getVerifyStrings(user?.locale || (typeof navigator !== 'undefined' ? navigator.language : 'en'));
  const reqs = Array.isArray(strings.REQUIREMENTS_BODY)
    ? strings.REQUIREMENTS_BODY
    : (strings.REQUIREMENTS_BODY ? [strings.REQUIREMENTS_BODY] : []);
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
  // Admin question thread + staff responses
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [infoRequests, setInfoRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  // Inline store location widget state
  const [addressText, setAddressText] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const [storeLoc, setStoreLoc] = useState(null);
  const [storeAddressGeo, setStoreAddressGeo] = useState(null);

  // Load user's saved store location so we can show CTA/link here
  useEffect(() => {
    (async () => {
      if (!user?.uid) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d = snap.data();
          setAddressText(d.storeAddressText || '');
          setStoreLoc(d.storeLoc || null);
          setStoreAddressGeo(d.storeAddressGeo || null);
        }
      } catch (e) {
        console.debug?.('VerificationPage: failed to load user store', e);
      }
    })();
  }, [user?.uid]);

  // Load the relevant verification request to show admin questions; prefer a requestId passed from notifications state,
  // otherwise prefer the most recent request that is in 'needs_info' (infoRequestedAt desc), then fall back to latest by user.
  useEffect(() => {
    (async () => {
      if (!db || !user?.uid) return;
      setLoadingThread(true);
      try {
        let reqId = navState?.requestId;
        if (reqId) {
          const s = await getDoc(doc(db, 'verification_requests', reqId));
          if (!s.exists() || (s.data()?.userId && s.data().userId !== user.uid)) {
            // Fallback: ignore invalid id and find latest by this user
            reqId = null;
          } else {
            setInfoRequests(Array.isArray(s.data()?.infoRequests) ? s.data().infoRequests : []);
          }
        }
        if (!reqId) {
          // Prefer a 'needs_info' request first
          try {
            const qNI = query(
              collection(db, 'verification_requests'),
              where('userId', '==', user.uid),
              where('status', '==', 'needs_info'),
              orderBy('infoRequestedAt', 'desc'),
              limit(1)
            );
            const qsNI = await getDocs(qNI);
            if (!qsNI.empty) {
              const d = qsNI.docs[0];
              reqId = d.id;
              const v = d.data();
              setInfoRequests(Array.isArray(v?.infoRequests) ? v.infoRequests : []);
            }
          } catch (e) {
            console.error('VerificationPage: needs_info query failed', e);
          }
        }
        if (!reqId) {
          try {
            const q = query(
              collection(db, 'verification_requests'),
              where('userId', '==', user.uid),
              orderBy('submittedAt', 'desc'),
              limit(1)
            );
            const qs = await getDocs(q);
            if (!qs.empty) {
              const d = qs.docs[0];
              reqId = d.id;
              const v = d.data();
              setInfoRequests(Array.isArray(v?.infoRequests) ? v.infoRequests : []);
            }
          } catch (e) {
            // If index missing for orderBy, try without ordering as last resort
            console.error('VerificationPage: latest-by-submitted query failed; falling back without orderBy', e);
            const q2 = query(
              collection(db, 'verification_requests'),
              where('userId', '==', user.uid),
              limit(1)
            );
            const qs2 = await getDocs(q2);
            if (!qs2.empty) {
              const d = qs2.docs[0];
              reqId = d.id;
              const v = d.data();
              setInfoRequests(Array.isArray(v?.infoRequests) ? v.infoRequests : []);
            }
          }
        }
        setActiveRequestId(reqId || null);
      } finally {
        setLoadingThread(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, user?.uid, navState?.requestId]);

  // Subscribe to staff reply messages for this request
  useEffect(() => {
    if (!db || !activeRequestId) { setMessages([]); return; }
    const q = query(collection(db, 'verification_requests', activeRequestId, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() || {}) }));
      setMessages(arr);
    }, () => setMessages([]));
    return () => { try { unsub(); } catch (err) { console.error('VerificationPage: messages unsubscribe failed', err); } };
  }, [db, activeRequestId]);

  async function sendReply() {
    if (!user?.uid || !activeRequestId) return;
    const text = replyText.trim();
    if (!text) return;
    setSendingReply(true);
    try {
      await addDoc(collection(db, 'verification_requests', activeRequestId, 'messages'), {
        message: text,
        authorUid: user.uid,
        createdAt: serverTimestamp(),
      });
      setReplyText('');
    } catch (e) {
      console.error('Failed to send reply', e);
      alert('Could not send your reply. Please try again.');
    } finally {
      setSendingReply(false);
    }
  }

  // geocodeAddress imported from shared module

  async function setStoreLocationInline() {
    if (!user?.uid) return;
    setSavingAddress(true);
    try {
      const addr = (addressText || '').trim();
      const payload = { storeAddressText: addr };

      // Address → storeAddressGeo (reference only), never into storeLoc
      if (addr) {
        try {
          const g = await geocodeAddress(addr);
          if (g) {
            payload.storeAddressGeo = {
              lat: g.lat,
              lng: g.lng,
              setAt: serverTimestamp(),
              source: 'address',
              provider: g.provider
            };
            // update local state immediately so Test map reflects the address
            setStoreAddressGeo({ lat: g.lat, lng: g.lng, source: 'address', setAt: null, provider: g.provider });
          }
        } catch (e) {
          console.error('Address geocoding failed', e);
        }
      }

      await updateDoc(doc(db, 'users', user.uid), payload);

      // Local state: pending setAt placeholder
    } catch (e) {
      console.error('Failed to save store location:', e);
      setError(e?.message || 'Failed to save store location. Please try again.');
    } finally {
      setSavingAddress(false);
    }
  }

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
    if (!user?.uid) {
      setError(strings.ERROR_NOT_SIGNED_IN || 'Please sign in to submit verification');
      return;
    }
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
        <h1 className="text-2xl font-semibold mb-1">Verification Center</h1>
        <p className="text-gray-700 mb-4">
          Confirm your store employment to unlock: brand trainings, product challenges, and sample rewards.  
          Everything is designed to help you learn, earn, and grow in the natural products community.
        </p>
      </div>

      {/* Localized strings already available as strings.NOTICE_TITLE / NOTICE_SUBTEXT */}
      <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-lg text-base mb-5">
        <strong className="font-semibold">{strings.NOTICE_TITLE}</strong><br />
        <span className="text-rose-900/80">{strings.NOTICE_SUBTEXT}</span>
      </div>

      {/* Localized Requirements and Tips */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-3">{strings.REQUIREMENTS_TITLE}</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
          {reqs.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
        {Array.isArray(strings.REQUIREMENTS_TIPS) && strings.REQUIREMENTS_TIPS.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-800 mb-1">Tips</div>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
              {strings.REQUIREMENTS_TIPS.map((tip, i) => (<li key={i}>{tip}</li>))}
            </ul>
          </div>
        )}
        <div className="mt-4">
          <div className="text-sm font-medium text-gray-800 mb-1">{strings.WHY_WE_VERIFY_TITLE}</div>
          <p className="text-sm text-gray-700">{strings.WHY_WE_VERIFY_BODY}</p>
        </div>
      </div>

      {/* Store Location (inline widget) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-2">Store Location</h2>
        <a
          href="/staff/profile/store-location"
          className="text-xs text-blue-600 hover:underline"
        >
          Manage in Profile
        </a>
        <p className="text-sm text-gray-600 mb-3">Save your store GPS once. We’ll compare verification selfies to this location.</p>
        <label className="block text-sm font-medium text-gray-700 mb-1">Store address (for humans)</label>
        <input
          type="text"
          value={addressText}
          onChange={(e) => setAddressText(e.target.value)}
          placeholder="123 Main St, Springfield…"
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
        />
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={setStoreLocationInline}
            disabled={savingAddress}
            className="rounded bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingAddress ? 'Saving…' : (storeLoc?.lat != null ? 'Update Location' : 'Set Store Location')}
          </button>
          {(storeAddressGeo?.lat != null || storeLoc?.lat != null) && (
            <a
              href={`https://maps.google.com/?q=${
                (storeAddressGeo?.lat != null && storeAddressGeo?.lng != null)
                  ? `${storeAddressGeo.lat},${storeAddressGeo.lng}`
                  : `${storeLoc.lat},${storeLoc.lng}`
              }`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Test map
            </a>
          )}
        </div>
        {!(addressText && addressText.trim()) && (
          <div className="mt-2 text-xs text-gray-600">
            Enter your store's address above so we can verify your location.
          </div>
        )}
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

      {/* Questions & Responses */}
      {(activeRequestId || loadingThread) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Questions from Admin</h2>
          {loadingThread && (
            <div className="text-sm text-gray-600">Loading…</div>
          )}
          {!loadingThread && !activeRequestId && (
            <div className="text-sm text-gray-600">No recent verification request found.</div>
          )}
          {!!activeRequestId && (
            <div className="space-y-4">
              <div>
                {Array.isArray(infoRequests) && infoRequests.length > 0 ? (
                  <ul className="space-y-2">
                    {[...infoRequests]
                      .sort((a,b) => {
                        const ad = a?.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a?.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
                        const bd = b?.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b?.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
                        return ad - bd;
                      })
                      .map((it, idx) => (
                        <li key={idx} className="rounded bg-amber-50 border border-amber-200 p-2">
                          <div className="text-sm text-gray-900">{it?.message || '(no message)'}</div>
                          <div className="mt-0.5 text-xs text-gray-600">{it?.createdAt?.toDate ? it.createdAt.toDate().toLocaleString?.() : ''}</div>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-600">No questions yet.</div>
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Your messages</div>
                {(!messages || messages.length === 0) ? (
                  <div className="text-sm text-gray-600">You haven't replied yet.</div>
                ) : (
                  <ul className="space-y-2">
                    {messages.map((m) => (
                      <li key={m.id} className="rounded bg-gray-50 border border-gray-200 p-2">
                        <div className="text-sm text-gray-900">{m.message || ''}</div>
                        <div className="mt-0.5 text-xs text-gray-600">{m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString?.() : ''}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reply to admin</label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full rounded border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="Type your reply…"
                />
                <div className="mt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={sendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="rounded bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingReply ? 'Sending…' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}