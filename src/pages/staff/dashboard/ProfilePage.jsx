import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/auth-context';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import StaffProfilePanel from '../ProfilePanel';
import useNotificationsStore from '@/hooks/useNotificationsStore';
import { requestPermissionAndToken } from '@/lib/push';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user } = useAuth();
  const { pushEnabled, setPushEnabled } = useNotificationsStore();
  const [profileImage, setProfileImage] = useState(null);
  const [aboutMe, setAboutMe] = useState({
    interests: '',
    location: '',
    story: ''
  });
  const [userInfo, setUserInfo] = useState({
    name: '',
    storeName: ''
  });
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [editingAboutMe, setEditingAboutMe] = useState(false);
  const [editingUserInfo, setEditingUserInfo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    communityUpdates: true,
    trainingReminders: true,
    sampleRequests: true,
    weeklyDigest: false,
  });

  // Avatar options
  const avatarOptions = [
    '👤', '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '👨‍⚕️', '👩‍⚕️', '🧑‍🌾', '👨‍🍳', '👩‍🍳',
    '🌱', '🥬', '🥕', '🍎', '🥑', '🌿', '🌾', '🍯', '🧘‍♀️', '🧘‍♂️'
  ];

  // Font styles for consistency
  const fontStyles = {
    mainTitle: {
      fontFamily: 'Playfair Display, serif',
      fontWeight: '900',
      letterSpacing: '-0.015em',
      lineHeight: '1.1',
      color: '#000000'
    },
    sectionHeading: {
      fontFamily: 'Playfair Display, serif',
      fontWeight: '800',
      letterSpacing: '-0.02em',
      lineHeight: '1.2',
      color: '#000000'
    },
    subsectionTitle: {
      fontFamily: 'Inter, sans-serif',
      fontWeight: '700',
      letterSpacing: '-0.005em',
      lineHeight: '1.3',
      color: '#000000'
    }
  };

  // Load user data on mount
  useEffect(() => {
    async function loadUserData() {
      if (!user?.uid) return;
      
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          setAboutMe({
            interests: userData.interests || '',
            location: userData.location || '',
            story: userData.story || ''
          });
          
          setUserInfo({
            name: userData.name || userData.displayName || user.displayName || 'New User',
            storeName: userData.storeName || userData.storeCode || 'Unknown Store'
          });
          
          setProfileImage(userData.profileImage || null);
          setNotificationPreferences({
            emailNotifications: userData.notificationPreferences?.emailNotifications ?? true,
            pushNotifications: userData.notificationPreferences?.pushNotifications ?? true,
            communityUpdates: userData.notificationPreferences?.communityUpdates ?? true,
            trainingReminders: userData.notificationPreferences?.trainingReminders ?? true,
            sampleRequests: userData.notificationPreferences?.sampleRequests ?? true,
            weeklyDigest: userData.notificationPreferences?.weeklyDigest ?? false,
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        alert('Error loading profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    loadUserData();
  }, [user?.uid, user?.displayName]);

  // Get status badge
  const getStatusBadge = () => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium";
    const status = user?.verificationStatus || (user?.verified ? 'approved' : 'pending');
    
    switch (status) {
      case 'approved':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>✓ Verified</span>;
      case 'pending':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>⏳ Under Review</span>;
      case 'rejected':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>⚠ Rejected</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>🔒 Not Verified</span>;
    }
  };

  // Upload profile image
  const uploadProfileImage = async (file) => {
    if (!file || !user?.uid) return;
    
    setSaving(true);
    try {
      // Check if storage is available
      if (!storage) {
        throw new Error('Firebase Storage not initialized');
      }
  
      // Upload to Firebase Storage
      const imageRef = ref(storage, `profile_images/${user.uid}/${Date.now()}_${file.name}`);
      
      const uploadResult = await uploadBytes(imageRef, file);
      const imageURL = await getDownloadURL(uploadResult.ref);
      
      // Update user profile
      await updateDoc(doc(db, 'users', user.uid), {
        profileImage: imageURL
      });
      
      setProfileImage(imageURL);
      setShowAvatarSelector(false);
      alert('Profile photo uploaded successfully!');
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert(`Error uploading photo: ${error.message}. Please check Firebase Storage setup.`);
    } finally {
      setSaving(false);
    }
  };

  // Select avatar
  const selectAvatar = async (avatar) => {
    if (!user?.uid) return;
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        profileImage: avatar
      });
  
      setProfileImage(avatar);
      setShowAvatarSelector(false);
    } catch (error) {
      console.error('Error selecting avatar:', error);
      alert('Error updating avatar. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Save about me
  const saveAboutMe = async () => {
    if (!user?.uid) return;
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        interests: aboutMe.interests,
        location: aboutMe.location,
        story: aboutMe.story
      });

      setEditingAboutMe(false);
      alert('About Me section updated successfully!');
    } catch (error) {
      console.error('Error updating about me:', error);
      alert('Error updating information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Save user info
  const saveUserInfo = async () => {
    if (!user?.uid) return;
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: userInfo.name,
        storeName: userInfo.storeName
      });
      
      setEditingUserInfo(false);
      alert('Profile information updated successfully!');
    } catch (error) {
      console.error('Error updating user info:', error);
      alert('Error updating information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle notification preference
  const togglePref = async (key) => {
    if (!user?.uid) return;
    const next = { ...notificationPreferences, [key]: !notificationPreferences[key] };
    setNotificationPreferences(next);
    try {
      await updateDoc(doc(db, 'users', user.uid), { notificationPreferences: next });
    } catch (err) {
      console.error('Failed to update notification preferences', err);
      // revert on failure
      setNotificationPreferences((prev) => ({ ...prev, [key]: !next[key] }));
      alert('Could not save notification preference.');
    }
  };

  // Verification benefits component
  const getVerificationBenefits = () => {
    const isVerified = user?.verificationStatus === 'approved' || user?.verified === true;
    
    return (
      <div className="bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 rounded-lg p-6 border border-brand-primary/20">
        <h3 className="text-lg font-semibold mb-4" style={fontStyles.sectionHeading}>
          {isVerified ? '🎉 Verified Benefits' : '🔒 Verification Benefits'}
        </h3>
        
        <div className="space-y-3">
          <div className={`flex items-center space-x-3 ${isVerified ? 'text-green-700' : 'text-gray-600'}`}>
            <span>{isVerified ? '✅' : '🔒'}</span>
            <span>Access to premium communities (Supplement Scoop, Fresh Finds, Good Vibes)</span>
          </div>
          <div className={`flex items-center space-x-3 ${isVerified ? 'text-green-700' : 'text-gray-600'}`}>
            <span>{isVerified ? '✅' : '🔒'}</span>
            <span>Exclusive brand challenges and training content</span>
          </div>
          <div className={`flex items-center space-x-3 ${isVerified ? 'text-green-700' : 'text-gray-600'}`}>
            <span>{isVerified ? '✅' : '🔒'}</span>
            <span>Earn points to stand out to brands and become a super user</span>
          </div>
          <div className={`flex items-center space-x-3 ${isVerified ? 'text-green-700' : 'text-gray-600'}`}>
            <span>{isVerified ? '✅' : '🔒'}</span>
            <span>Special access to prizes and exclusive product launches</span>
          </div>
          <div className={`flex items-center space-x-3 ${isVerified ? 'text-green-700' : 'text-gray-600'}`}>
            <span>{isVerified ? '✅' : '🔒'}</span>
            <span>Career advancement - status follows you to help get jobs and negotiate raises</span>
          </div>
          <div className="flex items-center space-x-3 text-green-700">
            <span>✅</span>
            <span>Access to "What's Good" community (available to all!)</span>
          </div>
        </div>

        {!isVerified && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              <strong>Current Status:</strong> You have access to "What's Good" community. Get verified to unlock premium communities and advance your career!
            </p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={fontStyles.mainTitle}>Profile</h1>
        <p className="text-gray-600">
          Manage your profile information and verification status
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column - Profile Panel */}
        <div className="md:col-span-1">
          <StaffProfilePanel
            user={user}
            profileImage={profileImage}
            showAvatarSelector={showAvatarSelector}
            setShowAvatarSelector={setShowAvatarSelector}
            avatarOptions={avatarOptions}
            uploadProfileImage={uploadProfileImage}
            selectAvatar={selectAvatar}
            getStatusBadge={getStatusBadge}
          />
        </div>

        {/* Right Column - Verification Benefits & Editable Cards */}
        <div className="md:col-span-2 space-y-6">
          {/* Verification Benefits */}
          {getVerificationBenefits()}

          {/* About Me Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold" style={fontStyles.subsectionTitle}>About Me</h3>
              {!editingAboutMe ? (
                <button
                  onClick={() => setEditingAboutMe(true)}
                  className="text-brand-primary hover:text-brand-primary/80 text-sm font-medium"
                >
                  Edit
                </button>
              ) : (
                <div className="space-x-2">
                  <button
                    onClick={() => setEditingAboutMe(false)}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveAboutMe}
                    className="text-brand-primary hover:text-brand-primary/80 text-sm font-medium"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {!editingAboutMe ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Interests</p>
                  <p className="text-gray-800">{aboutMe.interests || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Location</p>
                  <p className="text-gray-800">{aboutMe.location || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">My Story</p>
                  <p className="text-gray-800">{aboutMe.story || 'Not specified'}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Interests</label>
                  <input
                    type="text"
                    value={aboutMe.interests}
                    onChange={(e) => setAboutMe({ ...aboutMe, interests: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    placeholder="What are your interests?"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Location</label>
                  <input
                    type="text"
                    value={aboutMe.location}
                    onChange={(e) => setAboutMe({ ...aboutMe, location: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    placeholder="Where are you based?"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">My Story</label>
                  <textarea
                    value={aboutMe.story}
                    onChange={(e) => setAboutMe({ ...aboutMe, story: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    placeholder="Share your story..."
                    rows={4}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Profile Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold" style={fontStyles.subsectionTitle}>Profile Information</h3>
              {!editingUserInfo ? (
                <button
                  onClick={() => setEditingUserInfo(true)}
                  className="text-brand-primary hover:text-brand-primary/80 text-sm font-medium"
                >
                  Edit
                </button>
              ) : (
                <div className="space-x-2">
                  <button
                    onClick={() => setEditingUserInfo(false)}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveUserInfo}
                    className="text-brand-primary hover:text-brand-primary/80 text-sm font-medium"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {!editingUserInfo ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Name</p>
                  <p className="text-gray-800">{userInfo.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Store Name</p>
                  <p className="text-gray-800">{userInfo.storeName}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Name</label>
                  <input
                    type="text"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo({ ...userInfo, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Store Name</label>
                  <input
                    type="text"
                    value={userInfo.storeName}
                    onChange={(e) => setUserInfo({ ...userInfo, storeName: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    placeholder="Your store name"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Notification Preferences (parity with brand profile) */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold" style={fontStyles.subsectionTitle}>Notification Preferences</h3>
            </div>
            <div className="space-y-4">
              {/* Push Notifications Toggle */}
              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <div className="font-medium text-gray-900 text-sm">Enable Push Notifications</div>
                  <div className="text-xs text-gray-500">
                    {pushEnabled ? 'You’ll receive alerts for new posts in your communities.' : 'You’ll still see in-app notifications, but no push alerts.'}
                  </div>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={!!pushEnabled}
                    onChange={async () => {
                      if (!pushEnabled) {
                        const { permission } = await requestPermissionAndToken(user);
                        if (permission !== 'granted') {
                          try { toast?.error?.('Push notifications are disabled in your browser.'); } catch {}
                          return;
                        }
                      }
                      setPushEnabled(!pushEnabled);
                    }}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary relative" />
                </label>
              </div>

              {[
                { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive email updates about your account' },
                { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive push notifications in the app' },
                { key: 'communityUpdates', label: 'Community Updates', desc: 'New posts and activity in your communities' },
                { key: 'trainingReminders', label: 'Training Reminders', desc: 'Reminders about trainings and new content' },
                { key: 'sampleRequests', label: 'Sample Request Notifications', desc: 'Get notified about new sample requests' },
                { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Weekly summary of activity and insights' },
              ].map((row) => (
                <div key={row.key} className="flex items-center justify-between py-1">
                  <div className="space-y-0.5">
                    <div className="font-medium text-gray-900 text-sm">{row.label}</div>
                    <div className="text-xs text-gray-500">{row.desc}</div>
                  </div>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={!!notificationPreferences[row.key]}
                      onChange={() => togglePref(row.key)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary relative" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
