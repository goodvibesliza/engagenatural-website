export type TemplateType = 'lesson' | 'challenge' | 'community'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export type Visibility = 'internal' | 'shared'

export interface BaseTemplate {
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

export type LearningTemplate = BaseTemplate

// BrandTemplate extends BaseTemplate with brand-specific metadata
export interface BrandTemplate extends BaseTemplate {
  brandId: string
  // source template id this brand template was derived from
  sourceId: string
  // optional tier for assignment context
  tier?: 'basic' | 'pro' | 'enterprise'
}
