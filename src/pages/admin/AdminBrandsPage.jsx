// src/pages/admin/AdminBrandsPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import { useAuth } from '../../contexts/auth-context';

export default function AdminBrandsPage() {
  // Rest of the component remains the same

  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'assigned', 'unassigned'
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { userRoles } = useAuth();
  
  const isSuperAdmin = userRoles?.includes('super_admin');
  
  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(true);
      try {
        // Create query based on filter
        let brandsQuery = collection(db, 'brands');
        
        if (filter === 'assigned') {
          brandsQuery = query(
            collection(db, 'brands'), 
            where('managerId', '!=', null)
          );
        } else if (filter === 'unassigned') {
          brandsQuery = query(
            collection(db, 'brands'), 
            where('managerId', '==', null)
          );
        }
        
        const snapshot = await getDocs(brandsQuery);
        const brandsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Apply search filter client-side if needed
        const filteredBrands = searchTerm 
          ? brandsList.filter(brand => 
              brand.name?.toLowerCase().includes(searchTerm.toLowerCase()))
          : brandsList;
        
        setBrands(filteredBrands);
      } catch (error) {
        console.error("Error fetching brands:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBrands();
  }, [filter, searchTerm]);
  
  const handleDeleteBrand = async (brandId) => {
    if (!isSuperAdmin) {
      alert("You don't have permission to delete brands.");
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this brand? This cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'brands', brandId));
        setBrands(brands.filter(brand => brand.id !== brandId));
      } catch (error) {
        console.error("Error deleting brand:", error);
        alert("Error deleting brand: " + error.message);
      }
    }
  };
  
  return (
    <AdminLayout requireSuperAdmin={false}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Brands</h1>
          <div className="space-x-2">
            {isSuperAdmin && (
              <button
                onClick={() => navigate('/admin/brands/new')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create Brand
              </button>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          {/* Search and Filter Controls */}
          <div className="border-b border-gray-200 p-4 flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filter === 'all'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                All Brands
              </button>
              <button
                onClick={() => setFilter('assigned')}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filter === 'assigned'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Assigned
              </button>
              <button
                onClick={() => setFilter('unassigned')}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filter === 'unassigned'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Unassigned
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Search brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full sm:w-64"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          {/* Brands List */}
          <div className="p-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-2">Loading brands...</p>
              </div>
            ) : brands.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Brand
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Manager
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Templates
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {brands.map((brand) => (
                      <tr key={brand.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                              {brand.logoUrl ? (
                                <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-gray-500 font-medium">
                                  {brand.name?.charAt(0) || '?'}
                                </span>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                              <div className="text-sm text-gray-500">{brand.description || 'No description'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            brand.managerId
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {brand.managerId ? 'Managed' : 'Unassigned'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {brand.managerName || 'No manager assigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {brand.templateCount || 0} templates
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => navigate(`/admin/brands/${brand.id}`)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            View
                          </button>
                          
                          {isSuperAdmin && (
                            <>
                              <button
                                onClick={() => navigate(`/admin/brands/${brand.id}/edit`)}
                                className="text-indigo-600 hover:text-indigo-900 mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteBrand(brand.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No brands found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm
                    ? 'No brands match your search. Try a different term.'
                    : 'Get started by creating a new brand.'}
                </p>
                <div className="mt-6">
                  {isSuperAdmin && !searchTerm && (
                    <button
                      onClick={() => navigate('/admin/brands/new')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Create Brand
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}