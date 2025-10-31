import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useTemplateStore, TemplateType, Difficulty, Visibility, Template } from '@/mocks/template-store'

type Form = {
  title: string
  type: TemplateType
  duration: number
  difficulty: Difficulty
  tags: string
  body: string
  approved: boolean
  visibility: Visibility
}

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const store = useTemplateStore()

  const isNew = location.pathname.includes('/admin/templates/new') || !id
  const existing = useMemo<Template | null>(() => (id ? store.getById(id) : null), [id, store])

  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Form>(() => {
    const base: Form = {
      title: existing?.title || '',
      type: (existing?.type as TemplateType) || 'lesson',
      duration: existing?.duration || 10,
      difficulty: (existing?.difficulty as Difficulty) || 'beginner',
      tags: existing?.tags?.join(', ') || '',
      body: existing?.body || '',
      approved: existing?.approved ?? false,
      visibility: (existing?.visibility as Visibility) || 'internal',
    }
    return base
  })

  useEffect(() => {
    if (!existing) return
    setForm({
      title: existing.title,
      type: existing.type,
      duration: existing.duration,
      difficulty: existing.difficulty,
      tags: existing.tags.join(', '),
      body: existing.body,
      approved: existing.approved,
      visibility: existing.visibility,
    })
  }, [existing?.id])

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : name === 'duration' ? Number(value) : value }))
  }

  const payload = (): Omit<Template, 'id' | 'createdAt' | 'updatedAt'> => ({
    title: form.title.trim(),
    type: form.type,
    duration: Math.max(0, Math.floor(form.duration || 0)),
    difficulty: form.difficulty,
    tags: form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    body: form.body,
    approved: form.approved,
    visibility: form.visibility,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      if (existing) {
        const updated = store.update(existing.id, payload())
        if (updated) navigate(`/admin/templates/${updated.id}`)
      } else {
        const created = store.create(payload())
        navigate(`/admin/templates/${created.id}`)
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async () => {
    // Save then navigate to view
    if (existing) {
      const updated = store.update(existing.id, payload())
      if (updated) navigate(`/admin/templates/${updated.id}`)
    } else {
      const created = store.create(payload())
      navigate(`/admin/templates/${created.id}`)
    }
  }

  const handleDuplicate = () => {
    const baseId = existing?.id
    if (baseId) {
      const copy = store.duplicate(baseId)
      if (copy) navigate(`/admin/templates/${copy.id}/edit`)
    } else {
      // Duplicate current unsaved form by creating a new one with (Copy)
      const created = store.create({ ...payload(), title: `${form.title || 'Untitled'} (Copy)` })
      navigate(`/admin/templates/${created.id}/edit`)
    }
  }

  return (
    <div className="max-w-4xl mx-auto font-sans">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-stone-900 font-serif">
          {isNew ? 'Create Template' : 'Edit Template'}
        </h1>
        <div className="flex gap-2">
          <button onClick={handlePreview} className="px-3 py-2 text-sm border rounded-md">Preview</button>
          <button onClick={handleDuplicate} className="px-3 py-2 text-sm border rounded-md">Duplicate</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-md bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg">
        <div className="p-6 grid gap-5">
          <div>
            <label className="block text-sm font-medium text-stone-800">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              className="mt-1 w-full border rounded-md px-3 py-2"
              placeholder="Enter template title"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-800">Type</label>
              <select name="type" value={form.type} onChange={onChange} className="mt-1 w-full border rounded-md px-3 py-2">
                <option value="lesson">Lesson</option>
                <option value="challenge">Challenge</option>
                <option value="community">Community</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-800">Duration (min)</label>
              <input
                type="number"
                name="duration"
                value={form.duration}
                onChange={onChange}
                className="mt-1 w-full border rounded-md px-3 py-2"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-800">Difficulty</label>
              <select
                name="difficulty"
                value={form.difficulty}
                onChange={onChange}
                className="mt-1 w-full border rounded-md px-3 py-2 capitalize"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-800">Tags (comma-separated)</label>
            <input
              name="tags"
              value={form.tags}
              onChange={onChange}
              className="mt-1 w-full border rounded-md px-3 py-2"
              placeholder="ex: eco, sustainability, wellness"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-800">Body</label>
            <textarea
              name="body"
              value={form.body}
              onChange={onChange}
              className="mt-1 w-full border rounded-md px-3 py-2 min-h-[200px]"
              placeholder="Write the main content here"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-stone-800">
              <input type="checkbox" name="approved" checked={form.approved} onChange={onChange} className="h-4 w-4" />
              Approved
            </label>
            <div>
              <label className="block text-sm font-medium text-stone-800">Visibility</label>
              <select
                name="visibility"
                value={form.visibility}
                onChange={onChange}
                className="mt-1 w-full border rounded-md px-3 py-2"
              >
                <option value="internal">Internal</option>
                <option value="shared">Shared</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
