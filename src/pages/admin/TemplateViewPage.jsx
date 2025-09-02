// src/pages/admin/TemplateViewPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import { useAuth } from '../../contexts/auth-context';

export default function TemplateViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userRoles } = useAuth();
  
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('desktop'); // 'desktop' or 'mobile'
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' or 'structure'
  const [error, setError] = useState(null);
  
  const isSuperAdmin = userRoles?.includes('super_admin');
  
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        if (!id) {
          throw new Error('Template ID is required');
        }
        
        const templateRef = doc(db, 'templates', id);
        const templateDoc = await getDoc(templateRef);
        
        if (templateDoc.exists()) {
          setTemplate({
            id: templateDoc.id,
            ...templateDoc.data()
          });
        } else {
          setError("Template not found");
          console.error("Template not found");
        }
      } catch (error) {
        setError(`Error loading template: ${error.message}`);
        console.error("Error fetching template:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplate();
  }, [id]);
  
  if (loading) {
    return (
      <AdminLayout requireSuperAdmin={false}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-2">Loading template...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  if (error) {
    return (
      <AdminLayout requireSuperAdmin={false}>
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <button 
              onClick={() => navigate('/admin/templates')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Templates
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  if (!template) {
    return (
      <AdminLayout requireSuperAdmin={false}>
        <div className="text-center py-8 text-red-600">Template not found</div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout requireSuperAdmin={false}>
      <div className="max-w-7xl mx-auto">
        {/* Template Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">{template.name}</h1>
            <div className="flex items-center mt-1 space-x-2">
              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                template.type === 'lesson'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {template.type === 'lesson' ? 'Lesson Template' : 'Community Template'}
              </span>
              
              {template.isGlobal && (
                <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  Global Template
                </span>
              )}
            </div>
          </div>
          
          <div className="space-x-2">
            <button
              onClick={() => navigate('/admin/templates')}
              className="px-3 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Back to Templates
            </button>
            
            {isSuperAdmin && (
              <button
                onClick={() => navigate(`/admin/templates/${id}/edit`)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit Template
              </button>
            )}
          </div>
        </div>
        
        {/* Description */}
        {template.description && (
          <div className="mb-6">
            <p className="text-gray-600">{template.description}</p>
          </div>
        )}
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('preview')}
              className={`pb-4 px-1 ${
                activeTab === 'preview'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab('structure')}
              className={`pb-4 px-1 ${
                activeTab === 'structure'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Template Structure
            </button>
          </nav>
        </div>
        
        {activeTab === 'preview' ? (
          <div>
            {/* Device selector */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  onClick={() => setViewMode('desktop')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                    viewMode === 'desktop'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Desktop
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('mobile')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                    viewMode === 'mobile'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Mobile
                  </span>
                </button>
              </div>
            </div>
            
            {/* Preview container */}
            <div className="flex justify-center pb-12">
              <div className={`${
                viewMode === 'mobile' 
                  ? 'w-full max-w-xs'
                  : 'w-full max-w-4xl'
              } transition-all duration-300`}>
                <div className={`bg-white border rounded-lg shadow-lg overflow-hidden ${
                  viewMode === 'mobile' ? 'mx-auto' : ''
                }`}>
                  {viewMode === 'mobile' && (
                    <div className="h-6 bg-gray-800 flex justify-center items-center rounded-t-lg">
                      <div className="w-20 h-1 bg-gray-600 rounded-full"></div>
                    </div>
                  )}
                  
                  <div className={`${viewMode === 'mobile' ? 'p-3' : 'p-6'}`}>
                    <h2 className="text-lg font-bold mb-4 text-center border-b pb-2">
                      {template.name}
                    </h2>
                    
                    {/* Render template sections */}
                    {template.sections && template.sections.length > 0 ? (
                      <div className="space-y-6">
                        {template.sections.map((section) => (
                          <TemplateSectionPreview
                            key={section.id}
                            section={section}
                            viewMode={viewMode}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 italic">
                        This template has no sections defined yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4 border-b pb-2">Template Structure</h2>
              
              {template.sections && template.sections.length > 0 ? (
                <div className="space-y-4">
                  {template.sections.map((section, index) => (
                    <div key={section.id} className="border border-gray-200 rounded-md p-4">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center">
                          <span className="bg-gray-100 text-gray-700 w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 text-sm">
                            {index + 1}
                          </span>
                          <span className="font-medium">{section.title}</span>
                          {section.required && (
                            <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              Required
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500 font-medium">
                          {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
                        </span>
                      </div>
                      
                      {section.placeholder && (
                        <div className="text-sm text-gray-600 mt-1">
                          <p className="italic">Placeholder: "{section.placeholder}"</p>
                        </div>
                      )}
                      
                      {/* Type-specific displays */}
                      {section.type === 'quiz' && section.quizConfig && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-sm text-gray-600">
                            Quiz with {section.quizConfig.minQuestions || 1} to {section.quizConfig.maxQuestions || 5} questions
                            {section.quizConfig.passingScore && 
                              ` (${section.quizConfig.passingScore}% passing score)`}
                          </p>
                        </div>
                      )}
                      
                      {section.type === 'discussion' && section.discussionConfig && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-sm text-gray-600">
                            Discussion board
                            {section.discussionConfig.requireApproval ? 
                              ' (posts require approval)' : ' (open posting)'}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">This template has no sections defined yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Component to render individual template sections in the preview
function TemplateSectionPreview({ section, viewMode }) {
  // Render based on section type
  switch(section.type) {
    case 'text':
      return (
        <div className="border border-gray-200 rounded-md p-4">
          <h3 className="font-medium text-gray-800 mb-2">{section.title}</h3>
          <div className="prose max-w-none">
            <p className="text-gray-500 italic">{section.placeholder || 'Text content will appear here'}</p>
          </div>
        </div>
      );
      
    case 'image':
      return (
        <div className="border border-gray-200 rounded-md p-4">
          <h3 className="font-medium text-gray-800 mb-2">{section.title}</h3>
          <div className={`bg-gray-100 rounded-md flex items-center justify-center ${viewMode === 'mobile' ? 'h-40' : 'h-64'}`}>
            <div className="text-gray-400 flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="mt-2">{section.placeholder || 'Image will appear here'}</span>
            </div>
          </div>
        </div>
      );
      
    case 'video':
      return (
        <div className="border border-gray-200 rounded-md p-4">
          <h3 className="font-medium text-gray-800 mb-2">{section.title}</h3>
          <div className={`bg-gray-100 rounded-md flex items-center justify-center ${viewMode === 'mobile' ? 'h-48' : 'h-72'}`}>
            <div className="text-gray-400 flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="mt-2">{section.placeholder || 'Video will appear here'}</span>
            </div>
          </div>
        </div>
      );
      
    case 'quiz':
      return (
        <div className="border border-gray-200 rounded-md p-4">
          <h3 className="font-medium text-gray-800 mb-2">{section.title}</h3>
          <div className="bg-blue-50 rounded-md p-4">
            <p className="font-medium text-blue-800 mb-2">Sample Quiz Question</p>
            <div className="space-y-2">
              <div className="flex items-center">
                <input type="radio" id="option-1" name="sample-quiz" className="h-4 w-4 text-blue-600" />
                <label htmlFor="option-1" className="ml-2 text-gray-700">Answer option 1</label>
              </div>
              <div className="flex items-center">
                <input type="radio" id="option-2" name="sample-quiz" className="h-4 w-4 text-blue-600" />
                <label htmlFor="option-2" className="ml-2 text-gray-700">Answer option 2</label>
              </div>
              <div className="flex items-center">
                <input type="radio" id="option-3" name="sample-quiz" className="h-4 w-4 text-blue-600" />
                <label htmlFor="option-3" className="ml-2 text-gray-700">Answer option 3</label>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              {section.quizConfig ? (
                <p>{section.quizConfig.minQuestions || 1} to {section.quizConfig.maxQuestions || 5} questions with {section.quizConfig.passingScore || 70}% passing score</p>
              ) : (
                <p>Quiz settings not configured</p>
              )}
            </div>
          </div>
        </div>
      );
      
    case 'discussion':
      return (
        <div className="border border-gray-200 rounded-md p-4">
          <h3 className="font-medium text-gray-800 mb-2">{section.title}</h3>
          <div className="bg-purple-50 rounded-md p-4">
            <div className="border-b pb-2 mb-3">
              <p className="font-medium">Discussion Topics</p>
            </div>
            <div className="space-y-2">
              <div className="p-2 bg-white rounded border border-gray-200">
                <p className="font-medium">Sample Discussion Topic</p>
                <p className="text-sm text-gray-500">Started by User • 2 replies</p>
              </div>
              <div className="p-2 bg-white rounded border border-gray-200">
                <p className="font-medium">Another Discussion Topic</p>
                <p className="text-sm text-gray-500">Started by User • 5 replies</p>
              </div>
            </div>
            <button className="mt-3 text-sm text-purple-600 font-medium">+ New Topic</button>
          </div>
        </div>
      );
      
    case 'events':
      return (
        <div className="border border-gray-200 rounded-md p-4">
          <h3 className="font-medium text-gray-800 mb-2">{section.title}</h3>
          <div className="bg-green-50 rounded-md p-4">
            <div className="border-b pb-2 mb-3">
              <p className="font-medium">Upcoming Events</p>
            </div>
            <div className="space-y-2">
              <div className="p-2 bg-white rounded border border-gray-200">
                <p className="font-medium">Virtual Meetup</p>
                <p className="text-sm text-gray-500">July 15, 2025 • 3:00 PM</p>
              </div>
              <div className="p-2 bg-white rounded border border-gray-200">
                <p className="font-medium">Workshop</p>
                <p className="text-sm text-gray-500">July 22, 2025 • 10:00 AM</p>
              </div>
            </div>
            <button className="mt-3 text-sm text-green-600 font-medium">+ New Event</button>
          </div>
        </div>
      );
      
    case 'resources':
      return (
        <div className="border border-gray-200 rounded-md p-4">
          <h3 className="font-medium text-gray-800 mb-2">{section.title}</h3>
          <div className="bg-amber-50 rounded-md p-4">
            <div className="border-b pb-2 mb-3">
              <p className="font-medium">Resources</p>
            </div>
            <div className="space-y-2">
              <div className="p-2 bg-white rounded border border-gray-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p>Sample PDF Resource</p>
              </div>
              <div className="p-2 bg-white rounded border border-gray-200 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <p>External Reference Link</p>
              </div>
            </div>
            <button className="mt-3 text-sm text-amber-600 font-medium">+ Add Resource</button>
          </div>
        </div>
      );
      
    default:
      return (
        <div className="border border-gray-200 rounded-md p-4">
          <h3 className="font-medium text-gray-800 mb-2">{section.title}</h3>
          <p className="text-gray-500 italic">
            {section.placeholder || `${section.type} content will appear here`}
          </p>
        </div>
      );
  }
}