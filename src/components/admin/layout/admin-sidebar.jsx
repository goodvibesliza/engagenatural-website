import { useLocation, Link } from 'react-router-dom'
import { 
  BarChart3, 
  Users, 
  UserCheck, 
  Building, 
  TrendingUp, 
  FileText, 
  Package, 
  Activity, 
  Settings,
  Home,
  Database
} from 'lucide-react'
import React from 'react'
import { useRoleAccess } from '../../../hooks/use-role-access'
import { useAuth } from '../../../contexts/auth-context'
import { cn } from '../../../lib/utils'

const navigation = [
  { name: 'Overview', href: '/admin', icon: Home, current: false },
  { name: 'Users', href: '/admin/users', icon: Users, current: false, permission: ['manage_users'] },
  { name: 'Verifications', href: '/admin/verifications', icon: UserCheck, current: false, permission: ['approve_verifications'] },
  { name: 'Brands', href: '/admin/brands', icon: Building, current: false, permission: ['manage_brands', 'manage_brand_content', 'manage_brand_products'] },
  { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp, current: false, permission: ['view_analytics'] },
  { name: 'Content', href: '/admin/content', icon: FileText, current: false, permission: ['manage_content', 'manage_brand_content'] },
  { name: 'Products', href: '/admin/products', icon: Package, current: false, permission: ['manage_brand_products'] },
  { name: 'Activity', href: '/admin/activity', icon: Activity, current: false },
  { name: 'Settings', href: '/admin/settings', icon: Settings, current: false, permission: ['system_settings'] },
   // Demo Data management (super admin only)
  { name: 'Demo Data', href: '/admin/demo', icon: Database, current: false, permission: ['system_settings'] },
]

export default function AdminSidebar() {
  const location = useLocation()
  const auth = useAuth()
  
  /* ------------------------------------------------------------------
   * Safely consume the role-access hook
   * ------------------------------------------------------------------ */
  let rawRoleAccess
  try {
    rawRoleAccess = useRoleAccess()
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[AdminSidebar] useRoleAccess threw before context ready:', err)
    rawRoleAccess = {}
  }

  // Fallbacks while auth context / role access is still initialising
  const safeCanAccess =
    typeof rawRoleAccess?.canAccess === 'function'
      ? rawRoleAccess.canAccess
      : () => true
  const role = rawRoleAccess?.role || 'guest'

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
    return safeCanAccess(item.permission)
  })

  /* ------------------------------------------------------------------
   * Debug – log visible items whenever role changes
   * ------------------------------------------------------------------ */
  React.useEffect(() => {
    /* eslint-disable no-console */
    console.debug(
      '[AdminSidebar] visible nav items for role',
      role,
      filteredNavigation.map((n) => n.name)
    )
    /* eslint-enable no-console */
  }, [role, location.pathname]) // log once per role / nav change

  const handleLogout = async () => {
    try {
      await auth.signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-gray-200">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">EN</span>
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">EngageNatural</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        </div>

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
                  className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <BarChart3 className="h-5 w-5 shrink-0" aria-hidden="true" />
                  Legacy Dashboard
                </Link>
              </div>
            </li>

            {/* Logout Button */}
            <li>
              <div className="px-2 py-2 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors w-full text-left"
                >
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}