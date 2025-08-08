import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/auth-context";
import { db } from "../../../firebase.old";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { toast } from "sonner";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";
import { Badge } from "../../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Separator } from "../../ui/separator";
import { ScrollArea } from "../../ui/scroll-area";
import { Switch } from "../../ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../ui/alert-dialog";

// Icons
import { Plus, Edit, Trash2, Users, Tag, RefreshCw, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function CommunitiesManager({ brandId }) {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCommunity, setCurrentCommunity] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    topics: [],
    status: "draft",
    memberCount: 0,
    image: "",
    brandId: brandId || ""
  });
  const [topicInput, setTopicInput] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [communityToDelete, setCommunityToDelete] = useState(null);

  // Fetch communities for the brand
  useEffect(() => {
    fetchCommunities();
  }, [brandId]);

  const fetchCommunities = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // If no brandId is provided, use the current user's brandId
      const activeBrandId = brandId || user?.brandId;
      
      if (!activeBrandId) {
        throw new Error("No brand ID available");
      }
      
      const q = query(
        collection(db, "communities"),
        where("brandId", "==", activeBrandId),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const communitiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      
      setCommunities(communitiesData);
    } catch (err) {
      console.error("Error fetching communities:", err);
      setError(err.message);
      toast.error("Failed to load communities");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleStatusChange = (value) => {
    setFormData({
      ...formData,
      status: value
    });
  };

  const handleAddTopic = () => {
    if (topicInput.trim() === "") return;
    
    // Convert to kebab-case and lowercase
    const formattedTopic = topicInput.trim().toLowerCase().replace(/\s+/g, '-');
    
    if (!formData.topics.includes(formattedTopic)) {
      setFormData({
        ...formData,
        topics: [...formData.topics, formattedTopic]
      });
    }
    
    setTopicInput("");
  };

  const handleRemoveTopic = (topicToRemove) => {
    setFormData({
      ...formData,
      topics: formData.topics.filter(topic => topic !== topicToRemove)
    });
  };

  const openCreateDialog = () => {
    setFormData({
      name: "",
      description: "",
      topics: [],
      status: "draft",
      memberCount: 0,
      image: "",
      brandId: brandId || user?.brandId || ""
    });
    setIsEditing(false);
    setDialogOpen(true);
  };

  const openEditDialog = (community) => {
    setCurrentCommunity(community);
    setFormData({
      name: community.name || "",
      description: community.description || "",
      topics: community.topics || [],
      status: community.status || "draft",
      memberCount: community.memberCount || 0,
      image: community.image || "",
      brandId: community.brandId || brandId || user?.brandId || ""
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const openDeleteDialog = (community) => {
    setCommunityToDelete(community);
    setDeleteDialogOpen(true);
  };

  const handleCreateCommunity = async () => {
    if (!formData.name || !formData.description) {
      toast.error("Name and description are required");
      return;
    }

    setLoading(true);
    
    try {
      const newCommunity = {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, "communities"), newCommunity);
      toast.success("Community created successfully");
      setDialogOpen(false);
      fetchCommunities();
    } catch (err) {
      console.error("Error creating community:", err);
      toast.error("Failed to create community");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCommunity = async () => {
    if (!currentCommunity || !formData.name || !formData.description) {
      toast.error("Name and description are required");
      return;
    }

    setLoading(true);
    
    try {
      const communityRef = doc(db, "communities", currentCommunity.id);
      
      const updatedData = {
        ...formData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(communityRef, updatedData);
      toast.success("Community updated successfully");
      setDialogOpen(false);
      fetchCommunities();
    } catch (err) {
      console.error("Error updating community:", err);
      toast.error("Failed to update community");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!communityToDelete) return;
    
    setLoading(true);
    
    try {
      const communityRef = doc(db, "communities", communityToDelete.id);
      await deleteDoc(communityRef);
      toast.success("Community deleted successfully");
      setDeleteDialogOpen(false);
      setCommunityToDelete(null);
      fetchCommunities();
    } catch (err) {
      console.error("Error deleting community:", err);
      toast.error("Failed to delete community");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (loading && communities.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Communities</h2>
          <p className="text-muted-foreground">
            Manage your brand's communities and topics
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCommunities}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Community
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {communities.length === 0 && !loading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              No communities found for this brand.
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Community
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {communities.map((community) => (
            <Card key={community.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{community.name}</CardTitle>
                    <CardDescription>
                      {community.memberCount || 0} members
                    </CardDescription>
                  </div>
                  <Badge
                    variant={community.status === "active" ? "success" : "outline"}
                    className={
                      community.status === "active"
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : ""
                    }
                  >
                    {community.status === "active" ? "Active" : "Draft"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{community.description}</p>
                
                {community.topics && community.topics.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Topics:</p>
                    <div className="flex flex-wrap gap-2">
                      {community.topics.map((topic) => (
                        <Badge key={topic} variant="secondary">
                          <Tag className="h-3 w-3 mr-1" />
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  Created: {formatDate(community.createdAt)}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2 pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(community)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openDeleteDialog(community)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Community Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Community" : "Create New Community"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the details of your community"
                : "Create a new community for your brand"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Community Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter community name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter community description"
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="topics">Topics</Label>
                <div className="flex space-x-2">
                  <Input
                    id="topicInput"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    placeholder="Add topic (press Enter)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTopic();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTopic}>
                    Add
                  </Button>
                </div>
                
                {formData.topics.length > 0 && (
                  <div className="mt-2">
                    <ScrollArea className="h-20 w-full rounded-md border p-2">
                      <div className="flex flex-wrap gap-2">
                        {formData.topics.map((topic) => (
                          <Badge
                            key={topic}
                            variant="secondary"
                            className="flex items-center space-x-1"
                          >
                            <span>{topic}</span>
                            <button
                              type="button"
                              className="ml-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                              onClick={() => handleRemoveTopic(topic)}
                            >
                              <XCircle className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="Enter image URL (optional)"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="memberCount">Initial Member Count</Label>
                  <Input
                    id="memberCount"
                    name="memberCount"
                    type="number"
                    min="0"
                    value={formData.memberCount}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={isEditing ? handleUpdateCommunity : handleCreateCommunity}
              disabled={loading || !formData.name || !formData.description}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Community" : "Create Community"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the community "
              {communityToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCommunity}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
