import React, { useEffect, useMemo, useState } from 'react'
import { useTemplateStore } from '@/mocks/template-store'
import type { BrandTemplate, TemplateType } from '@/types/templates'
import { useAuth } from '@/contexts/auth-context'

const LS_PROGRESS_KEY = 'engagenatural.staffProgress'
const LS_FILTER_KEY = 'engagenatural.staffFilter'

type ProgressStatus = 'started' | 'completed'
type ProgressMap = Record<string, { status: ProgressStatus; updatedAt: string }>

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

function saveProgress(map: ProgressMap) {
  try {
    localStorage.setItem(LS_PROGRESS_KEY, JSON.stringify(map))
  } catch {}
}

export default function LearningPage() {
  const store = useTemplateStore()
  const { brandId: authBrandId } = useAuth() || ({} as any)
  const demoBrandFallback = import.meta.env.VITE_DEMO_BRAND_ID as string | undefined
  const effectiveBrandId = authBrandId || demoBrandFallback
  const [filter, setFilter] = useState<'all' | Extract<TemplateType, 'lesson' | 'challenge'>>(() => {
    try {
      const v = localStorage.getItem(LS_FILTER_KEY)
      const allowed = ['lesson', 'challenge', 'all'] as const
      return (allowed as readonly string[]).includes(v || '')
        ? (v as typeof allowed[number])
        : 'all'
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
    return effectiveBrandId ? store.listBrand(effectiveBrandId, type) : []
  }, [store, filter, effectiveBrandId])

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
