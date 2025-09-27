import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { isLocalhost } from '../lib/firebase';

// Icons
import { 
  AlertCircle, 
  Database, 
  Lock, 
  HardDrive, 
  Settings, 
  Info
} from 'lucide-react';

export default function EmulatorTestDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <div className="flex items-center">
            <h1 className="text-3xl font-bold">Firebase Emulator Dashboard</h1>
            <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
              Emulator Mode
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Test your Firebase functionality in a local environment
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button variant="outline" size="sm" asChild>
            <a href="/emulator-diagnostics" target="_blank" rel="noopener noreferrer">
              <AlertCircle className="h-4 w-4 mr-2" />
              Run Diagnostics
            </a>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="auth">Authentication</TabsTrigger>
          <TabsTrigger value="firestore">Firestore</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Firebase Emulator Test Dashboard</CardTitle>
              <CardDescription>
                This dashboard will be expanded with comprehensive testing tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Lock className="h-5 w-5 mr-2 text-blue-600" />
                      Authentication
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Test user authentication and roles</p>
                    <Button variant="link" className="p-0 mt-2">
                      Coming Soon →
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Database className="h-5 w-5 mr-2 text-green-600" />
                      Firestore
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Test database operations</p>
                    <Button variant="link" className="p-0 mt-2">
                      Coming Soon →
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="bg-purple-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <HardDrive className="h-5 w-5 mr-2 text-purple-600" />
                      Storage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Test file uploads and downloads</p>
                    <Button variant="link" className="p-0 mt-2">
                      Coming Soon →
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-800">Placeholder Dashboard</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      This is a placeholder for the Firebase Emulator Test Dashboard. 
                      The full implementation will include comprehensive tools for testing 
                      all Firebase services in the emulator environment.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="auth">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Testing</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Lock className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Authentication Testing Coming Soon</h3>
              <p className="text-center text-muted-foreground max-w-md">
                This section will include tools for testing user authentication, roles, and permissions.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="firestore">
          <Card>
            <CardHeader>
              <CardTitle>Firestore Testing</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Database className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Firestore Testing Coming Soon</h3>
              <p className="text-center text-muted-foreground max-w-md">
                This section will include tools for testing Firestore CRUD operations and security rules.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>Storage Testing</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <HardDrive className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Storage Testing Coming Soon</h3>
              <p className="text-center text-muted-foreground max-w-md">
                This section will include tools for testing file uploads, downloads, and storage security rules.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Emulator Status */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Emulator Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <div className="flex-1">
              <div className="flex items-center">
                <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                <span className="font-medium">Running in Emulator Mode</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Firebase emulators should be running at localhost:9099
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a 
                href="http://127.0.0.1:9099" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <Settings className="h-4 w-4 mr-2" />
                Emulator UI
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
