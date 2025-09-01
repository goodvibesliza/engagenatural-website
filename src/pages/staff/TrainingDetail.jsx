import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/auth-context';
import { 
  doc, 
  getDoc, 
  setDoc,
  updateDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ArrowLeft, 
  ArrowRight,
  Clock, 
  CheckCircle, 
  AlertCircle,
  BookOpen,
  Play,
  Pause,
  List,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

// Consistent font styles with other staff pages
const fontStyles = {
  mainTitle: {
    fontFamily: 'Playfair Display, serif',
    fontWeight: '900',
    letterSpacing: '-0.015em',
    lineHeight: '1.1',
    color: '#000000'
  },
  sectionHeading: {
    fontFamily: 'Playfair Display, serif',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
    color: '#000000'
  },
  subsectionTitle: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: '700',
    letterSpacing: '-0.005em',
    lineHeight: '1.3',
    color: '#000000'
  }
};

export default function TrainingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // States
  const [training, setTraining] = useState(null);
  const [progress, setProgress] = useState(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [loading, setLoading] = useState({
    training: true,
    progress: true
  });
  const [error, setError] = useState({
    training: null,
    progress: null
  });
  const [updating, setUpdating] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Refs
  const contentRef = useRef(null);
  const timerRef = useRef(null);
  const timeSpentRef = useRef(0);
  
  // Format duration helper
  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  };

  // Format date helper
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Load training data
  useEffect(() => {
    if (!id) return;

    const trainingRef = doc(db, 'trainings', id);
    
    const unsubscribe = onSnapshot(
      trainingRef,
      (doc) => {
        if (doc.exists()) {
          setTraining({
            id: doc.id,
            ...doc.data()
          });
        } else {
          setError(prev => ({
            ...prev,
            training: 'Training not found'
          }));
        }
        setLoading(prev => ({
          ...prev,
          training: false
        }));
      },
      (err) => {
        console.error('Error loading training:', err);
        setError(prev => ({
          ...prev,
          training: err.message
        }));
        setLoading(prev => ({
          ...prev,
          training: false
        }));
      }
    );

    return () => unsubscribe();
  }, [id]);

  // Load user progress data
  useEffect(() => {
    if (!id || !user?.uid) return;

    const progressId = `${user.uid}_${id}`;
    const progressRef = doc(db, 'training_progress', progressId);
    
    const unsubscribe = onSnapshot(
      progressRef,
      async (doc) => {
        if (doc.exists()) {
          setProgress({
            id: doc.id,
            ...doc.data()
          });
        } else {
          // Create new progress document if not exists
          try {
            const newProgress = {
              id: progressId,
              userId: user.uid,
              trainingId: id,
              status: 'in_progress',
              startedAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              completedSections: [],
              currentSection: 0,
              timeSpentMins: 0
            };
            
            await setDoc(progressRef, newProgress);
            setProgress(newProgress);
          } catch (err) {
            console.error('Error creating progress document:', err);
            setError(prev => ({
              ...prev,
              progress: err.message
            }));
          }
        }
        setLoading(prev => ({
          ...prev,
          progress: false
        }));
      },
      (err) => {
        console.error('Error loading progress:', err);
        setError(prev => ({
          ...prev,
          progress: err.message
        }));
        setLoading(prev => ({
          ...prev,
          progress: false
        }));
      }
    );

    return () => unsubscribe();
  }, [id, user?.uid]);

  // Set current section from progress
  useEffect(() => {
    if (
      progress?.currentSection !== undefined &&
      progress.currentSection !== currentSectionIndex
    ) {
      setCurrentSectionIndex(progress.currentSection);
    }
  }, [progress?.currentSection, currentSectionIndex]);

  // Time tracking
  useEffect(() => {
    const progressId = progress?.id;
    if (!progressId || !user?.uid) return;
    
    // Initialize time spent from progress
    timeSpentRef.current = progress.timeSpentMins || 0;
    
    // Start timer
    timerRef.current = setInterval(() => {
      timeSpentRef.current += 1/60; // Add one second in minutes
    }, 1000);
    
    // Update time spent every minute
    const updateInterval = setInterval(async () => {
      try {
        const progressRef = doc(db, 'training_progress', progressId);
        await updateDoc(progressRef, {
          timeSpentMins: Math.round(timeSpentRef.current),
          updatedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('Error updating time spent:', err);
      }
    }, 60000); // Every minute
    
    return () => {
      clearInterval(timerRef.current);
      clearInterval(updateInterval);
      
      const progressRef = doc(db, 'training_progress', progressId);
      updateDoc(progressRef, {
        timeSpentMins: Math.round(timeSpentRef.current),
        updatedAt: serverTimestamp()
      }).catch(err => {
        console.error('Error updating final time spent:', err);
      });
    };
  }, [progress?.id, user?.uid]);

  // Computed values
  const currentSection = useMemo(() => {
    if (!training?.sections || !training.sections.length) return null;
    return training.sections[currentSectionIndex] || training.sections[0];
  }, [training, currentSectionIndex]);

  const completedSections = useMemo(() => {
    return progress?.completedSections || [];
  }, [progress]);

  const isCurrentSectionCompleted = useMemo(() => {
    if (!currentSection) return false;
    return completedSections.includes(currentSection.id);
  }, [currentSection, completedSections]);

  const totalSections = useMemo(() => {
    return training?.sections?.length || 0;
  }, [training]);

  const completionPercentage = useMemo(() => {
    if (!totalSections) return 0;
    return Math.round((completedSections.length / totalSections) * 100);
  }, [completedSections, totalSections]);

  const allSectionsCompleted = useMemo(() => {
    if (!totalSections) return false;
    return completedSections.length === totalSections;
  }, [completedSections, totalSections]);

  // Navigation functions
  const goToNextSection = () => {
    if (currentSectionIndex < totalSections - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      updateCurrentSection(currentSectionIndex + 1);
    }
  };

  const goToPreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      updateCurrentSection(currentSectionIndex - 1);
    }
  };

  const goToSection = (index) => {
    if (index >= 0 && index < totalSections) {
      setCurrentSectionIndex(index);
      updateCurrentSection(index);
    }
  };

  // Update functions
  const updateCurrentSection = async (sectionIndex) => {
    if (!progress?.id) return;
    
    try {
      const progressRef = doc(db, 'training_progress', progress.id);
      await updateDoc(progressRef, {
        currentSection: sectionIndex,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating current section:', err);
    }
  };

  const markSectionComplete = async () => {
    if (!progress?.id || !currentSection?.id || isCurrentSectionCompleted || updating) return;
    
    setUpdating(true);
    try {
      const updatedSections = [...completedSections];
      if (!updatedSections.includes(currentSection.id)) {
        updatedSections.push(currentSection.id);
      }
      
      const progressRef = doc(db, 'training_progress', progress.id);
      await updateDoc(progressRef, {
        completedSections: updatedSections,
        updatedAt: serverTimestamp()
      });
      
      // If this was the last section, mark training as completed
      if (updatedSections.length === totalSections) {
        await updateDoc(progressRef, {
          status: 'completed',
          completedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error('Error marking section complete:', err);
    } finally {
      setUpdating(false);
    }
  };

  const markTrainingComplete = async () => {
    if (!progress?.id || !allSectionsCompleted || updating) return;
    
    setUpdating(true);
    try {
      const progressRef = doc(db, 'training_progress', progress.id);
      await updateDoc(progressRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error marking training complete:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Render loading state
  if (loading.training || loading.progress) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading training content...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error.training || error.progress) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 border border-red-200">
          <div className="flex items-center text-red-600 mb-4">
            <AlertCircle className="h-6 w-6 mr-2" />
            <h2 className="text-xl font-semibold">Error Loading Training</h2>
          </div>
          <p className="text-gray-700 mb-4">{error.training || error.progress}</p>
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="flex items-center text-brand-primary hover:text-brand-primary/80"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Render if no training found
  if (!training) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center text-yellow-600 mb-4">
            <AlertCircle className="h-6 w-6 mr-2" />
            <h2 className="text-xl font-semibold">Training Not Found</h2>
          </div>
          <p className="text-gray-700 mb-4">The requested training could not be found.</p>
          <button
            onClick={() => navigate('/staff/dashboard')}
            className="flex items-center text-brand-primary hover:text-brand-primary/80"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/staff/dashboard')}
              className="flex items-center text-brand-primary hover:text-brand-primary/80"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
            </button>
            
            <div className="text-center flex-1 mx-4">
              <h1 className="text-xl md:text-2xl truncate" style={fontStyles.sectionHeading}>
                {training.title}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                aria-label="Toggle sidebar"
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Progress: {completionPercentage}%</span>
            <span>{completedSections.length} of {totalSections} sections</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-brand-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar - Section navigation */}
          {showSidebar && (
            <div className="md:w-64 bg-white rounded-lg shadow-md p-4 h-fit sticky top-24">
              <h2 className="text-lg mb-4" style={fontStyles.subsectionTitle}>Sections</h2>
              <ul className="space-y-2">
                {training.sections?.map((section, index) => (
                  <li key={section.id}>
                    <button
                      onClick={() => goToSection(index)}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between ${
                        currentSectionIndex === index 
                          ? 'bg-brand-primary text-white' 
                          : completedSections.includes(section.id)
                            ? 'bg-green-50 text-green-800'
                            : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="truncate flex-1 text-sm">
                        {index + 1}. {section.title}
                      </span>
                      {completedSections.includes(section.id) && (
                        <CheckCircle className="h-4 w-4 ml-2 flex-shrink-0" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              
              {progress?.status === 'completed' ? (
                <div className="mt-6 bg-green-50 text-green-800 p-3 rounded-lg text-sm">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>Completed on {formatDate(progress.completedAt)}</span>
                  </div>
                </div>
              ) : allSectionsCompleted ? (
                <button
                  onClick={markTrainingComplete}
                  disabled={updating}
                  className="mt-6 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {updating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Mark Training Complete
                </button>
              ) : null}
            </div>
          )}
          
          {/* Main content */}
          <div className="flex-1">
            {currentSection ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Section header */}
                <div className="bg-gray-50 border-b p-4">
                  <h2 className="text-xl" style={fontStyles.subsectionTitle}>
                    {currentSection.title}
                  </h2>
                  {isCurrentSectionCompleted && (
                    <div className="mt-2 flex items-center text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span>Completed</span>
                    </div>
                  )}
                </div>
                
                {/* Section content */}
                <div className="p-6" ref={contentRef}>
                  {/* Content type rendering based on section type */}
                  {currentSection.type === 'video' && currentSection.videoUrl ? (
                    <div className="aspect-video mb-6">
                      <iframe 
                        src={currentSection.videoUrl} 
                        title={currentSection.title}
                        className="w-full h-full rounded-lg"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : null}
                  
                  {currentSection.content && (
                    <div className="prose max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: currentSection.content }}></div>
                    </div>
                  )}
                  
                  {/* If no content is available */}
                  {!currentSection.content && !currentSection.videoUrl && (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No content available for this section.</p>
                    </div>
                  )}
                </div>
                
                {/* Section navigation and actions */}
                <div className="border-t p-4 flex items-center justify-between">
                  <button
                    onClick={goToPreviousSection}
                    disabled={currentSectionIndex === 0}
                    className="flex items-center px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5 mr-1" />
                    Previous
                  </button>
                  
                  <div>
                    {!isCurrentSectionCompleted ? (
                      <button
                        onClick={markSectionComplete}
                        disabled={updating}
                        className="flex items-center px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updating ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        ) : (
                          <CheckCircle className="h-5 w-5 mr-2" />
                        )}
                        Mark Complete
                      </button>
                    ) : (
                      <span className="text-green-600 flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Completed
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={goToNextSection}
                    disabled={currentSectionIndex === totalSections - 1}
                    className="flex items-center px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-5 w-5 ml-1" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Content Available</h3>
                <p className="text-gray-500 mb-4">
                  This training doesn't have any sections yet.
                </p>
              </div>
            )}
            
            {/* Training metadata */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-lg mb-4" style={fontStyles.subsectionTitle}>Training Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                  <p className="text-gray-900">{training.description}</p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Duration</h4>
                    <p className="text-gray-900">{formatDuration(training.durationMins)}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Category</h4>
                    <p className="text-gray-900">{training.category || 'Uncategorized'}</p>
                  </div>
                  
                  {progress?.timeSpentMins > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Your Time Spent</h4>
                      <p className="text-gray-900">{formatDuration(progress.timeSpentMins)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
