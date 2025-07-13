import React from 'react';
import { useParams } from 'react-router-dom';

// This component is placed directly in src to avoid any import path issues
function DirectCommunityPage() {
  const { communityId } = useParams();
  
  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        backgroundColor: '#2563eb', 
        color: 'white',
        padding: '20px',
        borderRadius: '8px 8px 0 0' 
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>
          Community: {communityId}
        </h1>
        <p>Direct component with no imports - for testing</p>
      </div>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px',
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>
          Sample Posts
        </h2>
        
        <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
          <div style={{ fontWeight: 'bold' }}>Jane Smith</div>
          <p>Just started taking magnesium glycinate for sleep and it's working amazingly well!</p>
        </div>
        
        <div style={{ padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
          <div style={{ fontWeight: 'bold' }}>John Doe</div>
          <p>Has anyone tried the new probiotic from NaturalLife? Looking for reviews before I purchase.</p>
        </div>
      </div>
    </div>
  );
}

export default DirectCommunityPage;
