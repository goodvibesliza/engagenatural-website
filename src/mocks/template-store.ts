import { useEffect, useMemo, useState } from 'react'

export type TemplateType = 'lesson' | 'challenge' | 'community'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type Visibility = 'internal' | 'shared'

export interface Template {
  id: string
  title: string
  type: TemplateType
  duration: number
  difficulty: Difficulty
  tags: string[]
  body: string
  approved: boolean
  visibility: Visibility
  createdAt: string
  updatedAt: string
}

type CreateInput = Omit<Template, 'id' | 'createdAt' | 'updatedAt'>
type UpdateInput = Partial<Omit<Template, 'id' | 'createdAt' | 'updatedAt'>>

const LS_KEY = 'engagenatural.templates'
const LS_BRAND_KEY = 'engagenatural.brandTemplates'

export interface BrandTemplate {
  id: string
  brandId: string
  sourceId: string
  title: string
  type: TemplateType
  duration: number
  difficulty: Difficulty
  tags: string[]
  body: string
  createdAt: string
  updatedAt: string
}

const seed: Template[] = [
  {
    id: 'tpl-001',
    title: 'Sustainable Living Basics',
    type: 'lesson',
    duration: 25,
    difficulty: 'beginner',
    tags: ['sustainability', 'lifestyle'],
    body: 'Intro to sustainable living practices and eco-friendly choices.',
    approved: true,
    visibility: 'internal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-002',
    title: 'Zero Waste 30-Day Challenge',
    type: 'challenge',
    duration: 10,
    difficulty: 'intermediate',
    tags: ['zero-waste', 'challenge'],
    body: 'Daily prompts to reduce household waste to near-zero.',
    approved: true,
    visibility: 'shared',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-003',
    title: 'Eco Community Hub',
    type: 'community',
    duration: 5,
    difficulty: 'beginner',
    tags: ['community'],
    body: 'A community space to discuss eco-friendly living.',
    approved: true,
    visibility: 'shared',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

/**
 * Load the persisted template list from localStorage, falling back to the default seed set when missing or invalid.
 *
 * @returns The array of stored templates, or the default seed templates if no valid data is found in localStorage.
 */
function load(): Template[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return seed
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return seed
    return parsed
  } catch {
    return seed
  }
}

/**
 * Persist the given templates to browser localStorage using the module storage key.
 *
 * @param items - The templates to store; serialized as JSON and saved under `LS_KEY`. Failures during storage are silently ignored.
 */
function save(items: Template[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items))
  } catch {}
}

/**
 * Loads brand templates from localStorage.
 *
 * @returns An array of BrandTemplate objects retrieved from localStorage; an empty array if no valid data is found or an error occurs.
 */
function loadBrand(): BrandTemplate[] {
  try {
    const raw = localStorage.getItem(LS_BRAND_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

/**
 * Persist an array of brand templates to localStorage using the module's brand key.
 *
 * @param items - The BrandTemplate objects to store
 *
 * Note: Persistence failures (for example, JSON serialization errors or storage quota exceeded)
 * are caught and ignored; this function does not throw.
 */
function saveBrand(items: BrandTemplate[]) {
  try {
    localStorage.setItem(LS_BRAND_KEY, JSON.stringify(items))
  } catch {}
}

/**
 * Provides a React hook exposing an in-memory template store persisted to localStorage.
 *
 * The hook manages both learning templates and brand-specific templates and keeps them synchronized with localStorage.
 *
 * @returns An API object with methods for managing templates and brand templates: `list`, `listByType`, `getById`, `create`, `update`, `duplicate`, `remove`, `listBrand`, `getBrandById`, `duplicateToBrand`, `updateBrand`, and `removeBrand`.
 */
export function useTemplateStore() {
  const [items, setItems] = useState<Template[]>(() => load())
  const [brandItems, setBrandItems] = useState<BrandTemplate[]>(() => loadBrand())

  useEffect(() => {
    save(items)
  }, [items])

  useEffect(() => {
    saveBrand(brandItems)
  }, [brandItems])

  const api = useMemo(
    () => ({
      list: () => items,
      listByType: (type: TemplateType | 'all') =>
        type === 'all' ? items : items.filter((t) => t.type === type),
      // Prefer get(id); keep getById for backward compatibility
      get: (id: string) => items.find((t) => t.id === id) || null,
      getById: (id: string) => items.find((t) => t.id === id) || null,
      create: (input: CreateInput) => {
        const now = new Date().toISOString()
        const id = `tpl-${Math.random().toString(36).slice(2, 8)}`
        const created: Template = { id, createdAt: now, updatedAt: now, ...input }
        setItems((prev) => [created, ...prev])
        return created
      },
      update: (id: string, changes: UpdateInput) => {
        let updated: Template | null = null
        setItems((prev) =>
          prev.map((t) => {
            if (t.id !== id) return t
            updated = { ...t, ...changes, updatedAt: new Date().toISOString() }
            return updated
          })
        )
        return updated
      },
      duplicate: (id: string) => {
        const found = items.find((t) => t.id === id)
        if (!found) return null
        const now = new Date().toISOString()
        const copy: Template = {
          ...found,
          id: `tpl-${Math.random().toString(36).slice(2, 8)}`,
          title: `${found.title} (Copy)`,
          createdAt: now,
          updatedAt: now,
        }
        setItems((prev) => [copy, ...prev])
        return copy
      },
      remove: (id: string) => {
        setItems((prev) => prev.filter((t) => t.id !== id))
      },
      assignToBrands: (templateId: string, payload: { brandIds: string[]; tier?: 'basic' | 'pro' | 'enterprise' }) => {
        const src = items.find((t) => t.id === templateId)
        if (!src) return { success: false, error: 'Template not found' as const }
        const ids = Array.from(new Set(payload.brandIds || []))
        const now = new Date().toISOString()
        let created = 0
        setBrandItems((prev) => {
          const next = [...prev]
          for (const brandId of ids) {
            const bt: BrandTemplate = {
              id: `btpl-${Math.random().toString(36).slice(2, 8)}`,
              brandId,
              sourceId: src.id,
              title: src.title,
              type: src.type,
              duration: src.duration,
              difficulty: src.difficulty,
              tags: [...src.tags],
              body: src.body,
              createdAt: now,
              updatedAt: now,
            }
            next.unshift(bt)
            created++
          }
          return next
        })
        return { success: true as const, assigned: created }
      },
      // Brand template APIs
      listBrand: (brandId: string, type: TemplateType | 'all') =>
        brandItems.filter((b) => b.brandId === brandId && (type === 'all' || b.type === type)),
      getBrandById: (id: string) => brandItems.find((b) => b.id === id) || null,
      duplicateToBrand: (sourceId: string, brandId: string) => {
        const src = items.find((t) => t.id === sourceId)
        if (!src) return null
        const now = new Date().toISOString()
        const created: BrandTemplate = {
          id: `btpl-${Math.random().toString(36).slice(2, 8)}`,
          brandId,
          sourceId: src.id,
          title: src.title,
          type: src.type,
          duration: src.duration,
          difficulty: src.difficulty,
          tags: [...src.tags],
          body: src.body,
          createdAt: now,
          updatedAt: now,
        }
        setBrandItems((prev) => [created, ...prev])
        return created
      },
      updateBrand: (id: string, brandId: string, changes: Partial<Omit<BrandTemplate, 'id' | 'brandId' | 'sourceId' | 'createdAt'>>) => {
        let updated: BrandTemplate | null = null
        setBrandItems((prev) =>
          prev.map((b) => {
            if (b.id !== id || b.brandId !== brandId) return b
            updated = { ...b, ...changes, updatedAt: new Date().toISOString() }
            return updated
          })
        )
        return updated
      },
      removeBrand: (id: string, brandId: string) => {
        setBrandItems((prev) => prev.filter((b) => !(b.id === id && b.brandId === brandId)))
      },
    }),
    [items, brandItems]
  )

  return api
}