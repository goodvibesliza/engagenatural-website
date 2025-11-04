import { useMemo, useState } from "react"
import type { JSX } from "react"

import { useBrandContext } from "@/hooks/useBrandContext"
import { templateStore } from "@/stores/templateStore"
import type { TemplateType } from "@/types/templates"

import TemplatesSection from "./TemplatesSection"
import LibrarySection from "./LibrarySection"
import LessonsSection from "./LessonsSection"
import ChallengesSection from "./ChallengesSection"
import AnnouncementsSection from "./AnnouncementsSection"

type SectionKey = "Templates" | "Library" | "Lessons" | "Challenges" | "Announcements"

export default function ContentManagerMain(): JSX.Element {
  const { brandId, brandName, tier } = useBrandContext()

  const [active, setActive] = useState<SectionKey>("Templates")
  const [search, setSearch] = useState<string>("")
  const [tag, setTag] = useState<string>("")

  const externalType = useMemo<"all" | TemplateType>(() => {
    if (tag === "lesson" || tag === "challenge") return tag
    return "all"
  }, [tag])

  const topTemplates = useMemo(() => {
    return templateStore
      .listShared(undefined, tier)
      .slice(0, 3)
      .map((t, i) => t.title || `Template ${i + 1}`)
  }, [tier])

  return (
    <div className="grid grid-cols-[1fr_20rem] min-h-[calc(100vh-0px)] bg-[var(--brand-bg)] text-[var(--brand-fg)]">
      {/* Center column */}
      <main className="flex min-h-0 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-[color:var(--divider-taupe)] bg-white">
          <div className="flex items-center gap-3 px-5 py-4">
            <h1 className="text-xl font-semibold font-serif">{brandName}</h1>
            {tier ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 border border-[color:var(--divider-taupe)]">
                Tier: {tier}
              </span>
            ) : null}

            <div className="ml-auto flex items-center gap-2">
              <input
                aria-label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="h-9 w-52 rounded-md border border-[color:var(--divider-taupe)] bg-white px-3 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
              <select
                aria-label="Filter by tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="h-9 rounded-md border border-[color:var(--divider-taupe)] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              >
                <option value="">All tags</option>
                <option value="challenge">Challenge</option>
                <option value="lesson">Lesson</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("brand:new-template"))
                  }
                }}
                className="h-9 rounded-md bg-stone-900 px-3 text-sm font-medium text-white hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-pink-300"
              >
                New Template
              </button>
            </div>
          </div>

          {/* Section switcher (pills) */}
          <div className="border-t border-[color:var(--divider-taupe)] bg-white px-5 py-2">
            <div className="flex flex-wrap items-center gap-2">
              {(["Templates", "Library", "Lessons", "Challenges", "Announcements"] as SectionKey[]).map((key) => {
                const isActive = key === active
                return (
                  <button
                    key={key}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => setActive(key)}
                    className={[
                      "px-3 py-1.5 text-sm rounded-md transition-colors",
                      isActive ? "bg-stone-900 text-white" : "text-stone-800 hover:bg-stone-50",
                      "focus:outline-none focus:ring-2 focus:ring-pink-300",
                    ].join(" ")}
                  >
                    {key}
                  </button>
                )
              })}
            </div>
          </div>
        </header>

        {/* Section content */}
        <section className="flex-1 overflow-auto p-5">
          {active === "Templates" && (
            <TemplatesSection
              brandId={brandId}
              tier={tier}
              externalSearch={search}
              externalType={externalType}
              onExternalSearchChange={setSearch}
            />
          )}
          {active === "Library" && <LibrarySection brandId={brandId} />}
          {active === "Lessons" && <LessonsSection brandId={brandId} />}
          {active === "Challenges" && <ChallengesSection />}
          {active === "Announcements" && <AnnouncementsSection />}
        </section>
      </main>

      {/* Right rail */}
      <aside className="w-80 border-l border-[color:var(--divider-taupe)] bg-white p-4">
        <div className="space-y-4">
          <div className="rounded-lg border border-[color:var(--divider-taupe)] bg-stone-50 p-4">
            <h2 className="mb-2 text-sm font-medium text-stone-700">Completions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Kpi label="7d" value="12" />
              <Kpi label="30d" value="45" />
            </div>
          </div>

          <div className="rounded-lg border border-[color:var(--divider-taupe)] bg-stone-50 p-4">
            <h2 className="mb-2 text-sm font-medium text-stone-700">Top Templates</h2>
            <ol className="list-decimal pl-5 text-sm text-stone-800 space-y-1">
              {topTemplates.length > 0 ? (
                topTemplates.map((t, i) => <li key={i}>{t}</li>)
              ) : (
                <>
                  <li>Welcome Post</li>
                  <li>New Product Launch</li>
                  <li>Weekly Tips</li>
                </>
              )}
            </ol>
          </div>
        </div>
      </aside>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="rounded-md border border-[color:var(--divider-taupe)] bg-white p-3 text-center">
      <div className="text-xs uppercase tracking-wide text-stone-500">{label}</div>
      <div className="text-lg font-semibold text-stone-900">{value}</div>
    </div>
  )
}
