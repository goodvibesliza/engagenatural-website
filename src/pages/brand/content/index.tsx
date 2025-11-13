import { useState } from 'react'
import LogoWordmark from '@/components/brand/LogoWordmark'
import UserDropdownMenu from '@/components/UserDropdownMenu'
import ContentManagerMain from '@/pages/brand/ContentManager/ContentManagerMain'

type SectionKey = 'templates' | 'lessons' | 'challenges' | 'library' | 'announcements'

export default function BrandContentPage() {
  const [activeSection, setActiveSection] = useState<SectionKey>('templates')

  return (
    <div className="min-h-screen bg-white">
      {/* Global header */}
      <header className="sticky top-0 z-40 border-b bg-white">
        <div className="mx-auto max-w-7xl h-16 flex items-center justify-between px-4">
          <LogoWordmark size="md" />
          <UserDropdownMenu />
        </div>
      </header>

      <div className="mx-auto max-w-7xl grid grid-cols-[14rem_1fr] gap-6 px-4 py-6">
        {/* Left menu */}
        <nav aria-label="Content Management" className="self-start sticky top-16">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Content Management</h2>
          <ul className="space-y-1 text-sm">
            {(
              [
                { key: 'templates', label: 'Templates' },
                { key: 'lessons', label: 'Lessons' },
                { key: 'challenges', label: 'Challenges' },
                { key: 'library', label: 'My Library' },
                { key: 'announcements', label: 'Announcements' },
              ] as { key: SectionKey; label: string }[]
            ).map((item) => {
              const isActive = activeSection === item.key
              return (
                <li key={item.key}>
                  <button
                    type="button"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => setActiveSection(item.key)}
                    className={[
                      'w-full text-left rounded-md px-3 py-2',
                      isActive ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50',
                    ].join(' ')}
                  >
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Center + right rail handled by ContentManagerMain */}
        <ContentManagerMain activeSection={activeSection} onChangeSection={setActiveSection} />
      </div>
    </div>
  )
}
