// src/pages/brand/BrandTemplatesPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/auth-context';
import BrandManagerLayout from '../../components/brand/BrandManagerLayout';

export default function BrandTemplatesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  
  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        const brandId = localStorage.getItem('selectedBrandId');
        
        if (!brandId) {
          console.error('No selected brand');
          setTemplates([]);
          setFilteredTemplates([]);
          setLoading(false);
          return;
        }
        
        // Query brand-specific templates
        const brandTemplatesQuery = query(
          collection(db, 'templates'),
          where('brandId', '==', brandId)
        );
        
        // Query global templates
        const globalTemplatesQuery = query(
          collection(db, 'templates'),
          where('isGlobal', '==', true)
        );
        
        // Execute both queries
        const [brandTemplatesSnapshot, globalTemplatesSnapshot] = await Promise.all([
          getDocs(brandTemplatesQuery),
          getDocs(globalTemplatesQuery)
        ]);
        
        // Process results
        const brandTemplates = brandTemplatesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isBrandSpecific: true
        }));
        
        const globalTemplates = globalTemplatesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isGlobal: true
        }));
        
        // Combine templates
        const allTemplates = [...brandTemplates, ...globalTemplates];
        setTemplates(allTemplates);
        setFilteredTemplates(allTemplates);
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, [user]);
  
  // Filter templates when search term or type changes
  useEffect(() => {
    let filtered = templates;
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        template => template.name?.toLowerCase().includes(term) || 
                    template.description?.toLowerCase().includes(term)
      );
    }
    
    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(template => template.type === selectedType);
    }
    
    setFilteredTemplates(filtered);
  }, [searchTerm, selectedType, templates]);
  
  const handleUseTemplate = (template) => {
    navigate(`/brand/content/new?templateId=${template.id}`);
  };
  
  return (
    <BrandManagerLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Templates</h1>
        <p className="text-gray-600">Browse available templates for your brand content</p>
      </div>
      
      {/* Search and filter */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">
              Search templates
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                id="search"
                name="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search templates..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Types</option>
              <option value="lesson">Lessons</option>
              <option value="community">Community</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Templates grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="sr-only">Loading...</span>
        </div>
      ) : filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between">
                  <div className="flex space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      template.type === 'lesson'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {template.type === 'lesson' ? 'Lesson' : 'Community'}
                    </span>
                    
                    {template.isGlobal && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Global
                      </span>
                    )}
                    
                    {template.isBrandSpecific && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Brand
                      </span>
                    )}
                  </div>
                </div>
                
                <h3 className="mt-3 text-lg font-medium text-gray-900">{template.name || 'Untitled Template'}</h3>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{template.description || 'No description available'}</p>
                
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Use Template
                  </button>
                  <button
                    onClick={() => navigate(`/brand/templates/${template.id}`)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Preview
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedType !== 'all'
              ? 'Try adjusting your search filters.'
              : 'No templates are available for your brand yet.'}
          </p>
        </div>
      )}
    </BrandManagerLayout>
  );
}