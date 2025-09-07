// src/pages/brand/BrandContentViewPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import BrandManagerLayout from '../../components/brand/BrandManagerLayout';

export default function BrandContentViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('desktop'); // 'desktop' or 'mobile'
  
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        
        const contentRef = doc(db, 'content', id);
        const contentDoc = await getDoc(contentRef);
        
        if (!contentDoc.exists()) {
          setError('Content not found');
          return;
        }
        
        setContent({
          id: contentDoc.id,
          ...contentDoc.data(),
          // Convert timestamps to JS dates for easier handling
          createdAt: contentDoc.data().createdAt?.toDate(),
          updatedAt: contentDoc.data().updatedAt?.toDate(),
          publishedAt: contentDoc.data().publishedAt?.toDate()
        });
      } catch (error) {
        console.error('Error fetching content:', error);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContent();
  }, [id]);
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
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
            <div className="rounded-lg overflow-hidden">
              {section.imageUrl ? (
                <img 
                  src={section.imageUrl} 
                  alt={section.alt || 'Content image'} 
                  className="w-full object-cover"
                />
              ) : (
                <div className="bg-gray-200 h-48 flex items-center justify-center">
                  <div className="text-gray-400 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>Image Placeholder</p>
                  </div>
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
            {section.videoUrl ? (
              <div className="aspect-w-16 aspect-h-9">
                <iframe
                  className="w-full h-full rounded-lg"
                  src={section.videoUrl}
                  title="Video content"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center">
                <div className="text-gray-400 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p>Video Placeholder</p>
                </div>
              </div>
            )}
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
              onClick={() => navigate('/brand/content')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Back to Content
            </button>
          </div>
        </div>
      </BrandManagerLayout>
    );
  }
  
  return (
    <BrandManagerLayout>
      {/* Content header with actions */}
      <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <div className="flex space-x-2 items-center mb-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                content?.type === 'lesson'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {content?.type === 'lesson' ? 'Lesson' : 'Community'}
              </span>
              
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                content?.status === 'published'
                  ? 'bg-green-100 text-green-800'
                  : content?.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
              }`}>
                {content?.status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{content?.title || 'Untitled Content'}</h1>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/brand/content')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back
            </button>
            
            <button
              onClick={() => navigate(`/brand/content/${id}/edit`)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Edit
            </button>
          </div>
        </div>
        
        {/* Content metadata */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Last updated:</span>{' '}
              <span className="font-medium">{formatDate(content?.updatedAt)}</span>
            </div>
            
            <div>
              <span className="text-gray-500">Created:</span>{' '}
              <span className="font-medium">{formatDate(content?.createdAt)}</span>
            </div>
            
            {content?.status === 'published' && (
              <div>
                <span className="text-gray-500">Published:</span>{' '}
                <span className="font-medium">{formatDate(content?.publishedAt)}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Content description */}
        {content?.description && (
          <div className="px-6 py-3 bg-white border-b border-gray-200">
            <p className="text-sm text-gray-600">{content.description}</p>
          </div>
        )}
      </div>
      
      {/* Display controls */}
      <div className="bg-white shadow rounded-lg p-4 mb-6 flex justify-center">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          <button
            onClick={() => setViewMode('desktop')}
            className={`px-4 py-2 text-sm font-medium rounded-l-md ${
              viewMode === 'desktop'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Desktop View
          </button>
          
          <button
            onClick={() => setViewMode('mobile')}
            className={`px-4 py-2 text-sm font-medium rounded-r-md ${
              viewMode === 'mobile'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Mobile View
          </button>
        </div>
      </div>
      
      {/* Content preview */}
      <div className={`bg-white shadow rounded-lg overflow-hidden ${
        viewMode === 'mobile' ? 'max-w-sm mx-auto' : ''
      }`}>
        <div className="p-6">
          {content?.sections?.length > 0 ? (
            content.sections.map(renderSection)
          ) : (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No content sections</h3>
              <p className="mt-1 text-sm text-gray-500">
                This content doesn't have any sections defined.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Analytics preview (placeholder for now) */}
      {content?.status === 'published' && (
        <div className="bg-white shadow rounded-lg mt-6 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Content Performance</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Views</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Engagement</p>
              <p className="text-2xl font-bold">0%</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Avg. Time</p>
              <p className="text-2xl font-bold">0 min</p>
            </div>
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Analytics data will appear here once your content receives views.
            </p>
          </div>
        </div>
      )}
    </BrandManagerLayout>
  );
}