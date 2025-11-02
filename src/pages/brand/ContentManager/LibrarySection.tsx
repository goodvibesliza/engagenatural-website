import { useMemo, useState } from "react"
import type { JSX } from "react"
import { templateStore } from "@/stores/templateStore"
import type { BrandTemplate } from "@/types/templates"

export interface LessonsSectionProps {
  brandId: string
}

type StatusFilter = "all" | "draft" | "published"

export default function LessonsSection({ brandId }: LessonsSectionProps): JSX.Element {
  const [q, setQ] = useState<string>("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [preview, setPreview] = useState<BrandTemplate | null>(null)
  const [refresh, setRefresh] = useState<number>(0)

  const rows = useMemo(() => {
    let list = templateStore.listBrandCopies(brandId, "lesson")
    const query = q.trim().toLowerCase()
    if (query) list = list.filter((b) => (b.customTitle ?? "").toLowerCase().includes(query))
    if (status !== "all") list = list.filter((b) => b.status === status)
    return list
  }, [brandId, q, status, refresh])

  function openEdit(id: string) {
    const evt = new CustomEvent<{ id: string }>("brand:edit-template", { detail: { id } })
    window.dispatchEvent(evt)
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-stone-900">Lessons</h2>
        <input
          aria-label="Search lessons"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search lessons"
          className="ml-auto h-9 w-64 rounded-md border border-[color:var(--divider-taupe)] bg-white px-3 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
        <select
          aria-label="Filter status"
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="h-9 rounded-md border border-[color:var(--divider-taupe)] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
        >
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </header>

      <div className="overflow-x-auto rounded-lg border border-[color:var(--divider-taupe)] bg-white">
        {rows.length === 0 ? (
          <div className="p-6 text-sm text-stone-600">No lessons found.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-stone-50 text-stone-600">
              <tr className="text-left">
                <th className="px-3 py-2">Title</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Start</th>
                <th className="px-3 py-2">End</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--divider-taupe)]">
              {rows.map((b) => (
                <tr key={b.id} className="hover:bg-stone-50">
                  <td className="px-3 py-2 font-medium text-stone-900">{b.customTitle ?? "Untitled"}</td>
                  <td className="px-3 py-2 capitalize">{b.status}</td>
                  <td className="px-3 py-2">{b.startDate ?? "—"}</td>
                  <td className="px-3 py-2">{b.endDate ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPreview(b)}
                        className="rounded-md border border-[color:var(--divider-taupe)] bg-white px-2.5 py-1.5 text-xs text-stone-800 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-pink-300"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(b.id)}
                        className="rounded-md bg-stone-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-pink-300"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {preview ? <PreviewModal item={preview} onClose={() => setPreview(null)} /> : null}
    </div>
  )
}

function PreviewModal({ item, onClose }: { item: BrandTemplate; onClose: () => void }): JSX.Element {
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-x-0 top-16 mx-auto w-full max-w-2xl rounded-lg border border-[color:var(--divider-taupe)] bg-white p-5 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold font-serif text-stone-900">{item.customTitle ?? "Untitled"}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[color:var(--divider-taupe)] bg-white px-2.5 py-1.5 text-xs text-stone-800 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-pink-300"
          >
            Close
          </button>
        </div>
        <div className="text-sm text-stone-600 whitespace-pre-wrap">{item.customBody ?? "No content."}</div>
        <div className="mt-3 text-xs text-stone-500">
          {item.startDate ? `Start: ${item.startDate}` : "Start: —"} · {item.endDate ? `End: ${item.endDate}` : "End: —"}
        </div>
      </div>
    </div>
  )
}
