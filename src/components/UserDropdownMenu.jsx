import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/auth-context';

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
import { Button } from './ui/Button';

// Import icons from lucide-react
import {
  User,
  ShieldCheck,
  Users,
  Trophy,
  LogOut,
  Settings,
} from 'lucide-react';

/**
 * User account dropdown triggered by the user's avatar.
 *
 * Renders a compact avatar button when no user data is available; when a user is present,
 * shows a dropdown with the user's name and email, staff navigation links (Profile, Verification,
 * Communities, My Brands), a Settings link, a conditional "Admin Panel" link when the authenticated
 * role equals `'super_admin'`, and a Sign Out action.
 *
 * The Sign Out action calls the auth `signOut` function and performs a hard redirect to the site
 * root (`window.location.assign('/')`) on success; sign-out errors are logged to the console.
 *
 * @returns {JSX.Element} The user dropdown menu React element.
 */
export default function UserDropdownMenu() {
  const { user, role, signOut } = useAuth();

  // Handle sign out with hard redirect
  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.assign('/'); // Hard redirect to home
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Render a placeholder if user data is not available yet
  if (!user) {
    return (
      <Button variant="ghost" size="icon" className="rounded-full">
        <User className="h-5 w-5" />
      </Button>
    );
  }

  // Helper to get initials for the avatar fallback
  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.length > 2 ? initials.substring(0, 2) : initials;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            {user.profileImage && user.profileImage.startsWith('http') ? (
              <AvatarImage src={user.profileImage} alt={user.displayName || 'User Avatar'} />
            ) : (
              <AvatarFallback>{getInitials(user.displayName || user.name)}</AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName || user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Role-specific navigation links */}
        {role === 'staff' && (
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link to="/staff/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/staff/verification">
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Verification</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/community">
                <Users className="mr-2 h-4 w-4" />
                <span>Communities</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/staff/my-brands">
                <Trophy className="mr-2 h-4 w-4" />
                <span>My Brands</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}

        {role === 'brand_manager' && (
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link to="/brand/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/brand/communities">
                <Users className="mr-2 h-4 w-4" />
                <span>Communities</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}
        <DropdownMenuSeparator />
        
        {/* Hide Settings for brand managers AND staff (no distinct settings page) */}
        {(role !== 'brand_manager' && role !== 'staff') && (
          <DropdownMenuItem asChild>
            <Link to="/staff/profile">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        )}
        
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
        
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
