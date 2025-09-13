import React, { useState } from 'react';
import { app } from '../lib/firebase';

const EnvCheckPublic = () => {
  // Get environment variables
  const netlifyContext = import.meta.env.VITE_NETLIFY_CONTEXT || 'not set';
  const useEmulator = import.meta.env.VITE_USE_EMULATOR || 'not set';

  // Preview / dev guard
  const isPreview =
    import.meta.env.DEV ||
    import.meta.env.VITE_NETLIFY_CONTEXT === 'deploy-preview';
  
  // Firebase config from env
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  // Mask sensitive values
  const maskValue = (value, showFull = false) => {
    if (!value) return 'not set';
    if (showFull) return value;
    
    // Show last 6 chars with **** prefix
    if (value.length <= 6) return '****' + value;
    return '****' + value.slice(-6);
  };

  // Check for missing required variables
  const requiredVars = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];
  
  const missingVars = requiredVars.filter(key => !firebaseConfig[key]);

  // Get initialized projectId if available
  const initializedProjectId = app?.options?.projectId || 'not initialized';

  /* ------------------------------------------------------------------ */
  /*  Auth API probe helpers & state                                    */
  /* ------------------------------------------------------------------ */
  const envKey = import.meta.env.VITE_FIREBASE_API_KEY || '';
  const appKey = app?.options?.apiKey || '';
  const envTail = envKey ? envKey.slice(-6) : 'not set';
  const appTail = appKey ? appKey.slice(-6) : 'not set';

  const [probeLoading, setProbeLoading] = useState(false);
  const [probeResult, setProbeResult] = useState(null);

  const handleProbe = async () => {
    const keyToUse = appKey || envKey;
    if (!keyToUse) {
      setProbeResult({ error: { message: 'NO_API_KEY' } });
      return;
    }
    setProbeLoading(true);
    try {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${encodeURIComponent(
          keyToUse,
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: 'probe@example.com',
            continueUri: 'https://example.com',
          }),
        },
      );
      const json = await res.json();
      setProbeResult(json);
    } catch (e) {
      setProbeResult({ error: { message: 'FETCH_FAILED' } });
    } finally {
      setProbeLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Disable page in production                                        */
  /* ------------------------------------------------------------------ */
  if (!isPreview) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Environment Check
          </h1>
          <p className="mt-2 text-gray-600">
            This page is disabled outside development or deploy-preview.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Environment Check</h1>
          <p className="mt-2 text-lg text-gray-600">
            Viewing environment variables and Firebase configuration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Environment Variables Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Environment Variables</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">VITE_NETLIFY_CONTEXT</dt>
                  <dd className="text-sm text-gray-900">{netlifyContext}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">VITE_USE_EMULATOR</dt>
                  <dd className="text-sm text-gray-900">{useEmulator}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Firebase Config Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Firebase Configuration</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">API Key</dt>
                  <dd className="text-sm text-gray-900">{maskValue(firebaseConfig.apiKey)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Auth Domain</dt>
                  <dd className="text-sm text-gray-900">{maskValue(firebaseConfig.authDomain, true)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Project ID</dt>
                  <dd className="text-sm text-gray-900">{maskValue(firebaseConfig.projectId, true)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">App ID</dt>
                  <dd className="text-sm text-gray-900">{maskValue(firebaseConfig.appId)}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Initialized App Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Initialized Firebase App</h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Initialized Project ID</dt>
                  <dd className="text-sm text-gray-900">{initializedProjectId}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">App Available</dt>
                  <dd className="text-sm text-gray-900">{app ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Missing Variables Card - Only shown if variables are missing */}
          {missingVars.length > 0 && (
            <div className="bg-red-50 overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-red-800 mb-4">Missing Environment Variables</h2>
                <ul className="list-disc pl-5 space-y-1">
                  {missingVars.map(varName => (
                    <li key={varName} className="text-sm text-red-700">
                      {varName.toUpperCase()}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Auth API Probe Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Auth API probe
              </h2>
              <div className="text-sm text-gray-600 mb-3 space-y-1">
                <div>
                  Env API key tail:{' '}
                  <span className="font-mono">{envTail}</span>
                </div>
                <div>
                  App API key tail:{' '}
                  <span className="font-mono">{appTail}</span>
                </div>
              </div>
              <button
                onClick={handleProbe}
                disabled={probeLoading}
                className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {probeLoading ? 'Testing…' : 'Test Auth API'}
              </button>
              {probeResult && (
                <div className="mt-4">
                  <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs overflow-auto">
{JSON.stringify(probeResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvCheckPublic;
// Named export so it can be imported with `{ EnvCheckPublic }` as well.
export { EnvCheckPublic };
