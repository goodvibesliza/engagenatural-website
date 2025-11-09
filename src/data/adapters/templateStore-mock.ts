import type { TemplateStore } from '@/data/templateStore'
import type { TemplateType, LearningTemplate, BrandTemplate, ReviewStatus, EducatorRequest } from '@/types/templates'

// LocalStorage-backed implementation of TemplateStore

const KEY_SHARED = 'en.templates.shared.v1'
const KEY_BRAND = 'en.templates.brand.v1'
const KEY_EDU = 'en.templates.educator.v1'
const KEY_REVIEW = 'en.templates.review.v1' // { [copyId]: ReviewStatus }

type ReviewState = ReviewStatus

function hasWindow(): boolean {
  return typeof window !== 'undefined'
}

function lsGet<T>(key: string, fallback: T): T {
  if (!hasWindow()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as unknown as T
  } catch {
    return fallback
  }
}

function lsSet<T>(key: string, value: T): void {
  if (!hasWindow()) return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

function nowISO(): string {
  return new Date().toISOString()
}

function uuid(): string {
  // Prefer native randomUUID when available
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const c = (globalThis as any).crypto
  if (c?.randomUUID) return c.randomUUID()
  // RFC4122 v4 using getRandomValues if available
  if (c?.getRandomValues) {
    const bytes = new Uint8Array(16)
    c.getRandomValues(bytes)
    // Per RFC4122: set version and variant
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    return (
      hex.slice(0, 4).join('') +
      '-' +
      hex.slice(4, 6).join('') +
      '-' +
      hex.slice(6, 8).join('') +
      '-' +
      hex.slice(8, 10).join('') +
      '-' +
      hex.slice(10, 16).join('')
    )
  }
  // Last resort Math.random-based (not cryptographically strong)
  const rnd = () => Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0')
  return (
    rnd().slice(0, 8) +
    '-' +
    rnd().slice(0, 4) +
    '-' +
    ((parseInt(rnd().slice(0, 4), 16) & 0x0fff) | 0x4000).toString(16).padStart(4, '0') +
    '-' +
    ((parseInt(rnd().slice(0, 4), 16) & 0x3fff) | 0x8000).toString(16).padStart(4, '0') +
    '-' +
    rnd() + rnd().slice(0, 4)
  )
}

function seedIfEmpty(): void {
  const shared = lsGet<LearningTemplate[]>(KEY_SHARED, [])
  if (shared.length > 0) return

  const baseAuthor = 'system'
  const baseTags: string[] = ['getting-started']
  const items: LearningTemplate[] = [
    {
      id: uuid(),
      title: 'Welcome to EngageNatural – Lesson 1',
      type: 'lesson',
      body: 'Intro lesson covering the basics of your brand training workflow.',
      tags: baseTags,
      authorId: baseAuthor,
      visibility: 'shared',
      approved: true,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      tier: 'basic',
    },
    {
      id: uuid(),
      title: 'Product Knowledge – Lesson 2',
      type: 'lesson',
      body: 'Deepen product understanding with practical scenarios.',
      tags: ['product', 'knowledge'],
      authorId: baseAuthor,
      visibility: 'shared',
      approved: true,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      tier: 'pro',
    },
    {
      id: uuid(),
      title: 'Merchandising Challenge: Endcap Refresh',
      type: 'challenge',
      body: 'Plan and execute an endcap refresh with before/after photos.',
      tags: ['challenge', 'merchandising'],
      authorId: baseAuthor,
      visibility: 'shared',
      approved: true,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      tier: 'basic',
    },
    {
      id: uuid(),
      title: 'Engagement Challenge: Staff Training Sprint',
      type: 'challenge',
      body: 'Run a 7‑day staff sprint to boost product familiarity.',
      tags: ['challenge', 'training'],
      authorId: baseAuthor,
      visibility: 'shared',
      approved: true,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      tier: 'enterprise',
    },
  ]

  lsSet(KEY_SHARED, items)
  lsSet(KEY_BRAND, [] as BrandTemplate[])
  lsSet(KEY_EDU, [] as EducatorRequest[])
  lsSet(KEY_REVIEW, {} as Record<string, ReviewState>)
}

class LocalStorageTemplateStore implements TemplateStore {
  constructor() {
    seedIfEmpty()
  }

  private readShared(): LearningTemplate[] {
    return lsGet<LearningTemplate[]>(KEY_SHARED, [])
  }
  private writeShared(list: LearningTemplate[]): void {
    lsSet(KEY_SHARED, list)
  }

  private readBrand(): BrandTemplate[] {
    return lsGet<BrandTemplate[]>(KEY_BRAND, [])
  }
  private writeBrand(list: BrandTemplate[]): void {
    lsSet(KEY_BRAND, list)
  }

  private readEdu(): EducatorRequest[] {
    return lsGet<EducatorRequest[]>(KEY_EDU, [])
  }
  private writeEdu(list: EducatorRequest[]): void {
    lsSet(KEY_EDU, list)
  }

  private readReview(): Record<string, ReviewState> {
    return lsGet<Record<string, ReviewState>>(KEY_REVIEW, {})
  }
  private writeReview(map: Record<string, ReviewState>): void {
    lsSet(KEY_REVIEW, map)
  }

  async listShared(params?: { type?: TemplateType; tier?: string; q?: string }): Promise<LearningTemplate[]> {
    const { type, tier, q } = params || {}
    return this.readShared().filter((t) => {
      if (type && t.type !== type) return false
      if (tier && (t.tier !== tier)) return false
      if (q) {
        const hay = `${t.title} ${t.body} ${(t.tags || []).join(' ')}`.toLowerCase()
        if (!hay.includes(q.toLowerCase())) return false
      }
      return true
    })
  }

  async listBrandCopies(brandId: string, params?: { type?: TemplateType }): Promise<BrandTemplate[]> {
    const { type } = params || {}
    const list = this.readBrand().filter((c) => c.brandId === brandId && (!type || c.type === type))
    return list
  }

  async getShared(idValue: string): Promise<LearningTemplate | undefined> {
    return this.readShared().find((t) => t.id === idValue)
  }

  async getBrandCopy(idValue: string): Promise<BrandTemplate | undefined> {
    return this.readBrand().find((c) => c.id === idValue)
  }

  async createShared(input: Omit<LearningTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<LearningTemplate> {
    const list = this.readShared()
    const created: LearningTemplate = { ...input, id: uuid(), createdAt: nowISO(), updatedAt: nowISO() }
    const next = [created, ...list]
    this.writeShared(next)
    return created
  }

  async updateShared(idValue: string, patch: Partial<LearningTemplate>): Promise<LearningTemplate> {
    const list = this.readShared()
    const idx = list.findIndex((t) => t.id === idValue)
    if (idx === -1) throw new Error('Shared template not found')
    const updated: LearningTemplate = { ...list[idx], ...patch, updatedAt: nowISO() }
    const next = [...list]
    next[idx] = updated
    this.writeShared(next)
    return updated
  }

  async removeShared(idValue: string): Promise<void> {
    const list = this.readShared().filter((t) => t.id !== idValue)
    this.writeShared(list)
  }

  async duplicateToBrand(sharedId: string, brandId: string): Promise<BrandTemplate> {
    const base = await this.getShared(sharedId)
    if (!base) throw new Error('Shared template not found')
    const list = this.readBrand()
    const copy: BrandTemplate = {
      id: uuid(),
      sourceTemplateId: base.id,
      type: base.type,
      customTitle: base.title,
      customBody: base.body,
      reviewStatus: 'draft',
      brandId,
      tier: base.tier,
    }
    const next = [copy, ...list]
    this.writeBrand(next)
    const review = this.readReview()
    review[copy.id] = 'draft'
    this.writeReview(review)
    return copy
  }

  async updateBrandCopy(idValue: string, patch: Partial<BrandTemplate>): Promise<BrandTemplate> {
    const list = this.readBrand()
    const idx = list.findIndex((c) => c.id === idValue)
    if (idx === -1) throw new Error('Brand copy not found')
    const updated: BrandTemplate = { ...list[idx], ...patch }
    const next = [...list]
    next[idx] = updated
    this.writeBrand(next)
    return updated
  }

  async removeBrandCopy(idValue: string): Promise<void> {
    const list = this.readBrand().filter((c) => c.id !== idValue)
    this.writeBrand(list)
    const review = this.readReview()
    if (review[idValue]) {
      const { [idValue]: _omit, ...rest } = review
      this.writeReview(rest)
    }
  }

  // Review workflow
  async submitForReview(copyId: string, note?: string): Promise<BrandTemplate> {
    const review = this.readReview()
    const current: ReviewState = review[copyId] || 'draft'
    if (!(current === 'draft' || current === 'changes_requested')) {
      throw new Error('Invalid transition: submitForReview')
    }
    review[copyId] = 'submitted'
    this.writeReview(review)
    return this.updateBrandCopy(copyId, { reviewStatus: 'submitted', submittedAt: nowISO(), reviewerNote: note })
  }

  async markChangesRequested(copyId: string, note: string): Promise<BrandTemplate> {
    const review = this.readReview()
    const current: ReviewState = review[copyId] || 'draft'
    if (current !== 'submitted') throw new Error('Invalid transition: changes requested')
    review[copyId] = 'changes_requested'
    this.writeReview(review)
    return this.updateBrandCopy(copyId, { reviewStatus: 'changes_requested', reviewerNote: note })
  }

  async approveCopy(copyId: string, note?: string): Promise<BrandTemplate> {
    const review = this.readReview()
    const current: ReviewState = review[copyId] || 'draft'
    if (current !== 'submitted') throw new Error('Invalid transition: approve')
    review[copyId] = 'approved'
    this.writeReview(review)
    return this.updateBrandCopy(copyId, { reviewStatus: 'approved', approvedAt: nowISO(), reviewerNote: note })
  }

  async publishCopy(copyId: string): Promise<BrandTemplate> {
    const review = this.readReview()
    const current: ReviewState = review[copyId] || 'draft'
    if (current !== 'approved') throw new Error('Invalid transition: publish')
    review[copyId] = 'published'
    this.writeReview(review)
    return this.updateBrandCopy(copyId, { reviewStatus: 'published' })
  }

  async createEducatorRequest(
    input: Omit<EducatorRequest, 'id' | 'createdAt' | 'status'>
  ): Promise<EducatorRequest> {
    const list = this.readEdu()
    const created: EducatorRequest = {
      ...input,
      id: uuid(),
      createdAt: nowISO(),
      status: 'open',
    }
    const next = [created, ...list]
    this.writeEdu(next)
    return created
  }
}

export const templateStore: TemplateStore = new LocalStorageTemplateStore()
