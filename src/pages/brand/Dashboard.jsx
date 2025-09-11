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
        // build daily buckets for last 30 days initialised at 0
        const buckets = new Array(30).fill(0);

        snap.forEach((d) => {
          const ts = d.data()?.createdAt;
          const date = ts?.toDate ? ts.toDate() : null;
          if (!date) return;
          const diffMs = now - date;
          const diffDays = Math.floor(diffMs / 86_400_000);

          if (diffDays < 30) {
            last30d += 1;
            // bucket index (0 oldest, 29 today)
            const idx = 29 - diffDays;
            buckets[idx] += 1;
          }
          if (diffDays < 7) last7d += 1;
        });

        setFollowersStats({
          total,
          last7d,
          last30d,
          series30d: buckets
        });
      },
      (err) => console.error('followers snapshot error:', err)
    );

    return () => unsub();
  }, [brandId, now]);

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
                    <Button variant="ghost" size="sm" className="ml-2" asChild>
                      <Link to={`/brand/trainings/${training.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                  <div className="flex items-center mt-3 text-sm">
                    <div className="flex items-center text-gray-500 dark:text-gray-400 mr-4">
                      <span className="font-medium text-gray-900 dark:text-gray-100 mr-1">
                        {trainingProgressCounts[training.id]?.enrolled ??
                          training.metrics?.enrolled ??
                          0}
                      </span>
                      Enrolled
                    </div>
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-900 dark:text-gray-100 mr-1">
                        {trainingProgressCounts[training.id]?.completed ??
                          training.metrics?.completed ??
                          0}
                      </span>
                      Completed
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Engagement Card */}
      <Card className="overflow-hidden">
        <div className="p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Engagement (7 days)</h3>
            </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">New Enrollments</p>
                <h4 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{engagement.enrolled}</h4>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                <h4 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{engagement.completed}</h4>
              </div>
              <div className="col-span-2 mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  {engagement.enrolled === 0 && engagement.completed === 0 ? (
                    <span>No recent engagement data. Try seeding demo data for testing.</span>
                  ) : (
                    <span>Showing data from {formatDate(sevenDaysAgo)} to {formatDate(now)}</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Followers Card */}
      <Card className="overflow-hidden">
        <div className="p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-300" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
                Followers (30&nbsp;days)
              </h3>
            </div>
          </div>

          {/* KPI chips */}
          <div className="flex space-x-4 mb-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-xl font-bold">{followersStats.total}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Last 7 d</p>
              <p className="text-xl font-bold">{followersStats.last7d}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Last 30 d</p>
              <p className="text-xl font-bold">{followersStats.last30d}</p>
            </div>
          </div>

          {/* Simple inline bar chart */}
          <div className="flex items-end space-x-0.5 h-20">
            {followersStats.series30d.map((v, i) => {
              const max = Math.max(...followersStats.series30d, 1);
              const heightPct = (v / max) * 100;
              return (
                <div
                  key={i}
                  style={{ height: `${heightPct}%` }}
                  className="flex-1 bg-purple-400/70 dark:bg-purple-300/80 rounded-t"
                ></div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="p-6">
      {/* Dashboard Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Brand Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Overview of your brand's performance and activities</p>
      </div>

      {/* Tabs for different dashboard views */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="roi">ROI Calculator</TabsTrigger>
          <TabsTrigger value="community">Community Metrics</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab - Shows the original cards */}
        <TabsContent value="overview">
          {renderDashboardCards()}
        </TabsContent>
        
        {/* Analytics Tab - Shows the BrandAnalyticsPage component */}
        <TabsContent value="analytics">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <BrandAnalyticsPage brandId={brandId} />
          </div>
        </TabsContent>
        
        {/* ROI Calculator Tab - Shows the BrandROICalculatorPage component */}
        <TabsContent value="roi">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <BrandROICalculatorPage brandId={brandId} />
          </div>
        </TabsContent>
        
        {/* Community Metrics Tab - Shows the CommunityMetricsChart component */}
        <TabsContent value="community">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <CommunityMetricsChart brandId={brandId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const EnhancedBrandHome = () => {
  const { brandId: paramBrandId } = useParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  // Centralised logout that always redirects to PublicWebsite
  const { logout } = useLogout();
  // Determine active brandId in priority order:
  // 1) brand chosen in sidebar (saved in localStorage)
  // 2) brandId on the authenticated user document
  // 3) brandId from URL params
  // 4) default seeded brand ("demo-brand")
  const storedBrandId =
    typeof window !== 'undefined' ? localStorage.getItem('selectedBrandId') : null;
  const brandId = storedBrandId || user?.brandId || paramBrandId || 'demo-brand';
  
  // State for mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // State for active section (analytics, users, content, etc.)
  const [activeSection, setActiveSection] = useState('analytics');
  
  // State for notifications dropdown
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // State for user dropdown
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsOpen || userDropdownOpen) {
        if (!event.target.closest('.dropdown-container')) {
          setNotificationsOpen(false);
          setUserDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen, userDropdownOpen]);
  
  // Mock user data - use actual user data if available
  const userData = user || {
    name: 'Brand Manager',
    email: 'manager@engagenatural.com',
    avatar: null,
    notifications: 3
  };
  
  // Navigation items with enhanced styling
  const navItems = [
    { id: 'analytics', label: 'Analytics Dashboard', icon: BarChart2, description: 'Key metrics and ROI' },
    { id: 'users', label: 'User Management', icon: Users, description: 'Manage team access' },
    { id: 'content', label: 'Content Management', icon: FileText, description: 'Publish and organize content' },
    { id: 'samples', label: 'Sample Requests', icon: Package, description: 'Manage sample requests' },
    { id: 'communities', label: 'Communities', icon: Users, description: 'Manage communities & posts' },
    { id: 'brand', label: 'Brand Performance', icon: TrendingUp, description: 'Track engagement metrics' },
    { id: 'activity', label: 'Activity Feed', icon: Activity, description: 'Recent updates and events' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'Configure brand preferences' },
    { id: 'help', label: 'Help & Support', icon: HelpCircle, description: 'Documentation and resources' }
  ];
  
  // Function to handle section change
  const handleSectionChange = (section) => {
    setActiveSection(section);
    setSidebarOpen(false); // Close mobile sidebar when navigating
  };
  
  // Function to get user initials for avatar
  const getUserInitials = () => {
    if (!userData.name) return 'U';
    return userData.name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Handle logout
  const handleLogout = async () => {
    // use standardised logout flow
    logout();
  };
  
  // Mock notifications
  const notifications = [
    {
      id: 1,
      title: 'New challenge completed',
      description: 'User John D. completed the Eco-Shopping challenge',
      time: '10 minutes ago',
      read: false
    },
    {
      id: 2,
      title: 'ROI milestone reached',
      description: 'Your brand has reached 250% ROI growth',
      time: '2 hours ago',
      read: false
    },
    {
      id: 3,
      title: 'New user registration spike',
      description: '25 new users registered in the last hour',
      time: '5 hours ago',
      read: true
    }
  ];

  // Sample Requests Section Component
  const SampleRequestsSection = ({ brandId }) => {
    const [sampleRequests, setSampleRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      if (!brandId) return;
      const q = query(
        collection(db, 'sample_requests'),
        where('brandId', '==', brandId),
        orderBy('createdAt', 'desc')
      );
  
      const unsub = onSnapshot(
        q,
        (snap) => {
          try {
            setSampleRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setLoading(false);
          } catch (e) {
            console.error(e);
            setError(e.message);
            setLoading(false);
          }
        },
        (err) => {
          console.error(err);
          setError(err.message);
          setLoading(false);
        }
      );
      return () => unsub();
    }, [brandId]);
  
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Sample Requests
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Review and manage all sample requests for your brand
          </p>
        </div>
  
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-6 rounded-md">
            <p>Error loading sample requests: {error}</p>
          </div>
        ) : sampleRequests.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-6 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-gray-900 dark:text-gray-100 font-medium mb-1">
              No Sample Requests
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              You don't have any sample requests yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sampleRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {req.quantity}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(req.createdAt)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {renderStatusBadge(req.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar (always visible on desktop & larger screens) */}
      <div className="lg:w-72 flex-shrink-0">
        <div className="h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center text-white font-bold text-lg">
              E
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-800 dark:text-gray-200">EngageNatural</span>
          </div>
          
          {/* Brand selector */}
          <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <Building className="h-4 w-4 text-primary" />
                </div>
                <div className="ml-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {brandId}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Brand Manager
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <div className="mb-2 px-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Main
              </h3>
            </div>
            {navItems.map((item) => (
              <button
                key={item.id}
                className={`flex items-center w-full px-4 py-2.5 text-sm rounded-md mb-1 transition-colors ${
                  activeSection === item.id 
                    ? 'text-primary-foreground bg-primary font-medium' 
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleSectionChange(item.id)}
              >
                <item.icon className={`h-5 w-5 mr-3 ${activeSection === item.id ? 'text-primary-foreground' : 'text-gray-500 dark:text-gray-400'}`} />
                <div className="flex flex-col items-start">
                  <span>{item.label}</span>
                  {activeSection === item.id && (
                    <span className="text-xs opacity-80">{item.description}</span>
                  )}
                </div>
              </button>
            ))}
            
            <Separator className="my-4" />
            
            <div className="mb-2 px-3">
              <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Account
              </h3>
            </div>
            <button
              className="flex items-center w-full px-4 py-2.5 text-sm rounded-md mb-1 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
              <span>Sign Out</span>
            </button>
          </nav>
          
          {/* User profile section */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Avatar className="h-10 w-10 border border-primary/20">
                <AvatarImage src={userData.avatar} alt={userData.name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{userData.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{userData.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-white dark:bg-gray-800 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:hidden shadow-xl`}
      >
        {/* Mobile sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center text-white font-bold text-lg">
              E
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-800 dark:text-gray-200">EngageNatural</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Mobile brand selector */}
        <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                <Building className="h-4 w-4 text-primary" />
              </div>
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {brandId}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Brand Manager
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Mobile navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="mb-2 px-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Main
            </h3>
          </div>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`flex items-center w-full px-4 py-2.5 text-sm rounded-md mb-1 transition-colors ${
                activeSection === item.id 
                  ? 'text-primary-foreground bg-primary font-medium' 
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleSectionChange(item.id)}
            >
              <item.icon className={`h-5 w-5 mr-3 ${activeSection === item.id ? 'text-primary-foreground' : 'text-gray-500 dark:text-gray-400'}`} />
              <div className="flex flex-col items-start">
                <span>{item.label}</span>
                {activeSection === item.id && (
                  <span className="text-xs opacity-80">{item.description}</span>
                )}
              </div>
            </button>
          ))}
          
          <Separator className="my-4" />
          
          <div className="mb-2 px-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Account
            </h3>
          </div>
          <button
            className="flex items-center w-full px-4 py-2.5 text-sm rounded-md mb-1 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3 text-gray-500 dark:text-gray-400" />
            <span>Sign Out</span>
          </button>
        </nav>
        
        {/* Mobile user profile section */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 border border-primary/20">
              <AvatarImage src={userData.avatar} alt={userData.name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{userData.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{userData.email}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Left section: Mobile menu button and breadcrumbs */}
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 lg:hidden mr-3"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Breadcrumbs */}
            <div className="hidden md:flex items-center text-sm">
              <Link to="/" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                Home
              </Link>
              <span className="mx-2 text-gray-400 dark:text-gray-500">/</span>
              <Link to={`/brand/${brandId}`} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                Brands
              </Link>
              <span className="mx-2 text-gray-400 dark:text-gray-500">/</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">
                {navItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
              </span>
            </div>
            
            <div className="md:hidden text-lg font-semibold text-gray-900 dark:text-gray-100">
              {navItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
            </div>
          </div>
          
          {/* Right section: Actions and user profile */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 w-64 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:text-gray-200 text-sm"
              />
            </div>
            
            {/* Export button */}
            <Button variant="outline" size="sm" className="hidden md:flex items-center space-x-1">
              <Download className="h-4 w-4 mr-1" />
              <span>Export</span>
            </Button>
            
            {/* Date range selector */}
            <Button variant="outline" size="sm" className="hidden md:flex items-center space-x-1">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Last 30 Days</span>
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
            
            {/* Notifications dropdown */}
            <div className="relative dropdown-container">
              <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative h-9 w-9 rounded-full p-0">
                    <Bell className="h-5 w-5" />
                    {userData.notifications > 0 && (
                      <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white dark:ring-gray-800"></span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">Notifications</h3>
                      <Badge variant="outline" className="text-xs">
                        {notifications.filter(n => !n.read).length} new
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.map(notification => (
                    <DropdownMenuItem key={notification.id} className="p-0 focus:bg-transparent">
                      <div className={`w-full p-3 border-l-2 ${notification.read ? 'border-transparent' : 'border-primary'} hover:bg-muted/50`}>
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <span className="text-xs text-muted-foreground">{notification.time}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{notification.description}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center text-center text-sm text-primary">
                    View all notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* User profile dropdown */}
            <div className="relative dropdown-container">
              <DropdownMenu open={userDropdownOpen} onOpenChange={setUserDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 flex items-center space-x-2 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userData.avatar} alt={userData.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline-block text-sm">{userData.name}</span>
                    <ChevronDown className="hidden md:block h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userData.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{userData.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Building className="mr-2 h-4 w-4" />
                    <span>Brand Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Account Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 focus:text-red-600" onSelect={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {/* Render the appropriate section based on activeSection */}
          {activeSection === 'analytics' && <BrandDashboardContent brandId={brandId} />}
          {activeSection === 'users' && (
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">User Management</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage team members and their access permissions</p>
              </div>
              <Card className="p-6">
                <p>User management content will be displayed here.</p>
              </Card>
            </div>
          )}
          {activeSection === 'content' && (
            /* Full-width workspace for the content manager */
            <div className="w-full p-0 md:p-6">
              {/* Render the integrated content-management system */}
              <IntegratedContentManager brandId={brandId} />
            </div>
          )}
          {activeSection === 'samples' && (
            <div className="w-full p-6">
              <SampleRequestsSection brandId={brandId} />
            </div>
          )}
          {activeSection === 'communities' && (
            <div className="w-full p-0 md:p-6">
              <CommunitiesManager brandId={brandId} />
            </div>
          )}
          {activeSection === 'brand' && (
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Brand Performance</h1>
                <p className="text-gray-500 dark:text-gray-400">Track your brand's performance and engagement metrics</p>
              </div>
              <Card className="p-6">
                <p>Brand performance metrics will be displayed here.</p>
              </Card>
            </div>
          )}
          {activeSection === 'activity' && (
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Activity Feed</h1>
                <p className="text-gray-500 dark:text-gray-400">Recent activity and events from your brand</p>
              </div>
              <Card className="p-6">
                <p>Activity feed will be displayed here.</p>
              </Card>
            </div>
          )}
          {activeSection === 'settings' && (
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Settings</h1>
                <p className="text-gray-500 dark:text-gray-400">Configure your brand settings and preferences</p>
              </div>
              <Card className="p-6 space-y-4">
                <p>Settings options will be displayed here.</p>
                {/* Link to Brand Style Guide */}
                <Button
                  asChild
                  variant="outline"
                >
                  <Link to={`/brand-dashboard/${brandId}/style-guide`}>
                    View Brand Style Guide
                  </Link>
                </Button>
              </Card>
            </div>
          )}
          {activeSection === 'help' && (
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Help & Support</h1>
                <p className="text-gray-500 dark:text-gray-400">Resources and documentation to help you succeed</p>
              </div>
              <Card className="p-6">
                <p>Help and support resources will be displayed here.</p>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EnhancedBrandHome;
