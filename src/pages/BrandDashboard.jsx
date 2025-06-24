import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot, orderBy, limit, where } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Area, AreaChart } from 'recharts';

const BrandDashboard = () => {
  const { brandId } = useParams();
  const [uploads, setUploads] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [users, setUsers] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  // ROI Assumptions
  const ROI_ASSUMPTIONS = {
    productsPerLesson: 3,
    profitPerProduct: 5,
    description: "Each lesson completion is assumed to generate 3 additional product sales at $5 profit each"
  };

  useEffect(() => {
    if (!brandId) return;

    // Listen to uploads
    const uploadsQuery = query(
      collection(db, 'brands', brandId, 'uploads'),
      orderBy('uploadedAt', 'desc'),
      limit(50)
    );

    const unsubscribeUploads = onSnapshot(uploadsQuery, (snapshot) => {
      const uploadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate()
      }));
      setUploads(uploadsData);
    });

    // Listen to completions
    const completionsQuery = query(
      collection(db, 'brands', brandId, 'completions'),
      orderBy('completedAt', 'desc'),
      limit(200)
    );

    const unsubscribeCompletions = onSnapshot(completionsQuery, (snapshot) => {
      const completionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate()
      }));
      setCompletions(completionsData);
    });

    // Listen to users
    const usersQuery = query(
      collection(db, 'brands', brandId, 'users'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      setUsers(usersData);
    });

    // Listen to challenges/lessons
    const challengesQuery = query(
      collection(db, 'brands', brandId, 'challenges'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribeChallenges = onSnapshot(challengesQuery, (snapshot) => {
      const challengesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      setChallenges(challengesData);
      setLoading(false);
    });

    return () => {
      unsubscribeUploads();
      unsubscribeCompletions();
      unsubscribeUsers();
      unsubscribeChallenges();
    };
  }, [brandId]);

  // Calculate ROI per challenge
  const getROIPerChallenge = () => {
    const challengeROI = {};
    
    completions.forEach(completion => {
      const challengeId = completion.challengeId || 'Unknown Challenge';
      if (!challengeROI[challengeId]) {
        challengeROI[challengeId] = {
          challengeId,
          completions: 0,
          estimatedRevenue: 0,
          engagementRate: 0
        };
      }
      challengeROI[challengeId].completions += 1;
      challengeROI[challengeId].estimatedRevenue = 
        challengeROI[challengeId].completions * ROI_ASSUMPTIONS.productsPerLesson * ROI_ASSUMPTIONS.profitPerProduct;
    });

    // Calculate engagement rate (completions vs total users)
    Object.keys(challengeROI).forEach(challengeId => {
      const totalUsers = users.length || 1; // Avoid division by zero
      challengeROI[challengeId].engagementRate = 
        ((challengeROI[challengeId].completions / totalUsers) * 100).toFixed(1);
    });

    return Object.values(challengeROI).sort((a, b) => b.estimatedRevenue - a.estimatedRevenue);
  };

  // Get engagement per challenge
  const getEngagementPerChallenge = () => {
    const engagement = {};
    
    completions.forEach(completion => {
      const challengeId = completion.challengeId || 'Unknown Challenge';
      engagement[challengeId] = (engagement[challengeId] || 0) + 1;
    });

    return Object.entries(engagement)
      .map(([challengeId, count]) => ({
        challengeId: challengeId.length > 20 ? challengeId.substring(0, 20) + '...' : challengeId,
        fullChallengeId: challengeId,
        completions: count,
        engagementRate: ((count / (users.length || 1)) * 100).toFixed(1)
      }))
      .sort((a, b) => b.completions - a.completions);
  };

  // Get new users over time
  const getNewUsersOverTime = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last30Days.map(date => {
      const newUsers = users.filter(user => 
        user.createdAt && user.createdAt.toISOString().split('T')[0] === date
      ).length;
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        newUsers,
        cumulativeUsers: users.filter(user => 
          user.createdAt && user.createdAt <= new Date(date + 'T23:59:59')
        ).length
      };
    });
  };

  // Get ROI over time
  const getROIOverTime = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    let cumulativeROI = 0;

    return last30Days.map(date => {
      const dailyCompletions = completions.filter(completion => 
        completion.completedAt && completion.completedAt.toISOString().split('T')[0] === date
      ).length;
      
      const dailyROI = dailyCompletions * ROI_ASSUMPTIONS.productsPerLesson * ROI_ASSUMPTIONS.profitPerProduct;
      cumulativeROI += dailyROI;
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dailyROI,
        cumulativeROI,
        completions: dailyCompletions
      };
    });
  };

  // Calculate total metrics
  const totalROI = completions.length * ROI_ASSUMPTIONS.productsPerLesson * ROI_ASSUMPTIONS.profitPerProduct;
  const avgEngagementRate = users.length > 0 ? ((completions.length / users.length) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div style={{
        maxWidth: 1400,
        margin: '40px auto',
        padding: 32,
        textAlign: 'center'
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #0ea5e9',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{ color: '#64748b' }}>Loading brand analytics...</p>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 1400,
      margin: '40px auto',
      padding: 32,
      background: '#f8fafc'
    }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: '#1e293b', fontSize: 32, marginBottom: 8 }}>
          Brand Analytics Dashboard
        </h1>
        <p style={{ color: '#475569', marginBottom: 16 }}>
          Brand ID: <strong>{brandId}</strong>
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 20,
        marginBottom: 32
      }}>
        <div style={{
          background: '#fff',
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          textAlign: 'center',
          border: '2px solid #10b981'
        }}>
          <h3 style={{ color: '#10b981', fontSize: 28, margin: 0 }}>${totalROI}</h3>
          <p style={{ color: '#64748b', margin: '8px 0 0', fontWeight: 500 }}>Estimated ROI</p>
          <p style={{ color: '#9ca3af', margin: '4px 0 0', fontSize: 12 }}>
            {completions.length} lessons × ${ROI_ASSUMPTIONS.productsPerLesson * ROI_ASSUMPTIONS.profitPerProduct}
          </p>
        </div>
        
        <div style={{
          background: '#fff',
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#0ea5e9', fontSize: 28, margin: 0 }}>{users.length}</h3>
          <p style={{ color: '#64748b', margin: '8px 0 0', fontWeight: 500 }}>Total Users</p>
          <p style={{ color: '#9ca3af', margin: '4px 0 0', fontSize: 12 }}>Engaging with brand</p>
        </div>
        
        <div style={{
          background: '#fff',
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#8b5cf6', fontSize: 28, margin: 0 }}>{completions.length}</h3>
          <p style={{ color: '#64748b', margin: '8px 0 0', fontWeight: 500 }}>Total Completions</p>
          <p style={{ color: '#9ca3af', margin: '4px 0 0', fontSize: 12 }}>Across all challenges</p>
        </div>
        
        <div style={{
          background: '#fff',
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#f59e0b', fontSize: 28, margin: 0 }}>{avgEngagementRate}%</h3>
          <p style={{ color: '#64748b', margin: '8px 0 0', fontWeight: 500 }}>Avg Engagement</p>
          <p style={{ color: '#9ca3af', margin: '4px 0 0', fontSize: 12 }}>Completions per user</p>
        </div>
      </div>

      {/* ROI and User Growth Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: 24,
        marginBottom: 32
      }}>
        {/* ROI Over Time */}
        <div style={{
          background: '#fff',
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ color: '#1e293b', marginBottom: 20 }}>ROI Growth (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={getROIOverTime()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'cumulativeROI' ? `$${value}` : value,
                  name === 'cumulativeROI' ? 'Cumulative ROI' : 
                  name === 'dailyROI' ? 'Daily ROI' : 'Completions'
                ]}
              />
              <Bar yAxisId="right" dataKey="completions" fill="#e2e8f0" name="completions" />
              <Line yAxisId="left" type="monotone" dataKey="cumulativeROI" stroke="#10b981" strokeWidth={3} name="cumulativeROI" />
            </ComposedChart>
          </ResponsiveContainer>
          {/* ROI Explanation moved here */}
          <div style={{
            background: '#f8fafc',
            borderLeft: '4px solid #10b981',
            padding: '12px 16px',
            marginTop: 16,
            color: '#475569',
            fontSize: 14
          }}>
            <strong>ROI Calculation:</strong> {ROI_ASSUMPTIONS.description}, for a total of ${ROI_ASSUMPTIONS.productsPerLesson * ROI_ASSUMPTIONS.profitPerProduct} per completion.
          </div>
        </div>

        {/* New Users Growth */}
        <div style={{
          background: '#fff',
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ color: '#1e293b', marginBottom: 20 }}>User Growth (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={getNewUsersOverTime()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="newUsers" fill="#0ea5e9" name="New Users" />
              <Line yAxisId="right" type="monotone" dataKey="cumulativeUsers" stroke="#8b5cf6" strokeWidth={3} name="Total Users" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Challenge Performance Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
        gap: 24,
        marginBottom: 32
      }}>
        {/* ROI per Challenge */}
        <div style={{
          background: '#fff',
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ color: '#1e293b', marginBottom: 20 }}>ROI by Challenge</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={getROIPerChallenge().slice(0, 10)} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="challengeId" type="category" width={120} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'estimatedRevenue' ? `$${value}` : value,
                  name === 'estimatedRevenue' ? 'Estimated Revenue' : 'Completions'
                ]}
              />
              <Bar dataKey="estimatedRevenue" fill="#10b981" name="estimatedRevenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Engagement per Challenge */}
        <div style={{
          background: '#fff',
          padding: 24,
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ color: '#1e293b', marginBottom: 20 }}>Engagement by Challenge</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={getEngagementPerChallenge().slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="challengeId" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  value,
                  name === 'completions' ? 'Total Completions' : 'Engagement Rate (%)'
                ]}
              />
              <Bar dataKey="completions" fill="#0ea5e9" name="completions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Challenge Performance Table */}
      <div style={{
        background: '#fff',
        padding: 24,
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        marginBottom: 32
      }}>
        <h3 style={{ color: '#1e293b', marginBottom: 20 }}>Detailed Challenge Performance</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: 12, textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Challenge</th>
                <th style={{ padding: 12, textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Completions</th>
                <th style={{ padding: 12, textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Engagement Rate</th>
                <th style={{ padding: 12, textAlign: 'center', borderBottom: '2px solid #e2e8f0' }}>Estimated ROI</th>
              </tr>
            </thead>
            <tbody>
              {getROIPerChallenge().slice(0, 15).map((challenge, index) => (
                <tr key={challenge.challengeId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 12, fontWeight: 500 }}>{challenge.challengeId}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>{challenge.completions}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    <span style={{
                      background: parseFloat(challenge.engagementRate) > 50 ? '#dcfce7' : '#fef3c7',
                      color: parseFloat(challenge.engagementRate) > 50 ? '#166534' : '#92400e',
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 500
                    }}>
                      {challenge.engagementRate}%
                    </span>
                  </td>
                  <td style={{ padding: 12, textAlign: 'center', fontWeight: 600, color: '#10b981' }}>
                    ${challenge.estimatedRevenue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        background: '#fff',
        padding: 24,
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <h3 style={{ color: '#1e293b', marginBottom: 20 }}>Recent Activity</h3>
        {completions.length === 0 ? (
          <p style={{ color: '#64748b', textAlign: 'center', padding: 40 }}>
            No completions yet. Users will appear here as they complete challenges.
          </p>
        ) : (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {completions.slice(0, 20).map((completion) => (
              <div key={completion.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 12,
                borderBottom: '1px solid #e2e8f0'
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 500, color: '#1e293b' }}>
                    Challenge: {completion.challengeId || 'Unknown'}
                  </p>
                  <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
                    User: {completion.userId} • {completion.completedAt?.toLocaleDateString()} at {completion.completedAt?.toLocaleTimeString()}
                  </p>
                </div>
                <span style={{
                  background: '#f0fdf4',
                  color: '#166534',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 500
                }}>
                  +${ROI_ASSUMPTIONS.productsPerLesson * ROI_ASSUMPTIONS.profitPerProduct} ROI
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandDashboard;