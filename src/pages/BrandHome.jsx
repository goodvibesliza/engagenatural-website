import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

const BrandHome = () => {
  const { brandId } = useParams();
  const [uploads, setUploads] = useState([]);
  const [brandName, setBrandName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch brand name
    const unsubBrand = onSnapshot(
      collection(db, 'brands'),
      (snapshot) => {
        const brandDoc = snapshot.docs.find(doc => doc.id === brandId);
        setBrandName(brandDoc?.data()?.name || brandId);
      }
    );

    // Fetch uploads
    const uploadsQuery = query(
      collection(db, 'brands', brandId, 'uploads'),
      orderBy('uploadedAt', 'desc')
    );
    const unsubUploads = onSnapshot(uploadsQuery, (snapshot) => {
      setUploads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubBrand();
      unsubUploads();
    };
  }, [brandId]);

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
        <button
          onClick={() => navigate(`/brand/${brandId}/menu`)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 28,
            marginRight: 16,
            cursor: 'pointer'
          }}
          aria-label="Open menu"
        >
          <span style={{ display: 'inline-block', width: 32 }}>
            <div style={{ width: 28, height: 4, background: '#1e293b', margin: '5px 0', borderRadius: 2 }} />
            <div style={{ width: 28, height: 4, background: '#1e293b', margin: '5px 0', borderRadius: 2 }} />
            <div style={{ width: 28, height: 4, background: '#1e293b', margin: '5px 0', borderRadius: 2 }} />
          </span>
        </button>
        <h1 style={{ fontSize: 32, color: '#1e293b', margin: 0 }}>{brandName}</h1>
      </div>
      <h2 style={{ color: '#475569', fontSize: 22, marginBottom: 16 }}>Uploaded Content</h2>
      {uploads.length === 0 ? (
        <p style={{ color: '#64748b' }}>No content uploaded yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {uploads.map(upload => (
            <li key={upload.id} style={{
              background: '#f8fafc',
              marginBottom: 12,
              padding: 16,
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#1e293b', fontWeight: 500 }}>{upload.fileName}</span>
              <a href={upload.downloadURL} target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>
                View
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BrandHome;