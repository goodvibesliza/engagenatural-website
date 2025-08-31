// src/pages/admin/DemoData.jsx
import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { seedDemoData, resetDemoData } from '../../services/demoSeed';
import { AlertCircle, CheckCircle, Database, Trash2 } from 'lucide-react';

const DemoData = () => {
  const { user, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [operation, setOperation] = useState(null); // 'seed' or 'reset'
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // New input state
  const [brandManagerUid, setBrandManagerUid] = useState('');
  const [staffUidsInput, setStaffUidsInput] = useState('');

  // Reset state for a new operation
  const resetState = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  /* ------------------------------------------------------------------
   *  🔬 TEST FIRESTORE PERMISSIONS
   *  Helps diagnose why super_admin users may still get permission
   *  errors by performing simple read / write operations.
   * ------------------------------------------------------------------ */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const testFirestorePermissions = useCallback(async () => {
    if (!user?.uid) return;

    try {
      console.log('🧪  Testing Firestore permissions …');

      // Lazy-load Firestore to avoid extra bundle weight on first render
      const {
        doc,
        getDoc,
        addDoc,
        collection,
        serverTimestamp,
        deleteDoc,
      } = await import('firebase/firestore');
      const { db } = await import('../../lib/firebase');

      // Test 1 – read current user doc
      console.log('  • Test 1: reading current user document');
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      console.log('    ↳ exists:', userSnap.exists(), '| data:', userSnap.data());

      // Test 2 – create a throw-away doc
      console.log('  • Test 2: creating test_permissions document');
      const testRef = await addDoc(collection(db, 'test_permissions'), {
        message: 'Permission test',
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        isDemo: true,
      });
      console.log('    ↳ created with id:', testRef.id);

      // Test 3 – delete the throw-away doc
      console.log('  • Test 3: deleting test_permissions document');
      await deleteDoc(testRef);
      console.log('    ↳ deleted successfully');

      console.log('🎉  All permission tests passed!');
    } catch (err) {
      console.error('❌  Firestore permission test failed:', err);
      console.error('     code:', err.code, '| name:', err.name, '| message:', err.message);
      // Bubble the error so UI can show it if needed
      setError(`${err.code || err.name}: ${err.message}`);
    }
  }, [user?.uid]);

  // Handle seeding demo data
  const handleSeedDemoData = useCallback(async () => {
    resetState();
    setOperation('seed');
    setLoading(true);

    // Build options object
    const staffUids = staffUidsInput
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);

    const opts = {};
    if (brandManagerUid.trim()) opts.brandManagerUid = brandManagerUid.trim();
    if (staffUids.length) opts.staffUids = staffUids;

    try {
      const result = await seedDemoData(user.uid, opts);
      setResults(result.counts);
      setError(null);
    } catch (err) {
      const code = err.code || err.name || 'Error';
      setError(`${code}: ${err.message}`);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, brandManagerUid, staffUidsInput, resetState]);

  // Handle resetting demo data
  const handleResetDemoData = useCallback(async () => {
    resetState();
    setOperation('reset');
    setLoading(true);
    setShowConfirmReset(false);

    try {
      await resetDemoData();
      setResults({ reset: true });
      setError(null);
    } catch (err) {
      const code = err.code || err.name || 'Error';
      setError(`${code}: ${err.message}`);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [resetState]);

  // If not super admin, show unauthorized message
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-medium text-red-800 mb-2">Unauthorized Access</h2>
          <p className="text-red-600">
            This page is only accessible to super administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Demo Data Management</h1>
        <p className="text-gray-500 mt-2">
          Seed or reset demo data for testing and development purposes.
        </p>

        {/* Debug Info Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Current User Debug Info</h3>
          <div className="text-xs space-y-1 text-gray-600">
            <div><strong>UID:</strong> {user?.uid || 'Not available'}</div>
            <div><strong>Email:</strong> {user?.email || 'Not available'}</div>
            <div><strong>Role:</strong> {user?.role || 'Not available'}</div>
            <div><strong>Is Super Admin:</strong> {isSuperAdmin ? 'Yes' : 'No'}</div>
          </div>

          {/* Test Permissions Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={testFirestorePermissions}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              🧪 Test Firestore Permissions
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seed Demo Data Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <Database className="h-5 w-5 text-blue-700" />
              </div>
              <h2 className="text-lg font-medium">Seed Demo Data</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Creates sample brands, users, trainings, sample requests, and announcements for testing purposes.
              All created data will be marked as demo data and can be safely removed later.
            </p>

            {/* Inputs */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand Manager UID&nbsp;<span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={brandManagerUid}
                  onChange={(e) => setBrandManagerUid(e.target.value)}
                  placeholder="Existing Brand Manager UID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Staff UIDs&nbsp;<span className="text-gray-400">(comma-separated, optional)</span>
                </label>
                <input
                  type="text"
                  value={staffUidsInput}
                  onChange={(e) => setStaffUidsInput(e.target.value)}
                  placeholder="uid1, uid2, uid3 …"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>
            
            <button
              onClick={handleSeedDemoData}
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              aria-label="Seed demo data"
            >
              {loading && operation === 'seed' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Seeding Data...
                </span>
              ) : (
                'Seed Demo Data'
              )}
            </button>
          </div>
        </div>

        {/* Reset Demo Data Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <Trash2 className="h-5 w-5 text-red-700" />
              </div>
              <h2 className="text-lg font-medium">Reset Demo Data</h2>
            </div>
            
            <p className="text-gray-600 mb-6">
              Removes all demo data from the database. This will only delete records marked as demo data
              and will not affect any real production data.
            </p>
            
            <button
              onClick={() => setShowConfirmReset(true)}
              disabled={loading}
              className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              aria-label="Reset demo data"
            >
              {loading && operation === 'reset' ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting Data...
                </span>
              ) : (
                'Reset Demo Data'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {results && !error && (
        <div className={`bg-green-50 border border-green-200 rounded-lg p-6 animate-fadeIn`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-800">
                {operation === 'seed' ? 'Demo Data Created Successfully' : 'Demo Data Reset Successfully'}
              </h3>
              
              {operation === 'seed' && (
                <div className="mt-2 text-sm text-green-700">
                  <p className="font-medium mb-2">Created the following demo records:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {Object.entries(results).map(([key, value]) => (
                      <li key={key}>{key}: {value}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {operation === 'reset' && (
                <div className="mt-2 text-sm text-green-700">
                  <p>All demo data has been successfully removed from the database.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 animate-fadeIn">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Reset</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to reset all demo data? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDemoData}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">Important Notes</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm text-yellow-700">
          <li>Demo data is intended for testing purposes only and should not be used in production environments.</li>
          <li>All demo data is marked with <code className="bg-yellow-100 px-1 py-0.5 rounded">isDemo: true</code> and can be safely removed using the reset function.</li>
          <li>Demo users are created in Firestore but not in Firebase Auth to prevent actual account creation.</li>
          <li>This feature is only available to super administrators.</li>
        </ul>
      </div>
    </div>
  );
};

export default DemoData;
