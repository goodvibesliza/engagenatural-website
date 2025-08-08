// src/pages/admin/AdminTemplatesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase.old';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import { usePermissions } from '../../hooks/usePermissions';
import { seedTemplates } from '../../utils/seedFirestore';

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'lesson', 'community'
  const navigate = useNavigate();
  const permissions = usePermissions();
  
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        // Create query based on filter
        let templatesQuery;
        if (filter === 'all') {
          templatesQuery = collection(db, 'templates');
        } else {
          templatesQuery = query(
            collection(db, 'templates'), 
            where('type', '==', filter)
          );
        }
        
        const snapshot = await getDocs(templatesQuery);
        const templateList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setTemplates(templateList);
      } catch (error) {
        console.error("Error fetching templates:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, [filter]);
  
  const handleSeedData = async () => {
    if (window.confirm('This will create sample templates in your database. Continue?')) {
      const success = await seedTemplates();
      if (success) {
        // Reload templates after seeding
        window.location.reload();
      }
    }
  };
  
  return (
    <AdminLayout requireSuperAdmin={true}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Content Templates</h1>
          <div className="space-x-2">
            {permissions.canCreateTemplate && (
              <button
                onClick={() => navigate('/admin/templates/new')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create Template
              </button>
            )}
            
            {/* For development only - seed data button */}
            {window.location.hostname === 'localhost' && templates.length === 0 && (
              <button
                onClick={handleSeedData}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Seed Test Data
              </button>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filter === 'all'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                All Templates
              </button>
              <button
                onClick={() => setFilter('lesson')}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filter === 'lesson'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Lesson Templates
              </button>
              <button
                onClick={() => setFilter('community')}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filter === 'community'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Community Templates
              </button>
            </div>
          </div>
          
          <div className="p-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Loading templates...</p>
              </div>
            ) : templates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                  <TemplateCard 
                    key={template.id} 
                    template={template} 
                    onEdit={() => navigate(`/admin/templates/${template.id}/edit`)}
                    onView={() => navigate(`/admin/templates/${template.id}/view`)}
                    canEdit={permissions.canEditTemplate}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No templates found. Create your first template to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Template Card Component
function TemplateCard({ template, onEdit, onView, canEdit }) {
  const getBadgeColor = type => {
    return type === 'lesson'
      ? 'bg-green-100 text-green-800'
      : 'bg-purple-100 text-purple-800';
  };
  
  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden hover:shadow transition-shadow duration-200">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getBadgeColor(template.type)}`}>
            {template.type === 'lesson' ? 'Lesson' : 'Community'}
          </span>
          {template.isGlobal && (
            <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
              Global
            </span>
          )}
        </div>
        
        <h3 className="text-lg font-semibold mt-2">{template.name}</h3>
        
        <p className="text-gray-600 mt-1 text-sm line-clamp-2">{template.description}</p>
        
        <div className="mt-3 text-xs text-gray-500">
          {template.sections?.length || 0} sections
        </div>
      </div>
      
      <div className="px-5 py-3 bg-gray-50 border-t flex justify-between">
        <button
          onClick={onView}
          className="text-sm text-gray-700 hover:text-gray-900 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Preview
        </button>
        
        {canEdit && (
          <button
            onClick={onEdit}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        )}
      </div>
    </div>
  );
}