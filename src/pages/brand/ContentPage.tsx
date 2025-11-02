import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTemplateStore } from '@/mocks/template-store'
import type { BaseTemplate as Template, TemplateType, BrandTemplate } from '@/types/templates'
import { useAuth } from '@/contexts/auth-context'

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

function PreviewModal({ open, onClose, title, body }: { open: boolean; onClose: () => void; title: string; body: string }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-lg border border-stone-300 shadow-lg">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold font-serif text-stone-900">Preview</h2>
          <button onClick={onClose} className="text-stone-600">✕</button>
        </div>
        <div className="p-6">
          <h3 className="text-2xl font-serif font-semibold text-stone-900">{title}</h3>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-stone-800">{body}</p>
        </div>
        <div className="px-5 py-3 border-t flex justify-end bg-stone-50">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-md">Close</button>
        </div>
      </div>
    </div>
  )
}

function EditModal({
  open,
  onClose,
  template,
  onSave,
}: {
  open: boolean
  onClose: () => void
  template: BrandTemplate
  onSave: (updates: { title: string; body: string }) => void
}) {
  const [title, setTitle] = useState(template.title)
  const [body, setBody] = useState(template.body)
  useEffect(() => {
    if (open && template) {
      setTitle(template.title)
      setBody(template.body)
    }
  }, [open, template?.id])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-lg border border-stone-300 shadow-lg">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold font-serif text-stone-900">Edit Copy</h2>
          <button onClick={onClose} className="text-stone-600">✕</button>
        </div>
        <div className="p-6 grid gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-800">Title</label>
            <input className="mt-1 w-full border rounded-md px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-800">Body</label>
            <textarea className="mt-1 w-full border rounded-md px-3 py-2 min-h-[160px]" value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
        </div>
        <div className="px-5 py-3 border-t flex justify-end gap-2 bg-stone-50">
          <button onClick={onClose} className="px-4 py-2 text-sm border rounded-md">Cancel</button>
          <button onClick={() => { onSave({ title, body }); onClose() }} className="px-4 py-2 text-sm rounded-md bg-stone-900 text-white hover:bg-stone-800">Save</button>
        </div>
      </div>
    </div>
  )
}

function Card({
  data,
  owned,
  onUse,
  onPreview,
  onEdit,
}: {
  data: Template | BrandTemplate
  owned: boolean
  onUse?: () => void
  onPreview: () => void
  onEdit?: () => void
}) {
  return (
    <div className="bg-white border border-stone-300 rounded-lg p-4 flex flex-col">
      <div className="flex-1">
        <div className="flex items-center gap-2 text-xs text-stone-600">
          <span className="capitalize">{('type' in data && data.type) || 'lesson'}</span>
          {'duration' in data && <span>• {data.duration} min</span>}
        </div>
        <h3 className="mt-1 font-serif font-semibold text-stone-900">{data.title}</h3>
        {'tags' in data && Array.isArray(data.tags) && data.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {data.tags.slice(0, 5).map((t) => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-stone-50 border">{t}</span>
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        {!owned && onUse && (
          <button onClick={onUse} className="px-3 py-1.5 text-sm border rounded-md">Use Template</button>
        )}
        <button onClick={onPreview} className="px-3 py-1.5 text-sm border rounded-md">Preview</button>
        {owned && onEdit && (
          <button onClick={onEdit} className="px-3 py-1.5 text-sm border rounded-md">Edit copy</button>
        )}
      </div>
    </div>
  )
}

export default function ContentPage() {
  const q = useQuery()
  const section = q.get('section') || 'content'

  const [tab, setTab] = useState<Extract<TemplateType, 'lesson' | 'challenge'>>('lesson')
  const store = useTemplateStore()
  const { brandId: authBrandId } = useAuth() || ({} as any)
  const demoBrandFallback = (import.meta as any)?.env?.VITE_DEMO_BRAND_ID as string | undefined
  const effectiveBrandId = authBrandId || demoBrandFallback

  // Brand-owned copies
  const owned = effectiveBrandId ? store.listBrand(effectiveBrandId, tab) : []
  const ownedIds = new Set(owned.map((b) => b.sourceId))

  // Shared templates available to use (not yet owned by brand)
  const available = store
    .listByType(tab)
    .filter((t) => t.visibility === 'shared' && !ownedIds.has(t.id))

  const [preview, setPreview] = useState<{ title: string; body: string } | null>(null)
  const [editing, setEditing] = useState<BrandTemplate | null>(null)

  if (section !== 'content') {
    // Only content section is supported; render nothing otherwise for now.
    return null
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-serif font-semibold text-stone-900 mb-4">Brand Content</h1>
      <div className="mb-4 inline-flex rounded-md border">
        <button
          onClick={() => setTab('lesson')}
          className={`px-4 py-2 text-sm ${tab === 'lesson' ? 'bg-stone-900 text-white' : 'bg-white'}`}
        >
          Lessons
        </button>
        <button
          onClick={() => setTab('challenge')}
          className={`px-4 py-2 text-sm border-l ${tab === 'challenge' ? 'bg-stone-900 text-white' : 'bg-white'}`}
        >
          Challenges
        </button>
      </div>

      {/* Owned by brand */}
      <div className="mb-6">
        <h2 className="text-lg font-serif font-semibold mb-2">Your {tab === 'lesson' ? 'Lessons' : 'Challenges'}</h2>
        {owned.length === 0 ? (
          <div className="text-sm text-stone-600">No {tab}s yet. Use a shared template below.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {owned.map((b) => (
              <Card
                key={b.id}
                data={b}
                owned
                onPreview={() => setPreview({ title: b.title, body: b.body })}
                onEdit={() => setEditing(b)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Available shared templates */}
      <div>
        <h2 className="text-lg font-serif font-semibold mb-2">Shared {tab === 'lesson' ? 'Lessons' : 'Challenges'}</h2>
        {available.length === 0 ? (
          <div className="text-sm text-stone-600">No shared {tab}s available.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {available.map((t) => (
              <Card
                key={t.id}
                data={t}
                owned={false}
                onUse={() => effectiveBrandId && store.duplicateToBrand(t.id, effectiveBrandId)}
                onPreview={() => setPreview({ title: t.title, body: t.body })}
              />
            ))}
          </div>
        )}
      </div>

      <PreviewModal open={!!preview} onClose={() => setPreview(null)} title={preview?.title || ''} body={preview?.body || ''} />
      {editing && (
        <EditModal
          open={!!editing}
          onClose={() => setEditing(null)}
          template={editing}
          onSave={(u) => effectiveBrandId && store.updateBrand(editing.id, effectiveBrandId, u)}
        />
      )}
    </div>
  )
}
