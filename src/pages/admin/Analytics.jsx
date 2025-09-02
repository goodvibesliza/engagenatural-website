// src/pages/admin/Analytics.jsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Clock, 
  Eye, 
  ShoppingCart, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function AnalyticsPage() {
  // Placeholder data for metrics
  const metrics = [
    { 
      title: 'Total Visitors', 
      value: '12,543', 
      change: '+14%', 
      trend: 'up', 
      period: 'from last month',
      icon: <Users className="h-4 w-4 text-muted-foreground" />
    },
    { 
      title: 'Engagement Rate', 
      value: '58.3%', 
      change: '+7.2%', 
      trend: 'up', 
      period: 'from last month',
      icon: <Eye className="h-4 w-4 text-muted-foreground" />
    },
    { 
      title: 'Avg. Session Duration', 
      value: '3m 42s', 
      change: '+12s', 
      trend: 'up', 
      period: 'from last month',
      icon: <Clock className="h-4 w-4 text-muted-foreground" />
    },
    { 
      title: 'Conversion Rate', 
      value: '3.2%', 
      change: '-0.4%', 
      trend: 'down', 
      period: 'from last month',
      icon: <ShoppingCart className="h-4 w-4 text-muted-foreground" />
    },
    { 
      title: 'Revenue', 
      value: '$48,574', 
      change: '+5.4%', 
      trend: 'up', 
      period: 'from last month',
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />
    },
    { 
      title: 'Growth Rate', 
      value: '12.5%', 
      change: '+2.1%', 
      trend: 'up', 
      period: 'from last month',
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor platform performance, user engagement, and business metrics
          </p>
        </div>
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          <BarChart3 className="mr-1 h-3.5 w-3.5" />
          Placeholder
        </Badge>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                {metric.trend === 'up' ? (
                  <ArrowUpRight className="mr-1 h-3.5 w-3.5 text-green-500" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3.5 w-3.5 text-red-500" />
                )}
                <span className={metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                  {metric.change}
                </span>
                <span className="ml-1">{metric.period}</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder Note */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Implementation</CardTitle>
          <CardDescription>
            This is a placeholder for the analytics module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This is a placeholder implementation of the analytics dashboard. The final module will include:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
            <li>Real-time data visualization</li>
            <li>Custom date range selection</li>
            <li>Detailed reports and exports</li>
            <li>User behavior analysis</li>
            <li>Conversion funnels and goal tracking</li>
            <li>Integration with Google Analytics</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}