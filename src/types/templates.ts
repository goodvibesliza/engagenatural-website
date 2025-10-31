export type TemplateType = 'lesson' | 'challenge'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

type Visibility = 'public' | 'private' | 'brand'

export interface LearningTemplate {
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

export interface BrandTemplate {
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
