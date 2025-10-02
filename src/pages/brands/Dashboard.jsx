import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { trackEvent } from '../../services/analytics';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/Button';

// Icons
import { Users, BarChart3, Settings, ArrowRight } from 'lucide-react';

/**
 * Brand dashboard home page - shows overview and quick navigation
 */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    trackEvent('page_view', {
      page: 'brand_dashboard',
      user_role: user?.role,
      brand_id: user?.brandId
    });

    // Persist route
    localStorage.setItem('en.brand.lastRoute', '/brands');
  }, [user]);

  const quickActions = [
    {
      title: 'Communities',
      description: 'Manage your brand communities and engage with your audience',
      icon: Users,
      href: '/brands/communities',
      isNew: true
    },
    {
      title: 'Analytics',
      description: 'View performance metrics and engagement data',
      icon: BarChart3,
      href: '/brands/analytics',
    },
    {
      title: 'Settings',
      description: 'Configure your brand preferences and settings',
      icon: Settings,
      href: '/brands/settings',
    }
  ];

  const handleQuickAction = (action) => {
    trackEvent('brand_quick_action', {
      action: action.title.toLowerCase(),
      brand_id: user?.brandId
    });
    navigate(action.href);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name || 'Brand Manager'}
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your brand presence and engage with your community
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card key={action.title} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader onClick={() => handleQuickAction(action)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-md ${
                      action.isNew 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-brand-primary/10 text-brand-primary'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        {action.title}
                        {action.isNew && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            New
                          </span>
                        )}
                      </CardTitle>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
                <CardDescription className="mt-2">
                  {action.description}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Welcome Message */}
      <Card className="bg-gradient-to-r from-brand-primary/10 to-blue-50 border-brand-primary/20">
        <CardHeader>
          <CardTitle className="text-brand-primary">Brand Communities (New Feature)</CardTitle>
          <CardDescription className="text-gray-700">
            Create and manage communities to engage directly with your staff and customers. 
            Share updates, gather feedback, and build stronger relationships with your audience.
          </CardDescription>
          <div className="pt-4">
            <Button 
              onClick={() => navigate('/brands/communities')}
              className="bg-brand-primary hover:bg-brand-primary/90"
            >
              <Users className="w-4 h-4 mr-2" />
              Explore Communities
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Brand Info */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Brand ID</span>
            <span className="font-medium">{user?.brandId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Manager</span>
            <span className="font-medium">{user?.name || 'Not set'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Email</span>
            <span className="font-medium">{user?.email || 'Not set'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Status</span>
            <span className="font-medium text-green-600">
              {user?.approved ? 'Approved' : 'Pending'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}