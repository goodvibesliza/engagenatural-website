// src/components/brand/BrandManagerLayout.jsx
import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/auth-context';

export default function BrandManagerLayout({ children }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch brands associated with the user
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        
        // Query brands where the user is a manager
        const brandsQuery = query(
          collection(db, 'brands'),
          where('managers', 'array-contains', user.uid)
        );
        
        const querySnapshot = await getDocs(brandsQuery);
        const fetchedBrands = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setBrands(fetchedBrands);
        
        // Check if there's a selected brand in localStorage
        const storedBrandId = localStorage.getItem('selectedBrandId');
        
        if (storedBrandId) {
          const storedBrand = fetchedBrands.find(brand => brand.id === storedBrandId);
          if (storedBrand) {
            setSelectedBrand(storedBrand);
          } else if (fetchedBrands.length > 0) {
            // If stored brand not found, select the first one
            setSelectedBrand(fetchedBrands[0]);
            localStorage.setItem('selectedBrandId', fetchedBrands[0].id);
          }
        } else if (fetchedBrands.length > 0) {
          // If no stored brand, select the first one
          setSelectedBrand(fetchedBrands[0]);
          localStorage.setItem('selectedBrandId', fetchedBrands[0].id);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching brands:', err);
        setError('Failed to load brands');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchBrands();
    }
  }, [user]);
  
  // Handle brand selection
  const handleBrandChange = (e) => {
    const brandId = e.target.value;
    const brand = brands.find(b => b.id === brandId);
    
    if (brand) {
      setSelectedBrand(brand);
      localStorage.setItem('selectedBrandId', brandId);
      
      // Refresh the current page to update content for the new brand
      navigate(location.pathname);
    }
  };
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // Toggle profile menu
  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };
  
  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <NavLink to="/brand" className="text-xl font-bold text-blue-600">
                  EngageNatural
                </NavLink>
              </div>
            </div>
            
            <div className="flex items-center">
              {/* Brand selector */}
              {brands.length > 0 && (
                <div className="mr-4">
                  <select
                    value={selectedBrand?.id || ''}
                    onChange={handleBrandChange}
                    className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Mobile menu button */}
              <div className="mr-2 flex items-center sm:hidden">
                <button
                  onClick={toggleMobileMenu}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                >
                  <span className="sr-only">Open main menu</span>
                  <svg
                    className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <svg
                    className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div>
                  <button
                    onClick={toggleProfileMenu}
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    id="user-menu-button"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </button>
                </div>
                
                {isProfileMenuOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                    tabIndex="-1"
                  >
                    <div className="block px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                      {user?.email || 'User'}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      tabIndex="-1"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} sm:hidden bg-white shadow-lg`}>
        <div className="pt-2 pb-3 space-y-1">
          <NavLink
            to="/brand"
            className={({ isActive }) =>
              `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive
                  ? 'border-blue-500 text-blue-700 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }`
            }
            end
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/brand/content"
            className={({ isActive }) =>
              `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive
                  ? 'border-blue-500 text-blue-700 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }`
            }
          >
            Content
          </NavLink>
          <NavLink
            to="/brand/templates"
            className={({ isActive }) =>
              `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive
                  ? 'border-blue-500 text-blue-700 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }`
            }
          >
            Templates
          </NavLink>
          <NavLink
            to="/brand/analytics"
            className={({ isActive }) =>
              `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive
                  ? 'border-blue-500 text-blue-700 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }`
            }
          >
            Analytics
          </NavLink>
          <NavLink
            to="/brand/roi-calculator"
            className={({ isActive }) =>
              `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                isActive
                  ? 'border-blue-500 text-blue-700 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
              }`
            }
          >
            ROI Calculator
          </NavLink>
        </div>
      </div>

      {/* Main content */}
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row">
            {/* Sidebar for desktop */}
            <div className="hidden sm:block w-64 mr-6">
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Brand Manager</h3>
                </div>
                <div className="py-2">
                  <NavLink
                    to="/brand"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 text-sm font-medium ${
                        isActive
                          ? 'text-blue-700 bg-blue-50'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                    end
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/brand/content"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 text-sm font-medium ${
                        isActive || location.pathname.startsWith('/brand/content/')
                          ? 'text-blue-700 bg-blue-50'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    Content
                  </NavLink>
                  <NavLink
                    to="/brand/templates"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 text-sm font-medium ${
                        isActive || location.pathname.startsWith('/brand/templates/')
                          ? 'text-blue-700 bg-blue-50'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                    Templates
                  </NavLink>
                  <NavLink
                    to="/brand/analytics"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 text-sm font-medium ${
                        isActive
                          ? 'text-blue-700 bg-blue-50'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Analytics
                  </NavLink>
                  <NavLink
                    to="/brand/roi-calculator"
                    className={({ isActive }) =>
                      `flex items-center px-4 py-3 text-sm font-medium ${
                        isActive
                          ? 'text-blue-700 bg-blue-50'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    ROI Calculator
                  </NavLink>
                </div>
              </div>
              
              {/* Brand info */}
              {selectedBrand && (
                <div className="mt-6 bg-white shadow rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-500">Selected Brand</h4>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{selectedBrand.name}</p>
                  {selectedBrand.website && (
                    <a 
                      href={selectedBrand.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Visit Website
                    </a>
                  )}
                </div>
              )}
            </div>
            
            {/* Main content */}
            <div className="flex-1">
              {loading ? (
                <div className="bg-white shadow rounded-lg p-6 flex justify-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="sr-only">Loading...</span>
                </div>
              ) : error ? (
                <div className="bg-white shadow rounded-lg p-6">
                  <div className="bg-red-50 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>{error}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Always render children, even if no brands are assigned
                // This allows navigation during development
                children
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
