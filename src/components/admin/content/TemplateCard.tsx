import React from 'react'
import { Template } from '@/mocks/template-store'

interface Props {
  template: Template
  onPreview?: (t: Template) => void
  onEdit?: (t: Template) => void
  onDuplicate?: (t: Template) => void
  onAssign?: (t: Template) => void
}

/**
 * Render a card showing a template's metadata (type, duration, difficulty, title, tags) and action buttons.
 *
 * @param template - The Template to display in the card.
 * @param onPreview - Optional callback invoked with `template` when the "Preview" button is clicked.
 * @param onEdit - Optional callback invoked with `template` when the "Edit" button is clicked.
 * @param onDuplicate - Optional callback invoked with `template` when the "Duplicate" button is clicked.
 * @param onAssign - Optional callback invoked with `template` when the "Assign" button is clicked.
 * @returns A React element representing the template card.
 */
export default function TemplateCard({ template, onPreview, onEdit, onDuplicate, onAssign }: Props) {
  const chip = template.type === 'lesson' ? 'Lesson' : template.type === 'challenge' ? 'Challenge' : 'Community'

  return (
    <div className="bg-white border border-stone-300 rounded-lg hover:shadow-sm transition-shadow">
      <div className="p-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-stone-100 text-stone-700 border border-stone-200">
              {chip}
            </span>
            <span className="text-xs text-stone-500">{template.duration} min</span>
            <span className="text-xs text-stone-500 capitalize">{template.difficulty}</span>
          </div>
          <h3 className="mt-1 font-semibold text-stone-900 truncate font-serif">{template.title}</h3>
          {Array.isArray(template.tags) && template.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {template.tags.slice(0, 6).map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-stone-50 text-stone-700 border border-stone-200">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 grid gap-1">
          <button onClick={() => onPreview?.(template)} className="text-sm text-stone-700 hover:text-stone-900">
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
    </div>
  )
}