// src/pages/admin/BrandEditorPage.jsx
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/layout/AdminLayout';

export default function BrandEditorPage() {
  const { id } = useParams();
  const isNew = id === 'new';

  return (
    <AdminLayout>
      <div className="mb-6">
        <Link to="/admin/brands" className="text-blue-600 hover:text-blue-800">
          &larr; Back to Brands
        </Link>
        <h1 className="text-2xl font-bold mt-2">
          {isNew ? 'Create New Brand' : 'Edit Brand'}
        </h1>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <p>Brand editor form will appear here.</p>
      </div>
    </AdminLayout>
  );
}