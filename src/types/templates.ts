export type TemplateType = 'lesson' | 'challenge' | 'community'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export type Visibility = 'internal' | 'shared'

// Optional: current tier plan variants available in the app
export type BrandTier = 'basic' | 'pro' | 'enterprise'

export interface LearningTemplate {
  id: string
  title: string
  type: TemplateType
  body: string
  tags: string[]
  difficulty?: Difficulty
  duration?: number
  authorId: string
  visibility: Visibility
  approved: boolean
  createdAt?: string
  updatedAt?: string
  tier?: string
}

// Backward-compat alias for admin/mocks modules
export type BaseTemplate = LearningTemplate

export type ReviewStatus =
  | 'draft'
  | 'submitted'
  | 'changes_requested'
  | 'approved'
  | 'published'

export interface BrandTemplate {
  id: string
  sourceTemplateId: string
  type: TemplateType
  customTitle?: string
  customBody?: string
  reviewStatus: ReviewStatus
  reviewerNote?: string
  submittedAt?: string
  approvedAt?: string
  startDate?: string
  endDate?: string
  metrics?: { completions?: number; views?: number }
  brandId: string
  tier?: string
}

export interface EducatorRequest {
  id: string
  brandId: string
  templateId?: string
  topic: string
  skus?: string[]
  goals?: string
  budgetRange?: string
  contactEmail: string
  status: 'open' | 'in_progress' | 'closed'
  createdAt: string
}
