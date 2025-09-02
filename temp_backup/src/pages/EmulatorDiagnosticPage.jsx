import React, { useState, useEffect } from "react";
import { 
  runEmulatorDiagnostics, 
  getTroubleshootingRecommendations,
  getEmulatorStatusSummary
} from "../utils/emulatorDiagnostics";
import { isLocalhost } from "../firebase";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";

// Icons
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Info,
  Database,
  Key,
  HardDrive,
  LayoutDashboard,
  Copy,
  Terminal,
  ArrowRight,
  ExternalLink
} from "lucide-react";

export default function EmulatorDiagnosticPage() {
  const [diagnosticResults, setDiagnosticResults] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [statusSummary, setStatusSummary] = useState(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);

  // Check initial emulator status on mount
  useEffect(() => {
    const checkInitialStatus = async () => {
      try {
        const summary = await getEmulatorStatusSummary();
        setStatusSummary(summary);
      } catch (error) {
        console.error("Error checking initial emulator status:", error);
      }
    };

    if (isLocalhost) {
      checkInitialStatus();
    }
  }, []);

  // Run full diagnostics
  const handleRunDiagnostics = async () => {
    if (!isLocalhost) return;
    
    setIsRunningDiagnostics(true);
    try {
      // Run diagnostics
      const results = await runEmulatorDiagnostics();
      setDiagnosticResults(results);
      
      // Generate recommendations based on results
      const recs = getTroubleshootingRecommendations(results);
      setRecommendations(recs);
      
      // Update status summary
      setStatusSummary({
        running: results.summary.allOperational,
        services: {
          auth: results.emulators.auth.operational,
          firestore: results.emulators.firestore.operational,
          storage: results.emulators.storage.operational
        },
        ui: results.emulators.ui.available,
        message: results.summary.allOperational 
          ? "All emulators are operational" 
          : "Some emulators are not operational"
      });
      
      // Switch to results tab
      setActiveTab("results");
    } catch (error) {
      console.error("Error running diagnostics:", error);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  // Copy diagnostics results to clipboard
  const handleCopyResults = () => {
    if (!diagnosticResults) return;
    
    try {
      const resultsText = JSON.stringify(diagnosticResults, null, 2);
      navigator.clipboard.writeText(resultsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying results:", error);
    }
  };

  // Helper to render status badges
  const renderStatusBadge = (isOperational) => {
    if (isOperational === null || isOperational === undefined) {
      return (
        <Badge variant="outline" className="bg-gray-100">
          Unknown
        </Badge>
      );
    }
    
    return isOperational ? (
      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Operational
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
        <XCircle className="h-3 w-3 mr-1" />
        Not Operational
      </Badge>
    );
  };

  // If not in localhost, show warning
  if (!isLocalhost) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Firebase Emulator Diagnostics</CardTitle>
            <CardDescription>
              Troubleshoot Firebase emulator connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="warning" className="bg-yellow-50 text-yellow-800 border-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Not in development environment</AlertTitle>
              <AlertDescription>
                Firebase emulators are only available in local development environment (localhost).
                This page is not functional in production or preview environments.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Firebase Emulator Diagnostics</CardTitle>
              <CardDescription>
                Troubleshoot Firebase emulator connections
              </CardDescription>
            </div>
            <Button
              onClick={handleRunDiagnostics}
              disabled={isRunningDiagnostics}
            >
              {isRunningDiagnostics ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Diagnostics...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Run Diagnostics
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Emulator Status Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Emulator Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-muted/40">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <Key className="h-8 w-8 mb-2 text-amber-500" />
                    <h4 className="font-medium mb-1">Auth</h4>
                    {renderStatusBadge(statusSummary?.services?.auth)}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-muted/40">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <Database className="h-8 w-8 mb-2 text-blue-500" />
                    <h4 className="font-medium mb-1">Firestore</h4>
                    {renderStatusBadge(statusSummary?.services?.firestore)}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-muted/40">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <HardDrive className="h-8 w-8 mb-2 text-purple-500" />
                    <h4 className="font-medium mb-1">Storage</h4>
                    {renderStatusBadge(statusSummary?.services?.storage)}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-muted/40">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <LayoutDashboard className="h-8 w-8 mb-2 text-green-500" />
                    <h4 className="font-medium mb-1">Emulator UI</h4>
                    {renderStatusBadge(statusSummary?.ui)}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Status Message */}
          {statusSummary && (
            <Alert
              variant={statusSummary.running ? "default" : "destructive"}
              className={statusSummary.running 
                ? "bg-green-50 text-green-800 border-green-200 mb-6" 
                : "bg-red-50 text-red-800 border-red-200 mb-6"
              }
            >
              {statusSummary.running ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>
                {statusSummary.running 
                  ? "Emulators are running" 
                  : "Emulator issues detected"
                }
              </AlertTitle>
              <AlertDescription>
                {statusSummary.message}
                {!statusSummary.running && (
                  <div className="mt-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-red-800 border-red-300 hover:bg-red-100"
                      onClick={handleRunDiagnostics}
                    >
                      Run Diagnostics
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Quick Links */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Quick Links</h3>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open("http://127.0.0.1:4000", "_blank")}
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Emulator UI
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open("http://127.0.0.1:9099", "_blank")}
              >
                <Key className="h-4 w-4 mr-2" />
                Auth Emulator
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open("http://127.0.0.1:8080", "_blank")}
              >
                <Database className="h-4 w-4 mr-2" />
                Firestore Emulator
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open("http://127.0.0.1:9199", "_blank")}
              >
                <HardDrive className="h-4 w-4 mr-2" />
                Storage Emulator
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
          
          {/* Tabs for Results and Recommendations */}
          {diagnosticResults && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="results">Detailed Results</TabsTrigger>
              </TabsList>
              
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                {/* Recommendations */}
                {recommendations && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Recommendations</h3>
                    
                    {/* General Recommendations */}
                    {recommendations.general.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">General Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {recommendations.general.map((rec, index) => (
                              <li key={index} className="flex items-start">
                                <ArrowRight className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-primary" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Auth Recommendations */}
                    {recommendations.auth.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Auth Emulator</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {recommendations.auth.map((rec, index) => (
                              <li key={index} className="flex items-start">
                                <ArrowRight className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-amber-500" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Firestore Recommendations */}
                    {recommendations.firestore.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Firestore Emulator</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {recommendations.firestore.map((rec, index) => (
                              <li key={index} className="flex items-start">
                                <ArrowRight className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-blue-500" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Storage Recommendations */}
                    {recommendations.storage.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Storage Emulator</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {recommendations.storage.map((rec, index) => (
                              <li key={index} className="flex items-start">
                                <ArrowRight className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-purple-500" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* UI Recommendations */}
                    {recommendations.ui.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Emulator UI</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {recommendations.ui.map((rec, index) => (
                              <li key={index} className="flex items-start">
                                <ArrowRight className="h-4 w-4 mr-2 mt-1 flex-shrink-0 text-green-500" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
                
                {/* Terminal Commands */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Common Terminal Commands</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Start Emulators</h4>
                        <div className="bg-gray-900 text-gray-100 p-3 rounded-md font-mono text-sm">
                          <div className="flex items-center">
                            <Terminal className="h-4 w-4 mr-2 text-gray-400" />
                            <code>firebase emulators:start</code>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Force Restart Emulators</h4>
                        <div className="bg-gray-900 text-gray-100 p-3 rounded-md font-mono text-sm">
                          <div className="flex items-center">
                            <Terminal className="h-4 w-4 mr-2 text-gray-400" />
                            <code>firebase emulators:start --force</code>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Start With Specific Emulators</h4>
                        <div className="bg-gray-900 text-gray-100 p-3 rounded-md font-mono text-sm">
                          <div className="flex items-center">
                            <Terminal className="h-4 w-4 mr-2 text-gray-400" />
                            <code>firebase emulators:start --only auth,firestore,storage</code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Results Tab */}
              <TabsContent value="results" className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">Diagnostic Results</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyResults}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copied ? "Copied!" : "Copy Results"}
                  </Button>
                </div>
                
                <Card>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px] rounded-md border">
                      <pre className="p-4 text-xs">
                        {JSON.stringify(diagnosticResults, null, 2)}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
                
                {/* Timestamp */}
                <div className="text-xs text-muted-foreground">
                  Diagnostics run at: {diagnosticResults.timestamp}
                </div>
              </TabsContent>
            </Tabs>
          )}
          
          {/* Initial Instructions */}
          {!diagnosticResults && (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4" />
              <AlertTitle>Firebase Emulator Diagnostics</AlertTitle>
              <AlertDescription>
                <p className="mb-2">
                  This page helps troubleshoot Firebase emulator connections for your local development environment.
                </p>
                <p className="mb-2">
                  Click "Run Diagnostics" to check the status of your Firebase emulators and get recommendations for fixing any issues.
                </p>
                <p>
                  Make sure you have started the Firebase emulators with <code className="bg-blue-100 px-1 py-0.5 rounded">firebase emulators:start</code> in your terminal.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="text-xs text-muted-foreground">
            Firebase Emulator Diagnostics
          </div>
          <Button
            variant="link"
            size="sm"
            onClick={() => window.open("https://firebase.google.com/docs/emulator-suite", "_blank")}
          >
            Firebase Emulator Documentation
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
