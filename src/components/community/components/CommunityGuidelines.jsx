import React from 'react';

// Simple Community Guidelines Component for debugging
const CommunityGuidelines = ({ community }) => {
  if (!community || !community.rules) return null;

  return (
    <div className="bg-white rounded p-4 shadow">
      <h2 className="font-bold text-lg mb-2">Community Guidelines</h2>
      <ul className="list-disc pl-5">
        {community.rules.map((rule, index) => (
          <li key={index} className="mb-1 text-sm">{rule}</li>
        ))}
      </ul>
    </div>
  );
};

export default CommunityGuidelines;
