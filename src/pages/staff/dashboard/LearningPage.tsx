import React, { useEffect, useMemo, useState } from 'react'
import { useTemplateStore, BrandTemplate, TemplateType } from '@/mocks/template-store'

const CURRENT_BRAND_ID = 'demo-brand'
const LS_PROGRESS_KEY = 'engagenatural.staffProgress'
const LS_FILTER_KEY = 'engagenatural.staffFilter'

type ProgressStatus = 'started' | 'completed'
type ProgressMap = Record<string, { status: ProgressStatus; updatedAt: string }>

/**
 * Load the persisted learning progress map from local storage.
 *
 * @returns A ProgressMap mapping template IDs to progress entries ({ status, updatedAt }); returns an empty object if no valid progress is stored.
 */
function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(LS_PROGRESS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * Persist the given progress map to the staff progress key in localStorage.
 *
 * Saves the provided ProgressMap under the LS_PROGRESS_KEY. Any errors encountered while writing to storage are ignored.
 *
 * @param map - Mapping of template IDs to their progress entries to persist
 */
function saveProgress(map: ProgressMap) {
  try {
    localStorage.setItem(LS_PROGRESS_KEY, JSON.stringify(map))
  } catch {}
}

/**
 * Render a learning dashboard with filterable lessons and challenges and client-side progress tracking.
 *
 * The component lists templates for the demo brand, allows filtering by "all", "lesson", or "challenge",
 * and lets users mark items as started or completed. Item progress and the selected filter are persisted
 * to localStorage.
 *
 * @returns A React element containing a header with filter controls and a responsive grid of learning items;
 * each item shows metadata, a completed badge when applicable, and actions to start or mark the item complete.
 */
export default function LearningPage() {
  const store = useTemplateStore()
  const [filter, setFilter] = useState<'all' | Extract<TemplateType, 'lesson' | 'challenge'>>(() => {
    try {
      const v = localStorage.getItem(LS_FILTER_KEY)
      return v === 'lesson' || v === 'challenge' || v === 'all' ? (v as any) : 'all'
    } catch {
      return 'all'
    }
  })
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress())

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  useEffect(() => {
    try {
      localStorage.setItem(LS_FILTER_KEY, filter)
    } catch {}
  }, [filter])

  const items = useMemo(() => {
    const type: TemplateType | 'all' = filter === 'all' ? 'all' : filter
    return store.listBrand(CURRENT_BRAND_ID, type)
  }, [store, filter])

  const isCompleted = (id: string) => progress[id]?.status === 'completed'
  const isStarted = (id: string) => progress[id]?.status === 'started'

  const start = (t: BrandTemplate) => {
    setProgress((p) => ({ ...p, [t.id]: { status: 'started', updatedAt: new Date().toISOString() } }))
  }
  const complete = (t: BrandTemplate) => {
    setProgress((p) => ({ ...p, [t.id]: { status: 'completed', updatedAt: new Date().toISOString() } }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-serif font-semibold text-stone-900">Learning</h1>
        <div className="inline-flex rounded-md border overflow-hidden">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-sm ${filter === 'all' ? 'bg-stone-900 text-white' : 'bg-white'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('lesson')}
            className={`px-3 py-1.5 text-sm border-l ${filter === 'lesson' ? 'bg-stone-900 text-white' : 'bg-white'}`}
          >
            Lessons
          </button>
          <button
            onClick={() => setFilter('challenge')}
            className={`px-3 py-1.5 text-sm border-l ${filter === 'challenge' ? 'bg-stone-900 text-white' : 'bg-white'}`}
          >
            Challenges
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-stone-600">No items yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((t) => (
            <div key={t.id} className="bg-white border border-stone-300 rounded-lg p-4 flex flex-col">
              <div className="flex-1">
                <div className="text-xs text-stone-600 flex items-center gap-2">
                  <span className="capitalize">{t.type}</span>
                  <span>• {t.duration} min</span>
                  <span>• Demo Brand</span>
                </div>
                <h3 className="mt-1 font-serif font-semibold text-stone-900">{t.title}</h3>
                {isCompleted(t.id) && (
                  <span className="mt-2 inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 border border-green-200">
                    Completed
                  </span>
                )}
              </div>
              <div className="mt-3">
                {isCompleted(t.id) ? (
                  <button className="px-3 py-1.5 text-sm rounded-md bg-green-600 text-white cursor-default" disabled>
                    Completed
                  </button>
                ) : isStarted(t.id) ? (
                  <button onClick={() => complete(t)} className="px-3 py-1.5 text-sm border rounded-md">
                    Mark Complete
                  </button>
                ) : (
                  <button onClick={() => start(t)} className="px-3 py-1.5 text-sm border rounded-md">
                    Start
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}