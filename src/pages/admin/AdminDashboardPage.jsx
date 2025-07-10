// src/pages/admin/AdminDashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import { useAuth } from '../../contexts/auth-context';

export default function AdminDashboardPage() {
  const { user, userRoles } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    templates: 0,
    brands: 0,
    users: 0
  });
  const [recentBrands, setRecentBrands] = useState([]);
  
  const isSuperAdmin = userRoles?.includes('super_admin');
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get counts
        const templateCount = await getCountFromServer(collection(db, 'templates'));
        const brandCount = await getCountFromServer(collection(db, 'brands'));
        const userCount = await getCountFromServer(collection(db, 'users'));
        
        setStats({
          templates: templateCount.data().count,
          brands: brandCount.data().count,
          users: userCount.data().count
        });
        
        // Get recent brands
        const brandsQuery = query(
          collection(db, 'brands'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const brandsSnapshot = await getDocs(brandsQuery);
        const brandsData = brandsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRecentBrands(brandsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  const navigateToSection = (section) => {
    switch(section) {
      case 'templates':
        navigate('/admin/templates');
        break;
      case 'brands':
        navigate('/admin/brands');
        break;
      case 'users':
        navigate('/admin/users');
        break;
      case 'analytics':
        navigate('/admin/analytics');
        break;
      default:
        break;
    }
  };
  
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-2">Welcome, {user?.displayName || 'Admin'}</h2>
            <p className="text-gray-600">
              This is your admin dashboard where you can manage templates, brands, and users.
            </p>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Templates Card */}
          <div 
            className="bg-white shadow rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-300"
            onClick={() => navigateToSection('templates')}
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-gray-700">
                  <h3 className="text-lg font-medium">Templates</h3>
                  <p className="text-gray-500 text-sm">Available content templates</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-2xl font-bold">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    stats.templates
                  )}
                </h4>
                <p className="text-green-600 text-sm font-medium mt-1">
                  {stats.templates > 0 ? 'View all templates' : 'Create your first template'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Brands Card */}
          <div 
            className="bg-white shadow rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-300"
            onClick={() => navigateToSection('brands')}
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-gray-700">
                  <h3 className="text-lg font-medium">Brands</h3>
                  <p className="text-gray-500 text-sm">Managed brands</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-2xl font-bold">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    stats.brands
                  )}
                </h4>
                <p className="text-purple-600 text-sm font-medium mt-1">
                  {stats.brands > 0 ? 'View all brands' : 'Create your first brand'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Users Card */}
          <div 
            className="bg-white shadow rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-300"
            onClick={() => navigateToSection('users')}
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-gray-700">
                  <h3 className="text-lg font-medium">Users</h3>
                  <p className="text-gray-500 text-sm">Platform users</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-2xl font-bold">
                  {loading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                  ) : (
                    stats.users
                  )}
                </h4>
                <p className="text-green-600 text-sm font-medium mt-1">
                  {stats.users > 0 ? 'View all users' : 'No users yet'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Brands Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Recent Brands</h3>
              {stats.brands > 0 && (
                <Link to="/admin/brands" className="text-sm text-blue-600 hover:text-blue-800">
                  View all
                </Link>
              )}
            </div>
          </div>
          <div className="px-6 py-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentBrands.length > 0 ? (
              <div className="divide-y">
                {recentBrands.map(brand => (
                  <div key={brand.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {brand.logoUrl ? (
                          <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-500 font-medium">
                            {brand.name?.charAt(0) || '?'}
                          </span>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{brand.name}</p>
                        <p className="text-xs text-gray-500">
                          {brand.managerId ? 'Managed' : 'Unassigned'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/admin/brands/${brand.id}`)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No brands found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new brand.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/admin/brands/new')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Create Brand
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Analytics Section - Only visible for super_admin */}
        {isSuperAdmin && (
          <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900">Platform Analytics</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-2">Content Overview</h4>
                  <div className="h-64 flex items-center justify-center">
                    <button
                      onClick={() => navigateToSection('analytics')}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View Analytics Dashboard
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-2">User Engagement</h4>
                  <div className="h-64 flex items-center justify-center">
                    <p className="text-gray-500 text-center">
                      Detailed analytics will be available once users start engaging with content.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}