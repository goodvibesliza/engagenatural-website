import React from 'react';
import { Card } from '../../../components/ui/card';

export default function BrandPerformanceSection() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Brand Performance</h1>
        <p className="text-gray-500 dark:text-gray-400">Track your brand's performance and engagement metrics</p>
      </div>
      <Card className="p-6">
        <p>Brand performance metrics will be displayed here.</p>
      </Card>
    </div>
  );
}
