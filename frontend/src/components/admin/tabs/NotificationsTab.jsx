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
  // ===== Scheduled Notifications State =====
  const [scheduledTitle, setScheduledTitle] = useState('');
  const [scheduledMessage, setScheduledMessage] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [scheduledAudience, setScheduledAudience] = useState('all');
  const [scheduledRepeat, setScheduledRepeat] = useState('once');
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduledNotifications, setScheduledNotifications] = useState([]);
  const [scheduleStatus, setScheduleStatus] = useState('');
  const [loadingScheduled, setLoadingScheduled] = useState(false);

  // ===== EDIT STATES =====
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [editDateTime, setEditDateTime] = useState('');
  const [editAudience, setEditAudience] = useState('all');
  const [editRepeat, setEditRepeat] = useState('once');
  const [editLoading, setEditLoading] = useState(false);

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

  // ===== Schedule notification (UPDATED) =====
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
          targetAudience: scheduledAudience,
          repeatType: scheduledRepeat
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setScheduleStatus('✅ Notification scheduled successfully!');
        setScheduledTitle('');
        setScheduledMessage('');
        setScheduledDateTime('');
        setScheduledAudience('all');
        setScheduledRepeat('once');
        fetchScheduledNotifications();
      }
    } catch (err) {
      setScheduleStatus('❌ Failed to schedule: ' + (err.response?.data?.error || err.message));
    } finally {
      setScheduleLoading(false);
    }
  };

  // ===== Cancel scheduled notification (UNCHANGED) =====
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

  // ===== Start editing (UPDATED) =====
  const startEditing = (notification) => {
    setEditingId(notification._id);
    setEditTitle(notification.title);
    setEditMessage(notification.message);
    const dateObj = new Date(notification.scheduledFor);
    const localDateTime = dateObj.toISOString().slice(0, 16);
    setEditDateTime(localDateTime);
    setEditAudience(notification.targetAudience || 'all');
    setEditRepeat(notification.repeatType || 'once');
  };

  // ===== Cancel editing (UNCHANGED) =====
  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
    setEditMessage('');
    setEditDateTime('');
    setEditAudience('all');
    setEditRepeat('once');
  };

  // ===== Save edited notification (UPDATED) =====
  const saveEdit = async (id) => {
    if (!editTitle.trim() || !editMessage.trim() || !editDateTime) {
      alert('Please fill in all fields');
      return;
    }

    setEditLoading(true);
    try {
      const res = await axios.put(
        `/api/admin/scheduled-notifications/${id}`,
        {
          title: editTitle.trim(),
          message: editMessage.trim(),
          scheduledFor: editDateTime,
          targetAudience: editAudience,
          repeatType: editRepeat
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setScheduledNotifications(prev =>
          prev.map(n => n._id === id ? res.data.notification : n)
        );
        cancelEditing();
        alert('✅ Notification updated successfully!');
      }
    } catch (err) {
      alert('❌ Failed to update: ' + (err.response?.data?.error || err.message));
    } finally {
      setEditLoading(false);
    }
  };

  // ===== Format scheduled time for display (UNCHANGED) =====
  const formatScheduledTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ===== Get audience label (UNCHANGED) =====
  const getAudienceLabel = (audience) => {
    const labels = {
      all: 'All Users',
      premium: 'Premium Users',
      free: 'Free Users',
      inactive: 'Inactive Users (7+ days)'
    };
    return labels[audience] || audience;
  };

  // ===== Get status color (UNCHANGED) =====
  const getStatusColor = (status) => {
    if (status === 'sent') return '#2e7d32';
    if (status === 'pending') return '#ff9800';
    if (status === 'cancelled') return '#dc3545';
    return '#6c757d';
  };

  // ===== Get repeat label =====
  const getRepeatLabel = (repeatType) => {
    if (repeatType === 'daily') return 'Daily';
    return 'Once';
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

      {/* ===== SCHEDULED NOTIFICATIONS SECTION ===== */}
      <div style={{
        marginTop: 40,
        borderTop: `2px solid ${darkMode ? '#444' : '#ddd'}`,
        paddingTop: 30
      }}>
        <h3 style={{ color: headingColor, marginBottom: 20 }}>Schedule Notification</h3>
        <p style={{ color: secondaryText, marginBottom: 16 }}>
          Schedule notifications to be sent at optimal times. Choose "Daily" to repeat at the same time.
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
            <option value="all">All Users</option>
            <option value="premium">Premium Users</option>
            <option value="free">Free Users</option>
            <option value="inactive">Inactive Users (7+ days)</option>
          </select>
          {/* ===== NEW: Repeat dropdown ===== */}
          <select
            value={scheduledRepeat}
            onChange={(e) => setScheduledRepeat(e.target.value)}
            style={{
              padding: '14px 18px',
              border: '1px solid #ccc',
              borderRadius: 8,
              fontSize: 14,
              background: darkMode ? '#1a1a2e' : '#f8f9fa',
              color: textColor
            }}
          >
            <option value="once">Once</option>
            <option value="daily">Daily (repeat every day)</option>
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
            scheduledNotifications.map((n) => {
              const isEditing = editingId === n._id;
              return (
                <div
                  key={n._id}
                  style={{
                    padding: 16,
                    border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                    borderRadius: 8,
                    marginBottom: 12,
                    background: cardBg,
                    display: 'flex',
                    flexDirection: isEditing ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isEditing ? 'stretch' : 'center',
                    flexWrap: 'wrap',
                    gap: isEditing ? 12 : 0
                  }}
                >
                  {!isEditing ? (
                    // ===== VIEW MODE (existing) =====
                    <>
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <strong style={{ color: headingColor }}>{n.title}</strong>
                        <p style={{ fontSize: 14, color: textColor, marginTop: 4 }}>{n.message}</p>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 4 }}>
                          <small style={{ color: secondaryText }}>
                             {formatScheduledTime(n.scheduledFor)}
                          </small>
                          <small style={{ color: secondaryText }}>
                             {getAudienceLabel(n.targetAudience)}
                          </small>
                          <small style={{ color: getStatusColor(n.status) }}>
                            Status: {n.status.charAt(0).toUpperCase() + n.status.slice(1)}
                          </small>
                          {/* ===== NEW: Show repeat type ===== */}
                          <small style={{ color: secondaryText }}>
                            {getRepeatLabel(n.repeatType)}
                          </small>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                        {n.status === 'pending' && (
                          <>
                            <button
                              onClick={() => startEditing(n)}
                              style={{
                                padding: '8px 16px',
                                background: '#ffc107',
                                color: '#333',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: 13
                              }}
                            >
                              Edit
                            </button>
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
                              Cancel
                            </button>
                          </>
                        )}
                        {n.status === 'sent' && (
                          <span style={{ color: '#2e7d32', fontSize: 13, fontWeight: 'bold' }}>
                            ✅ Sent at {new Date(n.sentAt).toLocaleString()}
                          </span>
                        )}
                        {n.status === 'cancelled' && (
                          <span style={{ color: '#dc3545', fontSize: 13, fontWeight: 'bold' }}>
                            Cancelled
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    // ===== EDIT MODE (UPDATED with repeat) =====
                    <div style={{ width: '100%' }}>
                      <div style={{ display: 'grid', gap: 12 }}>
                        <input
                          type="text"
                          placeholder="Title"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          style={{
                            padding: '10px 14px',
                            border: '1px solid #ccc',
                            borderRadius: 6,
                            fontSize: 14,
                            background: darkMode ? '#1a1a2e' : '#f8f9fa',
                            color: textColor
                          }}
                        />
                        <textarea
                          placeholder="Message"
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          rows="2"
                          style={{
                            padding: '10px 14px',
                            border: '1px solid #ccc',
                            borderRadius: 6,
                            fontSize: 14,
                            resize: 'vertical',
                            background: darkMode ? '#1a1a2e' : '#f8f9fa',
                            color: textColor
                          }}
                        />
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <input
                            type="datetime-local"
                            value={editDateTime}
                            onChange={(e) => setEditDateTime(e.target.value)}
                            style={{
                              flex: 1,
                              padding: '10px 14px',
                              border: '1px solid #ccc',
                              borderRadius: 6,
                              fontSize: 14,
                              background: darkMode ? '#1a1a2e' : '#f8f9fa',
                              color: textColor
                            }}
                          />
                          <select
                            value={editAudience}
                            onChange={(e) => setEditAudience(e.target.value)}
                            style={{
                              padding: '10px 14px',
                              border: '1px solid #ccc',
                              borderRadius: 6,
                              fontSize: 14,
                              background: darkMode ? '#1a1a2e' : '#f8f9fa',
                              color: textColor
                            }}
                          >
                            <option value="all"> All</option>
                            <option value="premium">Premium</option>
                            <option value="free">Free</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                        {/* ===== NEW: Edit repeat dropdown ===== */}
                        <select
                          value={editRepeat}
                          onChange={(e) => setEditRepeat(e.target.value)}
                          style={{
                            padding: '10px 14px',
                            border: '1px solid #ccc',
                            borderRadius: 6,
                            fontSize: 14,
                            background: darkMode ? '#1a1a2e' : '#f8f9fa',
                            color: textColor
                          }}
                        >
                          <option value="once"> Once</option>
                          <option value="daily"> Daily</option>
                        </select>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <button
                            onClick={() => saveEdit(n._id)}
                            disabled={editLoading}
                            style={{
                              padding: '10px 20px',
                              background: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: 6,
                              cursor: editLoading ? 'not-allowed' : 'pointer',
                              fontWeight: 'bold',
                              fontSize: 14,
                              opacity: editLoading ? 0.7 : 1
                            }}
                          >
                            {editLoading ? 'Saving...' : ' Save'}
                          </button>
                          <button
                            onClick={cancelEditing}
                            style={{
                              padding: '10px 20px',
                              background: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: 6,
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: 14
                            }}
                          >
                             Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};