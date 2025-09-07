// src/pages/brand/BrandTemplateViewPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import BrandManagerLayout from '../../components/brand/BrandManagerLayout';

export default function BrandTemplateViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop' or 'mobile'
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' or 'structure'
  
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        
        const templateRef = doc(db, 'templates', id);
        const templateDoc = await getDoc(templateRef);
        
        if (!templateDoc.exists()) {
          setError('Template not found');
          return;
        }
        
        setTemplate({
          id: templateDoc.id,
          ...templateDoc.data()
        });
      } catch (error) {
        console.error('Error fetching template:', error);
        setError('Failed to load template');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplate();
  }, [id]);
  
  const handleUseTemplate = () => {
    navigate(`/brand/content/new?templateId=${id}`);
  };
  
  // Render a section based on its type
  const renderSection = (section, index) => {
    switch (section.type) {
      case 'header':
        return (
          <div key={index} className="mb-6">
            <h2 className="text-2xl font-bold">{section.title}</h2>
            {section.subtitle && <p className="text-gray-600">{section.subtitle}</p>}
          </div>
        );
        
      case 'text':
        return (
          <div key={index} className="mb-4">
            <p>{section.content}</p>
          </div>
        );
        
      case 'image':
        return (
          <div key={index} className="mb-6">
            <div className="bg-gray-200 rounded-lg flex items-center justify-center h-48">
              {section.imageUrl ? (
                <img 
                  src={section.imageUrl} 
                  alt={section.alt || 'Template image'} 
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-gray-400 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>Image Placeholder</p>
                </div>
              )}
            </div>
            {section.caption && (
              <p className="text-sm text-gray-500 mt-1">{section.caption}</p>
            )}
          </div>
        );
        
      case 'video':
        return (
          <div key={index} className="mb-6">
            <div className="bg-gray-200 rounded-lg flex items-center justify-center h-48">
              {section.videoUrl ? (
                <div className="w-full h-full">
                  <div className="relative pb-16:9 h-full">
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={section.videoUrl}
                      title={section.title || 'Video content'}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p>Video Placeholder</p>
                </div>
              )}
            </div>
            {section.caption && (
              <p className="text-sm text-gray-500 mt-1">{section.caption}</p>
            )}
          </div>
        );
        
      case 'list':
        return (
          <div key={index} className="mb-4">
            {section.title && <h3 className="text-lg font-medium mb-2">{section.title}</h3>}
            <ul className="list-disc pl-5 space-y-1">
              {section.items?.map((item, i) => (
                <li key={i}>{item}</li>
              )) || <li>Sample list item</li>}
            </ul>
          </div>
        );
        
      case 'quote':
        return (
          <div key={index} className="mb-6">
            <blockquote className="border-l-4 border-gray-300 pl-4 italic">
              {section.content}
              {section.attribution && (
                <footer className="text-sm text-gray-600 mt-1">— {section.attribution}</footer>
              )}
            </blockquote>
          </div>
        );
        
      default:
        return (
          <div key={index} className="mb-4 p-3 bg-gray-100 rounded">
            <p className="text-gray-600">[{section.type || 'Unknown'} Section]</p>
          </div>
        );
    }
  };
  
  // Render structure tab content
  const renderStructureTab = () => {
    return (
      <div className="space-y-4">
        {template?.sections?.map((section, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-gray-700 capitalize">{section.type} Section</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Section {index + 1}</span>
            </div>
            
            <div className="text-sm text-gray-600">
              {section.type === 'header' && (
                <>
                  <p><strong>Title:</strong> {section.title || '[No title]'}</p>
                  {section.subtitle && <p><strong>Subtitle:</strong> {section.subtitle}</p>}
                </>
              )}
              
              {section.type === 'text' && (
                <p><strong>Content:</strong> {section.content?.substring(0, 100)}...</p>
              )}
              
              {section.type === 'image' && (
                <>
                  <p><strong>Image URL:</strong> {section.imageUrl || '[Placeholder]'}</p>
                  {section.caption && <p><strong>Caption:</strong> {section.caption}</p>}
                </>
              )}
              
              {section.type === 'video' && (
                <>
                  <p><strong>Video URL:</strong> {section.videoUrl || '[Placeholder]'}</p>
                  {section.caption && <p><strong>Caption:</strong> {section.caption}</p>}
                </>
              )}
              
              {section.type === 'list' && (
                <>
                  {section.title && <p><strong>Title:</strong> {section.title}</p>}
                  <p><strong>Items:</strong> {section.items?.length || 0} item(s)</p>
                </>
              )}
              
              {section.type === 'quote' && (
                <>
                  <p><strong>Content:</strong> {section.content?.substring(0, 100)}...</p>
                  {section.attribution && <p><strong>Attribution:</strong> {section.attribution}</p>}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  if (loading) {
    return (
      <BrandManagerLayout>
        <div className="flex justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="sr-only">Loading...</span>
        </div>
      </BrandManagerLayout>
    );
  }
  
  if (error) {
    return (
      <BrandManagerLayout>
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">{error}</h3>
          <div className="mt-6">
            <button
              onClick={() => navigate('/brand/templates')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Templates
            </button>
          </div>
        </div>
      </BrandManagerLayout>
    );
  }
  
  return (
    <BrandManagerLayout>
      {/* Template header with actions */}
      <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <div className="flex space-x-2 items-center mb-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                template?.type === 'lesson'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {template?.type === 'lesson' ? 'Lesson' : 'Community'}
              </span>
              
              {template?.isGlobal && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Global
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{template?.name || 'Untitled Template'}</h1>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/brand/templates')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back
            </button>
            
            <button
              onClick={handleUseTemplate}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Use Template
            </button>
          </div>
        </div>
        
        {/* Template description */}
        {template?.description && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <p className="text-sm text-gray-600">{template.description}</p>
          </div>
        )}
        
        {/* View tabs */}
        <div className="px-6 py-2 bg-white border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-2 text-sm font-medium border-b-2 ${
                activeTab === 'preview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Preview
            </button>
            
            <button
              onClick={() => setActiveTab('structure')}
              className={`py-2 text-sm font-medium border-b-2 ${
                activeTab === 'structure'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Template Structure
            </button>
          </div>
        </div>
      </div>
      
      {/* Display controls for preview */}
      {activeTab === 'preview' && (
        <div className="bg-white shadow rounded-lg p-4 mb-6 flex justify-center">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                previewMode === 'desktop'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Desktop Preview
            </button>
            
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                previewMode === 'mobile'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Mobile Preview
            </button>
          </div>
        </div>
      )}
      
      {/* Preview content */}
      {activeTab === 'preview' && (
        <div className={`bg-white shadow rounded-lg overflow-hidden ${
          previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''
        }`}>
          <div className="p-6">
            {template?.sections?.length > 0 ? (
              template.sections.map(renderSection)
            ) : (
              <div className="text-center py-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No content sections</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This template doesn't have any content sections defined.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Structure tab */}
      {activeTab === 'structure' && (
        <div className="bg-white shadow rounded-lg overflow-hidden p-6">
          {template?.sections?.length > 0 ? (
            renderStructureTab()
          ) : (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No template structure</h3>
              <p className="mt-1 text-sm text-gray-500">
                This template doesn't have any structure defined.
              </p>
            </div>
          )}
        </div>
      )}
    </BrandManagerLayout>
  );
}