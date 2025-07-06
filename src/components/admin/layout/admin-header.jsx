import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, Search, User, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../../../contexts/auth-context'
import { Button } from '../../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu'
import { Input } from '../../ui/input'
import { Badge } from '../../ui/badge'

export default function AdminHeader({ setSidebarOpen }) {
  const { user, userProfile, role, signOut } = useAuth()
  const navigate = useNavigate()
  const [notifications] = useState([
    { id: 1, message: 'New verification request', unread: true },
    { id: 2, message: 'Brand partnership approved', unread: true },
    { id: 3, message: 'System maintenance scheduled', unread: false }
  ])

  const unreadCount = notifications.filter(n => n.unread).length

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

  const handleLogout = async () => {
    console.log("Attempting to log out...")
    try {
      const { success, error } = await signOut()
      if (success) {
        console.log("Logout successful. Navigating to homepage.")
        navigate('/')
      } else {
        console.error("Logout failed:", error)
        // Optionally, you can add a toast notification to inform the user
      }
    } catch (err) {
      console.error("An unexpected error occurred during logout:", err)
    }
  }

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-6 w-6" aria-hidden="true" />
      </Button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Search */}
        <div className="relative flex flex-1 items-center">
          <Search className="pointer-events-none absolute inset-y-0 left-3 h-full w-5 text-gray-400" />
          <Input
            className="block h-full w-full border-0 py-0 pl-10 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
            placeholder="Search users, brands, verifications..."
            type="search"
          />
        </div>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex items-start gap-2 p-3">
                  <div className="flex-1">
                    <p className={`text-sm ${notification.unread ? 'font-medium' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>
                  </div>
                  {notification.unread && (
                    <div className="h-2 w-2 rounded-full bg-blue-600" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-x-2 text-sm font-semibold leading-6 text-gray-900">
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <span className="hidden lg:flex lg:items-center">
                  <span className="ml-2" aria-hidden="true">
                    {userProfile?.firstName || user?.email}
                  </span>
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {`${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || user?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {getRoleDisplayName(role)}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate('/admin/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate('/admin/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
