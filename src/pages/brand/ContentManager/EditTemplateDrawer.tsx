import { useEffect, useMemo, useRef, useState } from "react"
import type { JSX } from "react"
import type { BrandTemplate } from "@/types/templates"

export interface EditTemplateDrawerProps {
  open: boolean
  onClose: () => void
  brandTemplate?: BrandTemplate
  onSave: (patch: Partial<BrandTemplate>) => void
}

export default function EditTemplateDrawer({
  open,
  onClose,
  brandTemplate,
  onSave,
}: EditTemplateDrawerProps): JSX.Element | null {
  const drawerRef = useRef<HTMLDivElement | null>(null)
  const firstFieldRef = useRef<HTMLInputElement | null>(null)
  const prevFocusedRef = useRef<HTMLElement | null>(null)

  const [customTitle, setCustomTitle] = useState<string>("")
  const [tagsText, setTagsText] = useState<string>("")
  const [customBody, setCustomBody] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [status, setStatus] = useState<BrandTemplate["status"]>("draft")
  const [preview, setPreview] = useState<boolean>(false)

  const readonlyType = brandTemplate?.type ?? "lesson"

  useEffect(() => {
    if (!open) return
    prevFocusedRef.current = document.activeElement as HTMLElement | null
    const t = setTimeout(() => {
      if (firstFieldRef.current) firstFieldRef.current.focus()
      else drawerRef.current?.focus()
    }, 0)
    return () => {
      clearTimeout(t)
      setPreview(false)
      prevFocusedRef.current?.focus?.()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    setCustomTitle(brandTemplate?.customTitle ?? "")
    setCustomBody(brandTemplate?.customBody ?? "")
    setStartDate(brandTemplate?.startDate ?? "")
    setEndDate(brandTemplate?.endDate ?? "")
    setStatus(brandTemplate?.status ?? "draft")
    setTagsText("")
  }, [open, brandTemplate?.id])

  const bodyCount = useMemo(() => customBody.length, [customBody])

  if (!open) return null

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key === "Tab") {
      const root = drawerRef.current
      if (!root) return
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("aria-hidden"))
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      }
    }
  }

  const disabled = !brandTemplate

  function buildPatch(nextStatus?: BrandTemplate["status"]): Partial<BrandTemplate> {
    return {
      customTitle: customTitle || undefined,
      customBody: customBody || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status: nextStatus ?? status,
    }
  }

  return (
    <div className="fixed inset-0 z-50" aria-hidden={!open}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-template-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="absolute right-0 top-0 h-full w-full max-w-[720px] bg-white shadow-xl outline-none grid grid-rows-[auto_1fr_auto]"
      >
        <header className="border-b border-[color:var(--divider-taupe)] px-5 py-4">
          <h2 id="edit-template-title" className="text-lg font-semibold font-serif text-stone-900">
            Edit Template
          </h2>
        </header>

        <div className="relative overflow-y-auto">
          <div className="space-y-8 px-5 py-6">
            <section aria-labelledby="basics-h" className="space-y-3">
              <h3 id="basics-h" className="text-sm font-medium text-stone-700">
                1) Basics
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid gap-1.5">
                  <label className="text-sm text-stone-700">
                    Custom Title<span className="text-red-600"> *</span>
                  </label>
                  <input
                    ref={firstFieldRef}
                    required
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Enter title"
                    className="h-10 rounded-md border border-[color:var(--divider-taupe)] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    disabled={disabled}
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-sm text-stone-700">Type</label>
                  <input
                    value={readonlyType}
                    readOnly
                    className="h-10 rounded-md border border-[color:var(--divider-taupe)] bg-stone-100 px-3 text-sm text-stone-700"
                    aria-readonly="true"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label className="text-sm text-stone-700">Tags (comma separated)</label>
                  <input
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    placeholder="e.g. brand, launch, spring"
                    className="h-10 rounded-md border border-[color:var(--divider-taupe)] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    disabled={disabled}
                  />
                </div>
              </div>
            </section>

            <section aria-labelledby="content-h" className="space-y-3">
              <h3 id="content-h" className="text-sm font-medium text-stone-700">
                2) Content
              </h3>
              <div className="grid gap-1.5">
                <label className="text-sm text-stone-700">Body</label>
                <textarea
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  rows={8}
                  placeholder="Write template content..."
                  className="rounded-md border border-[color:var(--divider-taupe)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  disabled={disabled}
                />
                <div className="text-xs text-stone-500">Characters: {bodyCount}</div>
              </div>
            </section>

            <section aria-labelledby="schedule-h" className="space-y-3">
              <h3 id="schedule-h" className="text-sm font-medium text-stone-700">
                3) Schedule & Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <label className="text-sm text-stone-700">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 rounded-md border border-[color:var(--divider-taupe)] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    disabled={disabled}
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm text-stone-700">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 rounded-md border border-[color:var(--divider-taupe)] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    disabled={disabled}
                  />
                </div>
                <div className="grid gap-1.5 md:col-span-2">
                  <label className="text-sm text-stone-700">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BrandTemplate["status"])}
                    className="h-10 w-full rounded-md border border-[color:var(--divider-taupe)] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                    disabled={disabled}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>
            </section>
          </div>

          {preview ? (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm p-5 overflow-y-auto">
              <div className="mx-auto max-w-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 border border-[color:var(--divider-taupe)]">
                    {readonlyType}
                  </span>
                  <span className="text-xs text-stone-500">Status: {status}</span>
                </div>
                <h3 className="text-xl font-semibold font-serif text-stone-900">
                  {customTitle || "Untitled"}
                </h3>
                <div className="text-sm text-stone-600 whitespace-pre-wrap">
                  {customBody || "No content."}
                </div>
                <div className="text-xs text-stone-500">
                  {startDate ? `Start: ${startDate}` : "Start: —"} · {endDate ? `End: ${endDate}` : "End: —"}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPreview(false)}
                    className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <footer className="border-t border-[color:var(--divider-taupe)] px-5 py-3 flex items-center justify-between">
          <div className="text-xs text-stone-500">Esc to close</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[color:var(--divider-taupe)] bg-white px-3 py-1.5 text-sm text-stone-800 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-pink-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(buildPatch())}
              disabled={disabled || !customTitle.trim()}
              className="rounded-md border border-[color:var(--divider-taupe)] bg-white px-3 py-1.5 text-sm text-stone-800 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-pink-300 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setPreview((v) => !v)}
              disabled={disabled}
              className="rounded-md border border-[color:var(--divider-taupe)] bg-white px-3 py-1.5 text-sm text-stone-800 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-pink-300 disabled:opacity-50"
            >
              {preview ? "Hide Preview" : "Preview"}
            </button>
            <button
              type="button"
              onClick={() => onSave(buildPatch("published"))}
              disabled={disabled || !customTitle.trim()}
              className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-pink-300 disabled:opacity-50"
            >
              Publish
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
