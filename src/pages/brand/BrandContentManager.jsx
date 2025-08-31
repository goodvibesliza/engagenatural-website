import React, { useState } from 'react';

// Correct relative paths to shared modules
import { useAuth } from '../../contexts/auth-context';

// UI primitives (shadcn-inspired)
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Separator } from '../../components/ui/separator';

// Brand-specific content manager
import LessonsManager from '../../components/brand/content/LessonsManager';

// Icons
import { BookOpen, Users, LayoutDashboard, Settings, FileText } from 'lucide-react';

export default function BrandContentManager() {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, brandId, brandName } = useAuth();
  
  // Format current date
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{brandName || 'Brand'} Dashboard</h1>
          <p className="text-muted-foreground">{currentDate}</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <FileText className="h-4 w-4 mr-2" />
            View Site
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <TabsTrigger value="overview" className="flex items-center">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="lessons" className="flex items-center">
            <BookOpen className="h-4 w-4 mr-2" />
            Lessons
          </TabsTrigger>
          <TabsTrigger value="communities" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Communities
          </TabsTrigger>
          <TabsTrigger value="other" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Other Content
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to your Content Dashboard</CardTitle>
              <CardDescription>
                Manage all your brand content from this central location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                      Lessons
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Published lessons</p>
                    <Button variant="link" className="p-0 mt-2" onClick={() => setActiveTab('lessons')}>
                      Manage Lessons →
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Users className="h-5 w-5 mr-2 text-green-600" />
                      Communities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Active communities</p>
                    <Button variant="link" className="p-0 mt-2" onClick={() => setActiveTab('communities')}>
                      Manage Communities →
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-purple-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-purple-600" />
                      Other Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Content pieces</p>
                    <Button variant="link" className="p-0 mt-2" onClick={() => setActiveTab('other')}>
                      Manage Content →
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Tips</CardTitle>
              <CardDescription>
                Get the most out of your brand dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start">
                <div className="bg-blue-100 p-2 rounded-full mr-4">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Create Engaging Lessons</h3>
                  <p className="text-sm text-muted-foreground">
                    Use high-quality images and clear, concise content to engage your audience.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-full mr-4">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Build Active Communities</h3>
                  <p className="text-sm text-muted-foreground">
                    Organize your communities with relevant topics and encourage participation.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-full mr-4">
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Customize Your Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Update your brand profile and preferences in the settings section.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lessons Tab */}
        <TabsContent value="lessons">
          <LessonsManager />
        </TabsContent>

        {/* Communities Tab */}
        <TabsContent value="communities">
          <Card>
            <CardHeader>
              <CardTitle>Communities Manager</CardTitle>
              <CardDescription>
                Create and manage communities for your brand
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Communities Coming Soon</h3>
              <p className="text-center text-muted-foreground max-w-md mb-6">
                This feature is under development. Soon you'll be able to create and manage communities for your brand.
              </p>
              <Button disabled>Create Community</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other Content Tab */}
        <TabsContent value="other">
          <Card>
            <CardHeader>
              <CardTitle>Other Content</CardTitle>
              <CardDescription>
                Manage additional content for your brand
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Additional Content Types Coming Soon</h3>
              <p className="text-center text-muted-foreground max-w-md mb-6">
                We're working on supporting more content types. Check back soon for updates!
              </p>
              <Button disabled>Add Content</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
