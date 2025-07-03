import React, { useState } from 'react';
import { useAuth } from '../contexts/auth-context';
import { useNavigate } from 'react-router-dom';

// Icons from lucide-react for the new dropdown
import {
  User,
  ShieldCheck,
  Users,
  Trophy,
  LogOut,
  Settings,
  Star,
  BookOpen,
  Building,
  UserPlus,
  LifeBuoy,
  TrendingUp,
} from 'lucide-react';

export default function BrandDashboard({ brandId }) {
  const navigate = useNavigate();
  const { userProfile, role } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  /* ------------------------------------------------------------------
   * DEBUG  – remove once issue is solved
   * ------------------------------------------------------------------ */
  console.log('BrandDashboard render:', { userProfile, role, showProfileDropdown });

  const [roiData, setRoiData] = useState({
    totalInvestment: '',
    employeesTrained: 50,
    avgProfitPerItem: 5
  });

  // ROI Calculations (Preserved from original)
  const additionalProductsSold = roiData.employeesTrained * 3;
  const additionalRevenue = additionalProductsSold * roiData.avgProfitPerItem;
  const roiPercentage = roiData.totalInvestment > 0
    ? ((additionalRevenue - parseFloat(roiData.totalInvestment)) / parseFloat(roiData.totalInvestment) * 100).toFixed(1)
    : 0;

  // Input handler (Preserved from original)
  const handleInputChange = (field, value) => {
    if (field === 'totalInvestment') {
      const numericValue = value.replace(/[^0-9.]/g, '');
      setRoiData(prev => ({ ...prev, [field]: numericValue }));
    } else {
      setRoiData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Logout handler (Preserved from original)
  const handleLogout = () => {
    // This should ideally call a signOut function from your auth context
    // For now, it just navigates as per your original code
    navigate('/');
  };

  // Mock analytics data (Preserved from original)
  const analytics = {
    totalCommunities: 12,
    activeMembers: 2847,
    monthlyEngagement: 18924,
    contentItems: 156,
    contentEngagement: {
      videos: 1247,
      articles: 892,
      posts: 2156,
      socialAsks: 634,
      averageRate: 24.7
    },
    communities: [
      { name: 'Outdoor Enthusiasts', members: 1247, engagement: 89, growth: '+12%' },
      { name: 'Fitness Community', members: 892, engagement: 76, growth: '+8%' },
      { name: 'Tech Innovators', members: 634, engagement: 94, growth: '+15%' }
    ],
    recentActivity: [
      { id: 1, type: 'member_joined', user: 'Sarah Johnson', community: 'Outdoor Enthusiasts', time: '2 hours ago' },
      { id: 2, type: 'challenge_completed', user: 'Mike Chen', challenge: 'Product Knowledge Quiz', time: '4 hours ago' },
      { id: 3, type: 'content_shared', user: 'Emily Davis', content: 'Summer Collection Video', time: '6 hours ago' },
      { id: 4, type: 'campaign_launched', campaign: 'Spring Promotion', time: '1 day ago' }
    ]
  };
  
  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    const initials = names.map(n => n[0]).join('');
    return initials.length > 2 ? initials.substring(0, 2) : initials;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with REPLACED User Profile Dropdown */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brand Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your brand presence and track performance</p>
        </div>
        
        {/* ---------- DEBUG button always visible ------------- */}
        <button
          onClick={() => console.log('DEBUG PROFILE button clicked')}
          className="mr-4 px-2 py-1 bg-red-600 text-white text-xs rounded-md"
        >
          DEBUG&nbsp;PROFILE
        </button>

        <div className="relative">
          <button
            onClick={() => {
              console.log('Avatar clicked, toggling dropdown');
              setShowProfileDropdown(prev => !prev);
            }}
            className="relative flex items-center justify-center h-10 w-10 rounded-full bg-gray-200 text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {userProfile?.photoURL ? (
              <img src={userProfile.photoURL} alt="Profile" className="h-full w-full rounded-full object-cover" />
            ) : (
              <span className="font-semibold">{getInitials(userProfile?.firstName)}</span>
            )}
          </button>
          
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <p className="font-semibold text-gray-900">
                  {userProfile?.firstName} {userProfile?.lastName}
                </p>
                <p className="text-sm text-gray-500">{userProfile?.email}</p>
              </div>
              <div className="py-1">
                <button onClick={() => navigate('/retailer/profile')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </button>
                <button onClick={() => navigate(`/brand/${brandId}/configuration`)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Brand Settings</span>
                </button>
                 {role === 'admin' && (
                    <button onClick={() => navigate('/admin')} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </button>
                 )}
              </div>
              <div className="border-t border-gray-200 py-1">
                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics (Preserved from original) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-start">
            <h3 className="text-gray-600">Total Communities</h3>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-3xl font-bold mt-2">{analytics.totalCommunities}</p>
          <p className="text-sm text-green-500 mt-1">+8.2% from last month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-start">
                <h3 className="text-gray-600">Active Members</h3>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-green-500" />
                </div>
            </div>
            <p className="text-3xl font-bold mt-2">{analytics.activeMembers.toLocaleString()}</p>
            <p className="text-sm text-green-500 mt-1">+12.5% from last month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-start">
                <h3 className="text-gray-600">Monthly Engagement</h3>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
            </div>
            <p className="text-3xl font-bold mt-2">{analytics.monthlyEngagement.toLocaleString()}</p>
            <p className="text-sm text-green-500 mt-1">+23.1% from last month</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-start">
                <h3 className="text-gray-600">Content Items</h3>
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-orange-500" />
                </div>
            </div>
            <p className="text-3xl font-bold mt-2">{analytics.contentItems}</p>
            <p className="text-sm text-green-500 mt-1">+5.7% from last month</p>
        </div>
      </div>

      {/* Content Engagement Section (Preserved from original) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Content Engagement</h3>
          <span className="text-sm text-gray-500">Last 30 days</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <p className="text-sm text-red-700">Videos</p>
            <p className="text-2xl font-bold text-red-900">{analytics.contentEngagement.videos.toLocaleString()}</p>
            <p className="text-xs text-red-600">engagements</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-sm text-blue-700">Articles</p>
            <p className="text-2xl font-bold text-blue-900">{analytics.contentEngagement.articles.toLocaleString()}</p>
            <p className="text-xs text-blue-600">engagements</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-sm text-green-700">Posts</p>
            <p className="text-2xl font-bold text-green-900">{analytics.contentEngagement.posts.toLocaleString()}</p>
            <p className="text-xs text-green-600">engagements</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <p className="text-sm text-purple-700">Social Asks</p>
            <p className="text-2xl font-bold text-purple-900">{analytics.contentEngagement.socialAsks.toLocaleString()}</p>
            <p className="text-xs text-purple-600">engagements</p>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg flex justify-between items-center">
          <span className="font-semibold text-purple-800">Average Engagement Rate</span>
          <span className="text-2xl font-bold text-purple-900">{analytics.contentEngagement.averageRate}%</span>
        </div>
      </div>

      {/* Quick Actions (Preserved from original) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
            <button className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-semibold">New Campaign</button>
            <button className="px-5 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-semibold">Invite Members</button>
            <button className="px-5 py-2 bg-gray-600 text-white rounded-lg shadow hover:bg-gray-700 transition-colors font-semibold">View Reports</button>
        </div>
      </div>

      {/* Recent Activity & Communities (Preserved from original) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h3>
          <ul className="space-y-4">
            {analytics.recentActivity.map(activity => (
              <li key={activity.id} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-sm">
                  {activity.user.charAt(0)}
                </div>
                <div>
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">{activity.user}</span> {activity.type.replace('_', ' ')}: <span className="font-medium text-blue-600">{activity.challenge || activity.community || activity.content || activity.campaign}</span>
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Communities Overview</h3>
          <ul className="space-y-3">
            {analytics.communities.map(community => (
              <li key={community.name} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-800">{community.name}</p>
                  <p className="text-sm text-gray-500">{community.members} members</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{community.engagement}%</p>
                  <p className="text-xs text-gray-500">Engagement</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ROI Calculator (Preserved from original) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-xl font-bold text-gray-900 mb-2">ROI Calculator</h3>
        <p className="text-gray-600 mb-4">
          <strong>ROI = Return on Investment.</strong> This tool estimates the increase in items sold as a result of your brand’s challenges and engagement campaigns. Track how your efforts are driving real sales!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Total Investment ($)</label>
              <input type="text" value={roiData.totalInvestment} onChange={e => handleInputChange('totalInvestment', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Employees Trained</label>
              <input type="number" value={roiData.employeesTrained} onChange={e => handleInputChange('employeesTrained', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Avg. Profit per Item ($)</label>
              <input type="number" value={roiData.avgProfitPerItem} onChange={e => handleInputChange('avgProfitPerItem', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800">Calculation Breakdown</h4>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between"><span className="text-gray-600">Additional Products Sold:</span><span className="font-bold">{additionalProductsSold}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Additional Revenue:</span><span className="font-bold">${additionalRevenue.toLocaleString()}</span></div>
              <div className="flex justify-between text-xl font-bold text-green-600 pt-2 border-t mt-2"><span className="text-gray-800">Estimated ROI:</span><span>{roiPercentage}%</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Legacy Features Links (Preserved from original) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Legacy Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href={`/brand/${brandId}/upload`} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              </div>
              <span className="font-medium text-gray-900">Content Upload</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </a>
          <a href={`/brand/${brandId}/configuration`} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <span className="font-medium text-gray-900">Brand Configuration</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </a>
          <a href={`/brand/${brandId}/challenges`} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              </div>
              <span className="font-medium text-gray-900">Challenges</span>
            </div>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </a>
        </div>
      </div>

      {/* Click outside to close dropdown (Preserved from original) */}
      {showProfileDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowProfileDropdown(false)}
        ></div>
      )}
    </div>
  );
}
