import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, storage, isLocalhost } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  limit,
  orderBy,
  where
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, listAll } from "firebase/storage";
import { toast } from "sonner";
import { useAuth } from "../contexts/auth-context";
import { useEmulatorRoles } from "../hooks/use-emulator-roles";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Separator } from "../components/ui/separator";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { ScrollArea } from "../components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";

// Icons
import {
  AlertTriangle,
  User,
  Users,
  Database,
  FileUp,
  Trash2,
  Edit,
  Plus,
  RefreshCw,
  LogOut,
  LogIn,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Loader2,
  Book,
  BookOpen,
  FileText,
  Image,
  Video,
  File,
  Info
} from "lucide-react";

// File uploader component
import FileUploader from "../components/brand/content/FileUploader";

export default function EmulatorTestDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const emulatorRoles = useEmulatorRoles();
  
  // UI state
  const [activeTab, setActiveTab] = useState("auth");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Auth state
  const [selectedRole, setSelectedRole] = useState("admin");
  const [brandIdInput, setBrandIdInput] = useState("brand1");
  
  // Firestore state
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState("lessons");
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentData, setDocumentData] = useState({});
  const [newDocumentData, setNewDocumentData] = useState({
    title: "",
    description: "",
    content: "",
    type: "article",
    brandId: "brand1",
    status: "draft"
  });
  
  // Storage state
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Check if emulator is available
  useEffect(() => {
    if (!isLocalhost) {
      setError("Emulator dashboard is only available in local development environment.");
    }
  }, []);
  
  // Handle role changes
  const handleRoleChange = async (role) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      let result = false;
      
      switch (role) {
        case "admin":
          result = await emulatorRoles.setAdminRole();
          break;
        case "brand":
          result = await emulatorRoles.setBrandManagerRole(brandIdInput);
          break;
        case "user":
          result = await emulatorRoles.setRegularUserRole();
          break;
        default:
          throw new Error(`Unknown role: ${role}`);
      }
      
      if (result) {
        setSelectedRole(role);
        setSuccess(`Successfully set role to ${role}`);
        
        // Refresh the page to ensure the new role takes effect
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error("Failed to set role");
      }
    } catch (err) {
      console.error("Error setting role:", err);
      setError(`Error setting role: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle sign in as specific role
  const handleSignInAs = async (role) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      let result = false;
      
      switch (role) {
        case "admin":
          result = await emulatorRoles.signInAsAdmin();
          break;
        case "brand":
          result = await emulatorRoles.signInAsBrandManager(brandIdInput);
          break;
        default:
          throw new Error(`Unknown role: ${role}`);
      }
      
      if (result) {
        setSelectedRole(role);
        setSuccess(`Successfully signed in as ${role}`);
        
        // Refresh the page to ensure the new role takes effect
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error("Failed to sign in");
      }
    } catch (err) {
      console.error("Error signing in:", err);
      setError(`Error signing in: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle reset emulator auth
  const handleResetAuth = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await emulatorRoles.resetEmulatorAuth();
      
      if (result) {
        setSuccess("Successfully reset emulator auth");
        
        // Navigate to login page
        setTimeout(() => {
          navigate("/login");
        }, 1000);
      } else {
        throw new Error("Failed to reset emulator auth");
      }
    } catch (err) {
      console.error("Error resetting auth:", err);
      setError(`Error resetting auth: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch collections
  const fetchCollections = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, we would fetch collections dynamically
      // For this demo, we'll use a predefined list
      setCollections(["lessons", "communities", "brands", "users"]);
    } catch (err) {
      console.error("Error fetching collections:", err);
      setError(`Error fetching collections: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch documents for a collection
  const fetchDocuments = async (collectionName) => {
    setIsLoading(true);
    setError(null);
    setDocuments([]);
    
    try {
      let q;
      
      // Apply filters based on role and collection
      if (user?.role === "brand" && user?.brandId && (collectionName === "lessons" || collectionName === "communities")) {
        q = query(
          collection(db, collectionName),
          where("brandId", "==", user.brandId),
          orderBy("createdAt", "desc"),
          limit(10)
        );
      } else {
        q = query(
          collection(db, collectionName),
          orderBy("createdAt", "desc"),
          limit(10)
        );
      }
      
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setDocuments(docs);
      setSelectedDocument(null);
      setDocumentData({});
    } catch (err) {
      console.error(`Error fetching ${collectionName}:`, err);
      setError(`Error fetching ${collectionName}: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch a single document
  const fetchDocument = async (collectionName, documentId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSelectedDocument(documentId);
        setDocumentData(data);
      } else {
        throw new Error("Document does not exist");
      }
    } catch (err) {
      console.error(`Error fetching document ${documentId}:`, err);
      setError(`Error fetching document: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create a new document
  const createDocument = async (collectionName, data) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Add timestamps and ensure brandId is set if user is a brand manager
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // If user is a brand manager, ensure brandId matches their assigned brand
      if (user?.role === "brand" && user?.brandId) {
        docData.brandId = user.brandId;
      }
      
      const docRef = await addDoc(collection(db, collectionName), docData);
      
      setSuccess(`Successfully created document with ID: ${docRef.id}`);
      setNewDocumentData({
        title: "",
        description: "",
        content: "",
        type: "article",
        brandId: user?.brandId || "brand1",
        status: "draft"
      });
      
      // Refresh the documents list
      fetchDocuments(collectionName);
    } catch (err) {
      console.error(`Error creating ${collectionName}:`, err);
      setError(`Error creating document: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update a document
  const updateDocument = async (collectionName, documentId, data) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const docRef = doc(db, collectionName, documentId);
      
      // Add updated timestamp
      const docData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, docData);
      
      setSuccess(`Successfully updated document with ID: ${documentId}`);
      
      // Refresh the document
      fetchDocument(collectionName, documentId);
    } catch (err) {
      console.error(`Error updating document ${documentId}:`, err);
      setError(`Error updating document: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a document
  const deleteDocument = async (collectionName, documentId) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const docRef = doc(db, collectionName, documentId);
      await deleteDoc(docRef);
      
      setSuccess(`Successfully deleted document with ID: ${documentId}`);
      setSelectedDocument(null);
      setDocumentData({});
      
      // Refresh the documents list
      fetchDocuments(collectionName);
    } catch (err) {
      console.error(`Error deleting document ${documentId}:`, err);
      setError(`Error deleting document: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch files from storage
  const fetchFiles = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get files from the "lessons" folder in storage
      const listRef = ref(storage, "lessons");
      const res = await listAll(listRef);
      
      const filePromises = res.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        return {
          name: itemRef.name,
          fullPath: itemRef.fullPath,
          url
        };
      });
      
      const filesList = await Promise.all(filePromises);
      setFiles(filesList);
    } catch (err) {
      console.error("Error fetching files:", err);
      setError(`Error fetching files: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initialize
  useEffect(() => {
    if (!isLocalhost) return;
    
    fetchCollections();
    
    // Set initial role based on current user
    if (user) {
      if (user.role === "super_admin") {
        setSelectedRole("admin");
      } else if (user.role === "brand_manager") {
        setSelectedRole("brand");
        setBrandIdInput(user.brandId || "brand1");
      } else {
        setSelectedRole("user");
      }
    }
  }, [user]);
  
  // Fetch documents when collection changes
  useEffect(() => {
    if (selectedCollection && isLocalhost) {
      fetchDocuments(selectedCollection);
    }
  }, [selectedCollection]);
  
  // Render loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }
  
  // Render error if not in local environment
  if (!isLocalhost) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Emulator dashboard is only available in local development environment.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Firebase Emulator Test Dashboard</CardTitle>
              <CardDescription>
                Test Firebase emulator features for authentication, database, and storage
              </CardDescription>
            </div>
            <Badge variant={user ? "success" : "destructive"}>
              {user ? "Authenticated" : "Not Authenticated"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* User info */}
          {user && (
            <div className="mb-6 p-4 bg-muted rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5" />
                <h3 className="font-medium">Current User</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Email:</span> {user.email}
                </div>
                <div>
                  <span className="font-medium">UID:</span> {user.uid}
                </div>
                <div>
                  <span className="font-medium">Role:</span>{" "}
                  <Badge variant="outline">{user.role}</Badge>
                </div>
                <div>
                  <span className="font-medium">Brand ID:</span>{" "}
                  {user.brandId || "None"}
                </div>
              </div>
            </div>
          )}
          
          {/* Error and success messages */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" className="mb-4 bg-green-50 text-green-800 border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          {/* Main tabs */}
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="auth" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                <span>Authentication</span>
              </TabsTrigger>
              <TabsTrigger value="firestore" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>Firestore</span>
              </TabsTrigger>
              <TabsTrigger value="storage" className="flex items-center gap-2">
                <FileUp className="h-4 w-4" />
                <span>Storage</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Authentication Tab */}
            <TabsContent value="auth" className="space-y-4 pt-4">
              <div className="grid gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Role Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Set Current User Role</CardTitle>
                        <CardDescription>
                          Change the role of the currently logged in user
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="role">Select Role</Label>
                            <Select
                              value={selectedRole}
                              onValueChange={setSelectedRole}
                              disabled={isLoading}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="brand">Brand Manager</SelectItem>
                                <SelectItem value="user">Regular User</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {selectedRole === "brand" && (
                            <div className="space-y-2">
                              <Label htmlFor="brandId">Brand ID</Label>
                              <Input
                                id="brandId"
                                value={brandIdInput}
                                onChange={(e) => setBrandIdInput(e.target.value)}
                                placeholder="Enter brand ID"
                                disabled={isLoading}
                              />
                            </div>
                          )}
                          
                          <Button
                            onClick={() => handleRoleChange(selectedRole)}
                            disabled={isLoading}
                            className="w-full"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Setting Role...
                              </>
                            ) : (
                              <>Set Role</>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Quick Sign In</CardTitle>
                        <CardDescription>
                          Sign in as a predefined user with specific role
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <Button
                            onClick={() => handleSignInAs("admin")}
                            disabled={isLoading}
                            className="w-full"
                            variant="outline"
                          >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Sign in as Admin
                          </Button>
                          
                          <div className="space-y-2">
                            <Label htmlFor="quickBrandId">Brand ID</Label>
                            <div className="flex space-x-2">
                              <Input
                                id="quickBrandId"
                                value={brandIdInput}
                                onChange={(e) => setBrandIdInput(e.target.value)}
                                placeholder="Enter brand ID"
                                disabled={isLoading}
                              />
                              <Button
                                onClick={() => handleSignInAs("brand")}
                                disabled={isLoading || !brandIdInput}
                                variant="outline"
                              >
                                <Users className="mr-2 h-4 w-4" />
                                Sign in as Brand Manager
                              </Button>
                            </div>
                          </div>
                          
                          <Button
                            onClick={handleResetAuth}
                            disabled={isLoading}
                            className="w-full"
                            variant="destructive"
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out & Reset Auth
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Emulator Info</h3>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Firebase Emulator Suite</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">
                        The Firebase Emulator UI is available at:{" "}
                        <a
                          href="http://localhost:4000"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          http://localhost:4000
                        </a>
                      </p>
                      <p>
                        You can view and manage all emulated services there.
                      </p>
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </TabsContent>
            
            {/* Firestore Tab */}
            <TabsContent value="firestore" className="space-y-4 pt-4">
              <div className="grid gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Firestore Database</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Collections List */}
                    <Card className="md:col-span-1">
                      <CardHeader>
                        <CardTitle className="text-base">Collections</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {collections.map((collection) => (
                            <Button
                              key={collection}
                              variant={selectedCollection === collection ? "default" : "outline"}
                              className="w-full justify-start"
                              onClick={() => setSelectedCollection(collection)}
                            >
                              {collection}
                            </Button>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button
                          onClick={fetchCollections}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh Collections
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    {/* Documents List */}
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            {selectedCollection
                              ? `Documents in "${selectedCollection}"`
                              : "Select a collection"}
                          </CardTitle>
                          {selectedCollection && (
                            <Button
                              size="sm"
                              onClick={() => fetchDocuments(selectedCollection)}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Refresh
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : documents.length > 0 ? (
                          <ScrollArea className="h-[300px]">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>ID</TableHead>
                                  <TableHead>Title/Name</TableHead>
                                  <TableHead>Brand ID</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {documents.map((doc) => (
                                  <TableRow key={doc.id}>
                                    <TableCell className="font-mono text-xs">
                                      {doc.id.substring(0, 8)}...
                                    </TableCell>
                                    <TableCell>
                                      {doc.title || doc.name || "Untitled"}
                                    </TableCell>
                                    <TableCell>{doc.brandId || "N/A"}</TableCell>
                                    <TableCell>
                                      <div className="flex space-x-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => fetchDocument(selectedCollection, doc.id)}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => deleteDocument(selectedCollection, doc.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </ScrollArea>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            {selectedCollection
                              ? "No documents found in this collection"
                              : "Select a collection to view documents"}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                {/* Document Editor */}
                {selectedCollection && (
                  <div className="grid grid-cols-1 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          {selectedDocument
                            ? `Edit Document (${selectedDocument})`
                            : `Create New ${selectedCollection} Document`}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {selectedDocument ? (
                          // Edit existing document
                          <div className="space-y-4">
                            {Object.entries(documentData).map(([key, value]) => {
                              // Skip internal fields and complex objects
                              if (
                                key === "createdAt" ||
                                key === "updatedAt" ||
                                typeof value === "object"
                              ) {
                                return null;
                              }
                              
                              return (
                                <div key={key} className="space-y-2">
                                  <Label htmlFor={`edit-${key}`}>{key}</Label>
                                  {key === "content" || key === "description" ? (
                                    <Textarea
                                      id={`edit-${key}`}
                                      value={value || ""}
                                      onChange={(e) =>
                                        setDocumentData({
                                          ...documentData,
                                          [key]: e.target.value,
                                        })
                                      }
                                      rows={4}
                                    />
                                  ) : key === "status" ? (
                                    <Select
                                      value={value}
                                      onValueChange={(newValue) =>
                                        setDocumentData({
                                          ...documentData,
                                          [key]: newValue,
                                        })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : key === "type" ? (
                                    <Select
                                      value={value}
                                      onValueChange={(newValue) =>
                                        setDocumentData({
                                          ...documentData,
                                          [key]: newValue,
                                        })
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="article">Article</SelectItem>
                                        <SelectItem value="video">Video</SelectItem>
                                        <SelectItem value="audio">Audio</SelectItem>
                                        <SelectItem value="event">Event</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Input
                                      id={`edit-${key}`}
                                      value={value || ""}
                                      onChange={(e) =>
                                        setDocumentData({
                                          ...documentData,
                                          [key]: e.target.value,
                                        })
                                      }
                                    />
                                  )}
                                </div>
                              );
                            })}
                            
                            <div className="flex justify-end space-x-2 pt-4">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedDocument(null);
                                  setDocumentData({});
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() =>
                                  updateDocument(
                                    selectedCollection,
                                    selectedDocument,
                                    documentData
                                  )
                                }
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  <>Update Document</>
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Create new document
                          <div className="space-y-4">
                            {selectedCollection === "lessons" && (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor="new-title">Title</Label>
                                  <Input
                                    id="new-title"
                                    value={newDocumentData.title}
                                    onChange={(e) =>
                                      setNewDocumentData({
                                        ...newDocumentData,
                                        title: e.target.value,
                                      })
                                    }
                                    placeholder="Enter lesson title"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="new-description">Description</Label>
                                  <Textarea
                                    id="new-description"
                                    value={newDocumentData.description}
                                    onChange={(e) =>
                                      setNewDocumentData({
                                        ...newDocumentData,
                                        description: e.target.value,
                                      })
                                    }
                                    placeholder="Enter lesson description"
                                    rows={3}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="new-content">Content</Label>
                                  <Textarea
                                    id="new-content"
                                    value={newDocumentData.content}
                                    onChange={(e) =>
                                      setNewDocumentData({
                                        ...newDocumentData,
                                        content: e.target.value,
                                      })
                                    }
                                    placeholder="Enter lesson content"
                                    rows={5}
                                  />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="new-type">Type</Label>
                                    <Select
                                      value={newDocumentData.type}
                                      onValueChange={(value) =>
                                        setNewDocumentData({
                                          ...newDocumentData,
                                          type: value,
                                        })
                                      }
                                    >
                                      <SelectTrigger id="new-type">
                                        <SelectValue placeholder="Select type" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="article">Article</SelectItem>
                                        <SelectItem value="video">Video</SelectItem>
                                        <SelectItem value="audio">Audio</SelectItem>
                                        <SelectItem value="event">Event</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="new-status">Status</Label>
                                    <Select
                                      value={newDocumentData.status}
                                      onValueChange={(value) =>
                                        setNewDocumentData({
                                          ...newDocumentData,
                                          status: value,
                                        })
                                      }
                                    >
                                      <SelectTrigger id="new-status">
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="new-brandId">Brand ID</Label>
                                  <Input
                                    id="new-brandId"
                                    value={newDocumentData.brandId}
                                    onChange={(e) =>
                                      setNewDocumentData({
                                        ...newDocumentData,
                                        brandId: e.target.value,
                                      })
                                    }
                                    placeholder="Enter brand ID"
                                    disabled={user?.role === "brand"}
                                  />
                                </div>
                              </>
                            )}
                            
                            {selectedCollection === "communities" && (
                              <>
                                <div className="space-y-2">
                                  <Label htmlFor="new-name">Community Name</Label>
                                  <Input
                                    id="new-name"
                                    value={newDocumentData.name || ""}
                                    onChange={(e) =>
                                      setNewDocumentData({
                                        ...newDocumentData,
                                        name: e.target.value,
                                      })
                                    }
                                    placeholder="Enter community name"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="new-description">Description</Label>
                                  <Textarea
                                    id="new-description"
                                    value={newDocumentData.description || ""}
                                    onChange={(e) =>
                                      setNewDocumentData({
                                        ...newDocumentData,
                                        description: e.target.value,
                                      })
                                    }
                                    placeholder="Enter community description"
                                    rows={3}
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="new-topics">Topics (comma separated)</Label>
                                  <Input
                                    id="new-topics"
                                    value={
                                      Array.isArray(newDocumentData.topics)
                                        ? newDocumentData.topics.join(", ")
                                        : ""
                                    }
                                    onChange={(e) =>
                                      setNewDocumentData({
                                        ...newDocumentData,
                                        topics: e.target.value
                                          .split(",")
                                          .map((t) => t.trim())
                                          .filter((t) => t),
                                      })
                                    }
                                    placeholder="wellness, meditation, yoga"
                                  />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="new-status">Status</Label>
                                    <Select
                                      value={newDocumentData.status}
                                      onValueChange={(value) =>
                                        setNewDocumentData({
                                          ...newDocumentData,
                                          status: value,
                                        })
                                      }
                                    >
                                      <SelectTrigger id="new-status">
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="new-memberCount">Member Count</Label>
                                    <Input
                                      id="new-memberCount"
                                      type="number"
                                      value={newDocumentData.memberCount || 0}
                                      onChange={(e) =>
                                        setNewDocumentData({
                                          ...newDocumentData,
                                          memberCount: parseInt(e.target.value, 10) || 0,
                                        })
                                      }
                                      placeholder="0"
                                    />
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="new-brandId">Brand ID</Label>
                                  <Input
                                    id="new-brandId"
                                    value={newDocumentData.brandId}
                                    onChange={(e) =>
                                      setNewDocumentData({
                                        ...newDocumentData,
                                        brandId: e.target.value,
                                      })
                                    }
                                    placeholder="Enter brand ID"
                                    disabled={user?.role === "brand"}
                                  />
                                </div>
                              </>
                            )}
                            
                            <div className="flex justify-end space-x-2 pt-4">
                              <Button
                                onClick={() =>
                                  createDocument(selectedCollection, newDocumentData)
                                }
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                  </>
                                ) : (
                                  <>Create Document</>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Storage Tab */}
            <TabsContent value="storage" className="space-y-4 pt-4">
              <div className="grid gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Storage</h3>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">File Upload</CardTitle>
                      <CardDescription>
                        Upload files to Firebase Storage emulator
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FileUploader
                        onUploadComplete={(fileUrl) => {
                          setSuccess(`File uploaded successfully: ${fileUrl}`);
                          fetchFiles();
                        }}
                        folder="lessons"
                      />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Uploaded Files</CardTitle>
                        <Button size="sm" onClick={fetchFiles}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : files.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {files.map((file) => (
                            <Card key={file.fullPath} className="overflow-hidden">
                              <div className="aspect-video bg-muted flex items-center justify-center">
                                {file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                  <img
                                    src={file.url}
                                    alt={file.name}
                                    className="object-cover w-full h-full"
                                  />
                                ) : file.name.match(/\.(mp4|webm|mov)$/i) ? (
                                  <Video className="h-12 w-12 text-muted-foreground" />
                                ) : file.name.match(/\.(pdf|doc|docx|txt)$/i) ? (
                                  <FileText className="h-12 w-12 text-muted-foreground" />
                                ) : (
                                  <File className="h-12 w-12 text-muted-foreground" />
                                )}
                              </div>
                              <CardContent className="p-3">
                                <p className="font-medium truncate" title={file.name}>
                                  {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {file.fullPath}
                                </p>
                              </CardContent>
                              <CardFooter className="p-3 pt-0">
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline"
                                >
                                  View File
                                </a>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No files found. Upload some files to see them here.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Firebase Emulator Test Dashboard
          </div>
          <div className="text-sm">
            <a
              href="http://localhost:4000"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Open Firebase Emulator UI
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
