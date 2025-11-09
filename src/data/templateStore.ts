// Template Store interface and environment-based adapter switcher (mock default)

// Re-export core template types for convenience
export type { TemplateType, LearningTemplate, BrandTemplate, EducatorRequest } from '@/types/templates'

import type { TemplateType, LearningTemplate, BrandTemplate, EducatorRequest } from '@/types/templates'

export interface TemplateStore {
  listShared(params?: { type?: TemplateType; tier?: string; q?: string }): Promise<LearningTemplate[]>
  listBrandCopies(brandId: string, params?: { type?: TemplateType }): Promise<BrandTemplate[]>
  getShared(id: string): Promise<LearningTemplate | undefined>
  getBrandCopy(id: string): Promise<BrandTemplate | undefined>
  createShared(input: Omit<LearningTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<LearningTemplate>
  updateShared(id: string, patch: Partial<LearningTemplate>): Promise<LearningTemplate>
  removeShared(id: string): Promise<void>
  duplicateToBrand(sharedId: string, brandId: string): Promise<BrandTemplate>
  updateBrandCopy(id: string, patch: Partial<BrandTemplate>): Promise<BrandTemplate>
  removeBrandCopy(id: string): Promise<void>
  submitForReview(copyId: string, note?: string): Promise<BrandTemplate>
  markChangesRequested(copyId: string, note: string): Promise<BrandTemplate>
  approveCopy(copyId: string, note?: string): Promise<BrandTemplate>
  publishCopy(copyId: string): Promise<BrandTemplate>
  createEducatorRequest(input: Omit<EducatorRequest, 'id' | 'createdAt' | 'status'>): Promise<EducatorRequest>
}

// In-memory mock adapter (satisfies interface; suitable for local/dev and storybook)
class MockTemplateStore implements TemplateStore {
  private shared: LearningTemplate[] = []
  private copies: BrandTemplate[] = []
  private educatorRequests: EducatorRequest[] = []

  async listShared(params?: { type?: TemplateType; tier?: string; q?: string }): Promise<LearningTemplate[]> {
    const { type, tier, q } = params || {}
    return this.shared.filter((t) => {
      if (type && t.type !== type) return false
      if (tier && t.tier && t.tier !== tier) return false
      if (q) {
        const hay = `${t.title} ${t.body} ${(t.tags || []).join(' ')}`.toLowerCase()
        if (!hay.includes(q.toLowerCase())) return false
      }
      return true
    })
  }

  async listBrandCopies(brandId: string, params?: { type?: TemplateType }): Promise<BrandTemplate[]> {
    const { type } = params || {}
    return this.copies.filter((c) => c.brandId === brandId && (!type || c.type === type))
  }

  async getShared(id: string): Promise<LearningTemplate | undefined> {
    return this.shared.find((t) => t.id === id)
  }

  async getBrandCopy(id: string): Promise<BrandTemplate | undefined> {
    return this.copies.find((c) => c.id === id)
  }

  async createShared(input: Omit<LearningTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<LearningTemplate> {
    const now = new Date().toISOString()
    const created: LearningTemplate = {
      ...input,
      id: (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)),
      createdAt: now,
      updatedAt: now,
    }
    this.shared.unshift(created)
    return created
  }

  async updateShared(id: string, patch: Partial<LearningTemplate>): Promise<LearningTemplate> {
    const idx = this.shared.findIndex((t) => t.id === id)
    if (idx === -1) throw new Error('Shared template not found')
    const updated: LearningTemplate = {
      ...this.shared[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    this.shared[idx] = updated
    return updated
  }

  async removeShared(id: string): Promise<void> {
    this.shared = this.shared.filter((t) => t.id !== id)
  }

  async duplicateToBrand(sharedId: string, brandId: string): Promise<BrandTemplate> {
    const base = await this.getShared(sharedId)
    if (!base) throw new Error('Shared template not found')
    const copy: BrandTemplate = {
      id: (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)),
      sourceTemplateId: base.id,
      type: base.type,
      customTitle: base.title,
      customBody: base.body,
      reviewStatus: 'draft',
      brandId,
      tier: base.tier,
    }
    this.copies.unshift(copy)
    return copy
  }

  async updateBrandCopy(id: string, patch: Partial<BrandTemplate>): Promise<BrandTemplate> {
    const idx = this.copies.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Brand copy not found')
    const updated: BrandTemplate = { ...this.copies[idx], ...patch }
    this.copies[idx] = updated
    return updated
  }

  async removeBrandCopy(id: string): Promise<void> {
    this.copies = this.copies.filter((c) => c.id !== id)
  }

  async submitForReview(copyId: string, _note?: string): Promise<BrandTemplate> {
    // No dedicated review status in BrandTemplate; keep as-is in mock
    const copy = await this.getBrandCopy(copyId)
    if (!copy) throw new Error('Brand copy not found')
    return copy
  }

  async markChangesRequested(copyId: string, _note: string): Promise<BrandTemplate> {
    const copy = await this.getBrandCopy(copyId)
    if (!copy) throw new Error('Brand copy not found')
    return copy
  }

  async approveCopy(copyId: string, _note?: string): Promise<BrandTemplate> {
    const copy = await this.getBrandCopy(copyId)
    if (!copy) throw new Error('Brand copy not found')
    return copy
  }

  async publishCopy(copyId: string): Promise<BrandTemplate> {
    return this.updateBrandCopy(copyId, { reviewStatus: 'published' })
  }

  async createEducatorRequest(
    input: Omit<EducatorRequest, 'id' | 'createdAt' | 'status'>
  ): Promise<EducatorRequest> {
    const req: EducatorRequest = {
      ...input,
      id: (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)),
      createdAt: new Date().toISOString(),
      status: 'open',
    }
    this.educatorRequests.unshift(req)
    return req
  }
}

// Factory to resolve the active store based on env
export function getTemplateStore(): TemplateStore {
  const backend = String((import.meta as any).env?.VITE_DATA_BACKEND || 'mock').toLowerCase()
  switch (backend) {
    case 'mock':
      return new MockTemplateStore()
    case 'mongo':
      // Placeholder: swap with a real Mongo adapter in a future prompt
      console.warn('[templateStore] Mongo adapter not yet implemented – falling back to mock')
      return new MockTemplateStore()
    default:
      console.warn(`[templateStore] Unknown VITE_DATA_BACKEND="${backend}" – using mock`)
      return new MockTemplateStore()
  }
}
