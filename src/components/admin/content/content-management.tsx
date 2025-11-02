import React, { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import TemplateCard from '@/components/admin/content/TemplateCard'
import { useTemplateStore } from '@/mocks/template-store'
import type { BaseTemplate as Template, TemplateType } from '@/types/templates'

type TabKey = 'lessons' | 'challenges' | 'communities'

const tabs: { key: TabKey; label: string; type: TemplateType }[] = [
  { key: 'lessons', label: 'Lessons', type: 'lesson' },
  { key: 'challenges', label: 'Challenges', type: 'challenge' },
  { key: 'communities', label: 'Communities', type: 'community' },
]

export default function ContentManagement(): JSX.Element {
  const navigate = useNavigate()
  const store = useTemplateStore()
  const [params, setParams] = useSearchParams()
  const currentTab = (params.get('tab') as TabKey) || 'lessons'
  const [assignTarget, setAssignTarget] = useState<Template | null>(null)

  const active = tabs.find((t) => t.key === currentTab) || tabs[0]
  const items = useMemo(() => store.listByType(active.type), [store, active.type])

  const setTab = (key: TabKey) => {
    const next = new URLSearchParams(params)
    next.set('tab', key)
    setParams(next, { replace: true })
  }

  return (
    <div className="max-w-7xl mx-auto font-sans text-stone-900">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Content</h1>
        <p className="text-stone-600 mt-1">Browse lessons, challenges, and communities.</p>
      </div>

      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        <div className="border-b border-stone-200 p-2">
          <div className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active.key === t.key ? 'bg-stone-100 text-stone-900' : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onPreview={(t) => navigate(`/admin/templates/${t.id}/view`)}
                  onEdit={(t) => navigate(`/admin/templates/${t.id}/edit`)}
                  onDuplicate={(t) => store.duplicate(t.id)}
                  onAssign={(t) => setAssignTarget(t)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-stone-500">No items yet.</div>
          )}
        </div>
      </div>

      {assignTarget && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg border border-stone-200">
            <div className="p-5 border-b border-stone-200">
              <h2 className="font-serif text-lg font-semibold">Assign Template</h2>
              <p className="text-sm text-stone-600 mt-1">Assign "{assignTarget.title}" to a group or brand.</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="text-sm text-stone-700">This is a placeholder. Assignment workflows will be added later.</div>
              <input className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm" placeholder="Search groups or brands" />
            </div>
            <div className="px-5 py-3 border-t border-stone-200 flex justify-end gap-2">
              <button onClick={() => setAssignTarget(null)} className="px-4 py-2 text-sm text-stone-700 hover:text-stone-900">
                Cancel
              </button>
              <button onClick={() => setAssignTarget(null)} className="px-4 py-2 text-sm bg-stone-900 text-white rounded-md hover:bg-stone-800">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
