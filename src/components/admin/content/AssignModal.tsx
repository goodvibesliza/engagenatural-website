import React, { useEffect, useMemo, useState } from 'react'

type Tier = 'basic' | 'pro' | 'enterprise'

const ALL_BRANDS = [
  { id: 'brand-1', name: 'GreenLeaf Organics' },
  { id: 'brand-2', name: 'EcoTech Solutions' },
  { id: 'brand-3', name: 'Nature First' },
  { id: 'brand-4', name: 'Wellness Co.' },
]

interface AssignModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (payload: { brandIds: string[]; tier: Tier }) => void
}

/**
 * Render a modal that lets the user select one or more brands and assign them a plan tier.
 *
 * The modal is not rendered when `open` is false. Selecting brands and a tier and submitting
 * calls `onSubmit` with `{ brandIds, tier }`, then calls `onClose`. Clicking the backdrop or
 * the Cancel button calls `onClose`.
 *
 * @param open - Whether the modal is visible
 * @param onClose - Callback invoked to close the modal
 * @param onSubmit - Callback invoked with the selected brand IDs and chosen tier when the form is submitted
 * @returns The modal JSX element when `open` is true, otherwise `null`
 */
export default function AssignModal({ open, onClose, onSubmit }: AssignModalProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [tier, setTier] = useState<Tier>('basic')

  const allChecked = useMemo(
    () => selected.length > 0 && selected.length === ALL_BRANDS.length,
    [selected]
  )

  // Reset selection when modal opens; keep hook order stable regardless of open
  useEffect(() => {
    if (open) {
      setSelected([])
      setTier('basic')
    }
  }, [open])

  if (!open) return null

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const toggleAll = () => {
    setSelected((prev) => (prev.length === ALL_BRANDS.length ? [] : ALL_BRANDS.map((b) => b.id)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ brandIds: selected, tier })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-lg border border-stone-300 shadow-lg">
        <form onSubmit={handleSubmit}>
          <div className="p-5 border-b">
            <h2 className="text-lg font-semibold text-stone-900 font-serif">Assign to Brands</h2>
            <p className="text-sm text-stone-600 mt-1">Choose brands and plan tier.</p>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-stone-800">Brands</label>
                <button type="button" onClick={toggleAll} className="text-xs text-stone-600 hover:text-stone-900">
                  {allChecked ? 'Clear all' : 'Select all'}
                </button>
              </div>
              <div className="max-h-48 overflow-auto border rounded-md divide-y">
                {ALL_BRANDS.map((b) => (
                  <label key={b.id} className="flex items-center gap-3 p-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-stone-300"
                      checked={selected.includes(b.id)}
                      onChange={() => toggle(b.id)}
                    />
                    <span className="text-stone-800">{b.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-stone-800">Plan / Tier</label>
              <select
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
                value={tier}
                onChange={(e) => setTier(e.target.value as Tier)}
              >
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          <div className="px-5 py-3 border-t flex justify-end gap-2 bg-stone-50">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-stone-700 hover:text-stone-900">
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-stone-900 text-white rounded-md hover:bg-stone-800 disabled:opacity-50"
              disabled={selected.length === 0}
            >
              Assign
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}