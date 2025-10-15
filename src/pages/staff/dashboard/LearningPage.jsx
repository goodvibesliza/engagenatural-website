import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/auth-context';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import TopMenuBarDesktop from '@/components/community/desktop/TopMenuBarDesktop.jsx';
import DesktopLinkedInShell from '@/layouts/DesktopLinkedInShell.jsx';
// Using a custom left-rail discover UI for this page
import { track } from '@/lib/analytics';

// Training card component for reuse across sections
const TrainingCard = ({
  training,
  progress,
  onStart,
  onComplete,
  isPending,
  onOpen,
}) => {
  const status = progress?.status || null;
  const isCompleted = status === 'completed';
  const isInProgress = status === 'in_progress';
  
  // Determine button text based on status
  const buttonText = isCompleted 
    ? 'Completed' 
    : (isInProgress ? 'Resume' : 'Start');
  
  // Format date if available
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };
  
  const completedDate = progress?.completedAt ? formatDate(progress.completedAt) : '';
  const startedDate = progress?.startedAt ? formatDate(progress.startedAt) : '';
  
  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full cursor-pointer"
      onClick={onOpen}
    >
      <div>
        <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">{training.title || 'Untitled Training'}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{training.description || 'No description available'}</p>
        
        {/* Tags */}
        {training.modules && training.modules.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {training.modules.map((tag, idx) => (
              <span 
                key={idx} 
                className="inline-block bg-gray-100 text-xs text-gray-600 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center mt-4">
        <div className="text-xs text-gray-500">
          {isCompleted && completedDate && `Completed: ${completedDate}`}
          {isInProgress && startedDate && `Started: ${startedDate}`}
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isCompleted) {
              onComplete();
            } else if (isInProgress) {
              onOpen();
            } else {
              onStart();
              onOpen();
            }
          }}
          disabled={isPending || isCompleted}
          className={`px-3 py-1 text-sm rounded font-medium ${
            isCompleted
              ? 'bg-green-100 text-green-800 cursor-default'
              : isPending
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-brand-primary text-white hover:bg-brand-primary/90'
          }`}
        >
          {isPending ? 'Processing...' : buttonText}
        </button>
      </div>
    </div>
  );
};

// Skeleton loader for training cards
const TrainingCardSkeleton = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col justify-between h-full animate-pulse">
    <div>
      <div className="h-5 w-3/4 bg-gray-200 rounded mb-2"></div>
      <div className="h-4 w-full bg-gray-200 rounded mb-1"></div>
      <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
      
      <div className="flex flex-wrap gap-1 mt-3">
        <div className="h-4 w-16 bg-gray-200 rounded"></div>
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
      </div>
    </div>
    
    <div className="flex justify-between items-center mt-4">
      <div className="h-3 w-1/4 bg-gray-200 rounded"></div>
      <div className="h-7 w-16 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export default function LearningPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // page_view analytics when desktop shell is active
  useEffect(() => {
    if (import.meta.env.VITE_EN_DESKTOP_FEED_LAYOUT === 'linkedin' && isDesktop) {
      try { track('page_view', { page: 'learning_desktop', surface: 'community_desktop' }); } catch (err) { console.debug?.('track page_view failed (learning_desktop)', err); }
    }
  }, [isDesktop]);
  
  // States for data
  const [trainings, setTrainings] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loadingTrainings, setLoadingTrainings] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(true);
  
  // States for filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState(new Set());
  
  // Track pending operations
  const [pendingTrainingIds, setPendingTrainingIds] = useState(new Set());
  
  // Refs for cleanup
  const unsubscribeRefs = useRef({});
  
  const flag = import.meta.env.VITE_EN_DESKTOP_FEED_LAYOUT;
  const rightRail = useMemo(() => (
    <>
      <div className="en-cd-right-title">Right Rail</div>
      <div className="en-cd-right-placeholder">(reserved)</div>
    </>
  ), []);

  // If not staff, show friendly message
  if (user && user.role !== 'staff') {
    const CenterContent = () => (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <span role="img" aria-label="lock" className="text-4xl mb-4">🔒</span>
        <p className="text-gray-600 max-w-md">
          This learning dashboard is available exclusively to staff members.
          If you believe you should have access, please contact support.
        </p>
      </div>
    );
    if (flag === 'linkedin' && isDesktop) {
      return (
        <DesktopLinkedInShell
          topBar={<TopMenuBarDesktop />}
          pageTitle={"Learning"}
          leftSidebar={<LeftSidebarSearch eventContext="learning_desktop" />}
          center={<CenterContent />}
          rightRail={rightRail}
        />
      );
    }
    return <CenterContent />;
  }
  
  // Load trainings and progress
  useEffect(() => {
    if (!user?.uid) return;
    
    // Clean up previous subscriptions
    Object.values(unsubscribeRefs.current).forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
    
    // Load published trainings
    const trainingsQuery = query(
      collection(db, 'trainings'),
      where('published', '==', true),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    setLoadingTrainings(true);
    unsubscribeRefs.current.trainings = onSnapshot(
      trainingsQuery,
      (snapshot) => {
        const trainingsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTrainings(trainingsData);
        setLoadingTrainings(false);
      },
      (error) => {
        // Silent error handling
        setTrainings([]);
        setLoadingTrainings(false);
      }
    );
    
    // Load user's training progress
    const progressQuery = query(
      collection(db, 'training_progress'),
      where('userId', '==', user.uid)
    );
    
    setLoadingProgress(true);
    unsubscribeRefs.current.progress = onSnapshot(
      progressQuery,
      (snapshot) => {
        const progressData = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.trainingId) {
            progressData[data.trainingId] = {
              id: doc.id,
              ...data
            };
          }
        });
        setProgressMap(progressData);
        setLoadingProgress(false);
      },
      (error) => {
        // Silent error handling
        setProgressMap({});
        setLoadingProgress(false);
      }
    );
    
    return () => {
      Object.values(unsubscribeRefs.current).forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, [user]);
  
  // Extract all unique tags from trainings
  const allTags = useMemo(() => {
    const tagSet = new Set();
    trainings.forEach(training => {
      if (Array.isArray(training.modules)) {
        training.modules.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [trainings]);
  
  // Filter trainings based on search and tags
  const filteredTrainings = useMemo(() => {
    return trainings.filter(training => {
      // Search by title
      const matchesSearch = !searchQuery || 
        (training.title && training.title.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Filter by selected tags (if any)
      const matchesTags = selectedTags.size === 0 || 
        (Array.isArray(training.modules) && 
         training.modules.some(tag => selectedTags.has(tag)));
      
      return matchesSearch && matchesTags;
    });
  }, [trainings, searchQuery, selectedTags]);
  
  // Split trainings into continue and completed
  const continueTrainings = useMemo(() => {
    const result = [];
    
    // Add trainings with progress that are not completed
    Object.entries(progressMap).forEach(([trainingId, progress]) => {
      if (progress.status === 'in_progress' || progress.status === 'not_started') {
        const training = trainings.find(t => t.id === trainingId);
        if (training) {
          result.push({
            ...training,
            progress
          });
        }
      }
    });
    
    return result;
  }, [trainings, progressMap]);
  
  // Get completed trainings
  const completedTrainings = useMemo(() => {
    const result = [];
    
    // Add completed trainings
    Object.entries(progressMap).forEach(([trainingId, progress]) => {
      if (progress.status === 'completed') {
        const training = trainings.find(t => t.id === trainingId);
        if (training) {
          result.push({
            ...training,
            progress
          });
        }
      }
    });
    
    // Sort by completedAt (newest first)
    return result.sort((a, b) => {
      const dateA = a.progress?.completedAt?.toMillis?.() || 0;
      const dateB = b.progress?.completedAt?.toMillis?.() || 0;
      return dateB - dateA;
    });
  }, [trainings, progressMap]);
  
  // Toggle tag selection
  const toggleTag = (tag) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  };
  
  // Start or resume a training
  const handleStartTraining = async (training) => {
    if (!user?.uid || pendingTrainingIds.has(training.id)) return;
    
    // Add to pending set
    setPendingTrainingIds(prev => {
      const newSet = new Set(prev);
      newSet.add(training.id);
      return newSet;
    });
    
    try {
      const progressId = `${user.uid}_${training.id}`;
      const progressRef = doc(db, 'training_progress', progressId);
      
      // Get current doc to check if startedAt exists
      const currentDoc = await getDoc(progressRef);
      const currentData = currentDoc.exists() ? currentDoc.data() : null;
      
      // Prepare update data
      const updateData = {
        userId: user.uid,
        trainingId: training.id,
        status: 'in_progress',
        updatedAt: serverTimestamp(),
        demoSeed: false
      };
      
      // Only set startedAt if it doesn't exist
      if (!currentData?.startedAt) {
        updateData.startedAt = serverTimestamp();
      }
      
      // Update document
      await setDoc(progressRef, updateData, { merge: true });
      
      // Optimistic update (handled by onSnapshot)
    } catch (error) {
      // Silent error handling
    } finally {
      // Remove from pending set
      setPendingTrainingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(training.id);
        return newSet;
      });
    }
  };
  
  // Mark training as complete
  const handleCompleteTraining = async (training) => {
    if (!user?.uid || pendingTrainingIds.has(training.id)) return;
    
    // Add to pending set
    setPendingTrainingIds(prev => {
      const newSet = new Set(prev);
      newSet.add(training.id);
      return newSet;
    });
    
    try {
      const progressId = `${user.uid}_${training.id}`;
      const progressRef = doc(db, 'training_progress', progressId);
      
      // Update document
      await setDoc(progressRef, {
        userId: user.uid,
        trainingId: training.id,
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Optimistic update (handled by onSnapshot)
    } catch (error) {
      // Silent error handling
    } finally {
      // Remove from pending set
      setPendingTrainingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(training.id);
        return newSet;
      });
    }
  };
  
  // Loading state
  const isLoading = loadingTrainings || loadingProgress;
  
  const CenterContent = ({ showDiscover }) => (
    <div className="space-y-8" data-testid="learning-center">

      {/* Continue Learning Section */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <span role="img" aria-label="book">📚</span>
          <h2 className="text-xl font-semibold text-gray-900">Continue Learning</h2>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {isLoading ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => <TrainingCardSkeleton key={i} />)}
            </div>
          ) : continueTrainings.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {continueTrainings.map(training => (
                <TrainingCard
                  key={training.id}
                  training={training}
                  progress={training.progress}
                  onStart={() => handleStartTraining(training)}
                  onComplete={() => handleCompleteTraining(training)}
                  isPending={pendingTrainingIds.has(training.id)}
                  onOpen={() => navigate(`/staff/trainings/${training.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No trainings in progress</p>
              <p className="text-sm mt-1">Start a training from the Discover section below</p>
            </div>
          )}
        </div>
      </section>

      {/* Completed Section */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2">
          <span role="img" aria-label="check">✅</span>
          <h2 className="text-xl font-semibold text-gray-900">Completed</h2>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {isLoading ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2].map(i => <TrainingCardSkeleton key={i} />)}
            </div>
          ) : completedTrainings.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {completedTrainings.map(training => (
                <TrainingCard
                  key={training.id}
                  training={training}
                  progress={training.progress}
                  onStart={() => handleStartTraining(training)}
                  onComplete={() => handleCompleteTraining(training)}
                  isPending={pendingTrainingIds.has(training.id)}
                  onOpen={() => navigate(`/staff/trainings/${training.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No completed trainings yet</p>
              <p className="text-sm mt-1">Complete trainings to see them here</p>
            </div>
          )}
        </div>
      </section>

      {/* Discover results in center (render only when requested) */}
      {showDiscover && (
        <section className="space-y-4">
          <div className="flex items-center space-x-2">
            <span role="img" aria-label="sparkle">✨</span>
            <h2 className="text-xl font-semibold text-gray-900">Discover</h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {isLoading ? (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4].map(i => <TrainingCardSkeleton key={i} />)}
              </div>
            ) : filteredTrainings.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredTrainings.map(training => {
                  const progress = progressMap[training.id];
                  return (
                    <TrainingCard
                      key={training.id}
                      training={training}
                      progress={progress}
                      onStart={() => handleStartTraining(training)}
                      onComplete={() => handleCompleteTraining(training)}
                      isPending={pendingTrainingIds.has(training.id)}
                      onOpen={() => navigate(`/staff/trainings/${training.id}`)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No trainings match your search</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );

  if (flag === 'linkedin' && isDesktop) {
    const LeftDiscover = (
      <div className="space-y-3" data-testid="learning-left-discover">
        <div className="text-xs uppercase text-gray-500">Discover</div>
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search trainings..."
            className="w-full h-10 pl-8 pr-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
            <span role="img" aria-label="search" className="text-gray-400">🔍</span>
          </div>
        </div>
        {/* Keyword chips */}
        <div className="flex flex-wrap gap-2">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-2.5 py-1 text-[11px] rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2 ${
                selectedTags.has(tag)
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={`Filter by ${tag}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    );
    return (
      <DesktopLinkedInShell
        topBar={<TopMenuBarDesktop />}
        pageTitle={"Learning"}
        leftSidebar={LeftDiscover}
        center={<CenterContent showDiscover />}
        rightRail={rightRail}
      />
    );
  }
  // Non-desktop fallback keeps Discover in the center
  return <CenterContent showDiscover />;
}
