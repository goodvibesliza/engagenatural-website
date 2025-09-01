import React, { useState } from 'react';
import { db, auth } from '../../lib/firebase';
import { doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

const DevTools = () => {
  // Environment check - only render if VITE_SHOW_DEMO_TOOLS is true
  if (import.meta.env.VITE_SHOW_DEMO_TOOLS !== 'true') {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <h1 className="text-xl font-bold text-red-600">Access Denied</h1>
        <p className="text-red-600">
          Dev tools are disabled. Set VITE_SHOW_DEMO_TOOLS=true in .env.local to enable.
        </p>
      </div>
    );
  }

  // State for operation status
  const [promoteStatus, setPromoteStatus] = useState({ message: '', isError: false });
  const [migrateStatus, setMigrateStatus] = useState({ message: '', isError: false, count: 0 });
  const [isPromoting, setIsPromoting] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  // Function to promote current user to super_admin
  const promoteSelfToSuperAdmin = async () => {
    if (!auth.currentUser) {
      setPromoteStatus({
        message: 'No user is currently signed in.',
        isError: true
      });
      return;
    }

    setIsPromoting(true);
    setPromoteStatus({ message: 'Promoting user...', isError: false });

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        role: 'super_admin',
        approved: true,
        email: auth.currentUser.email ?? null,
        uid: auth.currentUser.uid
      }, { merge: true });

      setPromoteStatus({
        message: `Successfully promoted ${auth.currentUser.email} to super_admin!`,
        isError: false
      });
    } catch (error) {
      setPromoteStatus({
        message: `Error promoting user: ${error.message}`,
        isError: true
      });
    } finally {
      setIsPromoting(false);
    }
  };

  // Function to migrate user docs to match their UID
  const migrateUserDocs = async () => {
    setIsMigrating(true);
    setMigrateStatus({
      message: 'Starting migration...',
      isError: false,
      count: 0
    });

    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      let migratedCount = 0;
      let errorCount = 0;
      
      for (const userDoc of snapshot.docs) {
        const userData = userDoc.data();
        
        // Check if document has a uid field and if doc.id doesn't match uid
        if (userData.uid && userDoc.id !== userData.uid) {
          try {
            // Create new document with correct ID
            const correctUserRef = doc(db, 'users', userData.uid);
            await setDoc(correctUserRef, { ...userData }, { merge: true });
            
            // Delete old document
            await deleteDoc(userDoc.ref);
            
            migratedCount++;
          } catch (err) {
            errorCount++;
          }
        }
      }

      setMigrateStatus({
        message: `Migration complete! ${migratedCount} documents migrated.${
          errorCount > 0 ? ` ${errorCount} errors encountered.` : ''
        }`,
        isError: errorCount > 0,
        count: migratedCount
      });
    } catch (error) {
      setMigrateStatus({
        message: `Error during migration: ${error.message}`,
        isError: true,
        count: 0
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Developer Tools</h1>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-700">
            ⚠️ These tools modify data directly and are intended for development use only.
            Current environment: {import.meta.env.VITE_USE_EMULATOR === 'true' ? 'Emulator' : 'Production'}
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Promote to Super Admin Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">User Role Management</h2>
          <p className="text-gray-600 mb-4">
            Promote the current user ({auth.currentUser?.email || 'Not signed in'}) to super_admin role.
          </p>
          
          <button
            onClick={promoteSelfToSuperAdmin}
            disabled={isPromoting || !auth.currentUser}
            className={`px-4 py-2 rounded-md ${
              isPromoting
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isPromoting ? 'Promoting...' : 'Promote me to super_admin'}
          </button>
          
          {promoteStatus.message && (
            <div className={`mt-4 p-3 rounded-md ${
              promoteStatus.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {promoteStatus.message}
            </div>
          )}
        </div>

        {/* Migrate User Docs Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">User Document Migration</h2>
          <p className="text-gray-600 mb-4">
            Migrate user documents to use their UID as the document ID.
          </p>
          
          <button
            onClick={migrateUserDocs}
            disabled={isMigrating}
            className={`px-4 py-2 rounded-md ${
              isMigrating
                ? 'bg-purple-300 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {isMigrating ? 'Migrating...' : 'Migrate user docs to UID keys'}
          </button>
          
          {migrateStatus.message && (
            <div className={`mt-4 p-3 rounded-md ${
              migrateStatus.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {migrateStatus.message}
              {migrateStatus.count > 0 && (
                <div className="mt-2 font-semibold">
                  Documents migrated: {migrateStatus.count}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DevTools;
