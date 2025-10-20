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
import LeftSidebarSearch from '@/components/common/LeftSidebarSearch.jsx';
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
        {(() => {
          const tagsArr = Array.isArray(training.tags)
            ? training.tags
            : (Array.isArray(training.modules) ? training.modules : []);
          return tagsArr.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-2">
              {tagsArr.map((tag, idx) => (
              <span 
                key={idx} 
                className="inline-block bg-gray-100 text-xs text-gray-600 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
              ))}
            </div>
          ) : null;
        })()}
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
  const STORAGE_KEY = 'en.search.learning';
  const lastSectionRef = useRef(null);

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
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState(new Set());
  
  // Track pending operations
  const [pendingTrainingIds, setPendingTrainingIds] = useState(new Set());
  
  // Refs for cleanup
  const unsubscribeRefs = useRef({});
  
  const flag = import.meta.env.VITE_EN_DESKTOP_FEED_LAYOUT;
  const shouldUseDesktopShell = flag === 'linkedin' && isDesktop;
  const rightRail = useMemo(() => (
    <>
      <div className="en-cd-right-title">Right Rail</div>
      <div className="en-cd-right-placeholder">(reserved)</div>
    </>
  ), []);

  // NOTE: Do not return early here; Hooks below must run unconditionally.
  
  // Load trainings and progress (guarded by role)
  useEffect(() => {
    if (!user?.uid || user.role !== 'staff') return;
    
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

  // Hydrate saved search (q + tags) on mount (guarded by role)
  useEffect(() => {
    if (!user || user.role !== 'staff') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || '';
      if (!raw) return;
      let parsed = null;
      try { parsed = JSON.parse(raw); } catch { /* backward compat: was plain string */ }
      if (parsed && typeof parsed === 'object') {
        const q = (parsed.q || '').trim();
        const tags = Array.isArray(parsed.tags) ? parsed.tags : [];
        if (q) setSearchQuery(q);
        if (tags.length) setSelectedTags(new Set(tags));
      } else {
        const q = raw.trim();
        if (q) setSearchQuery(q);
      }
    } catch { /* no-op */ }
  }, [user]);

  // Listen to left-rail search events (desktop shell; guarded by role)
  useEffect(() => {
    if (!user || user.role !== 'staff') return;
    const handler = (e) => {
      const detail = e?.detail || {};
      if (detail.page === 'learning') {
        setSearchQuery(detail.q || '');
      }
    };
    window.addEventListener('en:leftsearch', handler);
    return () => window.removeEventListener('en:leftsearch', handler);
  }, [user]);

  // Debounce text input by 300ms (guarded by role)
  useEffect(() => {
    if (!user || user.role !== 'staff') return;
    const raw = (searchQuery || '').trim();
    const t = setTimeout(() => setDebouncedQuery(raw), 300);
    return () => clearTimeout(t);
  }, [searchQuery, user]);

  // Persist unified search state (q + tags)
  useEffect(() => {
    if (!user || user.role !== 'staff') return;
    const q = (searchQuery || '').trim();
    const tags = Array.from(selectedTags);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ q, tags })); } catch { /* no-op */ }
  }, [searchQuery, selectedTags, user]);
  
  // Extract all unique tags from trainings
  const allTags = useMemo(() => {
    const tagSet = new Set();
    trainings.forEach(training => {
      const tagsArr = Array.isArray(training.tags)
        ? training.tags
        : (Array.isArray(training.modules) ? training.modules : []);
      tagsArr.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [trainings]);
  
  // Filter trainings based on unified search (q + tags)
  const filteredTrainings = useMemo(() => {
    const q = (debouncedQuery || '').toLowerCase();
    return trainings.filter(training => {
      // Build concatenated haystack per item
      const title = (training.title || '').toLowerCase();
      const tagsArr = Array.isArray(training.tags)
        ? training.tags
        : (Array.isArray(training.modules) ? training.modules : []);
      const tags = tagsArr.join(' ').toLowerCase();
      const brandName = (training.brandName || training.brand || training.brandId || '').toString().toLowerCase();
      const skillLevel = (training.skillLevel || training.category || '').toLowerCase();
      const haystack = `${title} ${tags} ${brandName} ${skillLevel}`.trim();
      const matchesSearch = !q || haystack.includes(q);
      // Filter by selected tags (if any) — OR semantics across selected tags
      const matchesTags = selectedTags.size === 0 || tagsArr.some(tag => selectedTags.has(tag));
      return matchesSearch && matchesTags;
    });
  }, [trainings, debouncedQuery, selectedTags]);

  // Active when q or tags are set
  const searchActive = useMemo(() => {
    return (debouncedQuery || '').trim().length > 0 || selectedTags.size > 0;
  }, [debouncedQuery, selectedTags]);

  // Search Results with relevance sort (title match > tags/brand), then title asc.
  // Works for q-only, tags-only, or both.
  const searchResults = useMemo(() => {
    const q = (debouncedQuery || '').trim().toLowerCase();
    if (!searchActive) return [];
    const arr = filteredTrainings.map(t => {
      if (!q) return { t, score: 0 }; // tags-only: keep title asc
      const title = (t.title || '').toLowerCase();
      const tagsArr = Array.isArray(t.tags)
        ? t.tags
        : (Array.isArray(t.modules) ? t.modules : []);
      const tags = tagsArr.join(' ').toLowerCase();
      const brandName = (t.brandName || t.brand || t.brandId || '').toString().toLowerCase();
      const inTitle = title.includes(q) ? 2 : 0;
      const inOther = (tags.includes(q) || brandName.includes(q)) ? 1 : 0;
      return { t, score: inTitle + inOther };
    });
    return arr
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const at = (a.t.title || '').toLowerCase();
        const bt = (b.t.title || '').toLowerCase();
        return at.localeCompare(bt);
      })
      .map(x => x.t);
  }, [debouncedQuery, filteredTrainings, searchActive]);

  // Analytics: search_change on change (debounced; guarded by role)
  useEffect(() => {
    if (!user || user.role !== 'staff') return;
    try { track('search_change', { page: 'learning', q: debouncedQuery, tagsCount: selectedTags.size, resultsCount: searchResults.length }); } catch { /* no-op */ }
  }, [debouncedQuery, selectedTags.size, searchResults.length, user]);

  // Section view analytics: search_results appears/disappears
  useEffect(() => {
    if (!user || user.role !== 'staff') return;
    const section = searchActive ? 'search_results' : 'lists';
    if (lastSectionRef.current !== section) {
      if (section === 'search_results') {
        try { track('section_view', { page: 'learning', section: 'search_results', resultsCount: searchResults.length }); } catch { /* no-op */ }
      }
      lastSectionRef.current = section;
    }
  }, [searchActive, searchResults.length, user]);
  
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

  // Dedupe underlying lists when searching
  const searchIds = useMemo(() => new Set(searchResults.map(t => t.id)), [searchResults]);
  const continueTrainingsDedup = useMemo(() => {
    if (!searchActive) return continueTrainings;
    return continueTrainings.filter(t => !searchIds.has(t.id));
  }, [searchActive, continueTrainings, searchIds]);
  
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

  const completedTrainingsDedup = useMemo(() => {
    if (!searchActive) return completedTrainings;
    return completedTrainings.filter(t => !searchIds.has(t.id));
  }, [searchActive, completedTrainings, searchIds]);
  
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

      {/* Mobile Search Overlay */}
      {isDesktop === false && (
        <MobileSearchOverlay />
      )}

      {/* Search Results */}
      {searchActive && (
        <section className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
            <div className="text-sm text-gray-500 flex items-center gap-3">
              <span>{searchResults.length} result{searchResults.length === 1 ? '' : 's'}</span>
              {selectedTags.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedTags(new Set())}
                  className="text-xs text-brand-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
          {searchResults.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 min-[900px]:grid-cols-2 xl:grid-cols-3 min-[900px]:gap-x-6 min-[900px]:gap-y-6">
              {searchResults.map(training => {
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
            <div className="text-center py-8 text-gray-600 space-y-3">
              <p>No learning items match your search.</p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedTags(new Set()); try { track('search_clear', { page: 'learning' }); } catch { /* no-op */ } }}
                className="inline-flex items-center px-3 h-9 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50"
                data-testid="learning-clear-empty-top"
              >
                Clear
              </button>
            </div>
          )}
        </section>
      )}

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
          ) : continueTrainingsDedup.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {continueTrainingsDedup.map(training => (
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
          ) : completedTrainingsDedup.length > 0 ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {completedTrainingsDedup.map(training => (
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {isLoading ? (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4].map(i => <TrainingCardSkeleton key={i} />)}
              </div>
            ) : (searchActive ? filteredTrainings.filter(t => !searchIds.has(t.id)) : filteredTrainings).length > 0 ? (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {(searchActive ? filteredTrainings.filter(t => !searchIds.has(t.id)) : filteredTrainings).map(training => {
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
              <div className="text-center py-8 text-gray-600 space-y-3">
                <p>No learning items match your search.</p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setSelectedTags(new Set()); try { track('search_clear', { page: 'learning' }); } catch { /* no-op */ } }}
                  className="inline-flex items-center px-3 h-9 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50"
                  data-testid="learning-clear-empty"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );

  // Mobile search overlay component for Learning (full-screen drawer with chips)
  const MobileSearchOverlay = () => {
    const [open, setOpen] = useState(false);
    const [animateIn, setAnimateIn] = useState(false);
    const inputRef = useRef(null);
    const panelRef = useRef(null);

    useEffect(() => {
      const handler = (e) => {
        if (e?.detail?.page && e.detail.page !== 'learning') return;
        setOpen(true);
        try { track('search_open', { page: 'learning' }); } catch { /* no-op */ }
        setTimeout(() => inputRef.current?.focus(), 0);
      };
      window.addEventListener('en:openMobileSearch', handler);
      return () => window.removeEventListener('en:openMobileSearch', handler);
    }, []);

    // Lock scroll, animate, and handle back button
    useEffect(() => {
      if (!open) return;
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => setAnimateIn(true));
      const onPop = () => { setOpen(false); try { track('search_close', { page: 'learning' }); } catch { /* no-op */ } };
      const state = { enMobileSearchLearning: true };
      try { history.pushState(state, ''); window.addEventListener('popstate', onPop, { once: true }); } catch { /* no-op */ }
      return () => {
        document.body.style.overflow = prev;
        setAnimateIn(false);
        try { window.removeEventListener('popstate', onPop); } catch { /* no-op */ }
      };
    }, [open]);

    // Focus trap inside panel
    const onKeyDownTrap = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        try { track('search_close', { page: 'learning' }); } catch { /* no-op */ }
        return;
      }
      if (e.key !== 'Tab') return;
      const root = panelRef.current;
      if (!root) return;
      const focusables = root.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
      const items = Array.from(focusables).filter(el => !el.hasAttribute('disabled'));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/40" onClick={() => { setOpen(false); try { track('search_close', { page: 'learning' }); } catch { /* no-op */ } }}>
        <div
          role="dialog"
          aria-label="Search"
          ref={panelRef}
          onKeyDown={onKeyDownTrap}
          className={`fixed left-0 right-0 bg-white rounded-t-2xl p-4 shadow-lg transition-transform duration-200 ease-out ${animateIn ? 'translate-y-0' : 'translate-y-full'}`}
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 60px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Search</h2>
            <button
              type="button"
              onClick={() => { setOpen(false); try { track('search_close', { page: 'learning' }); } catch { /* no-op */ } }}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close search"
            >
              ✕
            </button>
          </div>
          <div className="relative mb-3">
            <input
              ref={inputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trainings..."
              className="w-full h-11 min-h-[44px] pl-8 pr-8 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              aria-label="Search learning modules"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <span role="img" aria-label="search" className="text-gray-400">🔍</span>
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); try { track('search_clear', { page: 'learning' }); } catch { /* no-op */ } }}
                className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          {/* Keyword chips inside overlay */}
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
      </div>
    );
  };

  const LeftDiscover = (
    <div className="space-y-3" data-testid="learning-left-discover">
      <label htmlFor="learning-left-rail-search" className="block text-xs uppercase text-gray-500">Search learning modules</label>
      <form className="relative" onSubmit={(e) => e.preventDefault()}>
        <input
          id="learning-left-rail-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              setSearchQuery('');
              try { track('search_clear', { page: 'learning' }); } catch (err) { /* no-op */ }
            }
            if (e.key === 'Enter') e.preventDefault();
          }}
          placeholder="Search trainings..."
          className="w-full h-11 min-h-[44px] pl-8 pr-8 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          aria-label="Search learning modules"
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
          <span role="img" aria-label="search" className="text-gray-400">🔍</span>
        </div>
        {searchQuery && (
          <button
            type="button"
            onClick={() => { setSearchQuery(''); try { track('search_clear', { page: 'learning' }); } catch { /* no-op */ } }}
            className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
            data-testid="learning-clear-x"
          >
            ×
          </button>
        )}
      </form>
      {loadingTrainings && (
        <p className="text-[11px] text-gray-500">Loading…</p>
      )}
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

  // If not staff, show friendly message (after all hooks)
  if (user && user.role !== 'staff') {
    const CenterContentLocked = () => (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8">
        <span role="img" aria-label="lock" className="text-4xl mb-4">🔒</span>
        <p className="text-gray-600 max-w-md">
          This learning dashboard is available exclusively to staff members.
          If you believe you should have access, please contact support.
        </p>
      </div>
    );
    if (shouldUseDesktopShell) {
      return (
        <DesktopLinkedInShell
          topBar={<TopMenuBarDesktop />}
          pageTitle={"Learning"}
          leftSidebar={<LeftSidebarSearch />}
          center={<CenterContentLocked />}
          rightRail={rightRail}
        />
      );
    }
    return <CenterContentLocked />;
  }

  if (shouldUseDesktopShell) {
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
