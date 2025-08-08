import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { 
  Home, 
  Upload, 
  BarChart3, 
  Settings, 
  X,
  Target,
  Users
} from 'lucide-react'

const BrandMenu = () => {
  const { brandId } = useParams();
  const navigate = useNavigate();

  const menuItems = [
    {
      label: 'Dashboard',
      icon: Home,
      path: `/brand/${brandId}`,
      description: 'Overview and analytics'
    },
    {
      label: 'Communities',
      icon: Users,
      path: `/brand/${brandId}/communities`,
      description: 'Manage brand communities'
    },
    {
      label: 'Campaigns',
      icon: Target,
      path: `/brand/${brandId}/campaigns`,
      description: 'Create and manage campaigns'
    },
    {
      label: 'Content Upload',
      icon: Upload,
      path: `/brand/${brandId}/upload`,
      description: 'Upload brand content'
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      path: `/brand/${brandId}/dashboard`,
      description: 'Detailed analytics'
    },
    {
      label: 'Brand Configuration',
      icon: Settings,
      path: `/brand/${brandId}/configuration`,
      description: 'Brand settings and preferences'
    }
  ];

  return (
    <div className="fixed top-0 left-0 w-80 h-full bg-white shadow-xl z-50 overflow-y-auto">
      <Card className="h-full rounded-none border-0 shadow-none">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Brand Menu</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-1 p-4">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-4 text-left"
                  onClick={() => navigate(item.path)}
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">{item.label}</div>
                      <div className="text-sm text-gray-500">{item.description}</div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
          
          <div className="border-t p-4 mt-4">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate(-1)}
            >
              Close Menu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BrandMenu;

