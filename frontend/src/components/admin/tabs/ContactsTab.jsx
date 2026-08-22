import React, { useState } from 'react';

export const ContactsTab = ({
  contacts,
  replyingTo,
  setReplyingTo,
  replyMessage,
  setReplyMessage,
  sendingReply,
  sendReply,
  deleteContact,
  darkMode,
  secondaryText,
  headingColor,
  textColor,
  cardBg
}) => {
  const formatTime = (date) =>
    new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  if (!contacts || contacts.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: cardBg,
          borderRadius: 20,
          border: `1px solid ${darkMode ? '#333' : '#eaeaea'}`
        }}
      >
        <span style={{ fontSize: 48 }}>✉️</span>
        <h3 style={{ color: headingColor, marginTop: 12 }}>No messages yet</h3>
        <p style={{ color: secondaryText }}>User messages will appear here.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {contacts.map((contact) => {
        const isReplying = replyingTo === contact._id;
        const hasReply = contact.adminReply && contact.adminReply.trim().length > 0;
        const isNew = contact.status === 'new' || (!hasReply && contact.status !== 'replied');

        return (
          <div
            key={contact._id}
            style={{
              background: cardBg,
              borderRadius: 16,
              padding: 20,
              border: `1px solid ${darkMode ? '#333' : '#eaeaea'}`,
              boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            {/* Header with status badge */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                gap: 8
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#1e3c72',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                    fontWeight: 600,
                    flexShrink: 0
                  }}
                >
                  {contact.name ? contact.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: headingColor, fontSize: 15 }}>
                    {contact.name}
                  </div>
                  <div style={{ fontSize: 13, color: secondaryText }}>{contact.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {isNew && (
                  <span
                    style={{
                      background: '#ff9800',
                      color: 'white',
                      padding: '2px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700
                    }}
                  >
                    New
                  </span>
                )}
                {hasReply && (
                  <span
                    style={{
                      background: '#e8f5e9',
                      color: '#2e7d32',
                      padding: '2px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600
                    }}
                  >
                    Replied
                  </span>
                )}
                <span style={{ fontSize: 12, color: secondaryText, whiteSpace: 'nowrap' }}>
                  {formatTime(contact.createdAt)}
                </span>
              </div>
            </div>

            {/* Conversation thread */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                marginBottom: 16
              }}
            >
              {/* User message */}
              <div
                style={{
                  maxWidth: '90%',
                  alignSelf: 'flex-start',
                  background: darkMode ? '#2d2d3d' : '#f1f3f5',
                  padding: '12px 16px',
                  borderRadius: '12px 12px 12px 4px',
                  borderLeft: `4px solid #1e3c72`,
                  wordBreak: 'break-word'
                }}
              >
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: textColor }}>
                  {contact.message}
                </p>
              </div>

              {/* Admin reply */}
              {hasReply && (
                <div
                  style={{
                    maxWidth: '90%',
                    alignSelf: 'flex-end',
                    background: darkMode ? '#1a2e2a' : '#e8f5e9',
                    padding: '12px 16px',
                    borderRadius: '12px 12px 4px 12px',
                    borderRight: `4px solid #2e7d32`,
                    wordBreak: 'break-word'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4,
                      flexWrap: 'wrap',
                      gap: 4
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#2e7d32' }}>
                      You replied
                    </span>
                    {contact.adminReplyDate && (
                      <span style={{ fontSize: 11, color: secondaryText }}>
                        {formatTime(contact.adminReplyDate)}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: textColor }}>
                    {contact.adminReply}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
                paddingTop: 14,
                borderTop: `1px solid ${darkMode ? '#333' : '#eee'}`
              }}
            >
              {!isReplying ? (
                <>
                  <button
                    onClick={() => setReplyingTo(contact._id)}
                    style={{
                      background: '#1e3c72',
                      color: 'white',
                      border: 'none',
                      padding: '8px 18px',
                      borderRadius: 30,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      flex: '1 1 auto',
                      justifyContent: 'center'
                    }}
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete message from ${contact.name}?`)) {
                        deleteContact(contact._id);
                      }
                    }}
                    style={{
                      background: 'transparent',
                      color: '#dc3545',
                      border: `1px solid #dc3545`,
                      padding: '8px 18px',
                      borderRadius: 30,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      flex: '1 1 auto',
                      justifyContent: 'center',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    Delete
                  </button>
                </>
              ) : (
                <div style={{ width: '100%' }}>
                  <textarea
                    placeholder="Type your reply…"
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: `1px solid ${darkMode ? '#555' : '#ddd'}`,
                      background: darkMode ? '#1a1a2e' : '#f8f9fa',
                      color: textColor,
                      fontSize: 14,
                      resize: 'vertical',
                      boxSizing: 'border-box',
                      marginBottom: 12,
                      fontFamily: 'inherit'
                    }}
                  />
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => sendReply(contact.email, contact.name, contact.message, contact._id)}
                      disabled={sendingReply || !replyMessage.trim()}
                      style={{
                        background: replyMessage.trim() ? '#28a745' : '#ccc',
                        color: 'white',
                        border: 'none',
                        padding: '10px 22px',
                        borderRadius: 30,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: replyMessage.trim() ? 'pointer' : 'not-allowed',
                        opacity: replyMessage.trim() ? 1 : 0.6,
                        flex: '1 1 auto'
                      }}
                    >
                      {sendingReply ? 'Sending…' : 'Send Reply'}
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyMessage('');
                      }}
                      style={{
                        background: 'transparent',
                        color: secondaryText,
                        border: `1px solid ${darkMode ? '#555' : '#ccc'}`,
                        padding: '10px 22px',
                        borderRadius: 30,
                        fontSize: 14,
                        cursor: 'pointer',
                        flex: '1 1 auto'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};