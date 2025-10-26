import React from 'react';
import { Card } from '../../../components/ui/card';

export default function UsersSection() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">User Management</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage team members and their access permissions</p>
      </div>
      <Card className="p-6">
        <p>User management content will be displayed here.</p>
      </Card>
    </div>
  );
}
