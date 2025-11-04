// TODO: If your Brand layout lives elsewhere, adjust the import below.
import type { JSX } from "react"

import BrandManagerLayout from "@/components/brand/BrandManagerLayout"
import ContentManagerMain from "./ContentManager/ContentManagerMain"

export default function BrandContentManagementPage(): JSX.Element {
  return (
    <BrandManagerLayout>
      <ContentManagerMain />
    </BrandManagerLayout>
  )
}
