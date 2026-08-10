// src/components/admin/tabs/NotificationsTab.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const NotificationsTab = ({
  notificationTitle,
  setNotificationTitle,
  notificationMessage,
  setNotificationMessage,
  sendingNotification,
  sendNotification,
  notificationStatus,
  headingColor,
  token,
  darkMode,
  cardBg,
  textColor,
  secondaryText
}) => {
  // ===== NEW: Scheduled Notifications State =====
  const [scheduledTitle, setScheduledTitle] = useState('');
  const [scheduledMessage, setScheduledMessage] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [scheduledAudience, setScheduledAudience] = useState('all');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState([]);
  const [scheduleStatus, setScheduleStatus] = useState('');
  const [loadingScheduled, setLoadingScheduled] = useState(false);

  // ===== Fetch scheduled notifications =====
  const fetchScheduledNotifications = async () => {
    setLoadingScheduled(true);
    try {
      const res = await axios.get('/api/admin/scheduled-notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScheduledNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch scheduled notifications:', err);
    } finally {
      setLoadingScheduled(false);
    }
  };

  useEffect(() => {
    if (token) fetchScheduledNotifications();
  }, [token]);

  // ===== Schedule notification =====
  const handleScheduleNotification = async () => {
    if (!scheduledTitle.trim() || !scheduledMessage.trim() || !scheduledDateTime) {
      alert('Please fill in all fields');
      return;
    }

    setScheduleLoading(true);
    setScheduleStatus('');

    try {
      const res = await axios.post(
        '/api/admin/scheduled-notifications',
        {
          title: scheduledTitle.trim(),
          message: scheduledMessage.trim(),
          scheduledFor: scheduledDateTime,
          targetAudience: scheduledAudience
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setScheduleStatus('✅ Notification scheduled successfully!');
        setScheduledTitle('');
        setScheduledMessage('');
        setScheduledDateTime('');
        setScheduledAudience('all');
        fetchScheduledNotifications();
      }
    } catch (err) {
      setScheduleStatus('❌ Failed to schedule: ' + (err.response?.data?.error || err.message));
    } finally {
      setScheduleLoading(false);
    }
  };

  // ===== Cancel scheduled notification =====
  const handleCancelScheduled = async (id) => {
    if (!window.confirm('Cancel this scheduled notification?')) return;
    try {
      await axios.delete(`/api/admin/scheduled-notifications/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchScheduledNotifications();
    } catch (err) {
      alert('Failed to cancel: ' + (err.response?.data?.error || err.message));
    }
  };

  // ===== Format scheduled time for display =====
  const formatScheduledTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ===== Get audience label =====
  const getAudienceLabel = (audience) => {
    const labels = {
      all: 'All Users',
      premium: 'Premium Users',
      free: 'Free Users',
      inactive: 'Inactive Users (7+ days)'
    };
    return labels[audience] || audience;
  };

  // ===== Get status color =====
  const getStatusColor = (status) => {
    if (status === 'sent') return '#2e7d32';
    if (status === 'pending') return '#ff9800';
    if (status === 'cancelled') return '#dc3545';
    return '#6c757d';
  };

  return (
    <div style={{ padding: 20 }}>
      {/* ===== INSTANT NOTIFICATION (EXISTING - UNCHANGED) ===== */}
      <h3 style={{ color: headingColor, marginBottom: 20 }}>Send Push Notification to All Users</h3>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Notification Title"
          value={notificationTitle}
          onChange={(e) => setNotificationTitle(e.target.value)}
          style={{
            width: '100%',
            padding: '14px 18px',
            border: '1px solid #ccc',
            borderRadius: 8,
            fontSize: 14,
            boxSizing: 'border-box',
            background: darkMode ? '#1a1a2e' : '#f8f9fa',
            color: textColor
          }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <textarea
          placeholder="Notification Message"
          value={notificationMessage}
          onChange={(e) => setNotificationMessage(e.target.value)}
          rows="4"
          style={{
            width: '100%',
            padding: '14px 18px',
            border: '1px solid #ccc',
            borderRadius: 8,
            fontSize: 14,
            resize: 'vertical',
            boxSizing: 'border-box',
            background: darkMode ? '#1a1a2e' : '#f8f9fa',
            color: textColor
          }}
        />
      </div>
      <button
        onClick={sendNotification}
        disabled={sendingNotification}
        style={{
          background: '#ff9800',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        {sendingNotification ? 'Sending...' : 'Send Notification'}
      </button>
      {notificationStatus && <p style={{ marginTop: 16, color: '#2e7d32' }}>{notificationStatus}</p>}

      {/* ===== NEW: SCHEDULED NOTIFICATIONS SECTION ===== */}
      <div style={{
        marginTop: 40,
        borderTop: `2px solid ${darkMode ? '#444' : '#ddd'}`,
        paddingTop: 30
      }}>
        <h3 style={{ color: headingColor, marginBottom: 20 }}>Schedule Notification</h3>
        <p style={{ color: secondaryText, marginBottom: 16 }}>
          Schedule notifications to be sent at optimal times (e.g., evening when users are most active).
        </p>

        <div style={{ display: 'grid', gap: 16, maxWidth: 500 }}>
          <input
            type="text"
            placeholder="Notification Title"
            value={scheduledTitle}
            onChange={(e) => setScheduledTitle(e.target.value)}
            style={{
              padding: '14px 18px',
              border: '1px solid #ccc',
              borderRadius: 8,
              fontSize: 14,
              background: darkMode ? '#1a1a2e' : '#f8f9fa',
              color: textColor
            }}
          />
          <textarea
            placeholder="Notification Message"
            value={scheduledMessage}
            onChange={(e) => setScheduledMessage(e.target.value)}
            rows="3"
            style={{
              padding: '14px 18px',
              border: '1px solid #ccc',
              borderRadius: 8,
              fontSize: 14,
              resize: 'vertical',
              background: darkMode ? '#1a1a2e' : '#f8f9fa',
              color: textColor
            }}
          />
          <input
            type="datetime-local"
            value={scheduledDateTime}
            onChange={(e) => setScheduledDateTime(e.target.value)}
            style={{
              padding: '14px 18px',
              border: '1px solid #ccc',
              borderRadius: 8,
              fontSize: 14,
              background: darkMode ? '#1a1a2e' : '#f8f9fa',
              color: textColor
            }}
          />
          <select
            value={scheduledAudience}
            onChange={(e) => setScheduledAudience(e.target.value)}
            style={{
              padding: '14px 18px',
              border: '1px solid #ccc',
              borderRadius: 8,
              fontSize: 14,
              background: darkMode ? '#1a1a2e' : '#f8f9fa',
              color: textColor
            }}
          >
            <option value="all">👥 All Users</option>
            <option value="premium">⭐ Premium Users</option>
            <option value="free">🆓 Free Users</option>
            <option value="inactive">💤 Inactive Users (7+ days)</option>
          </select>
          <button
            onClick={handleScheduleNotification}
            disabled={scheduleLoading}
            style={{
              padding: '14px',
              background: '#1e3c72',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: scheduleLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: 16,
              opacity: scheduleLoading ? 0.7 : 1
            }}
          >
            {scheduleLoading ? 'Scheduling...' : 'Schedule Notification'}
          </button>
          {scheduleStatus && (
            <p style={{
              marginTop: 8,
              color: scheduleStatus.includes('✅') ? '#2e7d32' : '#dc3545',
              fontSize: 14
            }}>
              {scheduleStatus}
            </p>
          )}
        </div>

        {/* ===== LIST SCHEDULED NOTIFICATIONS ===== */}
        <div style={{ marginTop: 24 }}>
          <h4 style={{ color: headingColor, marginBottom: 12 }}>
            Scheduled Notifications
            {loadingScheduled && <span style={{ marginLeft: 8, fontSize: 14, color: secondaryText }}>Loading...</span>}
          </h4>

          {scheduledNotifications.length === 0 ? (
            <p style={{ color: secondaryText }}>No scheduled notifications.</p>
          ) : (
            scheduledNotifications.map((n) => (
              <div
                key={n._id}
                style={{
                  padding: 16,
                  border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                  borderRadius: 8,
                  marginBottom: 12,
                  background: cardBg,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <strong style={{ color: headingColor }}>{n.title}</strong>
                  <p style={{ fontSize: 14, color: textColor, marginTop: 4 }}>{n.message}</p>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
                    <small style={{ color: secondaryText }}>
                      📅 {formatScheduledTime(n.scheduledFor)}
                    </small>
                    <small style={{ color: secondaryText }}>
                      👥 {getAudienceLabel(n.targetAudience)}
                    </small>
                    <small style={{ color: getStatusColor(n.status) }}>
                      Status: {n.status.charAt(0).toUpperCase() + n.status.slice(1)}
                    </small>
                  </div>
                </div>
                {n.status === 'pending' && (
                  <button
                    onClick={() => handleCancelScheduled(n._id)}
                    style={{
                      padding: '8px 16px',
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: 13
                    }}
                  >
                    ❌ Cancel
                  </button>
                )}
                {n.status === 'sent' && (
                  <span style={{ color: '#2e7d32', fontSize: 13, fontWeight: 'bold' }}>
                    ✅ Sent at {new Date(n.sentAt).toLocaleString()}
                  </span>
                )}
                {n.status === 'cancelled' && (
                  <span style={{ color: '#dc3545', fontSize: 13, fontWeight: 'bold' }}>
                    🚫 Cancelled
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};