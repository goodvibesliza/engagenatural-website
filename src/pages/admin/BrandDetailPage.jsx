// src/pages/admin/BrandDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase.old';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import { usePermissions } from '../../hooks/usePermissions';

export default function BrandDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const permissions = usePermissions();
  
  const [brand, setBrand] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchBrandAndTemplates = async () => {
      setLoading(true);
      try {
        // Fetch brand
        const brandRef = doc(db, 'brands', id);
        const brandDoc = await getDoc(brandRef);
        
        if (!brandDoc.exists()) {
          console.error('Brand not found');
          navigate('/admin/brands');
          return;
        }
        
        const brandData = { id: brandDoc.id, ...brandDoc.data() };
        setBrand(brandData);
        
        // Fetch templates for this brand
        const templatesQuery = query(
          collection(db, 'templates'),
          where('brandId', '==', id)
        );
        
        const templatesSnapshot = await getDocs(templatesQuery);
        const templatesList = templatesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Also fetch global templates
        const globalTemplatesQuery = query(
          collection(db, 'templates'),
          where('isGlobal', '==', true)
        );
        
        const globalTemplatesSnapshot = await getDocs(globalTemplatesQuery);
        const globalTemplates = globalTemplatesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isGlobal: true
        }));
        
        // Combine brand-specific and global templates
        setTemplates([...templatesList, ...globalTemplates]);
        
      } catch (error) {
        console.error('Error fetching brand data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBrandAndTemplates();
  }, [id, navigate]);
  
  if (loading) {
    return (
      <AdminLayout requireSuperAdmin={false}>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading brand data...</p>
        </div>
      </AdminLayout>
    );
  }
  
  if (!brand) {
    return (
      <AdminLayout requireSuperAdmin={false}>
        <div className="text-center py-8 text-red-600">Brand not found</div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout requireSuperAdmin={false}>
      <div className="max-w-7xl mx-auto">
        {/* Brand Header */}
        <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between">
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-lg bg-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden mr-4">
                  {brand.logoUrl ? (
                    <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-500 font-bold text-xl">{brand.name?.charAt(0) || '?'}</span>
                  )}
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold">{brand.name}</h1>
                  {brand.website && (
                    <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                      {brand.website}
                    </a>
                  )}
                </div>
              </div>
              
              <div className="space-x-2">
                <button
                  onClick={() => navigate('/admin/brands')}
                  className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Back to Brands
                </button>
                
                {permissions.canManageBrands && (
                  <button
                    onClick={() => navigate(`/admin/brands/${id}/edit`)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit Brand
                  </button>
                )}
              </div>
            </div>
            
            {brand.description && (
              <div className="mt-4 text-gray-600">
                {brand.description}
              </div>
            )}
            
            <div className="mt-6 border-t pt-4">
              <div className="flex flex-wrap gap-4">
                <div>
                  <span className="text-sm text-gray-500">Manager</span>
                  <p className="font-medium">
                    {brand.managerName || 'No manager assigned'}
                  </p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500">Created</span>
                  <p className="font-medium">
                    {brand.createdAt?.toDate().toLocaleDateString() || 'Unknown date'}
                  </p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-500">Available Templates</span>
                  <p className="font-medium">{templates.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Templates Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Available Templates</h2>
            
            {permissions.canCreateTemplate && (
              <button
                onClick={() => navigate('/admin/templates/new')}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Create Template
              </button>
            )}
          </div>
          
          <div className="p-6">
            {templates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                  <div key={template.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                          template.type === 'lesson'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {template.type === 'lesson' ? 'Lesson' : 'Community'}
                        </span>
                        
                        {template.isGlobal && (
                          <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Global
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-medium mt-2">{template.name}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mt-1">{template.description || 'No description'}</p>
                    </div>
                    
                    <div className="bg-gray-50 px-4 py-3 border-t">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate(`/admin/templates/${template.id}/view`)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View Template
                        </button>
                        
                        <button
                          onClick={() => navigate(`/admin/brands/${id}/content/new?templateId=${template.id}`)}
                          className="text-sm text-green-600 hover:text-green-800"
                        >
                          Create Content
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No templates available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Either create brand-specific templates or make existing templates global.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}