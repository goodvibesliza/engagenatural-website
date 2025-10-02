import React, { useState, useEffect, useMemo } from 'react';
import { brandReportView } from '../../lib/analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/badge';
import { 
  calcToplineMetrics, 
  bucketByDay, 
  bucketByWeek, 
  generateSparkline, 
  formatNumber, 
  formatPercent 
} from '../../lib/communityMetrics';

// Icons
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Heart, 
  FileText, 
  MousePointer,
  Calendar
} from 'lucide-react';

/**
 * Community Reporting component with topline metrics and simple charts
 * Shows engagement analytics and training CTR
 */
export default function CommunityReport({ 
  posts = [], 
  comments = [], 
  likes = [],
  className = '' 
}) {
  const [dateRange, setDateRange] = useState(30); // 7 or 30 days
  const [loading, setLoading] = useState(false);

  // Calculate metrics when data or date range changes
  const metrics = useMemo(() => {
    if (posts.length === 0) return null;
    return calcToplineMetrics(posts, comments, likes, dateRange);
  }, [posts, comments, likes, dateRange]);

  // Chart data
  const chartData = useMemo(() => {
    if (posts.length === 0) return { sparkline: [], weeklyBars: [] };

    // Daily post opens for sparkline
    const postOpensDaily = bucketByDay(
      posts.filter(p => p.analytics?.post_open), 
      'publishedAt', 
      'analytics.post_open', 
      dateRange
    );

    // Weekly likes and comments for bar chart
    const weeklyLikes = bucketByWeek(likes, 'createdAt', null, dateRange);
    const weeklyComments = bucketByWeek(comments, 'createdAt', null, dateRange);

    return {
      sparkline: postOpensDaily,
      weeklyLikes,
      weeklyComments
    };
  }, [posts, comments, likes, dateRange]);

  // Handle date range toggle
  const handleDateRangeChange = (days) => {
    setLoading(true);
    setDateRange(days);
    
    // Track report view with date range
    brandReportView({ range: `${days}d` });
    
    // Add small delay for smooth transition
    setTimeout(() => setLoading(false), 200);
  };

  // Simple bar chart component
  const BarChart = ({ data, label, color = 'bg-blue-500' }) => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-600">{label}</div>
        <div className="flex items-end space-x-1 h-16">
          {data.map((bar, index) => {
            const height = (bar.value / maxValue) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className={`w-full ${color} rounded-sm transition-all duration-300 min-h-[2px]`}
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`${bar.week}: ${bar.value}`}
                />
                <span className="text-xs text-gray-500 mt-1 truncate">
                  {bar.week}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Sparkline component
  const Sparkline = ({ data, className: sparklineClass = '' }) => {
    if (!data || data.length === 0) {
      return (
        <svg className={`w-full h-8 ${sparklineClass}`} viewBox="0 0 200 32">
          <path d="M 0,16 L 200,16" stroke="#e5e7eb" strokeWidth="1" fill="none" />
        </svg>
      );
    }

    const path = generateSparkline(data, 200, 32);
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
      <svg className={`w-full h-8 ${sparklineClass}`} viewBox="0 0 200 32">
        <defs>
          <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
          </linearGradient>
        </defs>
        
        {/* Fill area under curve */}
        <path 
          d={`${path} L 200,32 L 0,32 Z`} 
          fill="url(#sparklineGradient)" 
        />
        
        {/* Line */}
        <path 
          d={path} 
          stroke="#3b82f6" 
          strokeWidth="2" 
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 200;
          const y = 32 - ((point.value - 0) / maxValue) * 32;
          return (
            <circle 
              key={index}
              cx={x} 
              cy={y} 
              r="2" 
              fill="#3b82f6"
              className="opacity-0 hover:opacity-100 transition-opacity"
            >
              <title>{`${point.date.toLocaleDateString()}: ${point.value}`}</title>
            </circle>
          );
        })}
      </svg>
    );
  };

  if (!metrics) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Community Insights
          </CardTitle>
          <CardDescription>Analytics and engagement metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No data available</p>
            <p className="text-sm">Publish posts to see analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Community Insights
            </CardTitle>
            <CardDescription>Analytics and engagement metrics</CardDescription>
          </div>
          
          {/* Date Range Toggle */}
          <div className="flex space-x-1">
            <Button
              variant={dateRange === 7 ? "default" : "ghost"}
              size="sm"
              onClick={() => handleDateRangeChange(7)}
              disabled={loading}
              data-testid="report-range-7"
            >
              7d
            </Button>
            <Button
              variant={dateRange === 30 ? "default" : "ghost"}
              size="sm"
              onClick={() => handleDateRangeChange(30)}
              disabled={loading}
              data-testid="report-range-30"
            >
              30d
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <>
            {/* Topline Metrics */}
            <div className="grid grid-cols-2 gap-4">
              {/* Posts Published */}
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(metrics.postsPublished)}
                    </p>
                    <p className="text-sm text-gray-600">Posts Published</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              {/* Unique Participants */}
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(metrics.uniqueParticipants)}
                    </p>
                    <p className="text-sm text-gray-600">Active Staff</p>
                  </div>
                  <Users className="w-8 h-8 text-green-500" />
                </div>
              </div>

              {/* Total Likes */}
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(metrics.totalLikes)}
                    </p>
                    <p className="text-sm text-gray-600">Total Likes</p>
                  </div>
                  <Heart className="w-8 h-8 text-red-500" />
                </div>
              </div>

              {/* Total Comments */}
              <div className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(metrics.totalComments)}
                    </p>
                    <p className="text-sm text-gray-600">Total Comments</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Training CTR */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg" data-testid="report-ctr-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <MousePointer className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium text-gray-900">Training CTR</span>
                </div>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {formatPercent(metrics.trainingCTR)}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                {formatNumber(metrics.trainingClicks)} clicks from {formatNumber(metrics.postOpens)} post views
              </div>
            </div>

            {/* Charts */}
            <div className="space-y-4">
              {/* Daily Post Opens Sparkline */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">Daily Post Views</h4>
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                </div>
                <Sparkline data={chartData.sparkline} />
              </div>

              {/* Weekly Engagement Bars */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <BarChart 
                    data={chartData.weeklyLikes} 
                    label="Likes by Week"
                    color="bg-red-500"
                  />
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <BarChart 
                    data={chartData.weeklyComments} 
                    label="Comments by Week"
                    color="bg-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Period Summary */}
            <div className="text-center text-sm text-gray-500 pt-2 border-t border-gray-200">
              <Calendar className="w-4 h-4 inline mr-1" />
              Showing data for the last {dateRange} days
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}