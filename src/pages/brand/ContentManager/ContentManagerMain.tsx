import { useEffect, useMemo, useState } from "react"
import type { JSX } from "react"
import { useBrandContext } from "@/hooks/useBrandContext"
import { templateStore } from "@/data"
import type { ReviewStatus } from "@/types/templates"

import TemplatesSection from "./TemplatesSection"
import LibrarySection from "./LibrarySection"
import LessonsSection from "./LessonsSection"
import ChallengesSection from "./ChallengesSection"
import AnnouncementsSection from "./AnnouncementsSection"
import RightRail from "@/components/brand/RightRail"
import EducatorRequestModal from "@/components/brand/EducatorRequestModal"
import SubmitForReviewDialog from "@/components/brand/SubmitForReviewDialog"

type SectionKey = "templates" | "library" | "lessons" | "challenges" | "announcements"

type Props = {
  activeSection: SectionKey
  onChangeSection?: (s: SectionKey) => void
  currentCopyId?: string
}

export default function ContentManagerMain({ activeSection, onChangeSection, currentCopyId }: Props): JSX.Element {
  const { brandId, brandName, tier } = useBrandContext()

  const [search, setSearch] = useState<string>("")
  const [tag, setTag] = useState<string>("")
  const [educatorOpen, setEducatorOpen] = useState(false)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [selectedCopyId, setSelectedCopyId] = useState<string | undefined>(currentCopyId)
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus | undefined>(undefined)

  // Sync selected copy id from props
  useEffect(() => {
    setSelectedCopyId(currentCopyId)
  }, [currentCopyId])

  // Load review status when selected changes
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!selectedCopyId) {
        if (!cancelled) setSelectedStatus(undefined)
        return
      }
      try {
        const copy = await templateStore.getBrandCopy(selectedCopyId)
        if (!cancelled) setSelectedStatus(copy?.reviewStatus)
      } catch {
        if (!cancelled) setSelectedStatus(undefined)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedCopyId])

  const changeSection = (s: SectionKey) => onChangeSection?.(s)
  const externalType = useMemo(() => (tag === 'lesson' || tag === 'challenge' ? (tag as 'lesson' | 'challenge') : undefined), [tag])

  return (
    <div className="grid grid-cols-[1fr_20rem] gap-6 min-h-[calc(100vh-64px)]">
      {/* Center column */}
      <main className="flex min-h-0 flex-col">
        {/* Sticky header */}
        <header className="sticky top-0 z-10 border-b bg-white">
          <div className="flex items-center gap-3 px-5 py-4">
            <h1 className="text-xl font-semibold font-serif">{brandName}</h1>
            {tier ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 border">
                Tier: {tier}
              </span>
            ) : null}

            <div className="ml-auto flex items-center gap-2">
              <input
                aria-label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="h-9 w-52 rounded-md border bg-white px-3 text-sm placeholder:text-stone-400"
              />
              <select
                aria-label="Filter by tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="h-9 rounded-md border bg-white px-3 text-sm"
              >
                <option value="">All tags</option>
                <option value="challenge">Challenge</option>
                <option value="lesson">Lesson</option>
              </select>
              <button
                type="button"
                onClick={() => changeSection("templates")}
                className="h-9 px-4 rounded-md bg-black text-white hover:bg-neutral-800"
              >
                New Template
              </button>
            </div>
          </div>
        </header>

        {/* Section content */}
        <section className="flex-1 overflow-auto p-5">
          {activeSection === "templates" && (
            <TemplatesSection
              brandId={brandId}
              tier={tier}
              externalSearch={search}
              externalType={externalType}
              onSelectCopy={(id) => setSelectedCopyId(id)}
            />
          )}
          {activeSection === "library" && <LibrarySection brandId={brandId} />}
          {activeSection === "lessons" && <LessonsSection brandId={brandId} />}
          {activeSection === "challenges" && <ChallengesSection />}
          {activeSection === "announcements" && <AnnouncementsSection />}
        </section>
      </main>

      {/* Right rail */}
      <RightRail
        brandId={brandId}
        reviewStatus={selectedStatus}
        onRequestEducator={() => setEducatorOpen(true)}
        onSubmitForReview={selectedCopyId ? () => setSubmitOpen(true) : undefined}
      />

      {/* Modals */}
      <EducatorRequestModal
        open={educatorOpen}
        onClose={() => setEducatorOpen(false)}
        brandId={brandId}
        templateId={selectedCopyId}
        onSubmitted={() => undefined}
      />
      {selectedCopyId && (
        <SubmitForReviewDialog
          open={submitOpen}
          onClose={() => setSubmitOpen(false)}
          copyId={selectedCopyId}
          onSubmitted={() => undefined}
        />
      )}
    </div>
  )
}
