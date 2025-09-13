import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Menu, X, Bell, Search, Calendar, Download, ChevronDown,
  BarChart2, Users, FileText, TrendingUp, Activity, Settings, 
  HelpCircle, LogOut, User, Building, Shield, Home,
  BookOpen, Package, ExternalLink, Eye
} from 'lucide-react';
import EnhancedBrandDashboard from '../EnhancedBrandDashboard';
import { useAuth } from "../../contexts/auth-context";

// Status badge renderer (moved out of BrandDashboardContent for reuse)
const renderStatusBadge = (status) => {
  let color = "";
  switch (status) {
    case 'pending':
      color = "bg-yellow-100 text-yellow-800";
      break;
    case 'approved':
      color = "bg-blue-100 text-blue-800";
      break;
    case 'shipped':
      color = "bg-green-100 text-green-800";
      break;
    case 'denied':
      color = "bg-red-100 text-red-800";
      break;
    case 'completed':
      color = "bg-green-100 text-green-800";
      break;
    case 'in_progress':
      color = "bg-blue-100 text-blue-800";
      break;
    default:
      color = "bg-gray-100 text-gray-800";
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

// Date formatting helper (moved out of BrandDashboardContent for reuse)
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

// New content management component
import IntegratedContentManager from './ContentManager';
// Consistent logout hook
import { useLogout } from '../../hooks/useLogout';
// Firebase imports
import { 
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase.js';

// UI Components
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

// Import analytics components
import BrandAnalyticsPage from './BrandAnalyticsPage';
import BrandROICalculatorPage from './BrandROICalculatorPage';
import CommunityMetricsChart from '../../components/brand/CommunityMetricsChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
// Communities manager
import CommunitiesManager from '../../components/brand/communities/CommunitiesManager';

// Brand Dashboard Content component
const BrandDashboardContent = ({ brandId }) => {
  const [trainings, setTrainings] = useState([]);
  const [sampleRequests, setSampleRequests] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [engagement, setEngagement] = useState({ enrolled: 0, completed: 0 });
  // map of trainingId -> { enrolled, completed }
  const [trainingProgressCounts, setTrainingProgressCounts] = useState({});
  // Followers KPI stats
  const [followersStats, setFollowersStats] = useState({
    total: 0,
    last7d: 0,
    last30d: 0,
    series30d: [] // array of length 30 with daily counts (oldest→newest)
  });
  const [loading, setLoading] = useState({
    trainings: true,
    sampleRequests: true,
    announcements: true,
    engagement: true
  });
  const [error, setError] = useState({
    trainings: null,
    sampleRequests: null,
    announcements: null,
    engagement: null,
    brandId: null
  });

  // Memoise current date range once per mount to prevent changing
  const { now, sevenDaysAgo, thirtyDaysAgo } = useMemo(() => {
    const current = new Date();
    const sevenDaysPrior = new Date();
    sevenDaysPrior.setDate(current.getDate() - 7);
    const thirtyPrior = new Date();
    thirtyPrior.setDate(current.getDate() - 30);
    return { now: current, sevenDaysAgo: sevenDaysPrior, thirtyDaysAgo: thirtyPrior };
  }, []);

  useEffect(() => {
    // Track if component is still mounted to avoid setting state after unmount
    let isMounted = true;
    
    // Initialize all unsubscribe functions as null
    let unsubscribeTrainings = null;
    let unsubscribeRequests = null;
    let unsubscribeAnnouncements = null;
    let unsubscribeProgress = null;

    // Validate brandId before making any queries
    if (!brandId) {
      console.error("Missing brandId in BrandDashboardContent");
      setError(prev => ({ 
        ...prev, 
        brandId: "No brand ID provided. Please contact support if this issue persists.",
        trainings: "Cannot fetch trainings: Brand ID is missing",
        sampleRequests: "Cannot fetch sample requests: Brand ID is missing",
        announcements: "Cannot fetch announcements: Brand ID is missing",
        engagement: "Cannot fetch engagement data: Brand ID is missing"
      }));
      setLoading({
        trainings: false,
        sampleRequests: false,
        announcements: false,
        engagement: false
      });
      return () => {};
    }

    // Reset any previous brandId error
    setError(prev => ({ ...prev, brandId: null }));

    try {
      // Fetch trainings
      const trainingsQuery = query(
        collection(db, 'trainings'),
        where('brandId', '==', brandId),
        where('published', '==', true),
        orderBy('createdAt', 'desc')
      );

      unsubscribeTrainings = onSnapshot(
        trainingsQuery,
        (snapshot) => {
          if (!isMounted) return;
          try {
            const trainingsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setTrainings(trainingsData);
            setLoading(prev => ({ ...prev, trainings: false }));
          } catch (err) {
            console.error("Error processing trainings data:", err);
            setError(prev => ({ ...prev, trainings: `Error processing data: ${err.message}` }));
            setLoading(prev => ({ ...prev, trainings: false }));
          }
        },
        (err) => {
          if (!isMounted) return;
          console.error("Error fetching trainings:", err);
          setError(prev => ({ ...prev, trainings: err.message }));
          setLoading(prev => ({ ...prev, trainings: false }));
        }
      );
    } catch (err) {
      console.error("Error setting up trainings query:", err);
      if (isMounted) {
        setError(prev => ({ ...prev, trainings: `Error setting up query: ${err.message}` }));
        setLoading(prev => ({ ...prev, trainings: false }));
      }
    }

    try {
      // Fetch sample requests
      const requestsQuery = query(
        collection(db, 'sample_requests'),
        where('brandId', '==', brandId),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      unsubscribeRequests = onSnapshot(
        requestsQuery,
        (snapshot) => {
          if (!isMounted) return;
          try {
            const requestsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setSampleRequests(requestsData);
            setLoading(prev => ({ ...prev, sampleRequests: false }));
          } catch (err) {
            console.error("Error processing sample requests data:", err);
            setError(prev => ({ ...prev, sampleRequests: `Error processing data: ${err.message}` }));
            setLoading(prev => ({ ...prev, sampleRequests: false }));
          }
        },
        (err) => {
          if (!isMounted) return;
          console.error("Error fetching sample requests:", err);
          setError(prev => ({ ...prev, sampleRequests: err.message }));
          setLoading(prev => ({ ...prev, sampleRequests: false }));
        }
      );
    } catch (err) {
      console.error("Error setting up sample requests query:", err);
      if (isMounted) {
        setError(prev => ({ ...prev, sampleRequests: `Error setting up query: ${err.message}` }));
        setLoading(prev => ({ ...prev, sampleRequests: false }));
      }
    }

    try {
      // Fetch announcements
      const announcementsQuery = query(
        collection(db, 'announcements'),
        where('brandId', '==', brandId),
        orderBy('createdAt', 'desc'),
        limit(5)
      );

      unsubscribeAnnouncements = onSnapshot(
        announcementsQuery,
        (snapshot) => {
          if (!isMounted) return;
          try {
            const announcementsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setAnnouncements(announcementsData);
            setLoading(prev => ({ ...prev, announcements: false }));
          } catch (err) {
            console.error("Error processing announcements data:", err);
            setError(prev => ({ ...prev, announcements: `Error processing data: ${err.message}` }));
            setLoading(prev => ({ ...prev, announcements: false }));
          }
        },
        (err) => {
          if (!isMounted) return;
          console.error("Error fetching announcements:", err);
          setError(prev => ({ ...prev, announcements: err.message }));
          setLoading(prev => ({ ...prev, announcements: false }));
        }
      );
    } catch (err) {
      console.error("Error setting up announcements query:", err);
      if (isMounted) {
        setError(prev => ({ ...prev, announcements: `Error setting up query: ${err.message}` }));
        setLoading(prev => ({ ...prev, announcements: false }));
      }
    }

    // Fetch engagement metrics from training_progress
    const fetchEngagement = async () => {
      try {
        if (!isMounted) return;
        
        // Get all training IDs for this brand
        const trainingsQueryForIds = query(
          collection(db, 'trainings'),
          where('brandId', '==', brandId)
        );

        const trainingsSnapshot = await getDocs(trainingsQueryForIds);
        let trainingIds = trainingsSnapshot.docs.map(doc => doc.id);

        // Guard: no trainings
        if (trainingIds.length === 0) {
          if (isMounted) {
            setLoading(prev => ({ ...prev, engagement: false }));
          }
          return;
        }

        // Firestore "in" operator supports max 10 values; trim if longer
        if (trainingIds.length > 10) {
          trainingIds = trainingIds.slice(0, 10);
        }

        try {
          // Query training_progress for these trainings in the last 7 days
          const progressQuery = query(
            collection(db, 'training_progress'),
            where('trainingId', 'in', trainingIds),
            where('updatedAt', '>=', Timestamp.fromDate(sevenDaysAgo))
          );
          
          unsubscribeProgress = onSnapshot(
            progressQuery,
            (snapshot) => {
              if (!isMounted) return;
              try {
                const progressData = snapshot.docs.map(doc => doc.data());
                
                // Calculate metrics
                const enrolled = progressData.length;
                const completed = progressData.filter(p => p.status === 'completed').length;
                
                setEngagement({ enrolled, completed });
                setLoading(prev => ({ ...prev, engagement: false }));
              } catch (err) {
                console.error("Error processing engagement data:", err);
                if (isMounted) {
                  setError(prev => ({ ...prev, engagement: `Error processing data: ${err.message}` }));
                  setLoading(prev => ({ ...prev, engagement: false }));
                }
              }
            },
            (err) => {
              console.error("Error fetching engagement:", err);
              if (isMounted) {
                setError(prev => ({ ...prev, engagement: err.message }));
                setLoading(prev => ({ ...prev, engagement: false }));
              }
            }
          );
        } catch (err) {
          console.error("Error setting up progress query:", err);
          if (isMounted) {
            setError(prev => ({ ...prev, engagement: `Error setting up query: ${err.message}` }));
            setLoading(prev => ({ ...prev, engagement: false }));
          }
        }
      } catch (err) {
        console.error("Error fetching training IDs:", err);
        if (isMounted) {
          setError(prev => ({ ...prev, engagement: `Error fetching training IDs: ${err.message}` }));
          setLoading(prev => ({ ...prev, engagement: false }));
        }
      }
    };

    fetchEngagement();

    // Cleanup subscriptions
    return () => {
      isMounted = false;
      
      // Safely unsubscribe from all listeners
      if (typeof unsubscribeTrainings === 'function') {
        try {
          unsubscribeTrainings();
        } catch (err) {
          console.error("Error unsubscribing from trainings:", err);
        }
      }
      
      if (typeof unsubscribeRequests === 'function') {
        try {
          unsubscribeRequests();
        } catch (err) {
          console.error("Error unsubscribing from requests:", err);
        }
      }
      
      if (typeof unsubscribeAnnouncements === 'function') {
        try {
          unsubscribeAnnouncements();
        } catch (err) {
          console.error("Error unsubscribing from announcements:", err);
        }
      }
      
      if (typeof unsubscribeProgress === 'function') {
        try {
          unsubscribeProgress();
        } catch (err) {
          console.error("Error unsubscribing from progress:", err);
        }
      }
    };
  }, [brandId]);

  /*
   * -----------------------------------------
   *  Followers metrics (live)
   * -----------------------------------------
   */
  useEffect(() => {
    if (!brandId) return;

    const q = query(
      collection(db, 'brand_follows'),
      where('brandId', '==', brandId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const total = snap.size;
        let last7d = 0;
        let last30d = 0;
        const buckets = new Array(30).fill(0);

        snap.forEach((d) => {
          const ts = d.data()?.createdAt;
          const date = ts?.toDate ? ts.toDate() : null;
          if (!date) return;
          const diffMs = now - date;
          const diffDays = Math.floor(diffMs / 86400000);

          if (diffDays < 30) {
            last30d += 1;
            const idx = 29 - diffDays;
            if (idx >= 0 && idx < 30) buckets[idx] += 1;
          }
          if (diffDays < 7) last7d += 1;
        });

        setFollowersStats({ total, last7d, last30d, series30d: buckets });
      },
      (err) => console.error('followers snapshot error:', err)
    );

    return () => unsub();
  }, [brandId, now]);

  /*
   * -----------------------------------------
   *  Training progress counts (enrolled/completed)
   * -----------------------------------------
   */
  useEffect(() => {
    if (!brandId) {
      setTrainingProgressCounts({});
      return;
    }

    // If no trainings yet, clear counts and exit
    if (!trainings || trainings.length === 0) {
      setTrainingProgressCounts({});
      return;
    }

    // Track mounted state
    let isMounted = true;

    // Take first 10 training IDs (Firestore 'in' limit)
    const trainingIds = trainings.slice(0, 10).map((t) => t.id);

    const q = query(
      collection(db, 'training_progress'),
      where('trainingId', 'in', trainingIds)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        if (!isMounted) return;
        const map = {};
        snap.forEach((doc) => {
          const d = doc.data();
          const id = d.trainingId;
          if (!map[id]) {
            map[id] = { enrolled: 0, completed: 0 };
          }
          map[id].enrolled += 1;
          if (d.status === 'completed') {
            map[id].completed += 1;
          }
        });
        setTrainingProgressCounts(map);
      },
      (err) => {
        console.error('Error fetching training progress counts:', err);
      }
    );

    return () => {
      isMounted = false;
      if (typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (err) {
          console.error('Error unsubscribing training progress listener:', err);
        }
      }
    };
  }, [trainings, brandId]);

  // Helper function to render status badge
  const renderStatusBadge = (status) => {
    let color = "";
    switch (status) {
      case 'pending':
        color = "bg-yellow-100 text-yellow-800";
        break;
      case 'approved':
        color = "bg-blue-100 text-blue-800";
        break;
      case 'shipped':
        color = "bg-green-100 text-green-800";
        break;
      case 'denied':
        color = "bg-red-100 text-red-800";
        break;
      case 'completed':
        color = "bg-green-100 text-green-800";
        break;
      case 'in_progress':
        color = "bg-blue-100 text-blue-800";
        break;
      default:
        color = "bg-gray-100 text-gray-800";
    }
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${color}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  // Format date function
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Display global error for brandId if present
  if (error.brandId) {
    return (
      <div className="p-6">
        <Card className="p-6 bg-red-50 border border-red-200">
          <div className="flex flex-col items-center text-center">
            <Shield className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Brand Dashboard Error</h2>
            <p className="text-red-600 mb-4">{error.brandId}</p>
            <p className="text-gray-600 mb-6">
              This could be due to missing permissions or an invalid brand identifier.
              Please ensure you are logged in with the correct account and have brand manager permissions.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Dashboard content with tabs
  const renderDashboardCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* My Trainings Card */}
      <Card className="overflow-hidden">
        <div className="p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">My Trainings</h3>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/brand/trainings">View All</Link>
            </Button>
          </div>

          {loading.trainings ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error.trainings ? (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-md">
              <p>Error loading trainings: {error.trainings}</p>
            </div>
          ) : trainings.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-6 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-gray-900 dark:text-gray-100 font-medium mb-1">No Trainings Found</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                You don't have any published trainings yet.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/brand/trainings/new">Create Training</Link>
              </Button>
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                <p>Need sample data? Use the Demo Data tool in Admin panel.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {trainings.slice(0, 4).map((training) => (
                <div key={training.id} className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{training.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        {training.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {training.status || 'draft'}
                    </Badge>
                  </div>
                  
                  {/* Progress stats if available */}
                  {trainingProgressCounts[training.id] && (
                    <div className="mt-3 flex items-center text-sm">
                      <div className="flex items-center mr-4">
                        <Users className="h-4 w-4 text-gray-500 mr-1" />
                        <span className="text-gray-600">
                          {trainingProgressCounts[training.id].enrolled} enrolled
                        </span>
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 text-gray-500 mr-1" />
                        <span className="text-gray-600">
                          {trainingProgressCounts[training.id].completed} completed
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-3 flex justify-end">
                    <Button variant="outline" size="sm" asChild className="text-xs">
                      <Link to={`/brand/trainings/${training.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
              
              {trainings.length > 4 && (
                <div className="flex justify-center mt-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/brand/trainings">View All {trainings.length} Trainings</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Recent Sample Requests */}
      <Card className="overflow-hidden">
        <div className="p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
                <Package className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Sample Requests</h3>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/brand/samples">View All</Link>
            </Button>
          </div>

          {loading.sampleRequests ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : error.sampleRequests ? (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-md">
              <p>Error loading sample requests: {error.sampleRequests}</p>
            </div>
          ) : sampleRequests.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-6 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-gray-900 dark:text-gray-100 font-medium mb-1">No Sample Requests</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                You don't have any sample requests yet.
              </p>
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                <p>Staff members can request samples from your product catalog.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {sampleRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {request.productName || 'Unnamed Product'}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Requested by: {request.userName || 'Unknown User'}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {formatDate(request.createdAt)}
                      </p>
                    </div>
                    <div>
                      {renderStatusBadge(request.status || 'pending')}
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <Button variant="outline" size="sm" asChild className="text-xs">
                      <Link to={`/brand/samples/${request.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
              
              {sampleRequests.length > 0 && (
                <div className="flex justify-center mt-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/brand/samples">View All Requests</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Engagement Metrics */}
      <Card className="overflow-hidden">
        <div className="p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                <Activity className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Engagement</h3>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/brand/analytics">View Analytics</Link>
            </Button>
          </div>

          {loading.engagement ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : error.engagement ? (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-md">
              <p>Error loading engagement data: {error.engagement}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Training Enrollments (7d)</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                    {engagement.enrolled}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completions (7d)</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
                    {engagement.completed}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Followers</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {followersStats.total}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Last 7d</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {followersStats.last7d}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Last 30d</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {followersStats.last30d}
                    </p>
                  </div>
                </div>
                
                {/* Mini chart for followers trend */}
                {followersStats.series30d.length > 0 && (
                  <div className="h-20 mt-2">
                    <CommunityMetricsChart 
                      data={followersStats.series30d.map((value, i) => ({ 
                        date: new Date(Date.now() - (29 - i) * 86400000),
                        value 
                      }))}
                      showXAxis={false}
                      showTooltip={true}
                      color="#22c55e"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Recent Announcements */}
      <Card className="overflow-hidden">
        <div className="p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-amber-100 dark:bg-amber-900 p-2 rounded-full">
                <Bell className="h-5 w-5 text-amber-600 dark:text-amber-300" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Announcements</h3>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/brand/announcements">View All</Link>
            </Button>
          </div>

          {loading.announcements ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
            </div>
          ) : error.announcements ? (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-md">
              <p>Error loading announcements: {error.announcements}</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-6 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-gray-900 dark:text-gray-100 font-medium mb-1">No Announcements</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                You haven't published any announcements yet.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/brand/announcements/new">Create Announcement</Link>
              </Button>
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                <p>Announcements will be shown to staff members who follow your brand.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="border border-gray-200 dark:border-gray-700 rounded-md p-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {announcement.title || 'Untitled Announcement'}
                    </h4>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDate(announcement.createdAt)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                      {announcement.content || 'No content'}
                    </p>
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <Button variant="outline" size="sm" asChild className="text-xs">
                      <Link to={`/brand/announcements/${announcement.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
              
              {announcements.length > 0 && (
                <div className="flex justify-center mt-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/brand/announcements">View All Announcements</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  // Render the main dashboard content with tabs
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Brand Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your brand content, trainings, and engagement
          </p>
        </div>
        <div className="flex space-x-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" asChild>
            <Link to="/brand/content">
              <FileText className="mr-1 h-4 w-4" /> Content
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/brand/trainings/new">
              <BookOpen className="mr-1 h-4 w-4" /> New Training
            </Link>
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link to="/brand/analytics">
              <BarChart2 className="mr-1 h-4 w-4" /> Analytics
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="roi">ROI Calculator</TabsTrigger>
          <TabsTrigger value="communities">Communities</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          {renderDashboardCards()}
        </TabsContent>
        <TabsContent value="analytics">
          <BrandAnalyticsPage brandId={brandId} embedded={true} />
        </TabsContent>
        <TabsContent value="roi">
          <BrandROICalculatorPage brandId={brandId} embedded={true} />
        </TabsContent>
        <TabsContent value="communities">
          <CommunitiesManager brandId={brandId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Main Dashboard component
export default function Dashboard() {
  const { user, isBrandManager } = useAuth();
  const navigate = useNavigate();
  const { brandId } = useParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout } = useLogout();
  
  // Check if user is authorized
  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    
    if (!isBrandManager && user.role !== 'super_admin') {
      navigate('/');
      return;
    }
  }, [user, isBrandManager, navigate]);

  // If no brandId in URL but user has a brandId, redirect to it
  useEffect(() => {
    if (user?.brandId && !brandId) {
      navigate(`/brand/${user.brandId}/dashboard`);
    }
  }, [user, brandId, navigate]);

  // If no user or still checking auth, show loading
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user doesn't have a brand assigned and isn't super admin, show error
  if (!user.brandId && user.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">No Brand Access</h1>
          <p className="text-gray-600 mb-6">
            Your account doesn't have a brand assigned. Please contact an administrator
            to get access to a brand dashboard.
          </p>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </div>
      </div>
    );
  }

  // If super_admin but no brandId specified, show enhanced dashboard
  if (user.role === 'super_admin' && !brandId) {
    return <EnhancedBrandDashboard />;
  }

  // Otherwise show the brand dashboard for the specified or assigned brand
  const activeBrandId = brandId || user.brandId;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Building className="h-6 w-6 text-brand-primary" />
              <h2 className="ml-2 text-xl font-bold text-gray-900 dark:text-gray-100">Brand Portal</h2>
            </div>
            <button 
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="px-2 space-y-1">
              <Link
                to={`/brand/${activeBrandId}/dashboard`}
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Home className="mr-3 h-5 w-5" />
                Dashboard
              </Link>
              <Link
                to={`/brand/${activeBrandId}/analytics`}
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <BarChart2 className="mr-3 h-5 w-5" />
                Analytics
              </Link>
              <Link
                to={`/brand/${activeBrandId}/content`}
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FileText className="mr-3 h-5 w-5" />
                Content Manager
              </Link>
              <Link
                to={`/brand/${activeBrandId}/trainings`}
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <BookOpen className="mr-3 h-5 w-5" />
                Trainings
              </Link>
              <Link
                to={`/brand/${activeBrandId}/communities`}
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Users className="mr-3 h-5 w-5" />
                Communities
              </Link>
              <Link
                to={`/brand/${activeBrandId}/samples`}
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Package className="mr-3 h-5 w-5" />
                Sample Requests
              </Link>
              <Link
                to={`/brand/${activeBrandId}/announcements`}
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Bell className="mr-3 h-5 w-5" />
                Announcements
              </Link>
              <Link
                to={`/brand/${activeBrandId}/config`}
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </Link>
              
              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
              
              {/* View as Staff link */}
              <Link
                to="/"
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Eye className="mr-3 h-5 w-5" />
                View as Staff
              </Link>
              
              {/* External resources */}
              <a
                href="https://help.engagenatural.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <HelpCircle className="mr-3 h-5 w-5" />
                Help Center
                <ExternalLink className="ml-auto h-4 w-4" />
              </a>
            </nav>
          </div>

          {/* Sidebar footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <Avatar>
                <AvatarImage src={user.profileImage} />
                <AvatarFallback className="bg-brand-primary text-white">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.displayName || user.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-auto text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <div className="bg-white dark:bg-gray-800 shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <button
                  className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-primary lg:hidden"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </button>
              </div>
              <div className="flex items-center">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                  />
                </div>
                <div className="ml-4">
                  <Button variant="outline" size="sm">
                    <Calendar className="mr-2 h-4 w-4" /> Calendar
                  </Button>
                </div>
                <div className="ml-4">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" /> Export
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
          <BrandDashboardContent brandId={activeBrandId} />
        </main>
      </div>
    </div>
  );
}
