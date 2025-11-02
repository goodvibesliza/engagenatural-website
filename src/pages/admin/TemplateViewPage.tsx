import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTemplateStore } from '@/mocks/template-store'
import type { BaseTemplate as Template } from '@/types/templates'
import AssignModal from '@/components/admin/content/AssignModal'
import EmptyState from '@/components/common/EmptyState'

export default function TemplateViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const store = useTemplateStore()

  const template = useMemo<Template | null>(() => (id ? store.get(id) : null), [id, store])
  const [assignOpen, setAssignOpen] = useState(false)

  if (!template) {
    return (
      <div className="max-w-4xl mx-auto">
        <EmptyState
          title="Template not found"
          description="Create a new template to get started."
          actionLabel="Create new template"
          onAction={() => navigate('/admin/templates/new')}
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold font-serif text-stone-900">{template.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-stone-600">
            <span className="capitalize">{template.type}</span>
            <span>• {template.duration} min</span>
            <span className="capitalize">• {template.difficulty}</span>
            {template.tags.length > 0 && (
              <span className="flex flex-wrap gap-1">
                {template.tags.slice(0, 6).map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-full border text-xs">{t}</span>
                ))}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/admin/templates/${template.id}/edit`)} className="px-3 py-2 text-sm border rounded-md">
            Edit
          </button>
          <button onClick={() => setAssignOpen(true)} className="px-3 py-2 text-sm border rounded-md">
            Assign
          </button>
          <button
            onClick={() => {
              store.remove(template.id)
              navigate('/admin/templates')
            }}
            className="px-3 py-2 text-sm border rounded-md text-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-lg p-6">
        <div className="prose max-w-none">
          <p className="whitespace-pre-wrap leading-7 text-stone-800">{template.body || 'No content yet.'}</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="border rounded-lg p-4 bg-stone-50">
          <h2 className="font-semibold font-serif text-stone-900 mb-2">Demo Analytics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-white border rounded">
              <div className="text-stone-600">Views</div>
              <div className="text-xl font-semibold">{(template.title.length * 37) % 500 + 120}</div>
            </div>
            <div className="p-3 bg-white border rounded">
              <div className="text-stone-600">Completions</div>
              <div className="text-xl font-semibold">{(template.duration * 13) % 200 + 30}</div>
            </div>
            <div className="p-3 bg-white border rounded">
              <div className="text-stone-600">Avg Time (min)</div>
              <div className="text-xl font-semibold">{Math.max(1, Math.round(template.duration * 0.7))}</div>
            </div>
            <div className="p-3 bg-white border rounded">
              <div className="text-stone-600">Satisfaction</div>
              <div className="text-xl font-semibold">{(template.tags.join('').length % 5) + 4}/5</div>
            </div>
          </div>
        </div>
      </div>

      <AssignModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onSubmit={(payload) => {
          if (!template) return setAssignOpen(false)
          const res = store.assignToBrands(template.id, payload)
          if (!('success' in res) || !res.success) {
            console.warn('Assign failed', res)
          }
          setAssignOpen(false)
        }}
      />
    </div>
  )
}
