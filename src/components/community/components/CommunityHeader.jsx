import React from 'react';

// Simple Community Header Component for debugging
const CommunityHeader = ({ community, user, onBackToProfile }) => {
  if (!community) return null;

  return (
    <div className="bg-gray-800 text-white p-6">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold">{community.name}</h1>
        <p className="text-gray-300">{community.description}</p>
        <div className="mt-4">
          <button 
            onClick={onBackToProfile}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityHeader;
