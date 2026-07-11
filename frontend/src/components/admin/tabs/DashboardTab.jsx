// src/components/admin/tabs/DashboardTab.jsx
import React from 'react';
import { LoadingWithBar } from '../../common/LoadingWithBar';

export const DashboardTab = ({ dashboardData, dashboardLoading, darkMode, headingColor, secondaryText, textColor }) => {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ color: headingColor, marginBottom: 20 }}>📊 Dashboard</h2>
      {dashboardLoading ? <LoadingWithBar message="Loading dashboard..." /> : dashboardData ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 30 }}>
            <div style={{ background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: 16, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: headingColor }}>{dashboardData.users.total}</div>
              <div style={{ color: secondaryText }}>Total Users</div>
            </div>
            <div style={{ background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: 16, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: '#2e7d32' }}>{dashboardData.users.premium}</div>
              <div style={{ color: secondaryText }}>Premium Users</div>
            </div>
            <div style={{ background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: 16, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ff9800' }}>₦{dashboardData.revenue.total}</div>
              <div style={{ color: secondaryText }}>Total Revenue</div>
            </div>
            <div style={{ background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: 16, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: headingColor }}>{dashboardData.quizzes.completions}</div>
              <div style={{ color: secondaryText }}>Quiz Completions</div>
            </div>
            <div style={{ background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: 16, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: headingColor }}>{dashboardData.users.newToday}</div>
              <div style={{ color: secondaryText }}>New Today</div>
            </div>
            <div style={{ background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: 16, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: headingColor }}>{dashboardData.users.newThisMonth}</div>
              <div style={{ color: secondaryText }}>New This Month</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: 16, borderRadius: 12 }}>
              <h4 style={{ color: headingColor, marginBottom: 12 }}>Popular Categories</h4>
              {dashboardData.popularCategories.map(cat => (
                <div key={cat._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid ' + (darkMode ? '#444' : '#eee') }}>
                  <span style={{ color: textColor }}>{cat._id || 'Uncategorized'}</span>
                  <span style={{ color: headingColor }}>{cat.count} quizzes</span>
                </div>
              ))}
            </div>
            <div style={{ background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: 16, borderRadius: 12 }}>
              <h4 style={{ color: headingColor, marginBottom: 12 }}>Recent Users</h4>
              {dashboardData.recentUsers.map(u => (
                <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid ' + (darkMode ? '#444' : '#eee') }}>
                  <span style={{ color: textColor }}>{u.name || u.email}</span>
                  <span style={{ color: secondaryText, fontSize: 12 }}>{new Date(u.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : <p>No data</p>}
    </div>
  );
};