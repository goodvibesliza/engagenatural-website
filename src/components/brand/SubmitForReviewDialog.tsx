import { useEffect, useMemo, useRef, useState } from 'react'
import { templateStore } from '@/data'

type Props = {
  open: boolean
  onClose: () => void
  copyId: string
  onSubmitted?: () => void
}

export default function SubmitForReviewDialog({ open, onClose, copyId, onSubmitted }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const firstFieldRef = useRef<HTMLTextAreaElement | null>(null)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setNote('')
      setTimeout(() => firstFieldRef.current?.focus(), 0)
    }
  }, [open])

  // Focus trap
  useEffect(() => {
    if (!open) return
    const el = dialogRef.current
    if (!el) return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusables = Array.from(
        el.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      )
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (!first || !last) return
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    el.addEventListener('keydown', handler)
    return () => el.removeEventListener('keydown', handler)
  }, [open])

  const canSubmit = useMemo(() => !submitting && copyId.trim().length > 0, [submitting, copyId])

  const submit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await templateStore.submitForReview(copyId, note.trim() || undefined)
      onSubmitted?.()
      onClose()
    } catch {
      // silent per requirements
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50" aria-hidden={!open}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className="absolute inset-0 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-md rounded-xl border bg-white p-4 shadow-xl">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Submit for Review</h2>
            <p className="text-sm text-gray-600">Optionally include a note for the reviewer.</p>
          </div>

          <label className="block">
            <span className="block text-sm font-medium">Note</span>
            <textarea
              ref={firstFieldRef}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2"
              rows={4}
              placeholder="Context or special instructions (optional)"
            />
          </label>

          <div className="mt-6 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 hover:bg-black/5">
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
