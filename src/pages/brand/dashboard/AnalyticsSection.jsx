 import React, { useEffect, useMemo, useState } from 'react';
 import { BookOpen, BarChart2, TrendingUp, Users, Shield } from 'lucide-react';
 import { Card } from '../../../components/ui/card';
 import { Button } from '../../../components/ui/Button';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
 import BrandAnalyticsPage from '../BrandAnalyticsPage';
 import BrandROICalculatorPage from '../BrandROICalculatorPage';
 import CommunityMetricsChart from '../../../components/brand/CommunityMetricsChart';
 import { Link } from 'react-router-dom';
 import {
   collection,
   query,
   where,
   orderBy,
   onSnapshot,
   getDocs,
   getCountFromServer,
   Timestamp,
 } from 'firebase/firestore';
 import { db } from '@/lib/firebase';
 
 // (removed unused renderStatusBadge) 
 
 const formatDate = (timestamp) => {
   if (!timestamp) return 'N/A';
   const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
   return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
 };
 
 export default function AnalyticsSection({ brandId }) {
   const [trainings, setTrainings] = useState([]);
   const [engagement, setEngagement] = useState({ enrolled: 0, completed: 0 });
   const [trainingProgressCounts, setTrainingProgressCounts] = useState({});
   const [followersStats, setFollowersStats] = useState({ total: 0, last7d: 0, last30d: 0, series30d: [] });
   const [topTrainings, setTopTrainings] = useState([]);
   const [loadingTop, setLoadingTop] = useState(true);
  const [loading, setLoading] = useState({ trainings: true, engagement: true });
  const [error, setError] = useState({ trainings: null, engagement: null, brandId: null });
 
   const { now, sevenDaysAgo, thirtyDaysAgo } = useMemo(() => {
     const current = new Date();
     const sevenDaysPrior = new Date();
     sevenDaysPrior.setDate(current.getDate() - 7);
     const thirtyPrior = new Date();
     thirtyPrior.setDate(current.getDate() - 30);
     return { now: current, sevenDaysAgo: sevenDaysPrior, thirtyDaysAgo: thirtyPrior };
   }, []);
 
   useEffect(() => {
     let isMounted = true;
     let unsubscribeTrainings = null;
     let unsubscribeProgress = null;
 
     if (!brandId) {
       console.error('Missing brandId in AnalyticsSection');
      setError((prev) => ({
         ...prev,
         brandId: 'No brand ID provided. Please contact support if this issue persists.',
         trainings: 'Cannot fetch trainings: Brand ID is missing',
         engagement: 'Cannot fetch engagement data: Brand ID is missing',
       }));
      setLoading({ trainings: false, engagement: false });
       return () => {};
     }
 
     setError((prev) => ({ ...prev, brandId: null }));
 
     try {
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
             const trainingsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
             setTrainings(trainingsData);
             setLoading((prev) => ({ ...prev, trainings: false }));
           } catch (err) {
             console.error('Error processing trainings data:', err);
             setError((prev) => ({ ...prev, trainings: `Error processing data: ${err.message}` }));
             setLoading((prev) => ({ ...prev, trainings: false }));
           }
         },
         (err) => {
           if (!isMounted) return;
           console.error('Error fetching trainings:', err);
           setError((prev) => ({ ...prev, trainings: err.message }));
           setLoading((prev) => ({ ...prev, trainings: false }));
         }
       );
     } catch (err) {
       console.error('Error setting up trainings query:', err);
       if (isMounted) {
         setError((prev) => ({ ...prev, trainings: `Error setting up query: ${err.message}` }));
         setLoading((prev) => ({ ...prev, trainings: false }));
       }
     }
 
    // removed unused listeners for sample_requests and announcements
 
     const fetchEngagement = async () => {
       try {
         if (!isMounted) return;
         const trainingsQueryForIds = query(collection(db, 'trainings'), where('brandId', '==', brandId));
         const trainingsSnapshot = await getDocs(trainingsQueryForIds);
         let trainingIds = trainingsSnapshot.docs.map((doc) => doc.id);
         if (trainingIds.length === 0) {
           if (isMounted) setLoading((prev) => ({ ...prev, engagement: false }));
           return;
         }
         if (trainingIds.length > 10) trainingIds = trainingIds.slice(0, 10);
         try {
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
                 const progressData = snapshot.docs.map((doc) => doc.data());
                 const enrolled = progressData.length;
                 const completed = progressData.filter((p) => p.status === 'completed').length;
                 setEngagement({ enrolled, completed });
                 setLoading((prev) => ({ ...prev, engagement: false }));
               } catch (err) {
                 console.error('Error processing engagement data:', err);
                 if (isMounted) {
                   setError((prev) => ({ ...prev, engagement: `Error processing data: ${err.message}` }));
                   setLoading((prev) => ({ ...prev, engagement: false }));
                 }
               }
             },
             (err) => {
               console.error('Error fetching engagement:', err);
               if (isMounted) {
                 setError((prev) => ({ ...prev, engagement: err.message }));
                 setLoading((prev) => ({ ...prev, engagement: false }));
               }
             }
           );
         } catch (err) {
           console.error('Error setting up progress query:', err);
           if (isMounted) {
             setError((prev) => ({ ...prev, engagement: `Error setting up query: ${err.message}` }));
             setLoading((prev) => ({ ...prev, engagement: false }));
           }
         }
       } catch (err) {
         console.error('Error fetching training IDs:', err);
         if (isMounted) {
           setError((prev) => ({ ...prev, engagement: `Error fetching training IDs: ${err.message}` }));
           setLoading((prev) => ({ ...prev, engagement: false }));
         }
       }
     };
 
     fetchEngagement();
 
     return () => {
       isMounted = false;
      if (typeof unsubscribeTrainings === 'function') try { unsubscribeTrainings(); } catch {}
      if (typeof unsubscribeProgress === 'function') try { unsubscribeProgress(); } catch {}
     };
   }, [brandId]);
 
   useEffect(() => {
     if (!brandId) return;
     const q = query(collection(db, 'brand_follows'), where('brandId', '==', brandId));
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
           const diffDays = Math.floor(diffMs / 86_400_000);
           if (diffDays < 30) {
             last30d += 1;
             const idx = 29 - diffDays;
             buckets[idx] += 1;
           }
           if (diffDays < 7) last7d += 1;
         });
         setFollowersStats({ total, last7d, last30d, series30d: buckets });
       },
       (err) => console.error('followers snapshot error:', err)
     );
     return () => unsub();
   }, [brandId, now]);
 
   useEffect(() => {
     if (!brandId) {
       setTrainingProgressCounts({});
       return;
     }
     if (!trainings || trainings.length === 0) {
       setTrainingProgressCounts({});
       return;
     }
     let isMounted = true;
     const trainingIds = trainings.slice(0, 10).map((t) => t.id);
     const q = query(collection(db, 'training_progress'), where('trainingId', 'in', trainingIds));
     const unsubscribe = onSnapshot(
       q,
       (snap) => {
         if (!isMounted) return;
         const map = {};
         snap.forEach((doc) => {
           const d = doc.data();
           const id = d.trainingId;
           if (!map[id]) map[id] = { enrolled: 0, completed: 0 };
           map[id].enrolled += 1;
           if (d.status === 'completed') map[id].completed += 1;
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
         try { unsubscribe(); } catch (err) { console.error('Error unsubscribing training progress listener:', err); }
       }
     };
   }, [trainings, brandId]);

  // Compute Top Trainings (last 30 days)
  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoadingTop(true);
      try {
        if (!brandId || trainings.length === 0) {
          if (active) {
            setTopTrainings([]);
            setLoadingTop(false);
          }
          return;
        }
        const since = Timestamp.fromDate(thirtyDaysAgo);
        const subset = trainings.slice(0, 50);
        const results = await Promise.allSettled(
          subset.map(async (t) => {
            const q = query(
              collection(db, 'training_progress'),
              where('trainingId', '==', t.id),
              where('status', '==', 'completed'),
              where('completedAt', '>=', since)
            );
            const agg = await getCountFromServer(q);
            const count = typeof agg?.data?.().count === 'number' ? agg.data().count : 0;
            return { id: t.id, title: t.title || t.name || 'Untitled training', count };
          })
        );
        if (!active) return;
        const mapped = results.map((r, i) =>
          r.status === 'fulfilled'
            ? r.value
            : { id: subset[i].id, title: subset[i].title || subset[i].name || 'Untitled training', count: 0 }
        );
        setTopTrainings(mapped.sort((a, b) => b.count - a.count).slice(0, 5));
      } catch {
        if (active) setTopTrainings([]);
      } finally {
        if (active) setLoadingTop(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [brandId, trainings, thirtyDaysAgo]);
 
   if (error.brandId) {
     return (
       <div className="p-6">
         <Card className="p-6 bg-red-50 border border-red-200">
           <div className="flex flex-col items-center text-center">
             <Shield className="h-12 w-12 text-red-500 mb-4" />
             <h2 className="text-xl font-semibold text-red-700 mb-2">Brand Dashboard Error</h2>
             <p className="text-red-600 mb-4">{error.brandId}</p>
             <p className="text-gray-600 mb-6">This could be due to missing permissions or an invalid brand identifier.</p>
             <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
           </div>
         </Card>
       </div>
     );
   }
 
   const renderDashboardCards = () => (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
               <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">You don't have any published trainings yet.</p>
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
                       <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{training.description}</p>
                     </div>
                     <Button variant="ghost" size="sm" className="ml-2" asChild>
                       <Link to={`/brand/trainings/${training.id}`}>View</Link>
                     </Button>
                   </div>
                   <div className="flex items-center mt-3 text-sm">
                     <div className="flex items-center text-gray-500 dark:text-gray-400 mr-4">
                       <span className="font-medium text-gray-900 dark:text-gray-100 mr-1">
                         {trainingProgressCounts[training.id]?.enrolled ?? training.metrics?.enrolled ?? 0}
                       </span>
                       Enrolled
                     </div>
                     <div className="flex items-center text-gray-500 dark:text-gray-400">
                       <span className="font-medium text-gray-900 dark:text-gray-100 mr-1">
                         {trainingProgressCounts[training.id]?.completed ?? training.metrics?.completed ?? 0}
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
       <Card className="overflow-hidden">
         <div className="p-6 bg-white dark:bg-gray-800">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center">
               <div className="bg-indigo-100 dark:bg-indigo-900 p-2 rounded-full">
                 <BarChart2 className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
               </div>
               <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Top Trainings (30 days)</h3>
             </div>
           </div>
           {loadingTop ? (
             <div className="space-y-3">
               {Array.from({ length: 5 }).map((_, i) => (
                 <div key={i} className="flex items-center justify-between animate-pulse">
                   <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                   <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                 </div>
               ))}
             </div>
           ) : topTrainings.length === 0 ? (
             <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-6 text-center">
               <BarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
               <h3 className="text-gray-900 dark:text-gray-100 font-medium mb-1">No Training Completions</h3>
               <p className="text-gray-500 dark:text-gray-400 text-sm">There have been no training completions in the last 30 days.</p>
             </div>
           ) : (
             <ul className="space-y-3">
               {topTrainings.map((t) => (
                 <li key={t.id} className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-md px-4 py-2">
                   <span className="truncate pr-2">{t.title}</span>
                   <span className="text-sm font-semibold bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded-full px-2 py-0.5">{t.count}</span>
                 </li>
               ))}
             </ul>
           )}
         </div>
       </Card>
       <Card className="overflow-hidden">
         <div className="p-6 bg-white dark:bg-gray-800">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center">
               <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
                 <Users className="h-5 w-5 text-purple-600 dark:text-purple-300" />
               </div>
               <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Followers (30 days)</h3>
             </div>
           </div>
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
           <div className="flex items-end space-x-0.5 h-20">
             {followersStats.series30d.map((v, i) => {
               const max = Math.max(...followersStats.series30d, 1);
               const heightPct = (v / max) * 100;
               return <div key={i} style={{ height: `${heightPct}%` }} className="flex-1 bg-purple-400/70 dark:bg-purple-300/80 rounded-t"></div>;
             })}
           </div>
         </div>
       </Card>
     </div>
   );
 
   return (
     <div className="p-6">
       <div className="mb-6">
         <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Brand Dashboard</h1>
         <p className="text-gray-500 dark:text-gray-400">Overview of your brand's performance and activities</p>
       </div>
       <Tabs defaultValue="overview" className="w-full">
         <TabsList className="mb-6">
           <TabsTrigger value="overview">Overview</TabsTrigger>
           <TabsTrigger value="analytics">Analytics</TabsTrigger>
           <TabsTrigger value="roi">ROI Calculator</TabsTrigger>
           <TabsTrigger value="community">Community Metrics</TabsTrigger>
         </TabsList>
         <TabsContent value="overview">{renderDashboardCards()}</TabsContent>
         <TabsContent value="analytics">
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
             <BrandAnalyticsPage brandId={brandId} />
           </div>
         </TabsContent>
         <TabsContent value="roi">
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
             <BrandROICalculatorPage brandId={brandId} />
           </div>
         </TabsContent>
         <TabsContent value="community">
           <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
             <CommunityMetricsChart brandId={brandId} />
           </div>
         </TabsContent>
       </Tabs>
     </div>
   );
 }
