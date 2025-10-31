export type TemplateType = 'lesson' | 'challenge' | 'community'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export type Visibility = 'internal' | 'shared'

interface BaseTemplate {
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
export type BrandTemplate = BaseTemplate
