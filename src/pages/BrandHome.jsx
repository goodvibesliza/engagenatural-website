import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";
import BrandDashboard from "./BrandDashboard";
import BrandChallenges from "./BrandChallenges";
import BrandContentUploader from "./BrandContentUploader";
import BrandConfiguration from "./BrandConfiguration";
import BrandPosting from "./BrandPosting";
import CommunityFeed from "./CommunityFeed";

// Imports for the enhanced dropdown and other UI components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '../components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  User,
  ShieldCheck,
  Users,
  Trophy,
  LogOut,
  Settings,
  Star,
  BookOpen,
  Building,
  UserPlus,
  LifeBuoy,
} from 'lucide-react';


export default function BrandHome() {
  const { brandId } = useParams();
  const authContext = useAuth();
  const navigate = useNavigate();
  
  // State for the new dropdown menu
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Handle both old and new auth context structures
  const {
    hasPermission,
    isBrandManager = false,
    isSuperAdmin = false,
    user: userProfile = {},
    role,
    signOut,
    PERMISSIONS = {
      VIEW_ANALYTICS: 'view_analytics',
      CREATE_CHALLENGES: 'create_challenges',
      UPLOAD_CONTENT: 'upload_content',
      VIEW_COMMUNITIES: 'view_communities',
      POST_AS_BRAND: 'post_as_brand',
      MANAGE_BRAND_CONFIG: 'manage_brand_config'
    }
  } = authContext || {};

  const TABS = [
    { key: "analytics", label: "Analytics", permission: PERMISSIONS.VIEW_ANALYTICS },
    { key: "challenges", label: "Challenges", permission: PERMISSIONS.CREATE_CHALLENGES },
    { key: "upload", label: "Content Upload", permission: PERMISSIONS.UPLOAD_CONTENT },
    { key: "community", label: "Community", permission: PERMISSIONS.VIEW_COMMUNITIES },
    { key: "brand-posting", label: "Post as Brand", permission: PERMISSIONS.POST_AS_BRAND },
    { key: "configuration", label: "Configuration", permission: PERMISSIONS.MANAGE_BRAND_CONFIG },
  ];

  const [tab, setTab] = useState("analytics");

  /* ------------------------------------------------------------------
   * HANDLERS
   * ------------------------------------------------------------------ */

  // Safe permission checker – fallback to "true" while auth is still loading
  const safeHasPermission = (perm) =>
    typeof hasPermission === "function" ? hasPermission(perm) : true;

  // Debug helper – see if the Profile menu fires and where we navigate
  const handleGoToProfile = () => {
    /* eslint-disable no-console */
    console.log("[BrandHome] My Profile clicked – navigating to /retailer/profile");
    /* eslint-enable no-console */
    navigate("/retailer/profile");
  };

  const handleLogout = async () => {
    try {
      if (typeof signOut === "function") {
        await signOut();
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[BrandHome] signOut error:", err);
    }
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.length > 2 ? initials.substring(0, 2) : initials;
  };

  const renderTabContent = () => {
    switch (tab) {
      case "analytics":
        return <BrandDashboard brandId={brandId} />;
      case "challenges":
        return <BrandChallenges brandId={brandId} />;
      case "upload":
        return <BrandContentUploader brandId={brandId} />;
      case "community":
        return <CommunityFeed brandId={brandId} />;
      case "brand-posting":
        return <BrandPosting brandId={brandId} />;
      case "configuration":
        return <BrandConfiguration brandId={brandId} />;
      default:
        return <BrandDashboard brandId={brandId} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 relative">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brand Admin</h1>
          <p className="text-gray-600 mt-1">
            {isBrandManager && `Managing ${userProfile?.brandName || brandId}`}
            {isSuperAdmin && `Super Admin - Managing ${brandId}`}
          </p>
        </div>
        
        {/* ENHANCED User Profile Dropdown */}
        <div className="relative">
          <DropdownMenu open={showProfileDropdown} onOpenChange={setShowProfileDropdown}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border-2 border-primary/50">
                  <AvatarImage src={userProfile?.photoURL} alt={userProfile?.displayName || 'User Avatar'} />
                  <AvatarFallback className="font-semibold">{getInitials(userProfile?.firstName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {userProfile?.firstName} {userProfile?.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {userProfile?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {/* My Profile */}
                <DropdownMenuItem onSelect={handleGoToProfile}>
                  <User className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/brand-partnerships')}>
                  <Building className="mr-2 h-4 w-4" />
                  <span>Brand Partnerships</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/my-team')} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    <span>My Team</span>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => navigate(`/brand/${brandId}/configuration`)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Brand Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/support')}>
                  <LifeBuoy className="mr-2 h-4 w-4" />
                  <span>Support</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              {role === 'admin' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => navigate('/admin')}>
                    <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
                    <span className="font-semibold">Admin Panel</span>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Prominent Logout button (always visible) */}
          <Button
            variant="destructive"
            size="sm"
            className="ml-4 flex items-center gap-2 px-4 shadow"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Log&nbsp;Out
          </Button>
        </div>
      </header>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {TABS.map((t) => (
            safeHasPermission(t.permission) && (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`${
                  tab === t.key
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                {t.label}
              </button>
            )
          ))}
        </nav>
      </div>
      
      {/* Tab Content */}
      <main>
        {renderTabContent()}
      </main>
    </div>
  );
}
