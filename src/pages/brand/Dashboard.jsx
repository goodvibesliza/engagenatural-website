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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Skeleton } from '../../components/ui/skeleton';

// Import analytics components
import BrandAnalyticsPage from './BrandAnalyticsPage';
import BrandROICalculatorPage from './BrandROICalculatorPage';
import CommunityMetricsChart from '../../components/brand/CommunityMetricsChart';
// Communities manager
import CommunitiesManager from '../../components/brand/communities/CommunitiesManager';
// Shared user dropdown
import UserDropdownMenuUpdated from '../../components/UserDropdownMenu';

// Shared helpers
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
      {String(status || '').replace('_', ' ')}
    </span>
  );
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : (timestamp instanceof Date ? timestamp : new Date(timestamp));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

// Utility to chunk arrays for Firestore 'in' queries
const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size));
  return chunks;
};

// Brand Dashboard Content with KPI-first layout
const BrandDashboardContent = ({ brandId }) => {
  // Data
  const [trainings, setTrainings] = useState([]); // live
  const [sampleRequests, setSampleRequests] = useState([]); // live (7d)
  const [progressStats, setProgressStats] = useState({
    enrollments7d: 0,
    completions7d: 0,
    enrollments30d: 0,
    completions30d: 0,
    topTrainings: []
  });

  // Loading
  const [loading, setLoading] = useState({
    trainings: true,
    sampleRequests: true,
    progressStats: true
  });

  // Date ranges (stable per mount)
  const { sevenDaysAgoTS, thirtyDaysAgoTS } = useMemo(() => {
    const now = new Date();
    const seven = new Date(now);
    seven.setDate(now.getDate() - 7);
    const thirty = new Date(now);
    thirty.setDate(now.getDate() - 30);
    return { sevenDaysAgoTS: Timestamp.fromDate(seven), thirtyDaysAgoTS: Timestamp.fromDate(thirty) };
  }, []);

  // Live trainings for this brand (limit 50)
  useEffect(() => {
    if (!brandId) return;
    const q = query(
      collection(db, 'trainings'),
      where('brandId', '==', brandId),
      where('published', '==', true),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTrainings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading((s) => ({ ...s, trainings: false }));
      },
      () => setLoading((s) => ({ ...s, trainings: false }))
    );
    return () => unsub();
  }, [brandId]);

  // Live sample requests in last 7 days (latest 5)
  useEffect(() => {
    if (!brandId) return;
    const q = query(
      collection(db, 'sample_requests'),
      where('brandId', '==', brandId),
      where('createdAt', '>=', sevenDaysAgoTS),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setSampleRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading((s) => ({ ...s, sampleRequests: false }));
      },
      () => setLoading((s) => ({ ...s, sampleRequests: false }))
    );
    return () => unsub();
  }, [brandId, sevenDaysAgoTS]);

  // Heavy aggregation: training_progress over 30d, derived 7d; batch in chunks of 10
  useEffect(() => {
    if (!brandId) return;
    if (loading.trainings) return; // wait for trainings load
    if (trainings.length === 0) {
      setProgressStats({
        enrollments7d: 0,
        completions7d: 0,
        enrollments30d: 0,
        completions30d: 0,
        topTrainings: []
      });
      setLoading((s) => ({ ...s, progressStats: false }));
      return;
    }

    const run = async () => {
      const ids = trainings.map((t) => t.id);
      const chunks = chunkArray(ids, 10);

      let enrollments7d = 0;
      let completions7d = 0;
      let enrollments30d = 0;
      let completions30d = 0;
      const completionMap = new Map(); // trainingId -> count

      for (const chunk of chunks) {
        const q = query(
          collection(db, 'training_progress'),
          where('trainingId', 'in', chunk),
          where('updatedAt', '>=', thirtyDaysAgoTS)
        );
        const snap = await getDocs(q);
        snap.forEach((doc) => {
          const d = doc.data();
          const status = d.status;
          const tId = d.trainingId;
          const updatedAt = d.updatedAt;

          // 30d totals
          enrollments30d += 1;
          if (status === 'completed') {
            completions30d += 1;
            completionMap.set(tId, (completionMap.get(tId) || 0) + 1);
          }

          // 7d totals (Timestamp-safe)
          const upMs = updatedAt?.toMillis?.() ?? 0;
          const sevenMs = sevenDaysAgoTS.toMillis();
          if (upMs >= sevenMs) {
            enrollments7d += 1;
            if (status === 'completed') completions7d += 1;
          }
        });
      }

      // Build top trainings array
      const topTrainings = Array.from(completionMap.entries())
        .map(([id, count]) => ({
          id,
          title: trainings.find((t) => t.id === id)?.title || 'Unknown Training',
          completions: count
        }))
        .sort((a, b) => b.completions - a.completions)
        .slice(0, 5);

      setProgressStats({
        enrollments7d,
        completions7d,
        enrollments30d,
        completions30d,
        topTrainings
      });
      setLoading((s) => ({ ...s, progressStats: false }));
    };

    run();
  }, [brandId, trainings, thirtyDaysAgoTS, sevenDaysAgoTS, loading.trainings]);

  const sampleRequests7dCount = useMemo(() => sampleRequests.length, [sampleRequests]);

  // Overview content (KPI-first)
  const renderDashboardCards = () => (
    <div className="space-y-6">
      {/* KPI tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Enrollments (7d) */}
        <Card className="p-4">
          <div className="text-sm text-gray-500">Enrollments (7d)</div>
          {loading.progressStats ? (
            <Skeleton className="h-8 w-16 mt-2" />
          ) : (
            <div className="flex items-center mt-2">
              <Users className="h-5 w-5 text-blue-500 mr-2" />
              <div className="text-2xl font-bold">{progressStats.enrollments7d}</div>
            </div>
          )}
        </Card>
        {/* Completions (7d) */}
        <Card className="p-4">
          <div className="text-sm text-gray-500">Completions (7d)</div>
          {loading.progressStats ? (
            <Skeleton className="h-8 w-16 mt-2" />
          ) : (
            <div className="flex items-center mt-2">
              <BookOpen className="h-5 w-5 text-green-600 mr-2" />
              <div className="text-2xl font-bold">{progressStats.completions7d}</div>
            </div>
          )}
        </Card>
        {/* Enrollments (30d) */}
        <Card className="p-4">
          <div className="text-sm text-gray-500">Enrollments (30d)</div>
          {loading.progressStats ? (
            <Skeleton className="h-8 w-16 mt-2" />
          ) : (
            <div className="flex items-center mt-2">
              <Users className="h-5 w-5 text-blue-500 mr-2" />
              <div className="text-2xl font-bold">{progressStats.enrollments30d}</div>
            </div>
          )}
        </Card>
        {/* Completions (30d) */}
        <Card className="p-4">
          <div className="text-sm text-gray-500">Completions (30d)</div>
          {loading.progressStats ? (
            <Skeleton className="h-8 w-16 mt-2" />
          ) : (
            <div className="flex items-center mt-2">
              <BookOpen className="h-5 w-5 text-green-600 mr-2" />
              <div className="text-2xl font-bold">{progressStats.completions30d}</div>
            </div>
          )}
        </Card>
        {/* Sample Requests (7d) */}
        <Card className="p-4">
          <div className="text-sm text-gray-500">Sample Requests (7d)</div>
          {loading.sampleRequests ? (
            <Skeleton className="h-8 w-16 mt-2" />
          ) : (
            <div className="flex items-center mt-2">
              <Package className="h-5 w-5 text-purple-600 mr-2" />
              <div className="text-2xl font-bold">{sampleRequests7dCount}</div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Trainings (30d) */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold">Top Trainings (30d)</h3>
          </div>
          {loading.progressStats ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : progressStats.topTrainings.length === 0 ? (
            <div className="text-center text-gray-500">
              <BarChart2 className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              No completions in the last 30 days
            </div>
          ) : (
            <div className="space-y-4">
              {progressStats.topTrainings.map((t) => (
                <div key={t.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <Link to={`/brand/trainings/${t.id}`} className="text-blue-600 hover:underline truncate max-w-[70%]">{t.title}</Link>
                  <span className="text-sm font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    {t.completions} completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Sample Requests (7d) */}
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Package className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold">Recent Sample Requests (7d)</h3>
          </div>
          {loading.sampleRequests ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          ) : sampleRequests.length === 0 ? (
            <div className="text-center text-gray-500">
              <Package className="h-10 w-10 mx-auto mb-2 text-gray-400" />
              No sample requests in the last 7 days
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sampleRequests.map((req) => (
                    <tr key={req.id}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">{formatDate(req.createdAt)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">{req.quantity || 1}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{renderStatusBadge(req.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Brand Trainings quick list */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <BookOpen className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold">Brand Trainings</h3>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/brand/content">View All</Link>
          </Button>
        </div>
        {loading.trainings ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-72" />
                </div>
                <Skeleton className="h-9 w-20" />
              </div>
            ))}
          </div>
        ) : trainings.length === 0 ? (
          <div className="text-center text-gray-500">
            <BookOpen className="h-10 w-10 mx-auto mb-2 text-gray-400" />
            No trainings found for your brand
          </div>
        ) : (
          <div className="space-y-4">
            {trainings.slice(0, 4).map((t) => (
              <div key={t.id} className="flex items-start justify-between border-b pb-4 last:border-0">
                <div>
                  <h4 className="font-medium text-gray-900">{t.title}</h4>
                  <p className="text-sm text-gray-500 line-clamp-1 mt-1">{t.description || 'No description provided'}</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/brand/trainings/${t.id}`}>
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  // No brandId: render error card (no console)
  if (!brandId) {
    return (
      <div className="p-6">
        <Card className="p-6 bg-red-50 border border-red-200">
          <div className="flex flex-col items-center text-center">
            <Shield className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Brand Dashboard Error</h2>
            <p className="text-red-600 mb-4">No brand ID provided. Please contact support if this issue persists.</p>
            <p className="text-gray-600 mb-6">This could be due to missing permissions or an invalid brand identifier.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Dashboard Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Brand Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Overview of your brand's performance and activities</p>
      </div>

      {/* KPI-first overview */}
      {renderDashboardCards()}
    </div>
  );
};

const EnhancedBrandHome = () => {
  const { brandId: paramBrandId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  // Centralised logout that always redirects to PublicWebsite
  const { logout } = useLogout();
  // Determine active brandId in priority order
  const storedBrandId =
    typeof window !== 'undefined' ? localStorage.getItem('selectedBrandId') : null;
  const brandId = storedBrandId || user?.brandId || paramBrandId || 'demo-brand';
  
  // State for mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // State for active section
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
    setSidebarOpen(false);
  };
  
  // Function to get user initials for avatar
  const getUserInitials = () => {
    if (!userData.name) return 'U';
    return userData.name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Handle logout
  const handleLogout = async () => {
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

  // Sample Requests Section Component (kept as in original)
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
            setError(e.message);
            setLoading(false);
          }
        },
        (err) => {
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
      
      {/* Sidebar */}
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
              <UserDropdownMenuUpdated />
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
