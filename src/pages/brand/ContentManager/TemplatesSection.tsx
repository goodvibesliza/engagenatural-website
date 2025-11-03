import { useMemo, useState } from "react"
import type { JSX } from "react"
import { templateStore } from "@/stores/templateStore"
import type { BrandTemplate, LearningTemplate, TemplateType } from "@/types/templates"

type SubTab = "shared" | "copies"
type TypeFilter = "all" | TemplateType

export interface TemplatesSectionProps {
  brandId: string
  tier?: string
  // Optional handler to switch the Templates sub-tab (e.g., to "shared")
  onSwitchTab?: (tab: string) => void
}

export default function TemplatesSection({ brandId, tier, onSwitchTab }: TemplatesSectionProps): JSX.Element {
  const [tab, setTab] = useState<SubTab>("shared")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [q, setQ] = useState<string>("")
  const [refresh, setRefresh] = useState<number>(0)

  const shared = useMemo(() => {
    const kind: TemplateType | undefined = typeFilter === "all" ? undefined : typeFilter
    const list = templateStore.listShared(kind, tier)
    return filterByQuery(list, q)
  }, [typeFilter, tier, q, refresh])

  const copies = useMemo(() => {
    const kind: TemplateType | undefined = typeFilter === "all" ? undefined : typeFilter
    const list = templateStore.listBrandCopies(brandId, kind)
    return filterCopiesByQuery(list, q)
  }, [brandId, typeFilter, q, refresh])

  function onUse(sharedId: string) {
    templateStore.duplicateToBrand(sharedId, brandId)
    setTab("copies")
    setRefresh((v) => v + 1)
  }

  function onEditCopy(id: string) {
    // Will be wired to EditTemplateDrawer in the next prompt
    if (typeof window !== "undefined") {
      const evt = new CustomEvent<{ id: string }>("brand:edit-template", { detail: { id } })
      window.dispatchEvent(evt)
    }
  }

  function onPublish(id: string) {
    templateStore.updateBrandCopy(id, { status: "published" })
    setRefresh((v) => v + 1)
  }

  function onDuplicateCopy(copy: BrandTemplate) {
    // Create a new brand copy derived from the same shared template, then carry over custom fields
    const created = templateStore.duplicateToBrand(copy.sourceTemplateId, copy.brandId)
    templateStore.updateBrandCopy(created.id, {
      customTitle: copy.customTitle ?? created.customTitle,
      customBody: copy.customBody ?? created.customBody,
      status: copy.status,
      tier: copy.tier,
    })
    setRefresh((v) => v + 1)
  }

  function onDeleteCopy(id: string) {
    templateStore.removeBrandCopy(id)
    setRefresh((v) => v + 1)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border border-[color:var(--divider-taupe)] bg-white p-0.5">
          <TabButton active={tab === "shared"} onClick={() => setTab("shared")}>
            Shared
          </TabButton>
          <TabButton active={tab === "copies"} onClick={() => setTab("copies")}>
            My Copies
          </TabButton>
        </div>

        <div className="inline-flex rounded-md border border-[color:var(--divider-taupe)] bg-white p-0.5 ml-2">
          <FilterButton active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>
            All
          </FilterButton>
          <FilterButton active={typeFilter === "lesson"} onClick={() => setTypeFilter("lesson")}>
            Lessons
          </FilterButton>
          <FilterButton active={typeFilter === "challenge"} onClick={() => setTypeFilter("challenge")}>
            Challenges
          </FilterButton>
        </div>

        {tier ? (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 border border-[color:var(--divider-taupe)]">
            Tier: {tier}
          </span>
        ) : null}

        <input
          aria-label="Quick search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search templates"
          className="ml-auto h-9 w-64 rounded-md border border-[color:var(--divider-taupe)] bg-white px-3 text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
      </div>

      {/* Boards */}
      {tab === "shared" ? (
        <SharedBoard rows={shared} onUse={onUse} />
      ) : (
        <CopiesBoard
          rows={copies}
          onEdit={onEditCopy}
          onPublish={onPublish}
          onDuplicate={onDuplicateCopy}
          onDelete={onDeleteCopy}
          onSwitchTab={onSwitchTab}
          onLocalSwitchToShared={() => setTab("shared")}
        />
      )}
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: JSX.Element | string }): JSX.Element {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        "px-3 py-1.5 text-sm rounded-md",
        active ? "bg-stone-900 text-white" : "text-stone-800 hover:bg-stone-50",
        "focus:outline-none focus:ring-2 focus:ring-pink-300",
      ].join(" ")}
    >
      {children}
    </button>
  )
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: JSX.Element | string }): JSX.Element {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={[
        "px-3 py-1.5 text-sm rounded-md",
        active ? "bg-stone-100 text-stone-900" : "text-stone-800 hover:bg-stone-50",
        "focus:outline-none focus:ring-2 focus:ring-pink-300",
      ].join(" ")}
    >
      {children}
    </button>
  )
}

function SharedBoard({ rows, onUse }: { rows: LearningTemplate[]; onUse: (id: string) => void }): JSX.Element {
  if (!rows.length) {
    return (
      <EmptyState
        title="No shared templates found"
        ctaLabel="Clear search"
        onCta={() => {
          // noop – parent manages search; consumers can re-render with cleared query
          // Intentionally left empty.
        }}
      />
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[color:var(--divider-taupe)] bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-stone-50 text-stone-600">
          <tr className="text-left">
            <Th>Title</Th>
            <Th>Type</Th>
            <Th>Duration</Th>
            <Th>Difficulty</Th>
            <Th>Tags</Th>
            <Th>Tier</Th>
            <Th className="text-right">Action</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--divider-taupe)]">
          {rows.map((t) => (
            <tr key={t.id} className="hover:bg-stone-50">
              <Td className="font-medium text-stone-900">{t.title}</Td>
              <Td className="capitalize">{t.type}</Td>
              <Td>{t.duration ?? "—"}</Td>
              <Td className="capitalize">{t.difficulty ?? "—"}</Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {t.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center rounded-full border border-[color:var(--divider-taupe)] bg-stone-50 px-2 py-0.5 text-xs text-stone-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </Td>
              <Td>{t.tier ?? "—"}</Td>
              <Td className="text-right">
                <button
                  type="button"
                  onClick={() => onUse(t.id)}
                  className="inline-flex items-center rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-pink-300"
                >
                  Use
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CopiesBoard({
  rows,
  onEdit,
  onPublish,
  onDuplicate,
  onDelete,
  onSwitchTab,
  onLocalSwitchToShared,
}: {
  rows: BrandTemplate[]
  onEdit: (id: string) => void
  onPublish: (id: string) => void
  onDuplicate: (copy: BrandTemplate) => void
  onDelete: (id: string) => void
  onSwitchTab?: (tab: string) => void
  onLocalSwitchToShared: () => void
}): JSX.Element {
  if (!rows.length) {
    return (
      <EmptyState
        title="No copies yet"
        ctaLabel="Browse shared"
        onCta={() => {
          // Prefer explicit handler from parent when provided
          if (onSwitchTab) {
            onSwitchTab("shared")
          } else if (typeof window !== "undefined") {
            // Backward compatibility: dispatch a CustomEvent for any legacy listeners
            const detail: any = typeof (window as any) !== "undefined" ? ("shared" as any) : ("shared" as any)
            const evt = new CustomEvent("brand:templates-switch", { detail })
            window.dispatchEvent(evt)
          }
          // Always update local state to reflect the switch immediately
          onLocalSwitchToShared()
        }}
      />
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[color:var(--divider-taupe)] bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-stone-50 text-stone-600">
          <tr className="text-left">
            <Th>Title</Th>
            <Th>Status</Th>
            <Th>Start</Th>
            <Th>End</Th>
            <Th>Completions</Th>
            <Th className="text-right">Action</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--divider-taupe)]">
          {rows.map((b) => (
            <tr key={b.id} className="hover:bg-stone-50">
              <Td className="font-medium text-stone-900">{b.customTitle ?? "Untitled"}</Td>
              <Td className="capitalize">{b.status}</Td>
              <Td>{b.startDate ?? "—"}</Td>
              <Td>{b.endDate ?? "—"}</Td>
              <Td>{b.metrics?.completions ?? 0}</Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(b.id)}
                    className="rounded-md border border-[color:var(--divider-taupe)] bg-white px-2.5 py-1.5 text-xs text-stone-800 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  >
                    Edit copy
                  </button>
                  <button
                    type="button"
                    onClick={() => onPublish(b.id)}
                    disabled={b.status === "published"}
                    className="rounded-md border border-[color:var(--divider-taupe)] bg-white px-2.5 py-1.5 text-xs text-stone-800 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-pink-300 disabled:opacity-50"
                  >
                    Publish
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicate(b)}
                    className="rounded-md border border-[color:var(--divider-taupe)] bg-white px-2.5 py-1.5 text-xs text-stone-800 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(b.id)}
                    className="rounded-md bg-red-600 px-2.5 py-1.5 text-xs text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-pink-300"
                  >
                    Delete
                  </button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children, className = "" }: { children: JSX.Element | string; className?: string }): JSX.Element {
  return <th className={["px-3 py-2 border-b border-[color:var(--divider-taupe)]", className].join(" ")}>{children}</th>
}

function Td({ children, className = "" }: { children: JSX.Element | string | number; className?: string }): JSX.Element {
  return <td className={["px-3 py-2 align-top", className].join(" ")}>{children}</td>
}

function EmptyState({ title, ctaLabel, onCta }: { title: string; ctaLabel: string; onCta: () => void }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-[color:var(--divider-taupe)] bg-white p-10 text-center">
      <div className="text-stone-800 font-medium">{title}</div>
      <button
        type="button"
        onClick={onCta}
        className="mt-3 rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-pink-300"
      >
        {ctaLabel}
      </button>
    </div>
  )
}

function filterByQuery(list: LearningTemplate[], q: string): LearningTemplate[] {
  const query = q.trim().toLowerCase()
  if (!query) return list
  return list.filter((t) => {
    if (t.title.toLowerCase().includes(query)) return true
    if (t.body.toLowerCase().includes(query)) return true
    if (t.tags.some((tag) => tag.toLowerCase().includes(query))) return true
    return false
  })
}

function filterCopiesByQuery(list: BrandTemplate[], q: string): BrandTemplate[] {
  const query = q.trim().toLowerCase()
  if (!query) return list
  return list.filter((b) => {
    const title = (b.customTitle ?? "").toLowerCase()
    if (title.includes(query)) return true
    return false
  })
}
