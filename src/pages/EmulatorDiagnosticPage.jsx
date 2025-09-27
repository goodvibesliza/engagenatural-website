import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { isLocalhost } from '@/lib/firebase';

// Icons
import { 
  AlertCircle, 
  Database, 
  Lock, 
  HardDrive, 
  RefreshCw,
  Info
} from 'lucide-react';

export default function EmulatorDiagnosticPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <div className="flex items-center">
            <h1 className="text-3xl font-bold">Firebase Emulator Diagnostics</h1>
            <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
              Emulator Mode
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Diagnose and troubleshoot Firebase emulator connectivity issues
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button variant="outline" size="sm" asChild>
            <a href="/emulator" className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Emulator Dashboard
            </a>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Emulator Diagnostics</CardTitle>
            <CardDescription>
              Test connectivity to Firebase emulator services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {!isLocalhost && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    This page is designed to work with Firebase emulators in a local development environment.
                    You appear to be accessing it from a production environment.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Lock className="h-5 w-5 mr-2 text-blue-600" />
                      Authentication
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Status: Pending check</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Database className="h-5 w-5 mr-2 text-green-600" />
                      Firestore
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Status: Pending check</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <HardDrive className="h-5 w-5 mr-2 text-purple-600" />
                      Storage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Status: Pending check</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-center mt-6">
                <Button className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run Diagnostics
                </Button>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mt-6">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-800">Placeholder</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      This is a placeholder for the Firebase Emulator Diagnostic Page. 
                      The full implementation will include comprehensive tools for diagnosing
                      connectivity issues with Firebase emulators.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Emulator Configuration</CardTitle>
            <CardDescription>
              Check your Firebase emulator configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm">
                Ensure your Firebase emulators are running with the following configuration:
              </p>
              <div className="bg-gray-50 p-4 rounded-md font-mono text-sm">
                <pre className="whitespace-pre-wrap">
                  {`{
  "emulators": {
    "auth": {
      "port": 9099,
      "host": "127.0.0.1"
    },
    "firestore": {
      "port": 8080,
      "host": "127.0.0.1"
    },
    "storage": {
      "port": 9199,
      "host": "127.0.0.1"
    },
    "ui": {
      "port": 4000,
      "host": "127.0.0.1"
    }
  }
}`}
                </pre>
              </div>
              
              <p className="text-sm mt-4">
                To start the emulators, run:
              </p>
              <div className="bg-gray-50 p-3 rounded-md font-mono text-sm">
                firebase emulators:start
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
