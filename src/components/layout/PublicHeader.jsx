import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useNavigate } from 'react-router-dom';
import LogoWordmark from '../brand/LogoWordmark';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/Button';
import { User, LogOut, Settings } from 'lucide-react';
import { useLogout } from '@/hooks/useLogout';

/**
 * Public-facing header with EngageNatural wordmark logo and user profile dropdown.
 * Designed to work alongside app navigation in left sidebar without duplication.
 */
export default function PublicHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { logout } = useLogout();

  const getUserInitials = () => {
    if (!user?.displayName && !user?.email) return 'U';
    const name = user?.displayName || user?.email;
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-[#f5f3f3] backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section - Left */}
          <div className="flex items-center">
            <LogoWordmark size="md" />
            <span className="ml-2 text-neutral-700 text-[10px] font-medium leading-none tracking-[0.15rem] font-body">
              BETA
            </span>
          </div>

          {/* User Profile - Right */}
          {user && (
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 flex items-center space-x-2 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL} alt={user.displayName || user.email} />
                      <AvatarFallback className="bg-brand-secondary/10 text-brand-secondary">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline-block text-sm">
                      {user.displayName || user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.displayName || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onSelect={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
