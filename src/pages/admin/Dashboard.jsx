// src/pages/admin/Dashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/admin/verify" className="p-4 bg-purple-100 rounded hover:bg-purple-200">Verify Staff</Link>
          <Link to="/brand" className="p-4 bg-blue-100 rounded hover:bg-blue-200">View Brand Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
