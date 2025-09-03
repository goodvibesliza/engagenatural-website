import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { logIndexHint, onSnapshotWithIndexHint } from '../../lib/firestoreIndexHelper';
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  Award, 
  CheckCircle, 
  AlertCircle,
  BarChart2,
  Calendar,
  Play
} from 'lucide-react';

// Consistent font styles with other brand pages
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
  
  const [training, setTraining] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState({
    training: true,
    progress: true
  });
  const [error, setError] = useState({
    training: null,
    progress: null
  });

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
        // Surface potential missing index or permission issues
        logIndexHint(err, 'TrainingDetail: training doc');
        setLoading(prev => ({
          ...prev,
          training: false
        }));
      }
    );

    return () => unsubscribe();
  }, [id]);

  // Load progress data
  useEffect(() => {
    if (!id) return;

    const progressQuery = query(
      collection(db, 'training_progress'),
      where('trainingId', '==', id),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshotWithIndexHint(
      progressQuery,
      async (snapshot) => {
        try {
          const progressDocs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Fetch user data for each progress entry
          const progressWithUserData = await Promise.all(
            progressDocs.map(async (progress) => {
              try {
                const userRef = doc(db, 'users', progress.userId);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                  return {
                    ...progress,
                    user: {
                      id: userSnap.id,
                      ...userSnap.data()
                    }
                  };
                }
                return progress;
              } catch (err) {
                console.error('Error fetching user data:', err);
                return progress;
              }
            })
          );
          
          setProgressData(progressWithUserData);
          setLoading(prev => ({
            ...prev,
            progress: false
          }));
        } catch (err) {
          console.error('Error loading progress data:', err);
          setError(prev => ({
            ...prev,
            progress: err.message
          }));
          setLoading(prev => ({
            ...prev,
            progress: false
          }));
        }
      },
      (err) => {
        console.error('Error in progress snapshot:', err);
        logIndexHint(err, 'TrainingDetail: progress');
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
  }, [id]);

  // Calculate progress statistics
  const stats = useMemo(() => {
    if (!progressData.length) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        completionRate: 0
      };
    }

    const completed = progressData.filter(p => p.status === 'completed').length;
    const inProgress = progressData.filter(p => p.status === 'in_progress').length;
    
    return {
      total: progressData.length,
      completed,
      inProgress,
      completionRate: progressData.length > 0 
        ? Math.round((completed / progressData.length) * 100) 
        : 0
    };
  }, [progressData]);

  if (loading.training) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (error.training) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 border border-red-200">
          <div className="flex items-center text-red-600 mb-4">
            <AlertCircle className="h-6 w-6 mr-2" />
            <h2 className="text-xl font-semibold">Error Loading Training</h2>
          </div>
          <p className="text-gray-700 mb-4">{error.training}</p>
          <button
            onClick={() => navigate('/brand/trainings')}
            className="flex items-center text-brand-primary hover:text-brand-primary/80"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Trainings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/brand/trainings')}
            className="flex items-center text-brand-primary hover:text-brand-primary/80"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Trainings
          </button>
        </div>

        {/* Training Header */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl mb-2" style={fontStyles.mainTitle}>{training.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{formatDuration(training.durationMins)}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Created: {formatDate(training.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{training.metrics?.enrolled || 0} enrolled</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                training.published 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {training.published ? 'Published' : 'Draft'}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                training.visibility === 'public' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {training.visibility === 'public' ? 'Public' : 'Restricted'}
              </span>
            </div>
          </div>
          
          <p className="text-gray-700 mb-6">{training.description}</p>
          
          {/* Training metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Category</h3>
              <p className="text-gray-900">{training.category || 'Uncategorized'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h3>
              <p className="text-gray-900">{formatDate(training.updatedAt)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Content Type</h3>
              <p className="text-gray-900">{training.contentType || 'Mixed Content'}</p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Link 
              to={`/brand/trainings/${id}/edit`}
              className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary/90"
            >
              Edit Training
            </Link>
            <Link 
              to={`/brand/trainings/${id}/preview`}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Preview Training
            </Link>
          </div>
        </div>

        {/* Progress Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mb-6">
          <h2 className="text-2xl mb-6" style={fontStyles.sectionHeading}>User Progress</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium text-blue-700 mb-1">Total Users</h3>
              <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="text-sm font-medium text-green-700 mb-1">Completed</h3>
              <p className="text-3xl font-bold text-green-900">{stats.completed}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
              <h3 className="text-sm font-medium text-yellow-700 mb-1">In Progress</h3>
              <p className="text-3xl font-bold text-yellow-900">{stats.inProgress}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <h3 className="text-sm font-medium text-purple-700 mb-1">Completion Rate</h3>
              <p className="text-3xl font-bold text-purple-900">{stats.completionRate}%</p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress Overview</span>
              <span>{stats.completionRate}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-brand-primary h-2.5 rounded-full" 
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
          </div>
          
          {/* User Progress Table */}
          <div>
            <h3 className="text-xl mb-4" style={fontStyles.subsectionTitle}>User Progress Details</h3>
            
            {loading.progress ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary"></div>
              </div>
            ) : error.progress ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                Error loading progress data: {error.progress}
              </div>
            ) : progressData.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No users enrolled</h3>
                <p className="text-gray-500">
                  No one has started this training yet. Share it with your team to get started.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Started
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Completed
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time Spent
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {progressData.map((progress) => (
                      <tr key={progress.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              {progress.user?.profileImage ? (
                                typeof progress.user.profileImage === 'string' && progress.user.profileImage.startsWith('http') ? (
                                  <img src={progress.user.profileImage} alt="" className="h-10 w-10 rounded-full object-cover" />
                                ) : (
                                  <span>{progress.user.profileImage}</span>
                                )
                              ) : (
                                <span>👤</span>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {progress.user?.name || 'Unknown User'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {progress.user?.email || progress.userId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            progress.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {progress.status === 'completed' ? 'Completed' : 'In Progress'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(progress.startedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {progress.completedAt ? formatDate(progress.completedAt) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {progress.timeSpentMins ? formatDuration(progress.timeSpentMins) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
