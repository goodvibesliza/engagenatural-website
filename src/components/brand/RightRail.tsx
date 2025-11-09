import { useEffect, useState } from 'react'
import { templateStore } from '@/data'
import type { LearningTemplate } from '@/types/templates'

type RightRailProps = {
  brandId: string
  reviewStatus?: import('@/types/templates').ReviewStatus
  onRequestEducator: () => void
  onSubmitForReview?: () => void
}

export default function RightRail({
  brandId,
  reviewStatus,
  onRequestEducator,
  onSubmitForReview,
}: RightRailProps) {
  const [topTemplates, setTopTemplates] = useState<Pick<LearningTemplate, 'id' | 'title'>[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await templateStore.listShared()
        const top = list.slice(0, 3).map((t) => ({ id: t.id, title: t.title }))
        if (!cancelled) setTopTemplates(top)
      } catch {
        if (!cancelled) {
          setTopTemplates([
            { id: 't1', title: 'Welcome to EngageNatural – Lesson 1' },
            { id: 't2', title: 'Product Knowledge – Lesson 2' },
            { id: 't3', title: 'Merchandising Challenge: Endcap Refresh' },
          ])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [brandId])

  return (
    <aside className="space-y-4">
      {/* Completions */}
      <section className="rounded-xl border p-4">
        <h3 className="text-sm font-semibold mb-3">Completions</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-gray-500">7D</div>
            <div className="text-2xl font-bold">42</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-gray-500">30D</div>
            <div className="text-2xl font-bold">186</div>
          </div>
        </div>
      </section>

      {/* Top Templates */}
      <section className="rounded-xl border p-4">
        <h3 className="text-sm font-semibold mb-3">Top Templates</h3>
        <ul className="space-y-2">
          {topTemplates.map((t) => (
            <li key={t.id} className="text-sm text-gray-800">
              • {t.title}
            </li>
          ))}
          {topTemplates.length === 0 && (
            <li className="text-sm text-gray-500">No templates yet</li>
          )}
        </ul>
      </section>

      {/* Actions */}
      <section className="rounded-xl border p-4 space-y-2">
        <button
          type="button"
          onClick={onRequestEducator}
          className="w-full rounded-md bg-black px-4 py-2 text-white hover:bg-black/90"
        >
          Need an Educator?
        </button>
        {reviewStatus !== 'published' && (
          <button
            type="button"
            onClick={onSubmitForReview}
            className="w-full rounded-md px-4 py-2 hover:bg-black/5"
          >
            Submit for Review
          </button>
        )}
      </section>
    </aside>
  )
}
