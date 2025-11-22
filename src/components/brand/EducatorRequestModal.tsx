import { useEffect, useMemo, useRef, useState } from 'react'
import { templateStore } from '@/data'
import type { EducatorRequest } from '@/types/templates'
import { toast } from 'sonner'

type Props = {
  open: boolean
  onClose: () => void
  brandId: string
  templateId?: string
  onSubmitted?: () => void
}

export default function EducatorRequestModal({ open, onClose, brandId, templateId, onSubmitted }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const firstFieldRef = useRef<HTMLInputElement | null>(null)
  const [topic, setTopic] = useState('')
  const [skusText, setSkusText] = useState('')
  const [goals, setGoals] = useState('')
  const [budgetRange, setBudgetRange] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reset fields when modal opens
  useEffect(() => {
    if (open) {
      setTopic('')
      setSkusText('')
      setGoals('')
      setBudgetRange('')
      setContactEmail('')
      setTimeout(() => firstFieldRef.current?.focus(), 0)
    }
  }, [open])

  // Focus trap within the dialog
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

  const canSubmit = useMemo(() => {
    const hasTopic = topic.trim().length > 0
    const hasEmail = /.+@.+\..+/.test(contactEmail.trim())
    return hasTopic && hasEmail && !submitting
  }, [topic, contactEmail, submitting])

  const submit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const payload: Omit<EducatorRequest, 'id' | 'createdAt' | 'status'> = {
        brandId,
        templateId,
        topic: topic.trim(),
        skus: skusText
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0),
        goals: goals.trim() || undefined,
        budgetRange: budgetRange.trim() || undefined,
        contactEmail: contactEmail.trim(),
      }
      await templateStore.createEducatorRequest(payload)
      toast.success('Request submitted')
      onSubmitted?.()
      onClose()
    } catch {
      // Optional: surface inline error; keeping silent per requirements
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
        <div className="w-full max-w-lg rounded-xl border bg-white p-4 shadow-xl">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Request an Educator</h2>
            <p className="text-sm text-gray-600">Tell us what you need help with.</p>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="block text-sm font-medium">Topic<span className="text-red-600">*</span></span>
              <input
                ref={firstFieldRef}
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2"
                placeholder="Training topic"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium">SKUs (comma separated)</span>
              <input
                type="text"
                value={skusText}
                onChange={(e) => setSkusText(e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2"
                placeholder="SKU1, SKU2, SKU3"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium">Goals</span>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2"
                rows={3}
                placeholder="What outcomes are you looking for?"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium">Budget Range</span>
              <input
                type="text"
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2"
                placeholder="$500 - $2,000"
              />
            </label>

            <label className="block">
              <span className="block text-sm font-medium">Contact Email<span className="text-red-600">*</span></span>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2"
                placeholder="you@example.com"
              />
            </label>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
