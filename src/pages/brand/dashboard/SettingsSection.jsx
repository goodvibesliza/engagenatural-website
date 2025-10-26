import React from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/Button';
import { Link } from 'react-router-dom';

export default function SettingsSection({ brandId }) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Configure your brand settings and preferences</p>
      </div>
      <Card className="p-6 space-y-4">
        <p>Settings options will be displayed here.</p>
        <Button asChild variant="outline">
          <Link to={`/brand-dashboard/${brandId}/style-guide`}>View Brand Style Guide</Link>
        </Button>
      </Card>
    </div>
  );
}
