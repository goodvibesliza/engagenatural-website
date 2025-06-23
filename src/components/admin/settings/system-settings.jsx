import { useState, useEffect } from 'react'
import { useRoleAccess } from '../../../hooks/use-role-access'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Switch } from '../../ui/switch'
import { Badge } from '../../ui/badge'
import { Textarea } from '../../ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table'
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Shield, 
  Bell, 
  Mail, 
  Database, 
  Cloud, 
  Key, 
  Users, 
  DollarSign, 
  FileText, 
  Globe, 
  Smartphone, 
  Monitor, 
  Palette, 
  Code, 
  BarChart3, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Plus, 
  Trash2, 
  Edit,
  Eye,
  EyeOff
} from 'lucide-react'

export default function SystemSettings() {
  const { canAccess, hasRole } = useRoleAccess()
  const [settings, setSettings] = useState({
    // General Settings
    general: {
      siteName: 'EngageNatural',
      siteDescription: 'Connecting brands with engaged communities through authentic partnerships',
      siteUrl: 'https://engagenatural.com',
      adminEmail: 'admin@engagenatural.com',
      supportEmail: 'support@engagenatural.com',
      timezone: 'America/New_York',
      language: 'en',
      maintenanceMode: false,
      registrationEnabled: true,
      emailVerificationRequired: true
    },
    
    // Security Settings
    security: {
      passwordMinLength: 8,
      passwordRequireSpecialChars: true,
      passwordRequireNumbers: true,
      passwordRequireUppercase: true,
      sessionTimeout: 24, // hours
      maxLoginAttempts: 5,
      lockoutDuration: 30, // minutes
      twoFactorRequired: false,
      ipWhitelist: [],
      allowedDomains: ['engagenatural.com'],
      encryptionEnabled: true,
      auditLogging: true
    },
    
    // Notification Settings
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      adminAlerts: true,
      userWelcomeEmails: true,
      paymentNotifications: true,
      securityAlerts: true,
      maintenanceNotifications: true,
      marketingEmails: false,
      weeklyReports: true
    },
    
    // Payment Settings
    payments: {
      currency: 'USD',
      taxRate: 8.5, // percentage
      processingFee: 2.9, // percentage
      monthlyPlanPrice: 5000, // base price in cents
      yearlyPlanPrice: 50000, // base price in cents
      additionalLessonPrice: 100000, // price in cents
      trialPeriodDays: 14,
      gracePeriodDays: 7,
      autoRenewal: true,
      prorationEnabled: true,
      refundPolicy: 'partial' // 'full', 'partial', 'none'
    },
    
    // Content Settings
    content: {
      maxFileSize: 100, // MB
      allowedFileTypes: ['mp4', 'pdf', 'jpg', 'png', 'docx'],
      autoApproval: false,
      contentModeration: true,
      backupFrequency: 'daily', // 'hourly', 'daily', 'weekly'
      storageLimit: 1000, // GB
      cdnEnabled: true,
      compressionEnabled: true,
      watermarkEnabled: false
    },
    
    // Integration Settings
    integrations: {
      googleAnalytics: {
        enabled: true,
        trackingId: 'GA-XXXXXXXXX',
        enhancedEcommerce: true
      },
      stripe: {
        enabled: true,
        publicKey: 'pk_test_...',
        webhookSecret: 'whsec_...'
      },
      sendgrid: {
        enabled: true,
        apiKey: 'SG.XXXXXXXXX',
        fromEmail: 'noreply@engagenatural.com'
      },
      firebase: {
        enabled: true,
        projectId: 'engagenatural-prod',
        authDomain: 'engagenatural-prod.firebaseapp.com'
      },
      slack: {
        enabled: false,
        webhookUrl: '',
        channel: '#admin-alerts'
      }
    }
  })

  const [activeTab, setActiveTab] = useState('general')
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showApiKeys, setShowApiKeys] = useState(false)

  // Handle setting changes
  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
    setUnsavedChanges(true)
  }

  const updateNestedSetting = (category, subcategory, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subcategory]: {
          ...prev[category][subcategory],
          [key]: value
        }
      }
    }))
    setUnsavedChanges(true)
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setUnsavedChanges(false)
      console.log('Settings saved:', settings)
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const resetSettings = () => {
    // Reset to default values
    setUnsavedChanges(false)
    console.log('Settings reset to defaults')
  }

  const maskApiKey = (key) => {
    if (!key || key.length < 8) return key
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4)
  }

  if (!canAccess(['manage_system_settings'])) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Lock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Access Restricted</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to access system settings.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Configure platform settings, security, integrations, and system preferences
          </p>
        </div>
        <div className="flex gap-2">
          {unsavedChanges && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              Unsaved Changes
            </Badge>
          )}
          <Button variant="outline" onClick={resetSettings}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={saveSettings} disabled={saving || !unsavedChanges}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Site Configuration
              </CardTitle>
              <CardDescription>
                Basic site information and global settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.general.siteName}
                    onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input
                    id="siteUrl"
                    value={settings.general.siteUrl}
                    onChange={(e) => updateSetting('general', 'siteUrl', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.general.siteDescription}
                  onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={settings.general.adminEmail}
                    onChange={(e) => updateSetting('general', 'adminEmail', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={settings.general.supportEmail}
                    onChange={(e) => updateSetting('general', 'supportEmail', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={settings.general.timezone} onValueChange={(value) => updateSetting('general', 'timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Default Language</Label>
                  <Select value={settings.general.language} onValueChange={(value) => updateSetting('general', 'language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Temporarily disable public access to the site</p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={settings.general.maintenanceMode}
                    onCheckedChange={(checked) => updateSetting('general', 'maintenanceMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="registrationEnabled">User Registration</Label>
                    <p className="text-sm text-muted-foreground">Allow new users to register accounts</p>
                  </div>
                  <Switch
                    id="registrationEnabled"
                    checked={settings.general.registrationEnabled}
                    onCheckedChange={(checked) => updateSetting('general', 'registrationEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailVerificationRequired">Email Verification</Label>
                    <p className="text-sm text-muted-foreground">Require email verification for new accounts</p>
                  </div>
                  <Switch
                    id="emailVerificationRequired"
                    checked={settings.general.emailVerificationRequired}
                    onCheckedChange={(checked) => updateSetting('general', 'emailVerificationRequired', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Configuration
              </CardTitle>
              <CardDescription>
                Password policies, session management, and security features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    min="6"
                    max="32"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="1"
                    max="168"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min="3"
                    max="10"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
                  <Input
                    id="lockoutDuration"
                    type="number"
                    min="5"
                    max="1440"
                    value={settings.security.lockoutDuration}
                    onChange={(e) => updateSetting('security', 'lockoutDuration', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="passwordRequireSpecialChars">Require Special Characters</Label>
                    <p className="text-sm text-muted-foreground">Passwords must contain special characters</p>
                  </div>
                  <Switch
                    id="passwordRequireSpecialChars"
                    checked={settings.security.passwordRequireSpecialChars}
                    onCheckedChange={(checked) => updateSetting('security', 'passwordRequireSpecialChars', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="passwordRequireNumbers">Require Numbers</Label>
                    <p className="text-sm text-muted-foreground">Passwords must contain numbers</p>
                  </div>
                  <Switch
                    id="passwordRequireNumbers"
                    checked={settings.security.passwordRequireNumbers}
                    onCheckedChange={(checked) => updateSetting('security', 'passwordRequireNumbers', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="passwordRequireUppercase">Require Uppercase</Label>
                    <p className="text-sm text-muted-foreground">Passwords must contain uppercase letters</p>
                  </div>
                  <Switch
                    id="passwordRequireUppercase"
                    checked={settings.security.passwordRequireUppercase}
                    onCheckedChange={(checked) => updateSetting('security', 'passwordRequireUppercase', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="twoFactorRequired">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
                  </div>
                  <Switch
                    id="twoFactorRequired"
                    checked={settings.security.twoFactorRequired}
                    onCheckedChange={(checked) => updateSetting('security', 'twoFactorRequired', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auditLogging">Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">Log all admin actions and security events</p>
                  </div>
                  <Switch
                    id="auditLogging"
                    checked={settings.security.auditLogging}
                    onCheckedChange={(checked) => updateSetting('security', 'auditLogging', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure email, SMS, and push notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send notifications via email</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsNotifications">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
                  </div>
                  <Switch
                    id="smsNotifications"
                    checked={settings.notifications.smsNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'smsNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="pushNotifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send browser push notifications</p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'pushNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="adminAlerts">Admin Alerts</Label>
                    <p className="text-sm text-muted-foreground">Critical system alerts for administrators</p>
                  </div>
                  <Switch
                    id="adminAlerts"
                    checked={settings.notifications.adminAlerts}
                    onCheckedChange={(checked) => updateSetting('notifications', 'adminAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="userWelcomeEmails">Welcome Emails</Label>
                    <p className="text-sm text-muted-foreground">Send welcome emails to new users</p>
                  </div>
                  <Switch
                    id="userWelcomeEmails"
                    checked={settings.notifications.userWelcomeEmails}
                    onCheckedChange={(checked) => updateSetting('notifications', 'userWelcomeEmails', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="paymentNotifications">Payment Notifications</Label>
                    <p className="text-sm text-muted-foreground">Notify about payment events</p>
                  </div>
                  <Switch
                    id="paymentNotifications"
                    checked={settings.notifications.paymentNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'paymentNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="securityAlerts">Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">Notify about security events</p>
                  </div>
                  <Switch
                    id="securityAlerts"
                    checked={settings.notifications.securityAlerts}
                    onCheckedChange={(checked) => updateSetting('notifications', 'securityAlerts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="weeklyReports">Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">Send weekly analytics reports</p>
                  </div>
                  <Switch
                    id="weeklyReports"
                    checked={settings.notifications.weeklyReports}
                    onCheckedChange={(checked) => updateSetting('notifications', 'weeklyReports', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Configuration
              </CardTitle>
              <CardDescription>
                Pricing, billing, and payment processing settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={settings.payments.currency} onValueChange={(value) => updateSetting('payments', 'currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={settings.payments.taxRate}
                    onChange={(e) => updateSetting('payments', 'taxRate', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="monthlyPlanPrice">Monthly Plan Price ($)</Label>
                  <Input
                    id="monthlyPlanPrice"
                    type="number"
                    min="0"
                    value={settings.payments.monthlyPlanPrice / 100}
                    onChange={(e) => updateSetting('payments', 'monthlyPlanPrice', parseInt(e.target.value) * 100)}
                  />
                </div>
                <div>
                  <Label htmlFor="yearlyPlanPrice">Yearly Plan Price ($)</Label>
                  <Input
                    id="yearlyPlanPrice"
                    type="number"
                    min="0"
                    value={settings.payments.yearlyPlanPrice / 100}
                    onChange={(e) => updateSetting('payments', 'yearlyPlanPrice', parseInt(e.target.value) * 100)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="additionalLessonPrice">Additional Lesson Price ($)</Label>
                  <Input
                    id="additionalLessonPrice"
                    type="number"
                    min="0"
                    value={settings.payments.additionalLessonPrice / 100}
                    onChange={(e) => updateSetting('payments', 'additionalLessonPrice', parseInt(e.target.value) * 100)}
                  />
                </div>
                <div>
                  <Label htmlFor="trialPeriodDays">Trial Period (days)</Label>
                  <Input
                    id="trialPeriodDays"
                    type="number"
                    min="0"
                    max="90"
                    value={settings.payments.trialPeriodDays}
                    onChange={(e) => updateSetting('payments', 'trialPeriodDays', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoRenewal">Auto Renewal</Label>
                    <p className="text-sm text-muted-foreground">Automatically renew subscriptions</p>
                  </div>
                  <Switch
                    id="autoRenewal"
                    checked={settings.payments.autoRenewal}
                    onCheckedChange={(checked) => updateSetting('payments', 'autoRenewal', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="prorationEnabled">Proration</Label>
                    <p className="text-sm text-muted-foreground">Prorate charges for plan changes</p>
                  </div>
                  <Switch
                    id="prorationEnabled"
                    checked={settings.payments.prorationEnabled}
                    onCheckedChange={(checked) => updateSetting('payments', 'prorationEnabled', checked)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="refundPolicy">Refund Policy</Label>
                <Select value={settings.payments.refundPolicy} onValueChange={(value) => updateSetting('payments', 'refundPolicy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Refund</SelectItem>
                    <SelectItem value="partial">Partial Refund</SelectItem>
                    <SelectItem value="none">No Refunds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Settings */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Content Management
              </CardTitle>
              <CardDescription>
                File upload limits, content moderation, and storage settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                  <Input
                    id="maxFileSize"
                    type="number"
                    min="1"
                    max="1000"
                    value={settings.content.maxFileSize}
                    onChange={(e) => updateSetting('content', 'maxFileSize', parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="storageLimit">Storage Limit (GB)</Label>
                  <Input
                    id="storageLimit"
                    type="number"
                    min="10"
                    max="10000"
                    value={settings.content.storageLimit}
                    onChange={(e) => updateSetting('content', 'storageLimit', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
                <Input
                  id="allowedFileTypes"
                  value={settings.content.allowedFileTypes.join(', ')}
                  onChange={(e) => updateSetting('content', 'allowedFileTypes', e.target.value.split(', '))}
                  placeholder="mp4, pdf, jpg, png, docx"
                />
                <p className="text-sm text-muted-foreground mt-1">Separate file extensions with commas</p>
              </div>

              <div>
                <Label htmlFor="backupFrequency">Backup Frequency</Label>
                <Select value={settings.content.backupFrequency} onValueChange={(value) => updateSetting('content', 'backupFrequency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoApproval">Auto Approval</Label>
                    <p className="text-sm text-muted-foreground">Automatically approve uploaded content</p>
                  </div>
                  <Switch
                    id="autoApproval"
                    checked={settings.content.autoApproval}
                    onCheckedChange={(checked) => updateSetting('content', 'autoApproval', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="contentModeration">Content Moderation</Label>
                    <p className="text-sm text-muted-foreground">Enable automated content moderation</p>
                  </div>
                  <Switch
                    id="contentModeration"
                    checked={settings.content.contentModeration}
                    onCheckedChange={(checked) => updateSetting('content', 'contentModeration', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="cdnEnabled">CDN Enabled</Label>
                    <p className="text-sm text-muted-foreground">Use content delivery network for faster loading</p>
                  </div>
                  <Switch
                    id="cdnEnabled"
                    checked={settings.content.cdnEnabled}
                    onCheckedChange={(checked) => updateSetting('content', 'cdnEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="compressionEnabled">Compression</Label>
                    <p className="text-sm text-muted-foreground">Automatically compress uploaded files</p>
                  </div>
                  <Switch
                    id="compressionEnabled"
                    checked={settings.content.compressionEnabled}
                    onCheckedChange={(checked) => updateSetting('content', 'compressionEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="watermarkEnabled">Watermark</Label>
                    <p className="text-sm text-muted-foreground">Add watermark to uploaded images</p>
                  </div>
                  <Switch
                    id="watermarkEnabled"
                    checked={settings.content.watermarkEnabled}
                    onCheckedChange={(checked) => updateSetting('content', 'watermarkEnabled', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integration Settings */}
        <TabsContent value="integrations" className="space-y-4">
          <div className="space-y-4">
            {/* Google Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Google Analytics
                </CardTitle>
                <CardDescription>
                  Configure Google Analytics tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="gaEnabled">Enable Google Analytics</Label>
                    <p className="text-sm text-muted-foreground">Track website analytics</p>
                  </div>
                  <Switch
                    id="gaEnabled"
                    checked={settings.integrations.googleAnalytics.enabled}
                    onCheckedChange={(checked) => updateNestedSetting('integrations', 'googleAnalytics', 'enabled', checked)}
                  />
                </div>

                {settings.integrations.googleAnalytics.enabled && (
                  <div>
                    <Label htmlFor="gaTrackingId">Tracking ID</Label>
                    <Input
                      id="gaTrackingId"
                      value={settings.integrations.googleAnalytics.trackingId}
                      onChange={(e) => updateNestedSetting('integrations', 'googleAnalytics', 'trackingId', e.target.value)}
                      placeholder="GA-XXXXXXXXX"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stripe */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Stripe Payment Processing
                </CardTitle>
                <CardDescription>
                  Configure Stripe for payment processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="stripeEnabled">Enable Stripe</Label>
                    <p className="text-sm text-muted-foreground">Process payments through Stripe</p>
                  </div>
                  <Switch
                    id="stripeEnabled"
                    checked={settings.integrations.stripe.enabled}
                    onCheckedChange={(checked) => updateNestedSetting('integrations', 'stripe', 'enabled', checked)}
                  />
                </div>

                {settings.integrations.stripe.enabled && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="stripePublicKey">Public Key</Label>
                      <div className="relative">
                        <Input
                          id="stripePublicKey"
                          type={showApiKeys ? "text" : "password"}
                          value={settings.integrations.stripe.publicKey}
                          onChange={(e) => updateNestedSetting('integrations', 'stripe', 'publicKey', e.target.value)}
                          placeholder="pk_test_..."
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowApiKeys(!showApiKeys)}
                        >
                          {showApiKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="stripeWebhookSecret">Webhook Secret</Label>
                      <Input
                        id="stripeWebhookSecret"
                        type={showApiKeys ? "text" : "password"}
                        value={settings.integrations.stripe.webhookSecret}
                        onChange={(e) => updateNestedSetting('integrations', 'stripe', 'webhookSecret', e.target.value)}
                        placeholder="whsec_..."
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SendGrid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  SendGrid Email Service
                </CardTitle>
                <CardDescription>
                  Configure SendGrid for email delivery
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sendgridEnabled">Enable SendGrid</Label>
                    <p className="text-sm text-muted-foreground">Send emails through SendGrid</p>
                  </div>
                  <Switch
                    id="sendgridEnabled"
                    checked={settings.integrations.sendgrid.enabled}
                    onCheckedChange={(checked) => updateNestedSetting('integrations', 'sendgrid', 'enabled', checked)}
                  />
                </div>

                {settings.integrations.sendgrid.enabled && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sendgridApiKey">API Key</Label>
                      <Input
                        id="sendgridApiKey"
                        type={showApiKeys ? "text" : "password"}
                        value={settings.integrations.sendgrid.apiKey}
                        onChange={(e) => updateNestedSetting('integrations', 'sendgrid', 'apiKey', e.target.value)}
                        placeholder="SG.XXXXXXXXX"
                      />
                    </div>

                    <div>
                      <Label htmlFor="sendgridFromEmail">From Email</Label>
                      <Input
                        id="sendgridFromEmail"
                        type="email"
                        value={settings.integrations.sendgrid.fromEmail}
                        onChange={(e) => updateNestedSetting('integrations', 'sendgrid', 'fromEmail', e.target.value)}
                        placeholder="noreply@engagenatural.com"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

