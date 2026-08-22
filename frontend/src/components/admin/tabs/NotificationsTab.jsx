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
          targetAudience: scheduledAudience,
          repeatType: scheduledRepeat
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setScheduleStatus('Notification scheduled successfully!');
        setScheduledTitle('');
        setScheduledMessage('');
        setScheduledDateTime('');
        setScheduledAudience('all');
        setScheduledRepeat('once');
        fetchScheduledNotifications();
      }
    } catch (err) {
      setScheduleStatus('Failed to schedule: ' + (err.response?.data?.error || err.message));
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

  // ===== Start editing =====
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

  // ===== Cancel editing =====
  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
    setEditMessage('');
    setEditDateTime('');
    setEditAudience('all');
    setEditRepeat('once');
  };

  // ===== Save edited notification =====
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
        alert('Notification updated successfully!');
      }
    } catch (err) {
      alert('Failed to update: ' + (err.response?.data?.error || err.message));
    } finally {
      setEditLoading(false);
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

  // ===== Get status badge =====
  const getStatusBadge = (status) => {
    const styles = {
      sent: { background: '#d4edda', color: '#155724', label: 'Sent' },
      pending: { background: '#fff3cd', color: '#856404', label: 'Pending' },
      cancelled: { background: '#f8d7da', color: '#721c24', label: 'Cancelled' }
    };
    const s = styles[status] || styles.pending;
    return (
      <span style={{ background: s.background, color: s.color, padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}>
        {s.label}
      </span>
    );
  };

  // ===== Get repeat label =====
  const getRepeatLabel = (repeatType) => {
    if (repeatType === 'daily') {
      return <span style={{ background: '#cce5ff', color: '#004085', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}>Daily</span>;
    }
    return <span style={{ background: '#e9ecef', color: '#495057', padding: '2px 10px', borderRadius: 12, fontSize: 12, fontWeight: 'bold' }}>Once</span>;
  };

  // ===== Input style =====
  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
    borderRadius: 8,
    fontSize: 14,
    boxSizing: 'border-box',
    background: darkMode ? '#1a1a2e' : '#f8f9fa',
    color: textColor,
    outline: 'none',
    transition: 'border-color 0.2s ease'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: 6,
    fontWeight: '600',
    fontSize: 14,
    color: secondaryText
  };

  return (
    <div style={{ padding: 24, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      
      {/* ============================================================ */}
      {/* INSTANT NOTIFICATION SECTION */}
      {/* ============================================================ */}
      <div style={{ marginBottom: 40, width: '100%' }}>
        <h3 style={{ color: headingColor, fontSize: 20, fontWeight: '600', marginBottom: 4 }}>
          Instant Notification
        </h3>
        <p style={{ color: secondaryText, fontSize: 14, marginBottom: 20 }}>
          Send an immediate push notification to all active users.
        </p>

        <div style={{ width: '100%' }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Title</label>
            <input
              type="text"
              placeholder="Enter notification title"
              value={notificationTitle}
              onChange={(e) => setNotificationTitle(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Message</label>
            <textarea
              placeholder="Enter notification message"
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              rows="3"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
          <button
            onClick={sendNotification}
            disabled={sendingNotification}
            style={{
              background: '#ff9800',
              color: 'white',
              padding: '12px 28px',
              border: 'none',
              borderRadius: 8,
              cursor: sendingNotification ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: 15,
              opacity: sendingNotification ? 0.6 : 1,
              transition: 'opacity 0.2s ease'
            }}
          >
            {sendingNotification ? 'Sending...' : 'Send Notification'}
          </button>
          {notificationStatus && (
            <p style={{ marginTop: 12, color: '#28a745', fontSize: 14 }}>{notificationStatus}</p>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SCHEDULED NOTIFICATIONS SECTION */}
      {/* ============================================================ */}
      <div style={{
        borderTop: `2px solid ${darkMode ? '#444' : '#e9ecef'}`,
        paddingTop: 32,
        width: '100%'
      }}>
        <h3 style={{ color: headingColor, fontSize: 20, fontWeight: '600', marginBottom: 4 }}>
          Schedule Notification
        </h3>
        <p style={{ color: secondaryText, fontSize: 14, marginBottom: 20 }}>
          Schedule a notification to be sent at a specific time. Choose "Daily" to repeat.
        </p>

        <div style={{ display: 'grid', gap: 16, width: '100%' }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input
              type="text"
              placeholder="Enter notification title"
              value={scheduledTitle}
              onChange={(e) => setScheduledTitle(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Message</label>
            <textarea
              placeholder="Enter notification message"
              value={scheduledMessage}
              onChange={(e) => setScheduledMessage(e.target.value)}
              rows="3"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Scheduled Date & Time</label>
            <input
              type="datetime-local"
              value={scheduledDateTime}
              onChange={(e) => setScheduledDateTime(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Target Audience</label>
            <select
              value={scheduledAudience}
              onChange={(e) => setScheduledAudience(e.target.value)}
              style={inputStyle}
            >
              <option value="all">All Users</option>
              <option value="premium">Premium Users</option>
              <option value="free">Free Users</option>
              <option value="inactive">Inactive Users (7+ days)</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Repeat</label>
            <select
              value={scheduledRepeat}
              onChange={(e) => setScheduledRepeat(e.target.value)}
              style={inputStyle}
            >
              <option value="once">Once</option>
              <option value="daily">Daily (repeat every day)</option>
            </select>
          </div>

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
              fontWeight: '600',
              fontSize: 16,
              opacity: scheduleLoading ? 0.6 : 1,
              transition: 'opacity 0.2s ease'
            }}
          >
            {scheduleLoading ? 'Scheduling...' : 'Schedule Notification'}
          </button>
          {scheduleStatus && (
            <p style={{ marginTop: 4, color: scheduleStatus.includes('✅') ? '#28a745' : '#dc3545', fontSize: 14 }}>
              {scheduleStatus}
            </p>
          )}
        </div>

        {/* ===== LIST SCHEDULED NOTIFICATIONS ===== */}
        <div style={{ marginTop: 32, width: '100%' }}>
          <h4 style={{ color: headingColor, fontSize: 16, fontWeight: '600', marginBottom: 16 }}>
            Scheduled Notifications
            {loadingScheduled && <span style={{ marginLeft: 8, fontSize: 14, color: secondaryText }}>Loading...</span>}
          </h4>

          {scheduledNotifications.length === 0 ? (
            <p style={{ color: secondaryText, fontSize: 14 }}>No scheduled notifications found.</p>
          ) : (
            scheduledNotifications.map((n) => {
              const isEditing = editingId === n._id;
              return (
                <div
                  key={n._id}
                  style={{
                    background: cardBg,
                    border: `1px solid ${darkMode ? '#444' : '#e9ecef'}`,
                    borderRadius: 12,
                    padding: 18,
                    marginBottom: 14,
                    boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
                    transition: 'box-shadow 0.2s ease',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  {!isEditing ? (
                    // ===== VIEW MODE =====
                    <div>
                      {/* Title & Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <strong style={{ color: headingColor, fontSize: 16 }}>{n.title}</strong>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {getStatusBadge(n.status)}
                          {getRepeatLabel(n.repeatType)}
                        </div>
                      </div>

                      {/* Message */}
                      <p style={{ fontSize: 14, color: textColor, marginTop: 6, marginBottom: 8 }}>{n.message}</p>

                      {/* Meta Info */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 10 }}>
                        <small style={{ color: secondaryText, fontSize: 13 }}>
                          Scheduled: {formatScheduledTime(n.scheduledFor)}
                        </small>
                        <small style={{ color: secondaryText, fontSize: 13 }}>
                          Audience: {getAudienceLabel(n.targetAudience)}
                        </small>
                      </div>

                      {/* ===== STATISTICS BREAKDOWN ===== */}
                      {(n.status === 'sent' || n.repeatType === 'daily') && (
                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 16,
                          padding: '10px 14px',
                          background: darkMode ? 'rgba(255,255,255,0.04)' : '#f8f9fa',
                          borderRadius: 8,
                          marginBottom: 12,
                          width: '100%',
                          boxSizing: 'border-box'
                        }}>
                          {n.status === 'sent' && (
                            <>
                              <small style={{ color: '#2e7d32', fontSize: 13 }}>
                                Sent: {new Date(n.sentAt).toLocaleString()}
                              </small>
                              {n.successCount !== undefined && n.failureCount !== undefined && (
                                <>
                                  <small style={{ color: '#2e7d32', fontSize: 13 }}>
                                    <span style={{ fontWeight: '600' }}>Success:</span> {n.successCount}
                                  </small>
                                  <small style={{ color: '#dc3545', fontSize: 13 }}>
                                    <span style={{ fontWeight: '600' }}>Failures:</span> {n.failureCount}
                                  </small>
                                </>
                              )}
                            </>
                          )}
                          {n.repeatType === 'daily' && (
                            <small style={{ color: '#6c757d', fontSize: 13 }}>
                              Next: {formatScheduledTime(n.scheduledFor)}
                            </small>
                          )}
                          {n.sentCount > 1 && (
                            <small style={{ color: '#6c757d', fontSize: 13 }}>
                              Total sends: {n.sentCount}
                            </small>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        {n.status === 'pending' && (
                          <>
                            <button
                              onClick={() => startEditing(n)}
                              style={{
                                padding: '6px 16px',
                                background: '#ffc107',
                                color: '#333',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: '600'
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleCancelScheduled(n._id)}
                              style={{
                                padding: '6px 16px',
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: '600'
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {n.status === 'sent' && (
                          <span style={{ color: '#2e7d32', fontSize: 13, fontWeight: '600' }}>
                            ✓ Sent
                          </span>
                        )}
                        {n.status === 'cancelled' && (
                          <span style={{ color: '#dc3545', fontSize: 13, fontWeight: '600' }}>
                            ✗ Cancelled
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    // ===== EDIT MODE =====
                    <div>
                      <h5 style={{ color: headingColor, marginBottom: 12, fontSize: 15 }}>Edit Notification</h5>
                      <div style={{ display: 'grid', gap: 12, width: '100%' }}>
                        <input
                          type="text"
                          placeholder="Title"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          style={inputStyle}
                        />
                        <textarea
                          placeholder="Message"
                          value={editMessage}
                          onChange={(e) => setEditMessage(e.target.value)}
                          rows="2"
                          style={{ ...inputStyle, resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <input
                            type="datetime-local"
                            value={editDateTime}
                            onChange={(e) => setEditDateTime(e.target.value)}
                            style={{ ...inputStyle, flex: '1 1 200px' }}
                          />
                          <select
                            value={editAudience}
                            onChange={(e) => setEditAudience(e.target.value)}
                            style={{ ...inputStyle, flex: '1 1 160px' }}
                          >
                            <option value="all">All Users</option>
                            <option value="premium">Premium</option>
                            <option value="free">Free</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                        <select
                          value={editRepeat}
                          onChange={(e) => setEditRepeat(e.target.value)}
                          style={inputStyle}
                        >
                          <option value="once">Once</option>
                          <option value="daily">Daily</option>
                        </select>
                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          <button
                            onClick={() => saveEdit(n._id)}
                            disabled={editLoading}
                            style={{
                              padding: '10px 24px',
                              background: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: 6,
                              cursor: editLoading ? 'not-allowed' : 'pointer',
                              fontWeight: '600',
                              fontSize: 14,
                              opacity: editLoading ? 0.6 : 1
                            }}
                          >
                            {editLoading ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            onClick={cancelEditing}
                            style={{
                              padding: '10px 24px',
                              background: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: 6,
                              cursor: 'pointer',
                              fontWeight: '600',
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