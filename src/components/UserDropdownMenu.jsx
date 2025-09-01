import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';
import { useLogout } from '../hooks/useLogout'; // custom logout hook

// Import UI components from shadcn/ui
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from './ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';

// Import icons from lucide-react
import {
  User,
  ShieldCheck,
  Users,
  Trophy,
  LogOut,
  Settings,
} from 'lucide-react';

export default function UserDropdownMenuUpdated() {
  const { user, userProfile, role } = useAuth();
  const { logout } = useLogout();

  // Render a placeholder or nothing if user data is not available yet
  if (!user || !userProfile) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full">
        <User className="h-5 w-5" />
      </Button>
    );
  }

  // Helper to get initials for the avatar fallback
  const getInitials = (name) => {
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.length > 2 ? initials.substring(0, 2) : initials || 'U';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={userProfile.photoURL} alt={userProfile.displayName || 'User Avatar'} />
            <AvatarFallback>{getInitials(userProfile.displayName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userProfile.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Common user links  */}
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/profile">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/profile?tab=verification">
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>Verification</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/communities">
              <Users className="mr-2 h-4 w-4" />
              <span>Communities</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/challenges">
              <Trophy className="mr-2 h-4 w-4" />
              <span>Challenges</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        
        {role === 'super_admin' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/admin">
                <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                <span className="font-semibold">Admin Panel</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
