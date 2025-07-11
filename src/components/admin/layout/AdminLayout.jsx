// src/components/admin/layout/AdminLayout.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/auth-context';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

export default function AdminLayout({ children, requireSuperAdmin = false }) {
  const { user, userRoles, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  const [currentBrand, setCurrentBrand] = useState(null);
  const [managedBrands, setManagedBrands] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  
  const isSuperAdmin = userRoles?.includes('super_admin');
  const isBrandManager = userRoles?.includes('brand_manager');
  
  // Check if we're in a brand-specific context
  useEffect(() => {
    const fetchBrandContext = async () => {
      if (!user) return;
      
      setLoadingBrands(true);
      try {
        // First check if we're in a specific brand context from URL
        const brandIdFromUrl = params.id && location.pathname.includes('/admin/brands/')
          ? params.id
          : null;
          
        // If we have a brand ID in the URL, fetch that brand
        if (brandIdFromUrl && brandIdFromUrl !== 'new') {
          const brandDoc = await getDoc(doc(db, 'brands', brandIdFromUrl));
          if (brandDoc.exists()) {
            setCurrentBrand({
              id: brandDoc.id,
              ...brandDoc.data()
            });
          }
        }
        
        // If user is a brand manager, fetch all their managed brands
        if (isBrandManager) {
          const brandsQuery = query(
            collection(db, 'brands'),
            where('managerId', '==', user.uid)
          );
          
          const brandsSnapshot = await getDocs(brandsQuery);
          const brandsList = brandsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setManagedBrands(brandsList);
          
          // If no brand is selected from URL but user manages brands,
          // set the first managed brand as current
          if (!currentBrand && brandsList.length > 0 && !isSuperAdmin) {
            setCurrentBrand(brandsList[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching brand context:', error);
      } finally {
        setLoadingBrands(false);
      }
    };
    
    fetchBrandContext();
  }, [user, params, location.pathname, isBrandManager, isSuperAdmin]);
  
  // Check permissions
  useEffect(() => {
    if (loading) return;
    
    if (requireSuperAdmin && !isSuperAdmin) {
      navigate('/admin');
    }
  }, [loading, isSuperAdmin, requireSuperAdmin, navigate]);
  
  const handleBrandChange = (brandId) => {
    navigate(`/admin/brands/${brandId}`);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/admin" className="font-bold text-xl text-gray-800">
              Admin Panel
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {user?.email}
            </div>
            
            <button
              onClick={() => {
                // Handle logout
                navigate('/login');
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      {/* Brand Context Banner (only shown when viewing a specific brand or for brand managers) */}
      {currentBrand && (
        <div className={`py-3 px-4 ${isSuperAdmin ? 'bg-blue-600' : 'bg-green-600'}`}>
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center text-white">
              <div className="flex items-center">
                {currentBrand.logoUrl ? (
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-white mr-2">
                    <img 
                      src={currentBrand.logoUrl} 
                      alt={currentBrand.name} 
                      className="h-full w-full object-cover" 
                    />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-white text-green-600 flex items-center justify-center mr-2">
                    <span className="font-bold">{currentBrand.name?.charAt(0) || '?'}</span>
                  </div>
                )}
                <span className="font-semibold text-lg">
                  {currentBrand.name}
                </span>
              </div>
              
              <div className="ml-3 px-2 py-1 bg-white bg-opacity-20 rounded-md text-xs">
                {isSuperAdmin ? 'Super Admin View' : 'Brand Manager View'}
              </div>
            </div>
            
            {/* Brand Selector Dropdown (if user manages multiple brands) */}
            {managedBrands.length > 1 && (
              <div className="relative">
                <select
                  value={currentBrand.id}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  className="bg-white bg-opacity-20 text-white border border-white border-opacity-30 rounded-md py-1 px-3 appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-30"
                >
                  {managedBrands.map(brand => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            )}
            
            {/* Exit Brand View Button (for super admin) */}
            {isSuperAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="text-white text-sm hover:underline focus:outline-none"
              >
                Exit Brand View
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white h-screen shadow-md fixed top-0 left-0 pt-16 overflow-y-auto">
          <div className="px-4 py-5 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Content
            </h3>
            <nav className="mt-3 space-y-1">
              <Link
                to="/admin/templates"
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location.pathname.includes('/admin/templates')
                    ? 'bg-gray-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                Templates
              </Link>
              
              <Link
                to="/admin/brands"
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location.pathname.includes('/admin/brands')
                    ? 'bg-gray-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                Brands
              </Link>
              
              <Link
                to="/admin/users"
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location.pathname.includes('/admin/users')
                    ? 'bg-gray-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                Users
              </Link>
            </nav>
          </div>
          
          <div className="px-4 py-5 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Analytics
            </h3>
            <nav className="mt-3 space-y-1">
              <Link
                to="/admin/dashboard"
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location.pathname === '/admin' || location.pathname === '/admin/dashboard'
                    ? 'bg-gray-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 ml-64 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}