import React from 'react'
import type { Template } from '@/mocks/template-store'

interface TemplateCardProps {
  template: Template
  onPreview?: (t: Template) => void
  onEdit?: (t: Template) => void
  onDuplicate?: (t: Template) => void
  onAssign?: (t: Template) => void
}

export default function TemplateCard({ template, onPreview, onEdit, onDuplicate, onAssign }: TemplateCardProps) {
  const badge = template.type === 'lesson' ? 'bg-stone-100 text-stone-700' : template.type === 'challenge' ? 'bg-stone-100 text-stone-700' : 'bg-stone-100 text-stone-700'

  return (
    <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${badge}`}>{
            template.type === 'lesson' ? 'Lesson' : template.type === 'challenge' ? 'Challenge' : 'Community'
          }</span>
          {template.isGlobal && (
            <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-stone-100 text-stone-700">Global</span>
          )}
        </div>

        <h3 className="font-serif text-lg font-semibold mt-2">{template.name}</h3>
        {template.description && <p className="text-stone-600 mt-1 text-sm line-clamp-2">{template.description}</p>}
        <div className="mt-3 text-xs text-stone-500">{template.sections || 0} sections</div>
      </div>

      <div className="px-5 py-3 bg-stone-50 border-t border-stone-200 grid grid-cols-2 gap-2 sm:flex sm:justify-between">
        <button
          onClick={() => onPreview?.(template)}
          className="text-sm text-stone-700 hover:text-stone-900"
        >
          Preview
        </button>
        <button onClick={() => onEdit?.(template)} className="text-sm text-stone-700 hover:text-stone-900">
          Edit
        </button>
        <button onClick={() => onDuplicate?.(template)} className="text-sm text-stone-700 hover:text-stone-900">
          Duplicate
        </button>
        <button onClick={() => onAssign?.(template)} className="text-sm text-stone-700 hover:text-stone-900">
          Assign
        </button>
      </div>
    </div>
  )
}
