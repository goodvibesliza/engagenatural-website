import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'engagenatural:template-store:v1'

// Utilities
const nowIso = () => new Date().toISOString()
const makeId = (prefix = 'tpl') => `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`

// Seed 5 lessons + 5 challenges
const seedLearning = () => {
  const ts = nowIso()
  /** @type {Array<import('@/types/templates').LearningTemplate>} */
  const lessons = [
    {
      id: makeId('lsn'),
      title: 'Sustainable Living Basics',
      type: 'lesson',
      duration: 25,
      difficulty: 'beginner',
      tags: ['sustainability', 'lifestyle'],
      body: 'Intro to sustainable living practices and eco-friendly choices.',
      approved: true,
      visibility: 'public',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: makeId('lsn'),
      title: 'Organic Nutrition Guide',
      type: 'lesson',
      duration: 35,
      difficulty: 'intermediate',
      tags: ['nutrition', 'health', 'organic'],
      body: 'Complete guide to organic nutrition and healthy eating.',
      approved: false,
      visibility: 'public',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: makeId('lsn'),
      title: 'Eco-Tech Innovation Workshop',
      type: 'lesson',
      duration: 45,
      difficulty: 'advanced',
      tags: ['technology', 'innovation'],
      body: 'Interactive workshop on sustainable technology solutions.',
      approved: false,
      visibility: 'private',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: makeId('lsn'),
      title: 'Mindful Consumption 101',
      type: 'lesson',
      duration: 18,
      difficulty: 'beginner',
      tags: ['habits', 'shopping'],
      body: 'Foundations of mindful consumption and spending habits.',
      approved: true,
      visibility: 'public',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: makeId('lsn'),
      title: 'Community Engagement for Impact',
      type: 'lesson',
      duration: 28,
      difficulty: 'intermediate',
      tags: ['community', 'impact'],
      body: 'How to mobilize communities for sustainable impact.',
      approved: true,
      visibility: 'public',
      createdAt: ts,
      updatedAt: ts,
    },
  ]
  /** @type {Array<import('@/types/templates').LearningTemplate>} */
  const challenges = [
    {
      id: makeId('chl'),
      title: 'Zero Waste 30 Day',
      type: 'challenge',
      duration: 30,
      difficulty: 'advanced',
      tags: ['challenge', 'waste-reduction'],
      body: 'A 30‑day challenge to reduce household waste to near zero.',
      approved: true,
      visibility: 'public',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: makeId('chl'),
      title: 'Mindful Consumption 14 Day',
      type: 'challenge',
      duration: 14,
      difficulty: 'intermediate',
      tags: ['challenge', 'shopping'],
      body: 'Build conscious shopping habits with daily prompts.',
      approved: true,
      visibility: 'public',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: makeId('chl'),
      title: 'Plant‑Based Week',
      type: 'challenge',
      duration: 7,
      difficulty: 'beginner',
      tags: ['nutrition', 'beginner'],
      body: 'Seven days of plant‑forward meals and education.',
      approved: false,
      visibility: 'public',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: makeId('chl'),
      title: 'Car‑Free Commute',
      type: 'challenge',
      duration: 10,
      difficulty: 'intermediate',
      tags: ['mobility', 'environment'],
      body: 'Ten days of car‑free commuting alternatives.',
      approved: true,
      visibility: 'public',
      createdAt: ts,
      updatedAt: ts,
    },
    {
      id: makeId('chl'),
      title: 'Digital Detox Weekend',
      type: 'challenge',
      duration: 2,
      difficulty: 'beginner',
      tags: ['wellbeing', 'habits'],
      body: 'Two‑day digital detox to reset attention and presence.',
      approved: true,
      visibility: 'public',
      createdAt: ts,
      updatedAt: ts,
    },
  ]
  return [...lessons, ...challenges]
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { learningTemplates: seedLearning(), brandTemplates: [] }
    const parsed = JSON.parse(raw)
    return {
      learningTemplates: Array.isArray(parsed.learningTemplates) ? parsed.learningTemplates : seedLearning(),
      brandTemplates: Array.isArray(parsed.brandTemplates) ? parsed.brandTemplates : [],
    }
  } catch {
    return { learningTemplates: seedLearning(), brandTemplates: [] }
  }
}

function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota errors
  }
}

// Hook API (swappable with Firestore/Mongo later)
export function useTemplateStore() {
  const initial = useMemo(() => load(), [])
  const [learningTemplates, setLearningTemplates] = useState(initial.learningTemplates)
  const [brandTemplates, setBrandTemplates] = useState(initial.brandTemplates)

  useEffect(() => {
    save({ learningTemplates, brandTemplates })
  }, [learningTemplates, brandTemplates])

  const api = useMemo(() => {
    return {
      learningTemplates,
      brandTemplates,

      // Getters
      list: (type /* 'lesson' | 'challenge' | 'all' */ = 'all') =>
        type === 'all' ? learningTemplates : learningTemplates.filter((t) => t.type === type),

      get: (id) => learningTemplates.find((t) => t.id === id) || brandTemplates.find((t) => t.id === id) || null,

      // Actions
      create: (payload) => {
        const ts = nowIso()
        const next = {
          id: makeId('tpl'),
          title: '',
          type: 'lesson',
          duration: 0,
          difficulty: 'beginner',
          tags: [],
          body: '',
          approved: false,
          visibility: 'public',
          createdAt: ts,
          updatedAt: ts,
          ...payload,
        }
        setLearningTemplates((prev) => [next, ...prev])
        return next
      },

      update: (id, patch) => {
        setLearningTemplates((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: nowIso() } : t))
        )
        return true
      },

      duplicate: (id) => {
        const src = learningTemplates.find((t) => t.id === id)
        if (!src) return null
        const copy = {
          ...src,
          id: makeId('copy'),
          title: `${src.title} (Copy)`,
          createdAt: nowIso(),
          updatedAt: nowIso(),
          approved: false,
        }
        setLearningTemplates((prev) => [copy, ...prev])
        return copy
      },

      assignToBrands: (_id, _brandIds) => {
        // No-op for now; API surface is present for future backend wiring
        return { success: true }
      },
    }
  }, [learningTemplates, brandTemplates])

  return api
}
