import type { BrandTemplate, LearningTemplate, TemplateType } from "../types/templates"

type SharedArr = LearningTemplate[]
type BrandArr = BrandTemplate[]

type PersistShape = {
  shared: SharedArr
  brand: BrandArr
}

const LS_KEY = "en.templateStore.v1"

function nowIso(): string {
  return new Date().toISOString()
}

function makeId(prefix = "id"): string {
  try {
    // crypto.randomUUID can throw in some environments (older browsers/non-secure contexts)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uuid = (globalThis as any)?.crypto?.randomUUID?.()
    if (uuid) return `${prefix}-${uuid}`
  } catch {
    // fall through to fallback
  }
  const ts = Date.now().toString(36)
  const rnd = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${ts}-${rnd}`
}

function safeLoad(): PersistShape {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(LS_KEY) : null
    if (!raw) return { shared: seedShared(), brand: [] }
    const parsed = JSON.parse(raw) as PersistShape
    if (!parsed || !Array.isArray(parsed.shared) || !Array.isArray(parsed.brand)) {
      return { shared: seedShared(), brand: [] }
    }
    return parsed
  } catch {
    return { shared: seedShared(), brand: [] }
  }
}

function safeSave(state: PersistShape) {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LS_KEY, JSON.stringify(state))
    }
  } catch {
    // ignore persistence errors
  }
}

function seedShared(): SharedArr {
  const base = nowIso()
  return [
    {
      id: makeId("tpl"),
      title: "Playfair Lesson · Petal Pink Wellness Basics",
      type: "lesson",
      body: "Intro to our Petal Pink brand accents and how to present them in lessons.",
      tags: ["petal-pink", "brand", "lesson"],
      difficulty: "beginner",
      duration: 15,
      authorId: "system",
      visibility: "shared",
      approved: true,
      createdAt: base,
      updatedAt: base,
      tier: "basic",
    },
    {
      id: makeId("tpl"),
      title: "Inter Lesson · Soft Border Styling 101",
      type: "lesson",
      body: "Guide to using var(--color-soft-border) tokens across components.",
      tags: ["soft-border", "tokens", "styling"],
      difficulty: "intermediate",
      duration: 20,
      authorId: "system",
      visibility: "shared",
      approved: true,
      createdAt: base,
      updatedAt: base,
      tier: "pro",
    },
    {
      id: makeId("tpl"),
      title: "Challenge · 7‑Day Petal Pink Refresh",
      type: "challenge",
      body: "Daily tasks to apply the Petal Pink theme consistently for 7 days.",
      tags: ["challenge", "design-system"],
      difficulty: "beginner",
      duration: 7,
      authorId: "system",
      visibility: "shared",
      approved: true,
      createdAt: base,
      updatedAt: base,
      tier: "basic",
    },
    {
      id: makeId("tpl"),
      title: "Challenge · Taupe Tone Eco Habits",
      type: "challenge",
      body: "A two‑week series encouraging eco‑friendly UI/UX habits using neutral tokens.",
      tags: ["taupe", "eco", "uiux"],
      difficulty: "advanced",
      duration: 14,
      authorId: "system",
      visibility: "shared",
      approved: true,
      createdAt: base,
      updatedAt: base,
      tier: "enterprise",
    },
  ]
}

let state = safeLoad()

function byType<T extends { type: TemplateType }>(arr: T[], type?: TemplateType): T[] {
  return type ? arr.filter((t) => t.type === type) : arr
}

export const templateStore = {
  listShared(type?: TemplateType, tier?: string): SharedArr {
    const shared = state.shared.filter((t) => t.visibility === "shared")
    const filtered = byType(shared, type)
    return tier ? filtered.filter((t) => t.tier === tier) : filtered
  },

  listBrandCopies(brandId: string, type?: TemplateType): BrandArr {
    const items = state.brand.filter((b) => b.brandId === brandId)
    return byType(items, type)
  },

  getShared(id: string): LearningTemplate | undefined {
    return state.shared.find((t) => t.id === id)
  },

  getBrandCopy(id: string): BrandTemplate | undefined {
    return state.brand.find((b) => b.id === id)
  },

  createShared(input: Omit<LearningTemplate, "id" | "createdAt" | "updatedAt">): LearningTemplate {
    const created: LearningTemplate = {
      ...input,
      id: makeId("tpl"),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    state = { ...state, shared: [created, ...state.shared] }
    safeSave(state)
    return created
  },

  updateShared(id: string, patch: Partial<LearningTemplate>): LearningTemplate {
    const existing = state.shared.find((t) => t.id === id)
    if (!existing) throw new Error("Shared template not found")
    const updated: LearningTemplate = { ...existing, ...patch, updatedAt: nowIso() }
    state = { ...state, shared: state.shared.map((t) => (t.id === id ? updated : t)) }
    safeSave(state)
    return updated
  },

  duplicateToBrand(sharedId: string, brandId: string): BrandTemplate {
    const src = state.shared.find((t) => t.id === sharedId)
    if (!src) throw new Error("Source template not found")
    const created: BrandTemplate = {
      id: makeId("btpl"),
      sourceTemplateId: src.id,
      type: src.type,
      customTitle: src.title,
      customBody: src.body,
      status: "draft",
      brandId,
      metrics: {},
      startDate: undefined,
      endDate: undefined,
      tier: src.tier,
    }
    state = { ...state, brand: [created, ...state.brand] }
    safeSave(state)
    return created
  },

  updateBrandCopy(id: string, patch: Partial<BrandTemplate>): BrandTemplate {
    const existing = state.brand.find((b) => b.id === id)
    if (!existing) throw new Error("Brand template not found")
    const updated: BrandTemplate = { ...existing, ...patch }
    state = { ...state, brand: state.brand.map((b) => (b.id === id ? updated : b)) }
    safeSave(state)
    return updated
  },

  removeShared(id: string): void {
    state = { ...state, shared: state.shared.filter((t) => t.id !== id) }
    safeSave(state)
  },

  removeBrandCopy(id: string): void {
    state = { ...state, brand: state.brand.filter((b) => b.id !== id) }
    safeSave(state)
  },
}

export type TemplateStore = typeof templateStore
