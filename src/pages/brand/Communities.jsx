import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/Button";
import { Users, MessageSquare, ThumbsUp, TrendingUp } from "lucide-react";

// Desktop-layout compact grid showing 4 communities with analytics
export default function Communities({ brandId }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const activeBrandId = brandId || user?.brandId;
  
  const [loading, setLoading] = useState(true);
  const [communityStats, setCommunityStats] = useState({
    whats_good: { posts7d: 0, posts30d: 0, uniqueStaff: 0, likes: 0, comments: 0 },
    supplement_scoop: { posts7d: 0, posts30d: 0, uniqueStaff: 0, likes: 0, comments: 0 },
    pro_feed: { posts7d: 0, posts30d: 0, uniqueStaff: 0, likes: 0, comments: 0 },
    brand_community: { posts7d: 0, posts30d: 0, uniqueStaff: 0, likes: 0, comments: 0 }
  });

  // Fixed community definitions
  const communities = [
    {
      key: "whats_good",
      id: "whats-good",
      name: "What's Good",
      description: "Share what's working for you and discover new natural products"
    },
    {
      key: "supplement_scoop",
      id: "supplement-scoop",
      name: "Supplement Scoop",
      description: "Latest insights and discussions on supplements"
    },
    {
      key: "pro_feed",
      id: "pro-feed",
      name: "Pro Feed",
      description: "Professional discussions and industry insights"
    },
    {
      key: "brand_community",
      id: "brand",
      name: "Brand Community",
      description: "Your brand's dedicated community space"
    }
  ];

  useEffect(() => {
    if (!activeBrandId) {
      setLoading(false);
      return;
    }
    fetchCommunityStats();
  }, [activeBrandId]);

  const fetchCommunityStats = async () => {
    setLoading(true);
    const now = Timestamp.now();
    const sevenDaysAgo = Timestamp.fromMillis(now.toMillis() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = Timestamp.fromMillis(now.toMillis() - 30 * 24 * 60 * 60 * 1000);

    try {
      const newStats = {};

      for (const community of communities) {
        // Query posts for this community
        const postsQuery = query(
          collection(db, "community_posts"),
          where("communityId", "==", community.id)
        );

        const postsSnapshot = await getDocs(postsQuery);
        const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter by time periods
        const posts7d = posts.filter(p => {
          const createdAt = p.createdAt;
          if (!createdAt) return false;
          const timestamp = createdAt.toMillis ? createdAt : Timestamp.fromDate(new Date(createdAt));
          return timestamp.toMillis() >= sevenDaysAgo.toMillis();
        });

        const posts30d = posts.filter(p => {
          const createdAt = p.createdAt;
          if (!createdAt) return false;
          const timestamp = createdAt.toMillis ? createdAt : Timestamp.fromDate(new Date(createdAt));
          return timestamp.toMillis() >= thirtyDaysAgo.toMillis();
        });

        // Calculate unique staff (unique authorUid or userId)
        const uniqueStaffSet = new Set();
        posts30d.forEach(p => {
          const uid = p.authorUid || p.userId;
          if (uid) uniqueStaffSet.add(uid);
        });

        // Sum likes and comments
        const totalLikes = posts.reduce((sum, p) => sum + (p.likeCount || 0), 0);
        const totalComments = posts.reduce((sum, p) => sum + (p.commentCount || 0), 0);

        newStats[community.key] = {
          posts7d: posts7d.length,
          posts30d: posts30d.length,
          uniqueStaff: uniqueStaffSet.size,
          likes: totalLikes,
          comments: totalComments
        };
      }

      setCommunityStats(newStats);
    } catch (err) {
      // Silent fail - show — for missing stats
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (communityId) => {
    navigate(`/brand/community/${communityId}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Communities</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage and monitor your brand communities</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {communities.map(community => {
          const stats = communityStats[community.key];
          
          return (
            <Card 
              key={community.key}
              data-testid={`community-card-${community.key}`}
              className="flex flex-col min-w-[280px]"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{community.name}</CardTitle>
                <CardDescription className="text-sm line-clamp-2">
                  {community.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-3">
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">7d Posts</span>
                      <span className="font-semibold">{stats.posts7d || "—"}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">30d Posts</span>
                      <span className="font-semibold">{stats.posts30d || "—"}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Unique Staff
                      </span>
                      <span className="font-semibold">{stats.uniqueStaff || "—"}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        Likes
                      </span>
                      <span className="font-semibold">{stats.likes || "—"}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Comments
                      </span>
                      <span className="font-semibold">{stats.comments || "—"}</span>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={() => handleOpen(community.key)}
                  className="w-full mt-4"
                  size="sm"
                >
                  Open
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

}
