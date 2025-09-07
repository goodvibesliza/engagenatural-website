import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loader2, CheckCircle, AlertCircle, User } from 'lucide-react';

const AdminVerify = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingUsers, setProcessingUsers] = useState({});

  // Load unverified users on component mount
  useEffect(() => {
    const fetchUnverifiedUsers = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, 'users');
        const unverifiedQuery = query(usersRef, where('verified', '==', false));
        const querySnapshot = await getDocs(unverifiedQuery);
        
        const unverifiedUsers = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setUsers(unverifiedUsers);
        setError(null);
      } catch (err) {
        console.error('Error fetching unverified users:', err);
        setError('Failed to load unverified users. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUnverifiedUsers();
  }, []);

  // Handle user approval
  const handleApprove = async (userId) => {
    try {
      setProcessingUsers(prev => ({ ...prev, [userId]: true }));
      const userRef = doc(db, 'users', userId);
      
      // Update user document in Firestore
      await updateDoc(userRef, {
        verified: true,
        verificationStatus: 'verified',
        verifiedAt: new Date()
      });
      
      // Remove approved user from local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      setProcessingUsers(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
      
    } catch (err) {
      console.error('Error approving user:', err);
      setError(`Failed to approve user. Error: ${err.message}`);
      setProcessingUsers(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Verification</h1>
        <div className="text-sm text-gray-500">
          {users.length} {users.length === 1 ? 'user' : 'users'} pending verification
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-gray-600">Loading users...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
              <p className="mt-1 text-gray-500">No users pending verification.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Store Code
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Photo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name || user.displayName || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.storeCode || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {user.verificationStatus || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.photoUrl ? (
                          <img 
                            src={user.photoUrl} 
                            alt={`${user.name || user.displayName || 'User'}'s photo`} 
                            className="h-12 w-12 rounded-full object-cover border border-gray-200"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/50?text=No+Image';
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          className={`px-4 py-2 rounded-md text-white font-medium ${
                            processingUsers[user.id] 
                              ? 'bg-gray-400 cursor-not-allowed' 
                              : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                          }`}
                          onClick={() => handleApprove(user.id)}
                          disabled={processingUsers[user.id]}
                        >
                          {processingUsers[user.id] ? (
                            <span className="flex items-center">
                              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                              Processing...
                            </span>
                          ) : (
                            'Approve'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminVerify;
