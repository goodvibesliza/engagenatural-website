import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart2, 
  Users, 
  FileText, 
  TrendingUp, 
  Activity, 
  Settings, 
  HelpCircle 
} from 'lucide-react';

// Logo component
const Logo = () => (
  <div className="flex items-center p-4">
    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg">
      E
    </div>
    <span className="ml-2 text-lg font-semibold text-gray-800">EngageNatural</span>
  </div>
);

// Navigation item component
const NavItem = ({ icon: Icon, label, path, isActive }) => (
  <Link
    to={path}
    className={`flex items-center px-4 py-3 text-sm ${
      isActive 
        ? 'text-green-600 bg-green-50 border-l-4 border-green-500' 
        : 'text-gray-700 hover:bg-gray-100'
    }`}
  >
    <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-green-500' : 'text-gray-500'}`} />
    <span>{label}</span>
  </Link>
);

const Sidebar = ({ className = "" }) => {
  const location = useLocation();
  const pathname = location.pathname;

  // Navigation items configuration
  const navItems = [
    {
      label: 'Analytics',
      icon: BarChart2,
      path: '/analytics',
    },
    {
      label: 'User Management',
      icon: Users,
      path: '/users',
    },
    {
      label: 'Content Management',
      icon: FileText,
      path: '/content',
    },
    {
      label: 'Brand Performance',
      icon: TrendingUp,
      path: '/brand',
    },
    {
      label: 'Activity Feed',
      icon: Activity,
      path: '/activity',
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/settings',
    },
    {
      label: 'Help & Support',
      icon: HelpCircle,
      path: '/support',
    },
  ];

  // Function to check if a nav item is active
  const isActive = (path) => {
    if (path === '/analytics' && pathname === '/') return true;
    return pathname.startsWith(path);
  };

  return (
    <div className={`w-64 bg-white border-r border-gray-200 h-screen flex flex-col ${className}`}>
      <Logo />
      <div className="flex-1 overflow-y-auto">
        <nav className="mt-2">
          {navItems.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              isActive={isActive(item.path)}
            />
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
