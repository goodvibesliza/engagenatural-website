import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const BrandMenu = () => {
  const { brandId } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: 260, height: '100%',
      background: '#fff', boxShadow: '2px 0 12px rgba(0,0,0,0.08)',
      padding: 32, zIndex: 1000
    }}>
      <h2 style={{ color: '#1e293b', marginBottom: 32 }}>Brand Menu</h2>
      <button
        onClick={() => navigate(`/brand/${brandId}`)}
        style={{ display: 'block', marginBottom: 20, background: 'none', border: 'none', color: '#0ea5e9', fontSize: 18, cursor: 'pointer' }}
      >
        Home
      </button>
      <button
        onClick={() => navigate(`/brand/${brandId}/upload`)}
        style={{ display: 'block', marginBottom: 20, background: 'none', border: 'none', color: '#0ea5e9', fontSize: 18, cursor: 'pointer' }}
      >
        Content Upload
      </button>
      <button
        onClick={() => navigate(`/brand/${brandId}/dashboard`)}
        style={{ display: 'block', marginBottom: 20, background: 'none', border: 'none', color: '#0ea5e9', fontSize: 18, cursor: 'pointer' }}
      >
        Analytics
      </button>
      <button
        onClick={() => navigate(-1)}
        style={{ display: 'block', marginTop: 40, background: 'none', border: 'none', color: '#64748b', fontSize: 16, cursor: 'pointer' }}
      >
        Close
      </button>
    </div>
  );
};

export default BrandMenu;