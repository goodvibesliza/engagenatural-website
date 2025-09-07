import React, { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

// UI Components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Checkbox } from "../../components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";

// Icons
import {
  AlertTriangle,
  Award,
  Calendar,
  ChevronRight,
  FileText,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";

// Activity types for challenges
const activityTypes = [
  { value: "photo", label: "Photo Upload", icon: "📷" },
  { value: "quiz", label: "Quiz", icon: "❓" },
  { value: "social", label: "Social Media Ask", icon: "📱" },
  { value: "video_quiz", label: "Watch Video + Quiz", icon: "🎬" },
  { value: "read_quiz", label: "Read Lesson + Quiz", icon: "📚" },
  { value: "document", label: "Document Upload", icon: "📄" },
  { value: "audio", label: "Audio Recording", icon: "🎙️" },
];

// Challenge Preview Component
const ChallengePreview = ({ challenge }) => {
  if (!challenge || !challenge.title) return (
    <div className="h-full flex items-center justify-center text-gray-400 flex-col p-4">
      <FileText className="h-12 w-12 mb-2" />
      <p className="text-center">Complete the challenge form to see a preview</p>
    </div>
  );
  
  return (
    <div className="bg-gray-50 h-full rounded-md overflow-hidden border">
      {/* App header */}
      <div className="bg-primary text-white p-4">
        <h2 className="font-bold text-lg">Challenge</h2>
      </div>
      
      {/* Challenge header */}
      <div className="p-4">
        <h3 className="font-bold text-lg">{challenge.title || "Challenge Title"}</h3>
        <p className="text-sm text-gray-600 mt-1">{challenge.description || "No description provided"}</p>
        
        {challenge.points > 0 && (
          <div className="mt-2 flex items-center">
            <Award className="h-4 w-4 text-amber-500 mr-1" />
            <span className="text-sm font-medium">{challenge.points} points</span>
          </div>
        )}
        
        {challenge.startDate && (
          <div className="mt-1 flex items-center">
            <Calendar className="h-4 w-4 text-gray-500 mr-1" />
            <span className="text-xs text-gray-500">
              {challenge.startDate} - {challenge.endDate}
            </span>
          </div>
        )}
      </div>
      
      {/* Challenge activities */}
      {challenge.activities && challenge.activities.length > 0 ? (
        <div className="p-4 border-t">
          <h4 className="font-medium mb-2">Activities</h4>
          <div className="space-y-3">
            {challenge.activities.map((activity, index) => (
              <div key={index} className="bg-white p-3 rounded-lg border shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {activity.icon && <span className="mr-2">{activity.icon}</span>}
                    {activity.instructions || `Activity ${index + 1}`}
                  </span>
                  <Badge variant="outline" className="bg-gray-100">
                    {activityTypes.find(t => t.value === activity.type)?.label || "Task"}
                  </Badge>
                </div>
                {activity.specs && (
                  <p className="text-sm text-gray-600 mt-1">{activity.specs}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 border-t text-center text-gray-500">
          <p>No activities added yet</p>
        </div>
      )}
      
      {/* Challenge footer */}
      <div className="p-4 border-t mt-4 bg-white">
        <Button className="w-full">Start Challenge</Button>
      </div>
    </div>
  );
};

// Warning Dialog Component
const WarningDialog = ({ open, onConfirm, onCancel }) => {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center text-amber-600">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Warning: Editing Published Challenge
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p>
            This challenge is already published. Editing it may affect users who are currently participating.
            Are you sure you want to proceed?
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Yes, Update Challenge</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main Challenge Editor Component
const EnhancedChallengeEditor = ({ brandId, challenge, mode = "create", open, onSaved, onCancel }) => {
  const [activeTab, setActiveTab] = useState("basic");
  const [showWarning, setShowWarning] = useState(false);
  
  // Form state
  const [basic, setBasic] = useState({
    title: "",
    description: "",
    communityId: "",
    startDate: "",
    endDate: "",
    points: 0,
    status: "draft",
    reusedContent: false,
  });
  
  const [activities, setActivities] = useState([]);
  
  // Initialize form with challenge data if editing
  useEffect(() => {
    if (challenge) {
      setBasic({
        title: challenge.title || "",
        description: challenge.description || "",
        communityId: challenge.communityId || "",
        startDate: challenge.startDate ? challenge.startDate.toDate?.().toISOString().slice(0, 10) : "",
        endDate: challenge.endDate ? challenge.endDate.toDate?.().toISOString().slice(0, 10) : "",
        points: challenge.points || 0,
        status: challenge.status || "draft",
        reusedContent: challenge.reusedContent || false,
      });
      setActivities(challenge.activities || []);
    }
  }, [challenge]);
  
  // --- Handlers ---
  const handleBasicChange = (name, value) => {
    setBasic((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleCheckboxChange = (name, checked) => {
    setBasic((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };
  
  const handleAddActivity = () => {
    setActivities((prev) => [
      ...prev,
      { type: "", instructions: "", specs: "" },
    ]);
  };
  
  const handleActivityChange = (i, field, value) => {
    setActivities((prev) =>
      prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a))
    );
  };
  
  const handleRemoveActivity = (i) => {
    setActivities((prev) => prev.filter((_, idx) => idx !== i));
  };
  
  const handleSave = async () => {
    // If editing a published challenge, show warning
    if (mode === "edit" && basic.status === "published") {
      setShowWarning(true);
      return;
    }
    await doSave();
  };
  
  const doSave = async () => {
    const data = {
      ...basic,
      activities: activities.map(activity => ({
        ...activity,
        icon: activityTypes.find(t => t.value === activity.type)?.icon || null
      })),
      createdAt: challenge?.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    try {
      if (mode === "edit" && challenge?.id) {
        await updateDoc(doc(db, "brands", brandId, "challenges", challenge.id), data);
      } else {
        await addDoc(collection(db, "brands", brandId, "challenges"), data);
      }
      onSaved();
    } catch (error) {
      console.error("Error saving challenge:", error);
      // Could add error handling UI here
    }
  };
  
  // Get preview data for the challenge
  const previewData = {
    ...basic,
    activities: activities.map(activity => ({
      ...activity,
      icon: activityTypes.find(t => t.value === activity.type)?.icon || null
    }))
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onCancel} className="max-w-5xl">
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>
              {mode === "edit" ? "Edit Challenge" : mode === "duplicate" ? "Duplicate Challenge" : "Create New Challenge"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6 pt-2">
            {/* Form Section - 3 columns on large screens */}
            <div className="lg:col-span-3 space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="activities">Activities</TabsTrigger>
                  <TabsTrigger value="review">Review</TabsTrigger>
                </TabsList>
                
                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={basic.title}
                      onChange={(e) => handleBasicChange("title", e.target.value)}
                      placeholder="Enter challenge title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={basic.description}
                      onChange={(e) => handleBasicChange("description", e.target.value)}
                      placeholder="Describe what this challenge is about"
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="community">Community</Label>
                    <Select 
                      value={basic.communityId} 
                      onValueChange={(value) => handleBasicChange("communityId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select community" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Select community</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="retail1">Retail Community 1</SelectItem>
                        <SelectItem value="retail2">Retail Community 2</SelectItem>
                        <SelectItem value="retail3">Retail Community 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={basic.startDate}
                        onChange={(e) => handleBasicChange("startDate", e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={basic.endDate}
                        onChange={(e) => handleBasicChange("endDate", e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="points">Points</Label>
                    <Input
                      id="points"
                      type="number"
                      value={basic.points}
                      onChange={(e) => handleBasicChange("points", parseInt(e.target.value) || 0)}
                      min={0}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={basic.status} 
                      onValueChange={(value) => handleBasicChange("status", value)}
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
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox 
                      id="reusedContent" 
                      checked={basic.reusedContent}
                      onCheckedChange={(checked) => handleCheckboxChange("reusedContent", checked)}
                    />
                    <Label htmlFor="reusedContent" className="text-sm">
                      Re-use content (yearly subscription required)
                    </Label>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button onClick={() => setActiveTab("activities")}>
                      Next: Activities <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
                
                {/* Activities Tab */}
                <TabsContent value="activities" className="space-y-4 mt-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Challenge Activities</h3>
                    <Button onClick={handleAddActivity} size="sm">
                      <Plus className="h-4 w-4 mr-2" /> Add Activity
                    </Button>
                  </div>
                  
                  {activities.length === 0 ? (
                    <div className="text-center p-12 border rounded-lg bg-gray-50">
                      <p className="text-gray-500">No activities added yet</p>
                      <Button onClick={handleAddActivity} variant="outline" className="mt-4">
                        <Plus className="h-4 w-4 mr-2" /> Add Your First Activity
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity, i) => (
                        <Card key={i} className="relative">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="absolute right-2 top-2 h-8 w-8 text-gray-500 hover:text-red-600"
                            onClick={() => handleRemoveActivity(i)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor={`activity-type-${i}`}>Activity Type</Label>
                                <Select 
                                  value={activity.type} 
                                  onValueChange={(value) => handleActivityChange(i, "type", value)}
                                >
                                  <SelectTrigger id={`activity-type-${i}`}>
                                    <SelectValue placeholder="Select activity type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">Select type</SelectItem>
                                    {activityTypes.map((type) => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.icon} {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`activity-instructions-${i}`}>Instructions</Label>
                                <Input
                                  id={`activity-instructions-${i}`}
                                  value={activity.instructions}
                                  onChange={(e) => handleActivityChange(i, "instructions", e.target.value)}
                                  placeholder="What should the user do?"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`activity-specs-${i}`}>Specifications</Label>
                                <Input
                                  id={`activity-specs-${i}`}
                                  value={activity.specs}
                                  onChange={(e) => handleActivityChange(i, "specs", e.target.value)}
                                  placeholder="File type, size limits, etc."
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  <div className="pt-4 flex justify-between">
                    <Button variant="outline" onClick={() => setActiveTab("basic")}>
                      Back
                    </Button>
                    <Button onClick={() => setActiveTab("review")}>
                      Next: Review <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </TabsContent>
                
                {/* Review Tab */}
                <TabsContent value="review" className="space-y-4 mt-2">
                  <div className="rounded-md border p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Title</h4>
                        <p>{basic.title || "Not set"}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Community</h4>
                        <p>{basic.communityId || "Not set"}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Points</h4>
                        <p>{basic.points}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Status</h4>
                        <Badge variant={basic.status === "published" ? "success" : "secondary"}>
                          {basic.status}
                        </Badge>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Start Date</h4>
                        <p>{basic.startDate || "Not set"}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">End Date</h4>
                        <p>{basic.endDate || "Not set"}</p>
                      </div>
                      
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-medium text-gray-500">Description</h4>
                        <p className="whitespace-pre-wrap">{basic.description || "No description provided"}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Activities ({activities.length})</h4>
                      {activities.length === 0 ? (
                        <p className="text-gray-500">No activities added</p>
                      ) : (
                        <div className="space-y-2">
                          {activities.map((activity, i) => (
                            <div key={i} className="p-3 bg-gray-50 rounded-md">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">
                                  {activityTypes.find(t => t.value === activity.type)?.icon} {" "}
                                  {activityTypes.find(t => t.value === activity.type)?.label || "Unknown type"}
                                </span>
                                <Badge variant="outline">{i + 1}</Badge>
                              </div>
                              <p className="text-sm mt-1">{activity.instructions || "No instructions"}</p>
                              {activity.specs && (
                                <p className="text-xs text-gray-500 mt-1">Specs: {activity.specs}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Validation warnings */}
                  {!basic.title && (
                    <Alert variant="warning" className="bg-amber-50 border-amber-200">
                      <AlertTitle className="text-amber-800">Missing information</AlertTitle>
                      <AlertDescription className="text-amber-700">
                        Please provide a title for your challenge
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="pt-4 flex justify-between">
                    <Button variant="outline" onClick={() => setActiveTab("activities")}>
                      Back
                    </Button>
                    <Button 
                      onClick={handleSave}
                      disabled={!basic.title}
                    >
                      {mode === "edit" ? "Update Challenge" : "Save Challenge"}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            {/* Preview Section - 2 columns on large screens */}
            <div className="lg:col-span-2">
              <div className="sticky top-6">
                <h3 className="text-lg font-medium mb-4">Challenge Preview</h3>
                <div className="h-[500px] overflow-y-auto border rounded-md">
                  <ChallengePreview challenge={previewData} />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Preview shows how the challenge will appear in the mobile app
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Warning Dialog */}
      <WarningDialog
        open={showWarning}
        onConfirm={async () => {
          setShowWarning(false);
          await doSave();
        }}
        onCancel={() => setShowWarning(false)}
      />
    </>
  );
};

export default EnhancedChallengeEditor;
