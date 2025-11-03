import { useEffect, useMemo, useState } from "react"
import type { JSX } from "react"
import { useBrandContext } from "@/hooks/useBrandContext"
import { templateStore } from "@/stores/templateStore"
import TemplatesSection from "./TemplatesSection"
import LibrarySection from "./LibrarySection"
import LessonsSection from "./LessonsSection"
import ChallengesSection from "./ChallengesSection"
import AnnouncementsSection from "./AnnouncementsSection"

type SectionKey = "Templates" | "Library" | "Lessons" | "Challenges" | "Announcements"

const SECTIONS: SectionKey[] = ["Templates", "Library", "Lessons", "Challenges", "Announcements"]

export default function BrandContentManager(): JSX.Element {
  const { brand } = useBrandContext()
  const brandId = brand?.id ?? (import.meta.env.VITE_DEMO_BRAND_ID as string) ?? "demo-brand"
  const brandName = brand?.name ?? "Demo Brand"
  const tier = brand?.tier ?? "pro"

  const [active, setActive] = useState<SectionKey>("Templates")
  const [search, setSearch] = useState<string>("")
  const [tag, setTag] = useState<string>("")

  const sharedTemplates = useMemo(() => {
    try {
      // Prefer brand-scoped shared templates; fallback to empty list
      const list = (templateStore as unknown as { listShared?: (brandId?: string) => unknown[] }).listShared?.(brandId)
      return Array.isArray(list) ? (list as unknown[]) : []
    } catch {
      return []
    }
  }, [brandId])

  // Listen for external requests to switch sections (custom events)
  useEffect(() => {
    if (typeof window === "undefined") return
    const onSwitch = (ev: Event) => {
      const custom = ev as CustomEvent<unknown>
      const detail = custom.detail
      let next: SectionKey | undefined
      if (typeof detail === "string") {
        if ((SECTIONS as readonly string[]).includes(detail)) next = detail as SectionKey
        if (detail === "shared" || detail === "copies") next = "Templates"
      } else if (detail && typeof detail === "object" && "tab" in (detail as Record<string, unknown>)) {
        const t = (detail as Record<string, unknown>).tab
        if (t === "shared" || t === "copies") next = "Templates"
        if (t === "Templates" || t === "Library" || t === "Lessons" || t === "Challenges" || t === "Announcements") {
          next = t as SectionKey
        }
      }
      if (next) setActive(next)
    }
    window.addEventListener("brand:templates-switch", onSwitch as EventListener)
    return () => window.removeEventListener("brand:templates-switch", onSwitch as EventListener)
  }, [])

  const topTemplates = useMemo(() => {
    const items = (sharedTemplates as Array<Record<string, unknown>>).slice(0, 3)
    return items.map((t, i) => {
      const title = typeof t?.title === "string" ? (t.title as string) : typeof t?.name === "string" ? (t.name as string) : `Template ${i + 1}`
      return title
    })
  }, [sharedTemplates])

  return (
    <div className="grid grid-cols-[auto_1fr_auto] h-screen bg-[var(--brand-bg)] text-[var(--brand-fg)]">
      {/* Left rail */}
      <nav aria-label="Brand content sections" className="w-56 border-r border-[color:var(--divider-taupe)] bg-white">
        <ul className="p-2 font-sans">
          {SECTIONS.map((key) => {
            const isActive = key === active
            return (
              <li key={key}>
                <button
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setActive(key)}
                  className={[
                    "w-full text-left px-3 py-2 rounded-md transition-colors",
                    isActive ? "bg-stone-100 font-semibold" : "hover:bg-stone-50",
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
      <main className="flex flex-col min-h-0">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-[color:var(--divider-taupe)] bg-white">
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
        <section className="flex-1 overflow-auto p-5">
          {active === "Templates" && (
            <TemplatesSection
              brandId={brandId}
              tier={tier}
              onSwitchTab={(tab) => {
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
