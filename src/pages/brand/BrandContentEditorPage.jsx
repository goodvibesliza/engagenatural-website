// src/pages/brand/BrandContentEditorPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/auth-context';
import BrandManagerLayout from '../../components/brand/BrandManagerLayout';

export default function BrandContentEditorPage() {
  const { id } = useParams(); // Will be undefined for new content
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get template ID from query params if creating new content
  const queryParams = new URLSearchParams(location.search);
  const templateId = queryParams.get('templateId');
  
  const [content, setContent] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState([]);
  const [status, setStatus] = useState('draft');
  
  // Initialize editor with existing content or template
  useEffect(() => {
    const initializeEditor = async () => {
      try {
        setLoading(true);
        
        // Get the brand ID
        const brandId = localStorage.getItem('selectedBrandId');
        if (!brandId) {
          setError('No brand selected');
          return;
        }
        
        if (id) {
          // Editing existing content
          const contentRef = doc(db, 'content', id);
          const contentDoc = await getDoc(contentRef);
          
          if (!contentDoc.exists()) {
            setError('Content not found');
            return;
          }
          
          const contentData = {
            id: contentDoc.id,
            ...contentDoc.data()
          };
          
          setContent(contentData);
          setTitle(contentData.title || '');
          setDescription(contentData.description || '');
          setSections(contentData.sections || []);
          setStatus(contentData.status || 'draft');
          
          // Also load the template if available
          if (contentData.templateId) {
            const templateRef = doc(db, 'templates', contentData.templateId);
            const templateDoc = await getDoc(templateRef);
            
            if (templateDoc.exists()) {
              setTemplate({
                id: templateDoc.id,
                ...templateDoc.data()
              });
            }
          }
        } else if (templateId) {
          // Creating new content from template
          const templateRef = doc(db, 'templates', templateId);
          const templateDoc = await getDoc(templateRef);
          
          if (!templateDoc.exists()) {
            setError('Template not found');
            return;
          }
          
          const templateData = {
            id: templateDoc.id,
            ...templateDoc.data()
          };
          
          setTemplate(templateData);
          setTitle(templateData.defaultTitle || '');
          setDescription(templateData.defaultDescription || '');
          setSections(templateData.sections?.map(section => ({...section})) || []);
          setStatus('draft');
        } else {
          // Creating new content without template
          setTitle('');
          setDescription('');
          setSections([]);
          setStatus('draft');
        }
      } catch (error) {
        console.error('Error initializing editor:', error);
        setError('Failed to load editor');
      } finally {
        setLoading(false);
      }
    };
    
    initializeEditor();
  }, [id, templateId, user]);
  
  const handleAddSection = (type) => {
    // Add a new section based on type
    const newSection = { type };
    
    switch (type) {
      case 'header':
        newSection.title = '';
        newSection.subtitle = '';
        break;
      case 'text':
        newSection.content = '';
        break;
      case 'image':
        newSection.imageUrl = '';
        newSection.alt = '';
        newSection.caption = '';
        break;
      case 'video':
        newSection.videoUrl = '';
        newSection.caption = '';
        break;
      case 'list':
        newSection.title = '';
        newSection.items = [''];
        break;
      case 'quote':
        newSection.content = '';
        newSection.attribution = '';
        break;
    }
    
    setSections([...sections, newSection]);
  };
  
  const handleUpdateSection = (index, field, value) => {
    const updatedSections = [...sections];
    updatedSections[index] = {
      ...updatedSections[index],
      [field]: value
    };
    setSections(updatedSections);
  };
  
  const handleUpdateListItem = (sectionIndex, itemIndex, value) => {
    const updatedSections = [...sections];
    const updatedItems = [...updatedSections[sectionIndex].items];
    updatedItems[itemIndex] = value;
    updatedSections[sectionIndex].items = updatedItems;
    setSections(updatedSections);
  };
  
  const handleAddListItem = (sectionIndex) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].items.push('');
    setSections(updatedSections);
  };
  
  const handleRemoveListItem = (sectionIndex, itemIndex) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].items.splice(itemIndex, 1);
    setSections(updatedSections);
  };
  
  const handleRemoveSection = (index) => {
    const updatedSections = [...sections];
    updatedSections.splice(index, 1);
    setSections(updatedSections);
  };
  
  const handleMoveSection = (index, direction) => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === sections.length - 1)
    ) {
      return;
    }
    
    const updatedSections = [...sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap sections
    [updatedSections[index], updatedSections[newIndex]] = 
      [updatedSections[newIndex], updatedSections[index]];
    
    setSections(updatedSections);
  };
  
  const handleSave = async (saveStatus = status) => {
    try {
      setSaving(true);
      
      const brandId = localStorage.getItem('selectedBrandId');
      if (!brandId) {
        setError('No brand selected');
        return;
      }
      
      // Validate required fields
      if (!title.trim()) {
        setError('Title is required');
        return;
      }
      
      // Prepare content data
      const contentData = {
        title: title.trim(),
        description: description.trim(),
        sections,
        status: saveStatus,
        brandId,
        templateId: template?.id || null,
        type: template?.type || 'lesson',
        updatedAt: serverTimestamp(),
        updatedBy: user.uid,
      };
      
      if (saveStatus === 'published' && !content?.publishedAt) {
        contentData.publishedAt = serverTimestamp();
      }
      
      let savedContentId;
      
      if (id) {
        // Update existing content
        await updateDoc(doc(db, 'content', id), contentData);
        savedContentId = id;
      } else {
        // Create new content
        contentData.createdAt = serverTimestamp();
        contentData.createdBy = user.uid;
        
        const docRef = await addDoc(collection(db, 'content'), contentData);
        savedContentId = docRef.id;
      }
      
      // Navigate based on action
      if (saveStatus === 'published') {
        navigate(`/brand/content/${savedContentId}`);
      } else {
        navigate('/brand/content');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      setError('Failed to save content');
    } finally {
      setSaving(false);
    }
  };
  
  // Render section editor based on type
  const renderSectionEditor = (section, index) => {
    const commonSectionControls = (
      <div className="flex justify-end space-x-2 mt-2">
        <button
          type="button"
          onClick={() => handleMoveSection(index, 'up')}
          disabled={index === 0}
          className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => handleMoveSection(index, 'down')}
          disabled={index === sections.length - 1}
          className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => handleRemoveSection(index)}
          className="p-1 rounded text-red-500 hover:bg-red-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    );
    
    switch (section.type) {
      case 'header':
        return (
          <div key={index} className="bg-white p-4 rounded-lg shadow mb-4 border-l-4 border-blue-500">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-medium text-gray-700">Header Section</h3>
              {commonSectionControls}
            </div>
            
            <div className="mb-3">
              <label htmlFor={`header-title-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                id={`header-title-${index}`}
                value={section.title || ''}
                onChange={(e) => handleUpdateSection(index, 'title', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter header title"
              />
            </div>
            
            <div>
              <label htmlFor={`header-subtitle-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                Subtitle (optional)
              </label>
              <input
                type="text"
                id={`header-subtitle-${index}`}
                value={section.subtitle || ''}
                onChange={(e) => handleUpdateSection(index, 'subtitle', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter subtitle"
              />
            </div>
          </div>
        );
        
      case 'text':
        return (
          <div key={index} className="bg-white p-4 rounded-lg shadow mb-4 border-l-4 border-green-500">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-medium text-gray-700">Text Section</h3>
              {commonSectionControls}
            </div>
            
            <div>
              <label htmlFor={`text-content-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                id={`text-content-${index}`}
                value={section.content || ''}
                onChange={(e) => handleUpdateSection(index, 'content', e.target.value)}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter text content"
              />
            </div>
          </div>
        );
        
      case 'image':
        return (
          <div key={index} className="bg-white p-4 rounded-lg shadow mb-4 border-l-4 border-purple-500">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-medium text-gray-700">Image Section</h3>
              {commonSectionControls}
            </div>
            
            <div className="mb-3">
              <label htmlFor={`image-url-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="text"
                id={`image-url-${index}`}
                value={section.imageUrl || ''}
                onChange={(e) => handleUpdateSection(index, 'imageUrl', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter image URL"
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor={`image-alt-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                Alt Text
              </label>
              <input
                type="text"
                id={`image-alt-${index}`}
                value={section.alt || ''}
                onChange={(e) => handleUpdateSection(index, 'alt', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the image for accessibility"
              />
            </div>
            
            <div>
              <label htmlFor={`image-caption-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                Caption (optional)
              </label>
              <input
                type="text"
                id={`image-caption-${index}`}
                value={section.caption || ''}
                onChange={(e) => handleUpdateSection(index, 'caption', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter image caption"
              />
            </div>
            
            {/* Image preview */}
            {section.imageUrl && (
              <div className="mt-3 p-2 bg-gray-100 rounded">
                <img 
                  src={section.imageUrl} 
                  alt={section.alt || 'Preview'} 
                  className="max-h-40 mx-auto object-contain"
                />
              </div>
            )}
          </div>
        );
        
      case 'video':
        return (
          <div key={index} className="bg-white p-4 rounded-lg shadow mb-4 border-l-4 border-red-500">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-medium text-gray-700">Video Section</h3>
              {commonSectionControls}
            </div>
            
            <div className="mb-3">
              <label htmlFor={`video-url-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                Video URL (YouTube, Vimeo, etc.)
              </label>
              <input
                type="text"
                id={`video-url-${index}`}
                value={section.videoUrl || ''}
                onChange={(e) => handleUpdateSection(index, 'videoUrl', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter video embed URL"
              />
            </div>
            
            <div>
              <label htmlFor={`video-caption-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                Caption (optional)
              </label>
              <input
                type="text"
                id={`video-caption-${index}`}
                value={section.caption || ''}
                onChange={(e) => handleUpdateSection(index, 'caption', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter video caption"
              />
            </div>
          </div>
        );
        
      case 'list':
        return (
          <div key={index} className="bg-white p-4 rounded-lg shadow mb-4 border-l-4 border-yellow-500">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-medium text-gray-700">List Section</h3>
              {commonSectionControls}
            </div>
            
            <div className="mb-3">
              <label htmlFor={`list-title-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                List Title (optional)
              </label>
              <input
                type="text"
                id={`list-title-${index}`}
                value={section.title || ''}
                onChange={(e) => handleUpdateSection(index, 'title', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter list title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                List Items
              </label>
              <div className="space-y-2">
                {section.items?.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center">
                    <div className="mr-2 text-gray-500">•</div>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleUpdateListItem(index, itemIndex, e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Item ${itemIndex + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveListItem(index, itemIndex)}
                      className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded"
                      disabled={section.items.length <= 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={() => handleAddListItem(index)}
                className="mt-2 flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Item
              </button>
            </div>
          </div>
        );
        
      case 'quote':
        return (
          <div key={index} className="bg-white p-4 rounded-lg shadow mb-4 border-l-4 border-indigo-500">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-medium text-gray-700">Quote Section</h3>
              {commonSectionControls}
            </div>
            
            <div className="mb-3">
              <label htmlFor={`quote-content-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                Quote Text
              </label>
              <textarea
                id={`quote-content-${index}`}
                value={section.content || ''}
                onChange={(e) => handleUpdateSection(index, 'content', e.target.value)}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter quote text"
              />
            </div>
            
            <div>
              <label htmlFor={`quote-attribution-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                Attribution (optional)
              </label>
              <input
                type="text"
                id={`quote-attribution-${index}`}
                value={section.attribution || ''}
                onChange={(e) => handleUpdateSection(index, 'attribution', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter quote attribution"
              />
            </div>
          </div>
        );
        
      default:
        return (
          <div key={index} className="bg-white p-4 rounded-lg shadow mb-4 border-l-4 border-gray-500">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-medium text-gray-700">Unknown Section Type: {section.type}</h3>
              {commonSectionControls}
            </div>
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
  
  if (error && !id && !templateId) {
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
      {/* Content editor header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            {id ? 'Edit Content' : 'Create New Content'}
          </h1>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => navigate('/brand/content')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <button
              type="button"
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              {saving && status === 'draft' ? 'Saving...' : 'Save Draft'}
            </button>
            
            <button
              type="button"
              onClick={() => handleSave('published')}
              disabled={saving}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {saving && status === 'published' ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>
        
        {/* Using template info */}
        {template && (
          <div className="px-6 py-3 bg-blue-50 border-b border-gray-200">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-blue-700">
                {id ? 'This content was created from' : 'Using'} template: <strong>{template.name}</strong>
              </span>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="px-6 py-3 bg-red-50 border-b border-gray-200">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Content metadata */}
      <div className="bg-white shadow rounded-lg mb-6 p-6">
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter content title"
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter a brief description"
          />
        </div>
      </div>
      
      {/* Content sections */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-3">Content Sections</h2>
        
        {sections.length > 0 ? (
          <div className="space-y-4">
            {sections.map((section, index) => renderSectionEditor(section, index))}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No content sections</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start adding sections to your content using the buttons below.
            </p>
          </div>
        )}
      </div>
      
      {/* Add section buttons */}
      <div className="bg-white shadow rounded-lg mb-6 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Add Content Section</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleAddSection('header')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Header
          </button>
          
          <button
            type="button"
            onClick={() => handleAddSection('text')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
            Text
          </button>
          
          <button
            type="button"
            onClick={() => handleAddSection('image')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Image
          </button>
          
          <button
            type="button"
            onClick={() => handleAddSection('video')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Video
          </button>
          
          <button
            type="button"
            onClick={() => handleAddSection('list')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            List
          </button>
          
          <button
            type="button"
            onClick={() => handleAddSection('quote')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Quote
          </button>
        </div>
      </div>
    </BrandManagerLayout>
  );
}