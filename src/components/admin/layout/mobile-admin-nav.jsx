import { useLocation, Link } from 'react-router-dom'
import { 
  X, 
  Home, 
  Users, 
  UserCheck, 
  Building, 
  TrendingUp, 
  FileText, 
  Package, 
  Activity, 
  Settings,
  Database,
  Wrench
} from 'lucide-react'
import { useRoleAccess } from '../../../hooks/use-role-access'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../ui/sheet'
import { Button } from '../../ui/button'
import { cn } from '../../../lib/utils'

const navigation = [
  { name: 'Overview', href: '/admin', icon: Home, current: false },
  { name: 'Users', href: '/admin/users', icon: Users, current: false, permission: ['manage_all_users', 'manage_brand_users', 'manage_retail_users'] },
  { name: 'Verifications', href: '/admin/verifications', icon: UserCheck, current: false, permission: ['approve_verifications'] },
  { name: 'Brands', href: '/admin/brands', icon: Building, current: false, permission: ['manage_all_brands', 'manage_brand_content', 'manage_brand_products'] },
  { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp, current: false, permission: ['view_all_analytics', 'view_brand_analytics', 'view_retail_analytics'] },
  { name: 'Content', href: '/admin/content', icon: FileText, current: false, permission: ['manage_content', 'manage_brand_content'] },
  { name: 'Products', href: '/admin/products', icon: Package, current: false, permission: ['manage_brand_products'] },
  { name: 'Activity', href: '/admin/activity', icon: Activity, current: false },
  { name: 'Settings', href: '/admin/settings', icon: Settings, current: false, permission: ['manage_system_settings'] },
  // Additional tools only when demo tools flag is enabled
  ...(import.meta.env.VITE_SHOW_DEMO_TOOLS === 'true'
    ? [
        {
          name: 'Demo Data',
          href: '/admin/demo',
          icon: Database,
          current: false,
          permission: ['system_settings'],
        },
        {
          name: 'Dev Tools',
          href: '/admin/dev',
          icon: Wrench,
          current: false,
          permission: ['system_settings'],
        },
        {
          name: 'Env Check',
          href: '/admin/env-check',
          icon: Activity,
          current: false,
          permission: ['system_settings'],
        },
      ]
    : []),
]

export default function MobileAdminNav({ sidebarOpen, setSidebarOpen }) {
  const location = useLocation()
  const { canAccess, role } = useRoleAccess()

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin'
      case 'brand_admin':
        return 'Brand Admin'
      case 'retail_admin':
        return 'Retail Admin'
      default:
        return 'User'
    }
  }

  const filteredNavigation = navigation.filter(item => {
    if (!item.permission) return true
    return canAccess(item.permission)
  })

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
          {/* Header */}
          <SheetHeader className="flex h-16 shrink-0 items-center justify-between">
            <SheetTitle className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">EN</span>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">EngageNatural</h1>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </SheetTitle>
          </SheetHeader>

          {/* Role Badge */}
          <div className="px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-medium text-blue-900">{getRoleDisplayName(role)}</p>
            <p className="text-xs text-blue-600">Access Level</p>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {filteredNavigation.map((item) => {
                    const isActive = location.pathname === item.href || 
                      (item.href !== '/admin' && location.pathname.startsWith(item.href))
                    
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            isActive
                              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                              : 'text-gray-700 hover:text-blue-700 hover:bg-gray-50',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors'
                          )}
                        >
                          <item.icon
                            className={cn(
                              isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-blue-700',
                              'h-6 w-6 shrink-0'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>

              {/* Legacy Dashboard Link */}
              <li className="mt-auto">
                <div className="px-2 py-2 border-t border-gray-200">
                  <Link
                    to="/admin/legacy"
                    onClick={() => setSidebarOpen(false)}
                    className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <TrendingUp className="h-5 w-5 shrink-0" aria-hidden="true" />
                    Legacy Dashboard
                  </Link>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
