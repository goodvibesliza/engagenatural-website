// src/pages/admin/TemplateEditorPage.tsx
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { doc, getDoc, collection, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import AdminLayout from '../../components/admin/layout/AdminLayout'
import { useAuth } from '../../contexts/auth-context'

// Simple types for this page
type TemplateType = 'lesson' | 'community'

interface QuizConfig {
  minQuestions?: number
  maxQuestions?: number
  passingScore?: number
}

interface DiscussionConfig {
  requireApproval?: boolean
}

type SectionType = 'text' | 'image' | 'video' | 'quiz' | 'discussion' | 'events' | 'resources'

interface TemplateSection {
  id: string
  type: SectionType
  title: string
  required?: boolean
  placeholder?: string
  quizConfig?: QuizConfig
  discussionConfig?: DiscussionConfig
}

interface TemplateDoc {
  name: string
  description: string
  type: TemplateType
  isGlobal: boolean
  sections: TemplateSection[]
}

interface TemplateEditorPageProps {}

export default function TemplateEditorPage(_props: TemplateEditorPageProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth() as { user?: { uid?: string } } | any
  const { id } = useParams<{ id: string }>()

  const isNewTemplate = location.pathname.includes('/templates/new')

  const [loading, setLoading] = useState<boolean>(!isNewTemplate)
  const [saving, setSaving] = useState<boolean>(false)
  const [template, setTemplate] = useState<TemplateDoc>({
    name: '',
    description: '',
    type: 'lesson',
    isGlobal: true,
    sections: [],
  })

  useEffect(() => {
    if (isNewTemplate) {
      setLoading(false)
      return
    }

    if (!id) {
      setLoading(false)
      return
    }

    const fetchTemplate = async () => {
      try {
        const templateRef = doc(db, 'templates', id)
        const templateDoc = await getDoc(templateRef)
        if (templateDoc.exists()) {
          setTemplate(templateDoc.data() as TemplateDoc)
        } else {
          navigate('/admin/templates')
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching template:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTemplate()
  }, [id, isNewTemplate, navigate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target
    setTemplate((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const addSection = () => {
    const newSectionId = `section-${Date.now()}`
    setTemplate((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        { id: newSectionId, type: 'text', title: 'New Section', required: false, placeholder: '' },
      ],
    }))
  }

  const updateSection = (index: number, updates: Partial<TemplateSection>) => {
    setTemplate((prev) => {
      const newSections = [...prev.sections]
      newSections[index] = { ...newSections[index], ...updates }
      return { ...prev, sections: newSections }
    })
  }

  const removeSection = (index: number) => {
    setTemplate((prev) => {
      const newSections = [...prev.sections]
      newSections.splice(index, 1)
      return { ...prev, sections: newSections }
    })
  }

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === template.sections.length - 1)) {
      return
    }
    setTemplate((prev) => {
      const newSections = [...prev.sections]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      ;[newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]]
      return { ...prev, sections: newSections }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const templateData: Partial<TemplateDoc> & { updatedAt: any; createdAt?: any; createdBy?: string } = {
        ...template,
        updatedAt: serverTimestamp(),
      }
      if (isNewTemplate) {
        templateData.createdAt = serverTimestamp()
        templateData.createdBy = user?.uid || 'unknown'
        const docRef = await addDoc(collection(db, 'templates'), templateData)
        const newId = docRef.id
        navigate(`/admin/templates/${newId}`)
      } else {
        if (!id) throw new Error('Missing template ID')
        const templateRef = doc(db, 'templates', id)
        await updateDoc(templateRef, templateData)
        navigate(`/admin/templates/${id}`)
      }
    } catch (error: any) {
      // eslint-disable-next-line no-alert
      alert(`Failed to save template: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout requireSuperAdmin={true}>
        <div className="text-center py-8">Loading template...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout requireSuperAdmin={true}>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{isNewTemplate ? 'Create New Template' : 'Edit Template'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium border-b pb-2">Basic Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={template.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>

              <div className="flex space-x-6">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Type *</label>
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
                <div key={section.id} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">Section {index + 1}</h3>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => moveSection(index, 'up')}
                        disabled={index === 0}
                        className={`p-1 rounded ${index === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                        title="Move Up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(index, 'down')}
                        disabled={index === template.sections.length - 1}
                        className={`p-1 rounded ${
                          index === template.sections.length - 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'
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

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Section Title</label>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateSection(index, { title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Section Type</label>
                      <select
                        value={section.type}
                        onChange={(e) => updateSection(index, { type: e.target.value as SectionType })}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder Text</label>
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

                  {section.type === 'quiz' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Quiz Settings</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Min Questions</label>
                          <input
                            type="number"
                            min={1}
                            value={section.quizConfig?.minQuestions || 1}
                            onChange={(e) =>
                              updateSection(index, {
                                quizConfig: { ...section.quizConfig, minQuestions: parseInt(e.target.value, 10) || 1 },
                              })
                            }
                            className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Max Questions</label>
                          <input
                            type="number"
                            min={1}
                            value={section.quizConfig?.maxQuestions || 5}
                            onChange={(e) =>
                              updateSection(index, {
                                quizConfig: { ...section.quizConfig, maxQuestions: parseInt(e.target.value, 10) || 5 },
                              })
                            }
                            className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Passing Score %</label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={section.quizConfig?.passingScore || 70}
                            onChange={(e) =>
                              updateSection(index, {
                                quizConfig: { ...section.quizConfig, passingScore: parseInt(e.target.value, 10) || 70 },
                              })
                            }
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
                          onChange={(e) =>
                            updateSection(index, {
                              discussionConfig: { ...section.discussionConfig, requireApproval: e.target.checked },
                            })
                          }
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
  )
}
