import React from 'react';
import { useAuth } from '../../contexts/auth-context';
import { app } from '../../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

const EnvCheck = () => {
  const { user } = useAuth();
  const projectId = app.options.projectId;
  
  // Environment variables
  const netlifyContext = import.meta.env.VITE_NETLIFY_CONTEXT;
  const mode = import.meta.env.MODE;
  const useEmulator = import.meta.env.VITE_USE_EMULATOR;
  const showDemoToolsRaw = import.meta.env.VITE_SHOW_DEMO_TOOLS;
  const showDemoTools = showDemoToolsRaw === 'true';
  
  // Determine environment badge
  const getBadgeType = () => {
    if (useEmulator === 'true') {
      return {
        label: 'Emulator',
        className: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200'
      };
    } else if (netlifyContext === 'deploy-preview') {
      return {
        label: 'Deploy Preview',
        className: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200'
      };
    } else {
      return {
        label: 'Production',
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
      };
    }
  };
  
  const badgeType = getBadgeType();
  
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Environment Check
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Current runtime environment information
          </p>
        </div>
        <Badge 
          variant="outline" 
          className={`text-md py-1 px-3 ${badgeType.className}`}
        >
          {badgeType.label}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Netlify Context</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{netlifyContext || 'undefined'}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{mode}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Using Emulator</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{useEmulator || 'false'}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Show Demo Tools&nbsp;<span className="text-xs text-gray-500">(build-time)</span></CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Raw:&nbsp;
              <span className="font-semibold">{String(showDemoToolsRaw)}</span>
            </p>
            <p className="text-sm">
              Computed:&nbsp;
              <span className="font-semibold">{String(showDemoTools)}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Firebase Project ID</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{projectId}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">User UID</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{user?.uid || 'Not authenticated'}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">User Role</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{user?.role || 'None'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnvCheck;
