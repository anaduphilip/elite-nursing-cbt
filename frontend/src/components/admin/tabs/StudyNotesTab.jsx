// src/components/admin/tabs/StudyNotesTab.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export const StudyNotesTab = ({ token, darkMode, headingColor, secondaryText, textColor, cardBg }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [estimatedReadTime, setEstimatedReadTime] = useState('');
  const [order, setOrder] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [active, setActive] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/study-notes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setNotes(res.data.notes || []);
      }
    } catch (error) {
      console.error('Failed to fetch study notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setContent('');
    setCategory('');
    setEstimatedReadTime('');
    setOrder(0);
    setIsPremium(false);
    setActive(true);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setResult('❌ Title and content are required');
      return;
    }
    setLoading(true);
    setResult('');
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        category: category.trim() || 'General',
        estimatedReadTime: estimatedReadTime ? parseInt(estimatedReadTime) : 5,
        order: order || 0,
        isPremium: isPremium,
        active: active
      };

      let res;
      if (editingId) {
        res = await axios.put(`/api/admin/study-notes/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        res = await axios.post('/api/admin/study-notes', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (res.data.success) {
        setResult(editingId ? '✅ Note updated!' : '✅ Note created!');
        resetForm();
        await fetchNotes();
      }
    } catch (error) {
      setResult('❌ Failed to save: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (note) => {
    setTitle(note.title);
    setDescription(note.description || '');
    setContent(note.content);
    setCategory(note.category || '');
    setEstimatedReadTime(note.estimatedReadTime || '');
    setOrder(note.order || 0);
    setIsPremium(note.isPremium || false);
    setActive(note.active !== undefined ? note.active : true);
    setEditingId(note._id);
    setResult('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this study note permanently?')) return;
    setLoading(true);
    try {
      await axios.delete(`/api/admin/study-notes/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult('✅ Note deleted');
      await fetchNotes();
    } catch (error) {
      setResult('❌ Failed to delete: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const note = notes.find(n => n._id === id);
      if (!note) return;
      const payload = {
        ...note,
        active: !currentStatus
      };
      await axios.put(`/api/admin/study-notes/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchNotes();
    } catch (error) {
      setResult('❌ Failed to toggle status');
    }
  };

  return (
    <div>
      <h3 style={{ color: headingColor, marginBottom: 20 }}>📖 Study Notes</h3>
      <p style={{ color: secondaryText, marginBottom: 16 }}>
        Manage study notes that users can read in Study Mode. Notes with Premium flag are only visible to premium users.
      </p>

      {result && (
        <div style={{
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          background: result.includes('✅') ? '#e8f5e9' : '#ffebee',
          color: result.includes('✅') ? '#2e7d32' : '#c62828'
        }}>
          {result}
        </div>
      )}

      {/* Form */}
      <div style={{
        background: darkMode ? '#1a1a2e' : '#f8f9fa',
        padding: 20,
        borderRadius: 12,
        marginBottom: 24,
        border: `1px solid ${darkMode ? '#444' : '#ddd'}`
      }}>
        <h4 style={{ color: headingColor, marginBottom: 16, fontSize: 16 }}>
          {editingId ? '✏️ Edit Note' : '➕ Create New Note'}
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 4, color: textColor }}>Title *</label>
            <input
              type="text"
              placeholder="Note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#2d2d3d' : 'white', color: darkMode ? '#eee' : '#333', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 4, color: textColor }}>Category</label>
            <input
              type="text"
              placeholder="e.g., Fundamentals, Pharmacology"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#2d2d3d' : 'white', color: darkMode ? '#eee' : '#333', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 4, color: textColor }}>Description</label>
          <input
            type="text"
            placeholder="Brief description of the note"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#2d2d3d' : 'white', color: darkMode ? '#eee' : '#333', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 4, color: textColor }}>Content *</label>
          <textarea
            placeholder="Full note content. Users will read this in Study Mode."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="6"
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#2d2d3d' : 'white', color: darkMode ? '#eee' : '#333', resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 4, color: textColor }}>Read Time (min)</label>
            <input
              type="number"
              placeholder="5"
              value={estimatedReadTime}
              onChange={(e) => setEstimatedReadTime(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#2d2d3d' : 'white', color: darkMode ? '#eee' : '#333', boxSizing: 'border-box' }}
              min="1"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 4, color: textColor }}>Order</label>
            <input
              type="number"
              placeholder="0"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#2d2d3d' : 'white', color: darkMode ? '#eee' : '#333', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 'bold', color: textColor, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
              />
              ⭐ Premium
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 'bold', color: textColor, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Active
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              background: '#1e3c72',
              color: 'white',
              padding: '10px 24px',
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Saving...' : (editingId ? 'Update Note' : 'Create Note')}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              style={{
                background: '#6c757d',
                color: 'white',
                padding: '10px 24px',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* Notes List */}
      {loading && !notes.length ? (
        <p style={{ color: secondaryText }}>Loading notes...</p>
      ) : notes.length === 0 ? (
        <p style={{ color: secondaryText }}>No study notes created yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
          {notes.map(note => (
            <div key={note._id} style={{
              background: darkMode ? '#1a1a2e' : 'white',
              padding: 18,
              borderRadius: 12,
              border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
              opacity: note.active ? 1 : 0.6,
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h4 style={{ color: headingColor, margin: 0, fontSize: 16 }}>{note.title}</h4>
                <div style={{ display: 'flex', gap: 6 }}>
                  {note.isPremium && (
                    <span style={{ background: '#ff9800', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 'bold' }}>⭐</span>
                  )}
                  <span style={{
                    background: note.active ? '#4caf50' : '#dc3545',
                    color: 'white',
                    padding: '2px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 'bold'
                  }}>
                    {note.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <p style={{ color: secondaryText, fontSize: 13, marginBottom: 4 }}>{note.description}</p>
              <p style={{ color: secondaryText, fontSize: 12, marginBottom: 8 }}>
                📂 {note.category || 'General'} • ⏱️ {note.estimatedReadTime || 5} min • 📊 {note.order || 0}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleEdit(note)}
                  style={{ background: '#ffc107', color: '#333', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(note._id, note.active)}
                  style={{
                    background: note.active ? '#dc3545' : '#28a745',
                    color: 'white',
                    padding: '4px 12px',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 12
                  }}
                >
                  {note.active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDelete(note._id)}
                  style={{ background: '#dc3545', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};