import React from 'react';

// Simple Verification Prompt Component for debugging
const VerificationPrompt = ({ navigate }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded p-4 shadow">
      <h3 className="font-bold text-blue-800 mb-2">Get Verified</h3>
      <p className="text-blue-700 text-sm mb-3">
        Verify your account to unlock all features in our community
      </p>
      <button 
        onClick={() => navigate('/staff/verification')}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Verify Now
      </button>
    </div>
  );
};

export default VerificationPrompt;
