// src/pages/admin/TemplateEditorPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, setDoc, collection, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import AdminLayout from '../../components/admin/layout/AdminLayout';
import { useAuth } from '../../contexts/auth-context';

export default function TemplateEditorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams();
  
  // Explicitly check if we're on the "new" page - don't rely on the URL parameter
  const isNewTemplate = location.pathname.includes('/templates/new');
  
  const [loading, setLoading] = useState(!isNewTemplate);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState({
    name: '',
    description: '',
    type: 'lesson',
    isGlobal: true,
    sections: []
  });
  
  useEffect(() => {
    // If we're creating a new template, don't fetch anything
    if (isNewTemplate) {
      console.log("Creating new template");
      setLoading(false);
      return;
    }
    
    // Only try to fetch if we have a valid ID
    if (!id) {
      console.error("No template ID provided");
      setLoading(false);
      return;
    }
    
    const fetchTemplate = async () => {
      try {
        console.log(`Fetching template with ID: ${id}`);
        const templateRef = doc(db, 'templates', id);
        const templateDoc = await getDoc(templateRef);
        
        if (templateDoc.exists()) {
          console.log("Template data loaded");
          setTemplate(templateDoc.data());
        } else {
          console.error("Template not found");
          navigate('/admin/templates');
        }
      } catch (error) {
        console.error("Error fetching template:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplate();
  }, [id, isNewTemplate, navigate]);
  
  // Input change handlers (no changes)
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTemplate(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const addSection = () => {
    const newSectionId = `section-${Date.now()}`;
    setTemplate(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: newSectionId,
          type: 'text',
          title: 'New Section',
          required: false,
          placeholder: ''
        }
      ]
    }));
  };
  
  const updateSection = (index, updates) => {
    setTemplate(prev => {
      const newSections = [...prev.sections];
      newSections[index] = { ...newSections[index], ...updates };
      return { ...prev, sections: newSections };
    });
  };
  
  const removeSection = (index) => {
    setTemplate(prev => {
      const newSections = [...prev.sections];
      newSections.splice(index, 1);
      return { ...prev, sections: newSections };
    });
  };
  
  const moveSection = (index, direction) => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === template.sections.length - 1)
    ) {
      return;
    }
    
    setTemplate(prev => {
      const newSections = [...prev.sections];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
      return { ...prev, sections: newSections };
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Prepare template data
      const templateData = {
        ...template,
        updatedAt: serverTimestamp(),
      };
      
      console.log("Preparing to save template:", templateData);
      
      if (isNewTemplate) {
        // Creating a new template - use addDoc for simplicity
        console.log("Creating new template");
        templateData.createdAt = serverTimestamp();
        templateData.createdBy = user?.uid || 'unknown';
        
        // Use addDoc which automatically generates ID
        const docRef = await addDoc(collection(db, 'templates'), templateData);
        const newId = docRef.id;
        console.log("Created new template with ID:", newId);
        
        navigate(`/admin/templates/${newId}`);
      } else {
        // Updating an existing template - only if ID is valid
        if (!id) {
          throw new Error("Missing template ID");
        }
        
        console.log(`Updating template with ID: ${id}`);
        const templateRef = doc(db, 'templates', id);
        await updateDoc(templateRef, templateData);
        console.log("Template updated successfully");
        
        navigate(`/admin/templates/${id}`);
      }
    } catch (error) {
      console.error("Error saving template:", error);
      alert(`Failed to save template: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <AdminLayout requireSuperAdmin={true}>
        <div className="text-center py-8">Loading template...</div>
      </AdminLayout>
    );
  }
  
  // Rest of the component remains the same with the form
  return (
    <AdminLayout requireSuperAdmin={true}>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {isNewTemplate ? 'Create New Template' : 'Edit Template'}
          </h1>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Form content - same as before */}
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium border-b pb-2">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={template.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={template.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                />
              </div>
              
              <div className="flex space-x-6">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Type *
                  </label>
                  <select
                    name="type"
                    value={template.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="lesson">Lesson</option>
                    <option value="community">Community</option>
                  </select>
                </div>
                
                <div className="w-1/2 flex items-center pt-6">
                  <input
                    type="checkbox"
                    id="isGlobal"
                    name="isGlobal"
                    checked={template.isGlobal}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="isGlobal" className="ml-2 text-sm text-gray-700">
                    Available to all brands (Global Template)
                  </label>
                </div>
              </div>
            </div>
            
            {/* Template Sections */}
            <div className="space-y-4 mt-8">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium border-b pb-2">Template Sections</h2>
                <button
                  type="button"
                  onClick={addSection}
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-sm hover:bg-blue-100"
                >
                  Add Section
                </button>
              </div>
              
              {template.sections.length === 0 && (
                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-md p-8 text-center">
                  <p className="text-gray-500">No sections added yet. Click "Add Section" to create your first section.</p>
                </div>
              )}
              
              {template.sections.map((section, index) => (
                <div 
                  key={section.id} 
                  className="border border-gray-200 rounded-md p-4 bg-gray-50"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">Section {index + 1}</h3>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => moveSection(index, 'up')}
                        disabled={index === 0}
                        className={`p-1 rounded ${
                          index === 0 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                        title="Move Up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(index, 'down')}
                        disabled={index === template.sections.length - 1}
                        className={`p-1 rounded ${
                          index === template.sections.length - 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                        title="Move Down"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSection(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Remove Section"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  {/* Section content */}
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Section Title
                      </label>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSection(index, { title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Section Type
                      </label>
                      <select
                        value={section.type}
                        onChange={(e) => updateSection(index, { type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="text">Text Content</option>
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="quiz">Quiz</option>
                        {template.type === 'community' && (
                          <>
                            <option value="discussion">Discussion</option>
                            <option value="events">Events</option>
                            <option value="resources">Resources</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Placeholder Text
                    </label>
                    <input
                      type="text"
                      value={section.placeholder || ''}
                      onChange={(e) => updateSection(index, { placeholder: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Guidance text for users filling this section"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`required-${section.id}`}
                      checked={section.required || false}
                      onChange={(e) => updateSection(index, { required: e.target.checked })}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor={`required-${section.id}`} className="ml-2 text-sm text-gray-700">
                      Required Section
                    </label>
                  </div>
                  
                  {/* Section type specific settings */}
                  {section.type === 'quiz' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Quiz Settings</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Min Questions</label>
                          <input
                            type="number"
                            min="1"
                            value={section.quizConfig?.minQuestions || 1}
                            onChange={(e) => updateSection(index, { 
                              quizConfig: { 
                                ...section.quizConfig,
                                minQuestions: parseInt(e.target.value) 
                              } 
                            })}
                            className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Max Questions</label>
                          <input
                            type="number"
                            min="1"
                            value={section.quizConfig?.maxQuestions || 5}
                            onChange={(e) => updateSection(index, { 
                              quizConfig: { 
                                ...section.quizConfig,
                                maxQuestions: parseInt(e.target.value) 
                              } 
                            })}
                            className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Passing Score %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={section.quizConfig?.passingScore || 70}
                            onChange={(e) => updateSection(index, { 
                              quizConfig: { 
                                ...section.quizConfig,
                                passingScore: parseInt(e.target.value) 
                              } 
                            })}
                            className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {section.type === 'discussion' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Discussion Settings</h4>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`requireApproval-${section.id}`}
                          checked={section.discussionConfig?.requireApproval || false}
                          onChange={(e) => updateSection(index, { 
                            discussionConfig: { 
                              ...section.discussionConfig,
                              requireApproval: e.target.checked 
                            } 
                          })}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <label htmlFor={`requireApproval-${section.id}`} className="ml-2 text-sm text-gray-700">
                          Require post approval
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/admin/templates')}
              className="px-4 py-2 border border-gray-300 rounded shadow-sm bg-white text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded shadow-sm hover:bg-blue-700 disabled:bg-blue-400"
            >
              {saving ? 'Saving...' : isNewTemplate ? 'Create Template' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}