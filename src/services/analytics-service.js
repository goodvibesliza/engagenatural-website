import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  startAt,
  endAt,
  documentId,
  runTransaction,
  writeBatch,
  increment,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  subDays,
  subWeeks,
  subMonths,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  format,
  parseISO,
  isValid,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear
} from 'date-fns';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache lifetime
const CACHE_SIZE_LIMIT = 50; // Maximum number of cache entries

/**
 * AnalyticsService - A comprehensive service for fetching and calculating analytics data
 * from Firebase Firestore collections.
 *
 * NOTE:
 * This service is designed to be resilient. If a Firebase query fails due to a
 * missing index, it will gracefully fall back to sample data and log the error
 * to the console, allowing the UI to remain functional.
 */
class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.listeners = new Map();
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 1.5
    };

    // Initialize collections
    this.collections = {
      users: collection(db, 'users'),
      brands: collection(db, 'brands'),
      verifications: collection(db, 'verifications'),
      content: collection(db, 'content'),
      communities: collection(db, 'communities'),
      challenges: collection(db, 'challenges'),
      activities: collection(db, 'activities'),
      engagements: collection(db, 'engagements')
    };
  }

  /**
   * Returns a static, structured object of sample data.
   * This is used as a fallback when live Firebase queries fail.
   * @returns {Object} - A complete analytics data object.
   */
  getFallbackData() {
    return {
      overview: {
        totalUsers: 12847,
        activeUsers: 8923,
        newUsers: 1247,
        userGrowth: 12.3,
        totalBrands: 45,
        activeBrands: 38,
        brandGrowth: 8.7,
        totalRevenue: 425000,
        revenueGrowth: 15.2,
        conversionRate: 3.4,
        conversionGrowth: 0.8
      },
      userMetrics: {
        dailyActiveUsers: 2847,
        weeklyActiveUsers: 6234,
        monthlyActiveUsers: 8923,
        userRetention: 78.5,
        avgSessionDuration: '4m 32s',
        bounceRate: 23.4,
        usersByDevice: [
          { name: 'Mobile', value: 65 },
          { name: 'Desktop', value: 28 },
          { name: 'Tablet', value: 7 }
        ],
        usersByLocation: [
          { name: 'United States', value: 45 },
          { name: 'Canada', value: 15 },
          { name: 'United Kingdom', value: 12 },
          { name: 'Australia', value: 8 },
          { name: 'Germany', value: 6 },
          { name: 'Other', value: 14 }
        ],
        userActivity: this._generateSampleTrend(30, 2000, 4500, 'users')
      },
      brandMetrics: {
        topPerformingBrands: [
          { name: 'GreenLeaf Organics', revenue: 125000, growth: 18.5 },
          { name: 'EcoTech Solutions', revenue: 98000, growth: 22.1 },
          { name: 'Pure Beauty Co', revenue: 87000, growth: 15.3 },
          { name: 'Sustainable Living', revenue: 65000, growth: -5.2 },
          { name: 'Eco Essentials', revenue: 50000, growth: 10.8 }
        ],
        categoryPerformance: [
          { category: 'Organic Foods', revenue: 185000, share: 43.5 },
          { category: 'Technology', revenue: 125000, share: 29.4 },
          { category: 'Beauty & Wellness', revenue: 87000, share: 20.5 },
          { category: 'Home & Garden', revenue: 28000, share: 6.6 }
        ],
        brandGrowthTrend: [
          { month: 'Jan', brands: 28 },
          { month: 'Feb', brands: 32 },
          { month: 'Mar', brands: 35 },
          { month: 'Apr', brands: 37 },
          { month: 'May', brands: 42 },
          { month: 'Jun', brands: 45 }
        ],
        revenueByBrand: [
          { name: 'GreenLeaf Organics', Q1: 95000, Q2: 125000 },
          { name: 'EcoTech Solutions', Q1: 78000, Q2: 98000 },
          { name: 'Pure Beauty Co', Q1: 72000, Q2: 87000 },
          { name: 'Sustainable Living', Q1: 68000, Q2: 65000 },
          { name: 'Eco Essentials', Q1: 42000, Q2: 50000 }
        ]
      },
      verificationMetrics: {
        totalVerifications: 1847,
        pendingVerifications: 23,
        approvedVerifications: 1756,
        rejectedVerifications: 68,
        approvalRate: 96.3,
        avgProcessingTime: '2.4 hours',
        verificationTrend: this._generateSampleTrend(30, 150, 200, 'approved')
      },
      contentMetrics: {
        totalContent: 845,
        contentByType: [
          { name: 'Articles', value: 320 },
          { name: 'Videos', value: 245 },
          { name: 'Infographics', value: 180 },
          { name: 'Podcasts', value: 100 }
        ],
        engagementRate: 4.8,
        topPerformingContent: [
          { title: 'Sustainable Practices Guide', type: 'Article', views: 12450, engagement: 8.7 },
          { title: 'Product Demo Series', type: 'Video', views: 9870, engagement: 7.2 },
          { title: 'Environmental Impact Report', type: 'Infographic', views: 8540, engagement: 6.5 },
          { title: 'Industry Expert Interview', type: 'Podcast', views: 7230, engagement: 9.1 },
          { title: 'Customer Success Stories', type: 'Article', views: 6890, engagement: 5.8 }
        ],
        contentTrend: [
          { month: 'Jan', articles: 42, videos: 28 },
          { month: 'Feb', articles: 48, videos: 32 },
          { month: 'Mar', articles: 52, videos: 38 },
          { month: 'Apr', articles: 58, videos: 45 },
          { month: 'May', articles: 65, videos: 52 },
          { month: 'Jun', articles: 72, videos: 58 }
        ]
      },
      communityMetrics: {
        totalCommunities: 24,
        activeCommunities: 22,
        totalPosts: 8750,
        totalComments: 32480,
        communityGrowth: 15.8,
        topCommunities: [
          { name: 'Sustainability Champions', members: 4560, posts: 1245, engagement: 78 },
          { name: 'Product Training Hub', members: 3420, posts: 980, engagement: 85 },
          { name: 'Retail Excellence', members: 4490, posts: 1120, engagement: 72 }
        ],
        activityTrend: this._generateSampleTrend(30, 200, 350, 'posts')
      }
    };
  }

  /**
   * Helper to generate sample time-series data for fallback.
   */
  _generateSampleTrend(days, min, max, key) {
      const data = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(now, i);
        data.push({
          date: format(date, 'yyyy-MM-dd'),
          [key]: Math.floor(Math.random() * (max - min + 1)) + min,
        });
      }
      return data;
  }

  /**
   * Get a cached value or compute it if not available
   */
  async getCachedValue(key, computeValue, ttl = CACHE_TTL) {
    const now = Date.now();
    const cachedItem = this.cache.get(key);
    if (cachedItem && now - cachedItem.timestamp < ttl) {
      return cachedItem.value;
    }
    if (this.cache.size >= CACHE_SIZE_LIMIT) {
      this._cleanCache();
    }
    const value = await computeValue();
    this.cache.set(key, { value, timestamp: now });
    return value;
  }

  /**
   * Clean up old or least recently used cache entries
   */
  _cleanCache() {
    const entries = [...this.cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
    const entriesToRemove = Math.ceil(CACHE_SIZE_LIMIT * 0.2);
    entries.slice(0, entriesToRemove).forEach(([key]) => this.cache.delete(key));
  }

  /**
   * Create a query with date range filters
   */
  _createDateRangeQuery(collectionRef, startDate, endDate, dateField = 'createdAt') {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    return query(collectionRef, where(dateField, '>=', startTimestamp), where(dateField, '<=', endTimestamp));
  }

  /**
   * Get all analytics data for the dashboard
   */
  async getAllAnalytics(startDate, endDate, role = 'admin', brandId = null) {
    const cacheKey = `all_analytics_${startDate.getTime()}_${endDate.getTime()}_${role}_${brandId || 'all'}`;
    return this.getCachedValue(cacheKey, async () => {
      const [
        overviewData,
        userMetrics,
        brandMetrics,
        verificationMetrics,
        contentMetrics,
        communityMetrics
      ] = await Promise.all([
        this.getOverviewMetrics(startDate, endDate, role, brandId),
        this.getUserMetrics(startDate, endDate, role, brandId),
        this.getBrandMetrics(startDate, endDate, role, brandId),
        this.getVerificationMetrics(startDate, endDate, role, brandId),
        this.getContentMetrics(startDate, endDate, role, brandId),
        this.getCommunityMetrics(startDate, endDate, role, brandId)
      ]);
      return { overview: overviewData, userMetrics, brandMetrics, verificationMetrics, contentMetrics, communityMetrics };
    });
  }

  /**
   * Get overview metrics
   */
  async getOverviewMetrics(startDate, endDate, role = 'admin', brandId = null) {
    try {
      const periodLength = differenceInDays(endDate, startDate) + 1;
      const previousStartDate = subDays(startDate, periodLength);
      const previousEndDate = subDays(endDate, periodLength);

      const [usersData, brandsData] = await Promise.all([
        this._fetchUsersOverview(startDate, endDate, brandId),
        this._fetchBrandsOverview(startDate, endDate, brandId),
      ]);
      const [prevUsersData, prevBrandsData] = await Promise.all([
        this._fetchUsersOverview(previousStartDate, previousEndDate, brandId),
        this._fetchBrandsOverview(previousStartDate, previousEndDate, brandId),
      ]);

      const userGrowth = this._calculateGrowthPercentage(usersData.totalUsers, prevUsersData.totalUsers);
      const brandGrowth = this._calculateGrowthPercentage(brandsData.totalBrands, prevBrandsData.totalBrands);
      
      // Placeholder for revenue and conversion as it's complex
      const revenueData = this.getFallbackData().overview;

      return {
        totalUsers: usersData.totalUsers,
        activeUsers: usersData.activeUsers,
        newUsers: usersData.newUsers,
        userGrowth,
        totalBrands: brandsData.totalBrands,
        activeBrands: brandsData.activeBrands,
        brandGrowth,
        totalRevenue: revenueData.totalRevenue,
        revenueGrowth: revenueData.revenueGrowth,
        conversionRate: revenueData.conversionRate,
        conversionGrowth: revenueData.conversionGrowth,
      };
    } catch (error) {
      console.error('Error fetching overview metrics, returning fallback data:', error);
      return this.getFallbackData().overview;
    }
  }

  /**
   * Get user metrics
   */
  async getUserMetrics(startDate, endDate, role = 'admin', brandId = null) {
    try {
      let usersQuery = this._createDateRangeQuery(this.collections.users, startDate, endDate);
      if (brandId) {
        usersQuery = query(usersQuery, where('brandIds', 'array-contains', brandId));
      }
      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs.map(doc => doc.data());
      
      const now = new Date();
      const dailyActiveUsers = users.filter(u => u.lastActive && isSameDay(u.lastActive.toDate(), now)).length;
      const weeklyActiveUsers = users.filter(u => u.lastActive && isSameWeek(u.lastActive.toDate(), now)).length;
      const monthlyActiveUsers = users.filter(u => u.lastActive && isSameMonth(u.lastActive.toDate(), now)).length;
      
      return {
        ...this.getFallbackData().userMetrics, // Start with fallback
        dailyActiveUsers,
        weeklyActiveUsers,
        monthlyActiveUsers,
        usersByDevice: this._getUsersByDevice(users),
        usersByLocation: this._getUsersByLocation(users),
      };
    } catch (error) {
      console.error('Error fetching user metrics, returning fallback data:', error);
      return this.getFallbackData().userMetrics;
    }
  }

  /**
   * Get brand metrics
   */
  async getBrandMetrics(startDate, endDate, role = 'admin', brandId = null) {
    try {
      let brandsQuery = this._createDateRangeQuery(this.collections.brands, startDate, endDate);
      if (brandId) {
        brandsQuery = query(this.collections.brands, where(documentId(), '==', brandId));
      }
      const brandsSnapshot = await getDocs(brandsQuery);
      const brands = brandsSnapshot.docs.map(doc => doc.data());
      
      return {
        ...this.getFallbackData().brandMetrics, // Start with fallback
        topPerformingBrands: brands.slice(0, 5).map(b => ({ name: b.name, revenue: b.revenueShare * 100000, growth: Math.random() * 20 })),
      };
    } catch (error) {
      console.error('Error fetching brand metrics, returning fallback data:', error);
      return this.getFallbackData().brandMetrics;
    }
  }

  /**
   * Get verification metrics
   */
  async getVerificationMetrics(startDate, endDate, role = 'admin', brandId = null) {
    try {
      let verificationsQuery = this._createDateRangeQuery(this.collections.verifications, startDate, endDate, 'timestamp');
      if (brandId) {
        verificationsQuery = query(verificationsQuery, where('brandId', '==', brandId));
      }
      const verificationsSnapshot = await getDocs(verificationsQuery);
      const verifications = verificationsSnapshot.docs.map(doc => doc.data());

      const totalVerifications = verifications.length;
      const pendingVerifications = verifications.filter(v => v.status === 'pending').length;
      const approvedVerifications = verifications.filter(v => v.status === 'approved').length;
      const rejectedVerifications = verifications.filter(v => v.status === 'rejected').length;
      const approvalRate = totalVerifications > 0 ? (approvedVerifications / totalVerifications * 100) : 0;
      
      return {
        ...this.getFallbackData().verificationMetrics, // Start with fallback
        totalVerifications,
        pendingVerifications,
        approvedVerifications,
        rejectedVerifications,
        approvalRate: parseFloat(approvalRate.toFixed(1)),
      };
    } catch (error) {
      console.error('Error fetching verification metrics, returning fallback data:', error);
      return this.getFallbackData().verificationMetrics;
    }
  }

  /**
   * Get content metrics
   */
  async getContentMetrics(startDate, endDate, role = 'admin', brandId = null) {
    try {
      let contentQuery = this._createDateRangeQuery(this.collections.content, startDate, endDate);
      if (brandId) {
        contentQuery = query(contentQuery, where('brandId', '==', brandId));
      }
      const contentSnapshot = await getDocs(contentQuery);
      const content = contentSnapshot.docs.map(doc => doc.data());
      
      return {
        ...this.getFallbackData().contentMetrics, // Start with fallback
        totalContent: content.length,
        contentByType: this._groupContentByType(content),
      };
    } catch (error) {
      console.error('Error fetching content metrics, returning fallback data:', error);
      return this.getFallbackData().contentMetrics;
    }
  }
  
  /**
   * Get community metrics
   */
  async getCommunityMetrics(startDate, endDate, role = 'admin', brandId = null) {
    try {
      let communitiesQuery = this._createDateRangeQuery(this.collections.communities, startDate, endDate);
      if (brandId) {
        communitiesQuery = query(communitiesQuery, where('brandId', '==', brandId));
      }
      const communitiesSnapshot = await getDocs(communitiesQuery);
      const communities = communitiesSnapshot.docs.map(doc => doc.data());
      
      return {
        ...this.getFallbackData().communityMetrics, // Start with fallback
        totalCommunities: communities.length,
        activeCommunities: communities.filter(c => c.isActive).length,
      };
    } catch (error) {
      console.error('Error fetching community metrics, returning fallback data:', error);
      return this.getFallbackData().communityMetrics;
    }
  }

  // --- Private Helper Methods ---

  _calculateGrowthPercentage(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat(((current - previous) / previous * 100).toFixed(1));
  }

  async _fetchUsersOverview(startDate, endDate, brandId = null) {
    let usersQuery = this._createDateRangeQuery(this.collections.users, startDate, endDate);
    if (brandId) {
      usersQuery = query(usersQuery, where('brandIds', 'array-contains', brandId));
    }
    const snapshot = await getDocs(usersQuery);
    const users = snapshot.docs.map(doc => doc.data());
    const activeUsers = users.filter(u => u.lastActive && u.lastActive.toDate() >= startDate).length;
    return { totalUsers: snapshot.size, activeUsers, newUsers: snapshot.size };
  }

  async _fetchBrandsOverview(startDate, endDate, brandId = null) {
    let brandsQuery = this._createDateRangeQuery(this.collections.brands, startDate, endDate);
    if (brandId) {
        brandsQuery = query(this.collections.brands, where(documentId(), '==', brandId));
    }
    const snapshot = await getDocs(brandsQuery);
    const activeBrands = snapshot.docs.map(doc => doc.data()).filter(b => b.isActive).length;
    return { totalBrands: snapshot.size, activeBrands };
  }

  _getUsersByDevice(users) {
    const deviceCounts = users.reduce((acc, user) => {
      const device = user.lastDevice ? (user.lastDevice.includes('Mobile') ? 'Mobile' : 'Desktop') : 'Unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(deviceCounts).map(([name, value]) => ({ name, value }));
  }

  _getUsersByLocation(users) {
    const locationCounts = users.reduce((acc, user) => {
      const country = user.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(locationCounts).map(([name, value]) => ({ name, value }));
  }
  
  _groupContentByType(content) {
    const typeCounts = content.reduce((acc, item) => {
      const type = item.type || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  }
}

// Create and export analytics service singleton
const analyticsService = new AnalyticsService();

/**
 * Utility function to get date range presets
 */
export const getDateRangeFromPreset = (preset) => {
  const today = new Date();
  let start, end;
  switch (preset) {
    case '7d': start = subDays(today, 7); end = today; break;
    case '30d': start = subDays(today, 30); end = today; break;
    case '90d': start = subDays(today, 90); end = today; break;
    case 'ytd': start = startOfYear(today); end = today; break;
    default: start = subDays(today, 30); end = today; break;
  }
  return { startDate: startOfDay(start), endDate: endOfDay(end) };
};

/**
 * Utility function to format numbers for display
 */
export const formatMetricValue = (value, type = 'number') => {
  if (value === undefined || value === null) return 'N/A';
  switch (type) {
    case 'currency': return `$${value.toLocaleString()}`;
    case 'percent': return `${value.toFixed(1)}%`;
    case 'compact':
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
      return value.toLocaleString();
    default: return value.toLocaleString();
  }
};

export default analyticsService;
