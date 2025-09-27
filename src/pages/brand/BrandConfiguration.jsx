import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Switch } from '../../components/ui/switch'
import { Separator } from '../../components/ui/separator'
import { 
  Settings, 
  Save, 
  Upload, 
  Palette, 
  Globe, 
  Bell, 
  Shield, 
  Users,
  Eye,
  Lock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

export default function BrandConfiguration() {
  const { brandId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [brandConfig, setBrandConfig] = useState({
    // Basic Information
    name: '',
    description: '',
    website: '',
    logoUrl: '',
    
    // Brand Colors & Styling
    primaryColor: '#0ea5e9',
    secondaryColor: '#64748b',
    accentColor: '#10b981',
    
    // Community Settings
    allowPublicJoin: true,
    requireApproval: false,
    maxMembers: 10000,
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    
    // Privacy Settings
    publicProfile: true,
    showMemberCount: true,
    allowMemberDirectory: true,
    
    // Campaign Settings
    autoApproveCampaigns: false,
    allowMemberCampaigns: false,
    campaignReviewRequired: true,
    
    // Content Settings
    contentModerationLevel: 'medium', // low, medium, high
    allowUserContent: true,
    requireContentApproval: false,
    
    // Advanced Settings
    customDomain: '',
    analyticsEnabled: true,
    apiAccess: false
  });

  useEffect(() => {
    async function fetchBrandConfig() {
      try {
        const docRef = doc(db, 'brands', brandId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBrandConfig(prevConfig => ({
            ...prevConfig,
            ...data
          }));
        }
      } catch (error) {
        console.error('Error fetching brand config:', error);
        setSaveStatus('Error loading configuration');
      } finally {
        setLoading(false);
      }
    }

    if (brandId) {
      fetchBrandConfig();
    }
  }, [brandId]);

  const handleInputChange = (field, value) => {
    setBrandConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('');
    
    try {
      const docRef = doc(db, 'brands', brandId);
      await updateDoc(docRef, {
        ...brandConfig,
        updatedAt: serverTimestamp()
      });
      
      setSaveStatus('Configuration saved successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving configuration:', error);
      setSaveStatus('Error saving configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-muted-foreground">Loading configuration...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Brand Configuration</h1>
            <p className="text-muted-foreground">
              Manage your brand settings, preferences, and community configuration
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              <Settings className="h-3 w-3 mr-1" />
              Settings
            </Badge>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Save Status */}
        {saveStatus && (
          <Card className={`border-l-4 ${saveStatus.includes('Error') ? 'border-l-red-500 bg-red-50' : 'border-l-green-500 bg-green-50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center">
                {saveStatus.includes('Error') ? (
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                )}
                <span className={saveStatus.includes('Error') ? 'text-red-700' : 'text-green-700'}>
                  {saveStatus}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              Basic Information
            </CardTitle>
            <CardDescription>
              Configure your brand's basic information and public profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brandName">Brand Name</Label>
                <Input
                  id="brandName"
                  value={brandConfig.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter brand name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  value={brandConfig.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://yourbrand.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Brand Description</Label>
              <Textarea
                id="description"
                value={brandConfig.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe your brand and mission..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL</Label>
              <Input
                id="logoUrl"
                value={brandConfig.logoUrl}
                onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                placeholder="https://yourbrand.com/logo.png"
              />
            </div>
          </CardContent>
        </Card>

        {/* Brand Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="h-5 w-5 mr-2" />
              Brand Colors & Styling
            </CardTitle>
            <CardDescription>
              Customize your brand's color scheme and visual identity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={brandConfig.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={brandConfig.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    placeholder="#0ea5e9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Secondary Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="secondaryColor"
                    type="color"
                    value={brandConfig.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={brandConfig.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    placeholder="#64748b"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accentColor">Accent Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="accentColor"
                    type="color"
                    value={brandConfig.accentColor}
                    onChange={(e) => handleInputChange('accentColor', e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={brandConfig.accentColor}
                    onChange={(e) => handleInputChange('accentColor', e.target.value)}
                    placeholder="#10b981"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Community Settings
            </CardTitle>
            <CardDescription>
              Configure how users can join and interact with your brand communities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Public Join</Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to join communities without approval
                </p>
              </div>
              <Switch
                checked={brandConfig.allowPublicJoin}
                onCheckedChange={(checked) => handleInputChange('allowPublicJoin', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Approval</Label>
                <p className="text-sm text-muted-foreground">
                  Require manual approval for new community members
                </p>
              </div>
              <Switch
                checked={brandConfig.requireApproval}
                onCheckedChange={(checked) => handleInputChange('requireApproval', checked)}
              />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="maxMembers">Maximum Members</Label>
              <Input
                id="maxMembers"
                type="number"
                value={brandConfig.maxMembers}
                onChange={(e) => handleInputChange('maxMembers', parseInt(e.target.value))}
                placeholder="10000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Privacy & Visibility
            </CardTitle>
            <CardDescription>
              Control what information is publicly visible
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Public Profile</Label>
                <p className="text-sm text-muted-foreground">
                  Make your brand profile visible to the public
                </p>
              </div>
              <Switch
                checked={brandConfig.publicProfile}
                onCheckedChange={(checked) => handleInputChange('publicProfile', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Member Count</Label>
                <p className="text-sm text-muted-foreground">
                  Display the number of community members publicly
                </p>
              </div>
              <Switch
                checked={brandConfig.showMemberCount}
                onCheckedChange={(checked) => handleInputChange('showMemberCount', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Member Directory</Label>
                <p className="text-sm text-muted-foreground">
                  Allow members to see and connect with each other
                </p>
              </div>
              <Switch
                checked={brandConfig.allowMemberDirectory}
                onCheckedChange={(checked) => handleInputChange('allowMemberDirectory', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure notification preferences for your brand
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email updates about community activity
                </p>
              </div>
              <Switch
                checked={brandConfig.emailNotifications}
                onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive real-time notifications for important events
                </p>
              </div>
              <Switch
                checked={brandConfig.pushNotifications}
                onCheckedChange={(checked) => handleInputChange('pushNotifications', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Receive weekly analytics and performance reports
                </p>
              </div>
              <Switch
                checked={brandConfig.weeklyReports}
                onCheckedChange={(checked) => handleInputChange('weeklyReports', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




