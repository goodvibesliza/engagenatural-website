// src/pages/admin/BrandsListPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import AdminLayout from '../../components/admin/layout/AdminLayout';

export default function BrandsListPage() {
  const { isSuperAdmin } = useAuth();

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Brands</h1>
        {isSuperAdmin && isSuperAdmin() && (
          <Link
            to="/admin/brands/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create New Brand
          </Link>
        )}
      </div>
      
      <div className="bg-white shadow rounded-lg p-6">
        <p>Brand listing will appear here.</p>
      </div>
    </AdminLayout>
  );
}