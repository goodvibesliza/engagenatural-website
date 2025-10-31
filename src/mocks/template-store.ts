import { useMemo, useState } from 'react'

export type TemplateType = 'lesson' | 'challenge' | 'community'

export interface Template {
  id: string
  name: string
  description?: string
  type: TemplateType
  isGlobal?: boolean
  sections?: number
}

const seed: Template[] = [
  {
    id: 't-101',
    name: 'Sustainable Living Basics',
    description: 'Intro to sustainable living practices and eco-friendly choices.',
    type: 'lesson',
    isGlobal: true,
    sections: 5,
  },
  {
    id: 't-102',
    name: 'Zero Waste 30-Day Challenge',
    description: 'Daily prompts to reduce household waste to near-zero.',
    type: 'challenge',
    isGlobal: true,
    sections: 30,
  },
  {
    id: 't-103',
    name: 'Organic Nutrition Guide',
    description: 'Fundamentals of whole-food, organic nutrition.',
    type: 'lesson',
    isGlobal: false,
    sections: 7,
  },
  {
    id: 't-104',
    name: 'Eco Community Hub',
    description: 'A community space to discuss eco-friendly living.',
    type: 'community',
    isGlobal: true,
    sections: 4,
  },
  {
    id: 't-105',
    name: 'Mindful Consumption Challenge',
    description: 'Two-week challenge to build conscious shopping habits.',
    type: 'challenge',
    isGlobal: false,
    sections: 14,
  },
]

export function useTemplateStore() {
  const [items, setItems] = useState<Template[]>(seed)

  const api = useMemo(
    () => ({
      listByType: (type: TemplateType | 'all') =>
        type === 'all' ? items : items.filter((t) => t.type === type),
      duplicate: (id: string) => {
        const found = items.find((t) => t.id === id)
        if (!found) return null
        const copy: Template = {
          ...found,
          id: `${found.id}-copy-${Date.now()}`,
          name: `${found.name} (Copy)`,
        }
        setItems((prev) => [copy, ...prev])
        return copy
      },
    }),
    [items]
  )

  return api
}
