import type { JSX } from "react"
import BrandContentUploader from "@/components/brand/content/BrandContentUploader"

export interface LibrarySectionProps {
  brandId: string
  onRefresh?: () => void
}

export default function LibrarySection({ brandId, onRefresh }: LibrarySectionProps): JSX.Element {
  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3">
        <h2 className="text-base font-semibold text-stone-900">Brand Library</h2>
      </header>

      <div className="rounded-lg border border-[color:var(--divider-taupe)] bg-white p-4">
        <BrandContentUploader brandId={brandId} />
      </div>

      {/* TODO: List existing content from Firestore here. */}
    </div>
  )
}
