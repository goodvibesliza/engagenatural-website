// TODO: If your Brand layout lives elsewhere, adjust the import below.
import type { JSX } from "react"
import { Link } from "react-router-dom"

// Explicit extension to ensure TSX version is used over legacy JSX
import BrandManagerLayout from "@/components/brand/BrandManagerLayout.tsx"
import LogoWordmark from "@/components/brand/LogoWordmark"
import ContentManagerMain from "./ContentManager/ContentManagerMain"

export default function BrandContentManagementPage(): JSX.Element {
  const switchSection = (section: "Templates" | "Lessons" | "Challenges" | "Library" | "Announcements") => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("brand:content-switch", { detail: section }))
    }
  }

  const leftSidebar = (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Content Management</h3>
      </div>
      <nav className="py-2">
        <Link to="/admin" className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900">
          ← Back to Admin Dashboard
        </Link>
        <button onClick={() => switchSection("Templates")} className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900">Templates</button>
        <button onClick={() => switchSection("Lessons")} className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900">Lessons</button>
        <button onClick={() => switchSection("Challenges")} className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900">Challenges</button>
        <button onClick={() => switchSection("Library")} className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900">My Library</button>
        <button onClick={() => switchSection("Announcements")} className="block w-full text-left px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900">Announcements</button>
      </nav>
    </div>
  )

  return (
    <BrandManagerLayout leftSidebar={leftSidebar} headerLogo={<LogoWordmark size="md" />} hideProfileMenu>
      <ContentManagerMain />
    </BrandManagerLayout>
  )
}
