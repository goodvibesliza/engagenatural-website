// src/pages/admin/Dashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Building, TrendingUp, UserCheck, Activity, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const quickActions = [
    { name: 'Verify Staff', href: '/admin/verifications', icon: UserCheck, color: 'bg-purple-500 hover:bg-purple-600' },
    { name: 'Manage Users', href: '/admin/users', icon: Users, color: 'bg-blue-500 hover:bg-blue-600' },
    { name: 'Brand Management', href: '/admin/brands', icon: Building, color: 'bg-green-500 hover:bg-green-600' },
    { name: 'Analytics', href: '/admin/analytics', icon: TrendingUp, color: 'bg-orange-500 hover:bg-orange-600' },
    { name: 'Activity Log', href: '/admin/activity', icon: Activity, color: 'bg-indigo-500 hover:bg-indigo-600' },
    { name: 'System Settings', href: '/admin/settings', icon: Settings, color: 'bg-gray-500 hover:bg-gray-600' },
  ];

  const stats = [
    { name: 'Total Users', stat: '71', change: '12', changeType: 'increase' },
    { name: 'Pending Verifications', stat: '5', change: '2.02%', changeType: 'increase' },
    { name: 'Active Brands', stat: '12', change: '4.75%', changeType: 'increase' },
    { name: 'System Health', stat: '98.5%', change: '0.12%', changeType: 'increase' },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Admin Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's an overview of your system.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-sm font-medium text-gray-500 truncate">{item.name}</div>
                </div>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <div className="text-2xl font-semibold text-gray-900">{item.stat}</div>
                <div className="flex items-baseline text-sm font-semibold text-green-600">
                  +{item.change}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className="relative rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 rounded-lg p-3 text-white ${action.color}`}>
                    <action.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-gray-900">{action.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}