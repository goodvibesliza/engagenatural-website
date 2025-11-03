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
      id: `tpl-${crypto.randomUUID()}`,
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
      id: `tpl-${crypto.randomUUID()}`,
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
      id: `tpl-${crypto.randomUUID()}`,
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
      id: `tpl-${crypto.randomUUID()}`,
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
      id: `tpl-${crypto.randomUUID()}`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
    state = { ...state, shared: [created, ...state.shared] }
    safeSave(state)
    return created
  },

  updateShared(id: string, patch: Partial<LearningTemplate>): LearningTemplate {
    let updated: LearningTemplate | undefined
    state = {
      ...state,
      shared: state.shared.map((t) => {
        if (t.id !== id) return t
        updated = { ...t, ...patch, updatedAt: nowIso() }
        return updated
      }),
    }
    if (!updated) {
      throw new Error("Shared template not found")
    }
    safeSave(state)
    return updated
  },

  duplicateToBrand(sharedId: string, brandId: string): BrandTemplate {
    const src = state.shared.find((t) => t.id === sharedId)
    if (!src) throw new Error("Source template not found")
    const created: BrandTemplate = {
      id: `btpl-${crypto.randomUUID()}`,
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
    let updated: BrandTemplate | undefined
    state = {
      ...state,
      brand: state.brand.map((b) => {
        if (b.id !== id) return b
        updated = { ...b, ...patch }
        return updated
      }),
    }
    if (!updated) {
      throw new Error("Brand template not found")
    }
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
