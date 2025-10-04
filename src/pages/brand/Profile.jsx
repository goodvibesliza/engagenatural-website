import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Separator } from '../../components/ui/separator';
import { Switch } from '../../components/ui/switch';
import { User, Building, Mail, Calendar, Bell, Upload, Save, X } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Brand Manager Profile Page
 * Desktop layout showing profile information, notification preferences, and avatar upload
 */
export default function BrandProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    role: 'brand_manager',
    brandId: '',
    lastLogin: null,
    profileImage: null,
    notificationPreferences: {
      emailNotifications: true,
      pushNotifications: true,
      communityUpdates: true,
      trainingReminders: true,
      sampleRequests: true,
      weeklyDigest: false,
    },
  });
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Load user data on mount
  useEffect(() => {
    async function loadUserData() {
      if (!user?.uid) return;

      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            name: data.name || data.displayName || user.displayName || 'Brand Manager',
            email: data.email || user.email || '',
            role: data.role || 'brand_manager',
            brandId: data.brandId || user.brandId || '',
            lastLogin: data.lastLogin || null,
            profileImage: data.profileImage || user.photoURL || null,
            notificationPreferences: {
              emailNotifications: data.notificationPreferences?.emailNotifications ?? true,
              pushNotifications: data.notificationPreferences?.pushNotifications ?? true,
              communityUpdates: data.notificationPreferences?.communityUpdates ?? true,
              trainingReminders: data.notificationPreferences?.trainingReminders ?? true,
              sampleRequests: data.notificationPreferences?.sampleRequests ?? true,
              weeklyDigest: data.notificationPreferences?.weeklyDigest ?? false,
            },
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Error loading profile data');
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, [user?.uid, user?.displayName, user?.email, user?.photoURL, user?.brandId]);

  // Handle avatar upload
  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user?.uid) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      // Upload to Firebase Storage
      const imageRef = ref(storage, `profile_images/${user.uid}/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(imageRef, file);
      const imageURL = await getDownloadURL(uploadResult.ref);

      // Update user document
      await updateDoc(doc(db, 'users', user.uid), {
        profileImage: imageURL,
      });

      setUserData((prev) => ({ ...prev, profileImage: imageURL }));
      toast.success('Profile photo updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Error uploading photo. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle name update
  const handleNameUpdate = async () => {
    if (!user?.uid || !tempName.trim()) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: tempName.trim(),
      });

      setUserData((prev) => ({ ...prev, name: tempName.trim() }));
      setEditingName(false);
      toast.success('Name updated successfully');
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Error updating name. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle notification preference toggle
  const handleNotificationToggle = async (key) => {
    if (!user?.uid) return;

    const newPreferences = {
      ...userData.notificationPreferences,
      [key]: !userData.notificationPreferences[key],
    };

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        notificationPreferences: newPreferences,
      });

      setUserData((prev) => ({
        ...prev,
        notificationPreferences: newPreferences,
      }));
      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast.error('Error updating preferences. Please try again.');
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  // Get user initials
  const getUserInitials = () => {
    if (!userData.name) return 'BM';
    return userData.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Profile Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage your profile information and preferences
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-gray-200 dark:border-gray-700">
                <AvatarImage src={userData.profileImage} alt={userData.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="avatar-upload" className="text-sm font-medium">
                  Profile Photo
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Upload a photo or use an avatar
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploadingAvatar}
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Name
              </Label>
              {editingName ? (
                <div className="flex gap-2">
                  <Input
                    id="name"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Enter your name"
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={handleNameUpdate}
                    disabled={saving || !tempName.trim()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingName(false);
                      setTempName(userData.name);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <Input value={userData.name} disabled className="flex-1" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingName(true);
                      setTempName(userData.name);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input id="email" value={userData.email} disabled />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Email cannot be changed. Contact support if you need to update it.
              </p>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Role
              </Label>
              <Input id="role" value="Brand Manager" disabled />
            </div>

            {/* Brand ID */}
            <div className="space-y-2">
              <Label htmlFor="brandId" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Associated Brand
              </Label>
              <Input id="brandId" value={userData.brandId || 'Not assigned'} disabled />
            </div>

            {/* Last Login */}
            <div className="space-y-2">
              <Label htmlFor="lastLogin" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Last Login
              </Label>
              <Input id="lastLogin" value={formatDate(userData.lastLogin)} disabled />
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive email updates about your account
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={userData.notificationPreferences.emailNotifications}
                onCheckedChange={() => handleNotificationToggle('emailNotifications')}
              />
            </div>

            <Separator />

            {/* Push Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive push notifications in the app
                </p>
              </div>
              <Switch
                id="push-notifications"
                checked={userData.notificationPreferences.pushNotifications}
                onCheckedChange={() => handleNotificationToggle('pushNotifications')}
              />
            </div>

            <Separator />

            {/* Community Updates */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="community-updates">Community Updates</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get notified about new posts and activity in your communities
                </p>
              </div>
              <Switch
                id="community-updates"
                checked={userData.notificationPreferences.communityUpdates}
                onCheckedChange={() => handleNotificationToggle('communityUpdates')}
              />
            </div>

            <Separator />

            {/* Training Reminders */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="training-reminders">Training Reminders</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Reminders about incomplete trainings and new content
                </p>
              </div>
              <Switch
                id="training-reminders"
                checked={userData.notificationPreferences.trainingReminders}
                onCheckedChange={() => handleNotificationToggle('trainingReminders')}
              />
            </div>

            <Separator />

            {/* Sample Requests */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sample-requests">Sample Request Notifications</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get notified about new sample requests
                </p>
              </div>
              <Switch
                id="sample-requests"
                checked={userData.notificationPreferences.sampleRequests}
                onCheckedChange={() => handleNotificationToggle('sampleRequests')}
              />
            </div>

            <Separator />

            {/* Weekly Digest */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-digest">Weekly Digest</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive a weekly summary of activity and insights
                </p>
              </div>
              <Switch
                id="weekly-digest"
                checked={userData.notificationPreferences.weeklyDigest}
                onCheckedChange={() => handleNotificationToggle('weeklyDigest')}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
