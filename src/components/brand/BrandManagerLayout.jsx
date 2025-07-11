// src/components/brand/BrandManagerLayout.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/auth-context';

export default function BrandManagerLayout({ children }) {
  const { user, userRoles, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [managedBrands, setManagedBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  useEffect(() => {
    const fetchManagedBrands = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Query brands managed by this user
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
        
        // If user has brands, select the first one or use stored preference
        if (brandsList.length > 0) {
          const savedBrandId = localStorage.getItem('selectedBrandId');
          const savedBrand = savedBrandId ? 
            brandsList.find(b => b.id === savedBrandId) : 
            null;
            
          setSelectedBrand(savedBrand || brandsList[0]);
          
          // Store the selected brand ID for consistency
          if (!savedBrandId && brandsList[0]) {
            localStorage.setItem('selectedBrandId', brandsList[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching managed brands:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchManagedBrands();
  }, [user]);
  
  const handleBrandChange = (brandId) => {
    const brand = managedBrands.find(b => b.id === brandId);
    if (brand) {
      setSelectedBrand(brand);
      localStorage.setItem('selectedBrandId', brand.id);
    }
  };
  
  const isActive = (path) => {
    return location.pathname === path || 
           (path !== '/brand/dashboard' && location.pathname.startsWith(path));
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
          <p className="mt-2">Loading your brand dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (managedBrands.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h2 className="mt-2 text-xl font-medium text-gray-900">No Managed Brands</h2>
          <p className="mt-1 text-gray-500">
            You don't have any brands assigned to you yet. Please contact the administrator.
          </p>
          <div className="mt-6">
            <button
              onClick={() => signOut()}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar - desktop */}
      <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white shadow">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200">
          {/* Brand selector and logo */}
          <div className="flex items-center h-16 px-4 border-b border-gray-200 bg-gray-50">
            {selectedBrand && (
              <div className="flex items-center">
                {selectedBrand.logoUrl ? (
                  <img 
                    src={selectedBrand.logoUrl} 
                    alt={selectedBrand.name} 
                    className="h-8 w-8 object-contain mr-2" 
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-2">
                    <span className="font-bold">{selectedBrand.name?.charAt(0) || '?'}</span>
                  </div>
                )}
                
                {managedBrands.length > 1 ? (
                  <select
                    value={selectedBrand?.id || ''}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className="text-sm font-medium text-gray-700 bg-transparent border-0 focus:ring-0"
                  >
                    {managedBrands.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm font-medium text-gray-700">{selectedBrand.name}</span>
                )}
              </div>
            )}
          </div>
          
          {/* Navigation links */}
          <nav className="flex-1 px-2 py-4 bg-white">
            <div className="space-y-1">
              <Link 
                to="/brand/dashboard" 
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/brand/dashboard')
                    ? 'bg-gray-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
              
              <Link 
                to="/brand/templates" 
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/brand/templates')
                    ? 'bg-gray-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Templates
              </Link>
              
              <Link 
                to="/brand/content" 
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/brand/content')
                    ? 'bg-gray-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Content
              </Link>
              
              <Link 
                to="/brand/analytics" 
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive('/brand/analytics')
                    ? 'bg-gray-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics
              </Link>
            </div>
          </nav>
          
          {/* User menu */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-sm font-medium text-gray-700 truncate">
                  {user?.email}
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="ml-3 text-xs text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="md:hidden">
        {/* Mobile nav backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        
        {/* Mobile sidebar */}
        <div className={`fixed inset-y-0 left-0 flex flex-col z-40 w-72 max-w-xs bg-white transform ease-in-out duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 bg-gray-50">
            {selectedBrand && (
              <div className="flex items-center">
                {selectedBrand.logoUrl ? (
                  <img 
                    src={selectedBrand.logoUrl} 
                    alt={selectedBrand.name} 
                    className="h-8 w-8 object-contain mr-2" 
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-2">
                    <span className="font-bold">{selectedBrand.name?.charAt(0) || '?'}</span>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">{selectedBrand.name}</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Mobile nav links */}
          <nav className="flex-1 px-2 py-4 bg-white overflow-y-auto">
            <div className="space-y-1">
              <Link 
                to="/brand/dashboard" 
                className={`group flex items-center px-3 py-2 text-base font-medium rounded-md ${
                  isActive('/brand/dashboard')
                    ? 'bg-gray-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </Link>
              
              <Link 
                to="/brand/templates" 
                className={`group flex items-center px-3 py-2 text-base font-medium rounded-md ${
                  isActive('/brand/templates')
                    ? 'bg-gray-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Templates
              </Link>
              
              <Link 
                to="/brand/content" 
                className={`group flex items-center px-3 py-2 text-base font-medium rounded-md ${
                  isActive('/brand/content')
                    ? 'bg-gray-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Content
              </Link>
              
              <Link 
                to="/brand/analytics" 
                className={`group flex items-center px-3 py-2 text-base font-medium rounded-md ${
                  isActive('/brand/analytics')
                    ? 'bg-gray-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics
              </Link>
            </div>
          </nav>
          
          {/* Mobile user menu */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-sm font-medium text-gray-700 truncate">
                  {user?.email}
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="ml-3 text-xs text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white shadow">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Mobile brand title */}
          <div className="flex items-center justify-center">
            {selectedBrand && (
              <h1 className="text-lg font-medium text-gray-900">{selectedBrand.name}</h1>
            )}
          </div>
        </div>
        
        {/* Main content area */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}