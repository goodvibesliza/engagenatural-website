// TODO: If your Brand layout lives elsewhere, adjust the import below.
import type { JSX } from "react"

// Explicit extension to ensure TSX version is used over legacy JSX
import BrandManagerLayout from "@/components/brand/BrandManagerLayout.tsx"
import ContentManagerMain from "./ContentManager/ContentManagerMain"

export default function BrandContentManagementPage(): JSX.Element {
  return (
    <BrandManagerLayout>
      <ContentManagerMain />
    </BrandManagerLayout>
  )
}
