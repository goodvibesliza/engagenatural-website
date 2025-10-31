export type TemplateType = 'lesson' | 'challenge' | 'community'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

type Visibility = 'public' | 'private' | 'brand'

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
