import { useEffect, useMemo, useState } from "react"
import type { JSX } from "react"
import { templateStore } from "@/stores/templateStore"
import LibrarySection from "./LibrarySection"
import TemplatesSection from "./TemplatesSection"

type SectionKey = "Templates" | "Library" | "Lessons" | "Challenges" | "Announcements"

function useDemoBrand(): { brandId: string; brandName: string; tier: string } {
  const brandId = (import.meta.env.VITE_DEMO_BRAND_ID as string) || "demo-brand"
  // Mocked brand values; replace with auth-context when ready
  return { brandId, brandName: "Demo Brand", tier: "pro" }
}

const SECTIONS: SectionKey[] = [
  "Templates",
  "Library",
  "Lessons",
  "Challenges",
  "Announcements",
]

export default function BrandContentManagerShell(): JSX.Element {
  const { brandId, brandName, tier } = useDemoBrand()
  const [active, setActive] = useState<SectionKey>("Templates")

  // No-op search and tag filter state for future wiring
  const [search, setSearch] = useState<string>("")
  const [tag, setTag] = useState<string>("")

  const sharedTemplates = useMemo(() => templateStore.listShared(undefined, undefined), [])

  // Listen for external requests to switch sections (legacy/custom events)
  useEffect(() => {
    if (typeof window === "undefined") return
    const onSwitch = (ev: Event) => {
      try {
        const detail: any = (ev as CustomEvent).detail
        let next: SectionKey | undefined
        if (typeof detail === "string") {
          // If a valid section name is provided, honor it; otherwise map shared/copies → Templates
          if (["Templates", "Library", "Lessons", "Challenges", "Announcements"].includes(detail)) {
            next = detail as SectionKey
          } else if (detail === "shared" || detail === "copies") {
            next = "Templates"
          }
        } else if (detail && typeof detail === "object") {
          const t = detail.tab
          if (t === "Templates") next = "Templates"
          if (t === "Library") next = "Library"
          if (t === "Lessons") next = "Lessons"
          if (t === "Challenges") next = "Challenges"
          if (t === "Announcements") next = "Announcements"
          if (t === "shared" || t === "copies") next = "Templates"
        }
        if (next) setActive(next)
      } catch {
        /* no-op */
      }
    }
    window.addEventListener("brand:templates-switch", onSwitch as EventListener)
    return () => {
      window.removeEventListener("brand:templates-switch", onSwitch as EventListener)
    }
  }, [])

  return (
    <div className="grid grid-cols-[220px_1fr_320px] min-h-[calc(100vh-56px)] bg-stone-50 text-stone-900">
      {/* Left rail */}
      <nav aria-label="Brand content sections" className="border-r border-[color:var(--divider-taupe)] bg-white">
        <ul className="p-2">
          {SECTIONS.map((key) => {
            const isActive = key === active
            return (
              <li key={key} className="">
                <button
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setActive(key)}
                  className={[
                    "w-full text-left px-3 py-2 rounded-md transition-colors",
                    isActive ? "bg-stone-100 font-medium" : "hover:bg-stone-50",
                    "focus:outline-none focus:ring-2 focus:ring-pink-300 focus:ring-offset-2 focus:ring-offset-white",
                  ].join(" ")}
                >
                  {key}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Center column */}
      <main className="flex flex-col min-h-full">
        {/* Header */}
        <header className="border-b border-[color:var(--divider-taupe)] bg-white">
          <div className="flex items-center gap-3 px-5 py-4">
            <h1 className="text-xl font-semibold font-serif">{brandName}</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 border border-[color:var(--divider-taupe)]">
              Tier: {tier}
            </span>

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
                <option value="brand">Brand</option>
                <option value="challenge">Challenge</option>
                <option value="lesson">Lesson</option>
              </select>
              <button
                type="button"
                className="h-9 rounded-md bg-stone-900 px-3 text-sm font-medium text-white hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-pink-300"
              >
                New Template
              </button>
            </div>
          </div>
        </header>

        {/* Content switcher */}
        <section className="flex-1 p-5">
          {active === "Templates" && (
            <TemplatesSection
              brandId={brandId}
              tier={tier}
              onSwitchTab={(tab) => {
                // Ensure Templates section is visible if sub-tab navigation is requested
                if (tab === "shared" || tab === "copies") setActive("Templates")
              }}
            />
          )}
          {active === "Library" && <LibrarySection brandId={brandId} />}
          {active === "Lessons" && <LessonsSection />}
          {active === "Challenges" && <ChallengesSection />}
          {active === "Announcements" && <AnnouncementsSection />}
        </section>
      </main>

      {/* Right rail */}
      <aside className="border-l border-[color:var(--divider-taupe)] bg-white p-4">
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
              <li>Playfair Lesson · Petal Pink Wellness Basics</li>
              <li>Inter Lesson · Soft Border Styling 101</li>
              <li>Challenge · 7‑Day Petal Pink Refresh</li>
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

// TemplatesSection now imported from module

// LibrarySection is imported from a dedicated module

function LessonsSection(): JSX.Element {
  return (
    <div className="rounded-lg border border-[color:var(--divider-taupe)] bg-white p-6 text-sm text-stone-700">
      Lessons manager coming soon.
    </div>
  )
}

function ChallengesSection(): JSX.Element {
  return (
    <div className="rounded-lg border border-[color:var(--divider-taupe)] bg-white p-6 text-sm text-stone-700">
      Challenges coming soon.
    </div>
  )
}

function AnnouncementsSection(): JSX.Element {
  return (
    <div className="rounded-lg border border-[color:var(--divider-taupe)] bg-white p-6 text-sm text-stone-700">
      Announcements coming soon.
    </div>
  )
}
