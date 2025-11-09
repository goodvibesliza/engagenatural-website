import { useEffect, useMemo, useState } from "react"
import type { JSX } from "react"
import { templateStore } from "@/data"
import type { BrandTemplate, LearningTemplate, TemplateType } from "@/types/templates"

type SubTab = "shared" | "copies"
type TypeFilter = "all" | TemplateType

export interface TemplatesSectionProps {
  brandId: string
  tier?: string
  onSelectCopy?: (id: string) => void
}

const BTN_PRIMARY = "h-9 px-4 rounded-md bg-black text-white hover:bg-neutral-800"
const BTN_GHOST = "h-9 px-3 rounded-md border border-neutral-300 hover:bg-neutral-50"
const BTN_SMALL = "h-8 px-3"

export default function TemplatesSection({ brandId, tier, onSelectCopy }: TemplatesSectionProps): JSX.Element {
  const [tab, setTab] = useState<SubTab>("shared")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [refresh, setRefresh] = useState<number>(0)
  const [shared, setShared] = useState<LearningTemplate[]>([])
  const [copies, setCopies] = useState<BrandTemplate[]>([])

  const kind: TemplateType | undefined = typeFilter === "all" ? undefined : typeFilter

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await templateStore.listShared({ type: kind, tier })
        if (!cancelled) setShared(list)
      } catch {
        if (!cancelled) setShared([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [kind, tier, refresh])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await templateStore.listBrandCopies(brandId, { type: kind })
        if (!cancelled) setCopies(list)
      } catch {
        if (!cancelled) setCopies([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [brandId, kind, refresh])

  const onUse = async (sharedId: string) => {
    const created = await templateStore.duplicateToBrand(sharedId, brandId)
    setTab("copies")
    setRefresh((v) => v + 1)
    onSelectCopy?.(created.id)
  }

  const onEditCopy = (id: string) => {
    onSelectCopy?.(id)
  }

  const onPublish = async (id: string) => {
    await templateStore.publishCopy(id)
    setRefresh((v) => v + 1)
  }

  const onDuplicateCopy = async (copy: BrandTemplate) => {
    const created = await templateStore.duplicateToBrand(copy.sourceTemplateId, copy.brandId)
    await templateStore.updateBrandCopy(created.id, {
      customTitle: copy.customTitle ?? created.customTitle,
      customBody: copy.customBody ?? created.customBody,
      reviewStatus: copy.reviewStatus,
      tier: copy.tier,
    })
    setRefresh((v) => v + 1)
  }

  const onDeleteCopy = async (id: string) => {
    await templateStore.removeBrandCopy(id)
    setRefresh((v) => v + 1)
  }

  return (
    <div className="space-y-4">
      {/* Tabs & type filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border bg-white p-0.5">
          <TabButton active={tab === "shared"} onClick={() => setTab("shared")}>Shared</TabButton>
          <TabButton active={tab === "copies"} onClick={() => setTab("copies")}>My Copies</TabButton>
        </div>

        <div className="inline-flex rounded-md border bg-white p-0.5 ml-2">
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
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-700 border">
            Tier: {tier}
          </span>
        ) : null}
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
      className={["px-3 py-1.5 text-sm rounded-md", active ? "bg-stone-900 text-white" : "text-stone-800 hover:bg-stone-50"].join(" ")}
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
      className={["px-3 py-1.5 text-sm rounded-md", active ? "bg-stone-100 text-stone-900" : "text-stone-800 hover:bg-stone-50"].join(" ")}
    >
      {children}
    </button>
  )
}

function SharedBoard({ rows, onUse }: { rows: LearningTemplate[]; onUse: (id: string) => void }): JSX.Element {
  if (!rows.length) {
    return <EmptyState title="No shared templates found" />
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
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
        <tbody className="divide-y">
          {rows.map((t) => (
            <tr key={t.id} className="hover:bg-stone-50">
              <Td className="font-medium text-stone-900">{t.title}</Td>
              <Td className="capitalize">{t.type}</Td>
              <Td>{t.duration ?? "—"}</Td>
              <Td className="capitalize">{t.difficulty ?? "—"}</Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {t.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center rounded-full border bg-stone-50 px-2 py-0.5 text-xs text-stone-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </Td>
              <Td>{t.tier ?? "—"}</Td>
              <Td className="text-right">
                <button type="button" onClick={() => onUse(t.id)} className={BTN_PRIMARY + " text-xs"}>
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
}: {
  rows: BrandTemplate[]
  onEdit: (id: string) => void
  onPublish: (id: string) => void | Promise<void>
  onDuplicate: (copy: BrandTemplate) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
}): JSX.Element {
  if (!rows.length) {
    return <EmptyState title="No copies yet" />
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
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
        <tbody className="divide-y">
          {rows.map((b) => (
            <tr key={b.id} className="hover:bg-stone-50">
              <Td className="font-medium text-stone-900">{b.customTitle ?? "Untitled"}</Td>
              <Td className="capitalize">{b.reviewStatus}</Td>
              <Td>{b.startDate ?? "—"}</Td>
              <Td>{b.endDate ?? "—"}</Td>
              <Td>{b.metrics?.completions ?? 0}</Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => onEdit(b.id)} className={[BTN_GHOST, BTN_SMALL].join(" ")}>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onPublish(b.id)}
                    disabled={b.reviewStatus === "published"}
                    className={[BTN_GHOST, BTN_SMALL, b.reviewStatus === "published" ? "opacity-50" : ""].join(" ")}
                  >
                    Publish
                  </button>
                  <button type="button" onClick={() => onDuplicate(b)} className={[BTN_GHOST, BTN_SMALL].join(" ")}>
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(b.id)}
                    className={["h-8 px-3 rounded-md bg-red-600 text-white hover:bg-red-700"].join(" ")}
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
  return <th className={["px-3 py-2 border-b", className].join(" ")}>{children}</th>
}

function Td({ children, className = "" }: { children: JSX.Element | string | number; className?: string }): JSX.Element {
  return <td className={["px-3 py-2 align-top", className].join(" ")}>{children}</td>
}

function EmptyState({ title }: { title: string }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-white p-10 text-center">
      <div className="text-stone-800 font-medium">{title}</div>
    </div>
  )
}
