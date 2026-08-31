// src/components/admin/tabs/RatingsTab.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RatingsTab = ({ token, darkMode, headingColor, textColor, secondaryText, cardBg }) => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    stars: '',
    isMarketing: '',
    isDeleted: '',
    search: '',
    sortBy: 'latest'
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRating, setSelectedRating] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ stars: '', feedback: '', name: '' });

  // Bulk Marketing generator
  const [bulkCount, setBulkCount] = useState(100);
  const [bulkStars, setBulkStars] = useState(5);
  const [bulkNamePrefix, setBulkNamePrefix] = useState('User');
  const [bulkFeedback, setBulkFeedback] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkRestoring, setBulkRestoring] = useState(false);
  const [bulkPermanentDeleting, setBulkPermanentDeleting] = useState(false);

  // Modals
  const [showDeleteAllMarketingModal, setShowDeleteAllMarketingModal] = useState(false);
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);

  // Reaction inputs
  const [newReactionEmoji, setNewReactionEmoji] = useState('');
  const [newReactionCount, setNewReactionCount] = useState(1);

  // ----- Fetch ratings with search and sort -----
  const fetchRatings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(filter.stars && { stars: filter.stars }),
        ...(filter.isMarketing !== '' && { isMarketing: filter.isMarketing }),
        ...(filter.isDeleted !== '' && { isDeleted: filter.isDeleted }),
        ...(filter.search && { search: filter.search }),
        sort: filter.sortBy
      });
      const res = await axios.get(`/api/admin/ratings?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setRatings(res.data.ratings);
        setTotalPages(res.data.pagination.pages);
        setSelectedIds([]);
        setSelectAll(false);
      }
    } catch (err) {
      console.error('Fetch ratings error:', err);
      alert('Failed to fetch ratings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [page, filter]);

  // ----- Single actions (unchanged) -----
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this rating?')) return;
    try {
      await axios.delete(`/api/admin/ratings/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRatings();
    } catch (err) {
      alert('Failed to delete.');
    }
  };

  const handleReply = async (id) => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await axios.post(
        `/api/admin/ratings/${id}/reply`,
        { replyText: replyText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReplyText('');
      setSelectedRating(null);
      fetchRatings();
    } catch (err) {
      alert('Failed to reply.');
    } finally {
      setReplying(false);
    }
  };

  const handleUpdate = async (id) => {
    try {
      await axios.put(
        `/api/admin/ratings/${id}`,
        {
          stars: parseInt(editData.stars),
          feedback: editData.feedback,
          name: editData.name
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditMode(false);
      setSelectedRating(null);
      fetchRatings();
    } catch (err) {
      alert('Failed to update.');
    }
  };

  // ----- Bulk Marketing generator -----
  const handleBulkMarketing = async () => {
    if (!window.confirm(`Add ${bulkCount} Marketing ${bulkStars}-star ratings?`)) return;
    setBulkLoading(true);
    try {
      await axios.post(
        '/api/admin/ratings/bulk',
        {
          count: bulkCount,
          stars: bulkStars,
          namePrefix: bulkNamePrefix,
          feedback: bulkFeedback
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`${bulkCount} Marketing ratings added.`);
      fetchRatings();
    } catch (err) {
      alert('Failed to add bulk ratings.');
    } finally {
      setBulkLoading(false);
    }
  };

  // ----- Bulk selection helpers -----
  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(ratings.map(r => r._id));
    }
    setSelectAll(!selectAll);
  };

  // ----- Bulk actions for active view -----
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one rating to delete.');
      return;
    }
    if (!window.confirm(`Delete ${selectedIds.length} selected ratings? They can be restored later.`)) return;
    setBulkDeleting(true);
    try {
      await axios.delete('/api/admin/ratings/bulk', {
        data: { ids: selectedIds },
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedIds([]);
      setSelectAll(false);
      fetchRatings();
      alert(`${selectedIds.length} ratings deleted successfully.`);
    } catch (err) {
      alert('Failed to delete ratings.');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDeleteAllMarketing = async () => {
    setBulkDeleting(true);
    try {
      await axios.delete('/api/admin/ratings/bulk', {
        data: { deleteAllMarketing: true },
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowDeleteAllMarketingModal(false);
      fetchRatings();
      alert('All Marketing ratings deleted successfully.');
    } catch (err) {
      alert('Failed to delete Marketing ratings.');
    } finally {
      setBulkDeleting(false);
    }
  };

  // ----- Bulk actions for deleted view -----
  const handleBulkRestore = async () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one rating to restore.');
      return;
    }
    if (!window.confirm(`Restore ${selectedIds.length} selected ratings?`)) return;
    setBulkRestoring(true);
    try {
      await axios.put('/api/admin/ratings/bulk/restore', {
        ids: selectedIds
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedIds([]);
      setSelectAll(false);
      fetchRatings();
      alert(`${selectedIds.length} ratings restored successfully.`);
    } catch (err) {
      alert('Failed to restore ratings.');
    } finally {
      setBulkRestoring(false);
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one rating to permanently delete.');
      return;
    }
    if (!window.confirm(`⚠️ PERMANENTLY DELETE ${selectedIds.length} selected ratings? This cannot be undone!`)) return;
    setBulkPermanentDeleting(true);
    try {
      await axios.delete('/api/admin/ratings/bulk/permanent', {
        data: { ids: selectedIds },
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedIds([]);
      setSelectAll(false);
      fetchRatings();
      alert(`${selectedIds.length} ratings permanently deleted.`);
    } catch (err) {
      alert('Failed to permanently delete ratings.');
    } finally {
      setBulkPermanentDeleting(false);
    }
  };

  const handleRestoreAll = async () => {
    if (!window.confirm('Restore ALL deleted ratings?')) return;
    setBulkRestoring(true);
    try {
      await axios.put('/api/admin/ratings/bulk/restore', {
        restoreAll: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRatings();
      alert('All deleted ratings restored.');
    } catch (err) {
      alert('Failed to restore.');
    } finally {
      setBulkRestoring(false);
    }
  };

  const handleDeleteAllDeleted = async () => {
    setBulkPermanentDeleting(true);
    try {
      await axios.delete('/api/admin/ratings/bulk/permanent', {
        data: { deleteAllDeleted: true },
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowPermanentDeleteModal(false);
      fetchRatings();
      alert('All deleted ratings permanently removed.');
    } catch (err) {
      alert('Failed to permanently delete.');
    } finally {
      setBulkPermanentDeleting(false);
    }
  };

  // ===== Add marketing reaction =====
  const handleAddReaction = async () => {
    if (!selectedRating) return;
    if (!newReactionEmoji || newReactionCount < 1) {
      alert('Please enter a valid emoji and count.');
      return;
    }
    try {
      await axios.post(
        `/api/admin/ratings/${selectedRating._id}/reactions`,
        {
          emoji: newReactionEmoji,
          count: newReactionCount,
          replyId: null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewReactionEmoji('');
      setNewReactionCount(1);
      fetchRatings();
      alert('Reaction added successfully.');
    } catch (err) {
      alert('Failed to add reaction.');
    }
  };

  const isDeletedView = filter.isDeleted === 'true';

  // ----- Handle search input (debounced) -----
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFilter(prev => ({ ...prev, search: value }));
    setPage(1); // Reset to first page on search
  };

  const handleSortChange = (e) => {
    setFilter(prev => ({ ...prev, sortBy: e.target.value }));
    setPage(1);
  };

  return (
    <div>
      <h3 style={{ color: headingColor }}>Ratings & Feedback</h3>

      {/* Filters + Search + Sort */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <select
          value={filter.stars}
          onChange={(e) => setFilter({ ...filter, stars: e.target.value })}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: cardBg, color: textColor }}
        >
          <option value="">All Stars</option>
          {[1,2,3,4,5].map(s => <option key={s} value={s}>{s}★</option>)}
        </select>
        <select
          value={filter.isMarketing}
          onChange={(e) => setFilter({ ...filter, isMarketing: e.target.value })}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: cardBg, color: textColor }}
        >
          <option value="">All Types</option>
          <option value="true">Marketing</option>
          <option value="false">Real</option>
        </select>
        <select
          value={filter.isDeleted}
          onChange={(e) => setFilter({ ...filter, isDeleted: e.target.value })}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: cardBg, color: textColor }}
        >
          <option value="">All Status</option>
          <option value="false">Active</option>
          <option value="true">Deleted</option>
        </select>

        {/* Search Input */}
        <input
          type="text"
          placeholder="🔍 Search by name or feedback..."
          value={filter.search}
          onChange={handleSearchChange}
          style={{
            flex: 1,
            minWidth: 200,
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #ccc',
            background: cardBg,
            color: textColor,
            outline: 'none'
          }}
        />

        {/* Sort Dropdown */}
        <select
          value={filter.sortBy}
          onChange={handleSortChange}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: cardBg, color: textColor }}
        >
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
          <option value="highest">Highest Star</option>
          <option value="lowest">Lowest Star</option>
        </select>

        <button onClick={fetchRatings} style={{ padding: '8px 16px', background: '#1e3c72', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      {/* Bulk Marketing Generator (only show in active view) */}
      {!isDeletedView && (
        <div style={{ padding: 16, background: darkMode ? '#1a1a2e' : '#f8f9fa', borderRadius: 8, marginBottom: 16 }}>
          <h4 style={{ color: headingColor, marginBottom: 8 }}>Add Marketing Ratings (Marketing)</h4>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="number"
              min="1"
              max="10000"
              value={bulkCount}
              onChange={(e) => setBulkCount(parseInt(e.target.value) || 1)}
              style={{ width: 100, padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', background: cardBg, color: textColor }}
            />
            <select
              value={bulkStars}
              onChange={(e) => setBulkStars(parseInt(e.target.value))}
              style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', background: cardBg, color: textColor }}
            >
              {[1,2,3,4,5].map(s => <option key={s} value={s}>{s}★</option>)}
            </select>
            <input
              type="text"
              placeholder="Name prefix"
              value={bulkNamePrefix}
              onChange={(e) => setBulkNamePrefix(e.target.value)}
              style={{ width: 150, padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', background: cardBg, color: textColor }}
            />
            <input
              type="text"
              placeholder="Feedback (optional)"
              value={bulkFeedback}
              onChange={(e) => setBulkFeedback(e.target.value)}
              style={{ flex: 1, minWidth: 200, padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', background: cardBg, color: textColor }}
            />
            <button
              onClick={handleBulkMarketing}
              disabled={bulkLoading}
              style={{ padding: '8px 20px', background: '#ff9800', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            >
              {bulkLoading ? 'Adding...' : 'Add Bulk'}
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      <div style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '12px 16px',
        background: darkMode ? '#1a1a2e' : '#f8f9fa',
        borderRadius: 8,
        marginBottom: 16
      }}>
        <span style={{ color: textColor, fontWeight: 'bold', fontSize: 14 }}>
          Bulk Actions:
        </span>
        <button
          onClick={toggleSelectAll}
          style={{
            padding: '6px 16px',
            background: selectAll ? '#dc3545' : '#1e3c72',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          {selectAll ? 'Deselect All' : 'Select All'}
        </button>
        <span style={{ color: secondaryText, fontSize: 13 }}>
          {selectedIds.length} selected
        </span>

        {isDeletedView ? (
          // ----- Deleted view actions -----
          <>
            <button
              onClick={handleBulkRestore}
              disabled={selectedIds.length === 0 || bulkRestoring}
              style={{
                padding: '6px 20px',
                background: selectedIds.length === 0 || bulkRestoring ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: selectedIds.length === 0 || bulkRestoring ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 'bold'
              }}
            >
              {bulkRestoring ? 'Restoring...' : `Restore Selected (${selectedIds.length})`}
            </button>
            <button
              onClick={handleBulkPermanentDelete}
              disabled={selectedIds.length === 0 || bulkPermanentDeleting}
              style={{
                padding: '6px 20px',
                background: selectedIds.length === 0 || bulkPermanentDeleting ? '#ccc' : '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: selectedIds.length === 0 || bulkPermanentDeleting ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 'bold'
              }}
            >
              {bulkPermanentDeleting ? 'Deleting...' : `Permanently Delete (${selectedIds.length})`}
            </button>
            <button
              onClick={handleRestoreAll}
              disabled={bulkRestoring}
              style={{
                padding: '6px 20px',
                background: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 'bold'
              }}
            >
              Restore All
            </button>
            <button
              onClick={() => setShowPermanentDeleteModal(true)}
              style={{
                padding: '6px 20px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 'bold'
              }}
            >
              Delete All Permanently
            </button>
          </>
        ) : (
          // ----- Active view actions -----
          <>
            <button
              onClick={handleBulkDelete}
              disabled={selectedIds.length === 0 || bulkDeleting}
              style={{
                padding: '6px 20px',
                background: selectedIds.length === 0 || bulkDeleting ? '#ccc' : '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: selectedIds.length === 0 || bulkDeleting ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 'bold'
              }}
            >
              {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}
            </button>
            <button
              onClick={() => setShowDeleteAllMarketingModal(true)}
              style={{
                padding: '6px 20px',
                background: '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 'bold'
              }}
            >
              Delete All Marketing
            </button>
          </>
        )}
      </div>

      {/* Ratings Table */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${darkMode ? '#444' : '#ddd'}` }}>
                <th style={{ textAlign: 'center', padding: '8px', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', width: 16, height: 16 }}
                  />
                </th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Stars</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Feedback</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Date</th>
                <th style={{ textAlign: 'center', padding: '8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ratings.map(r => (
                <tr key={r._id} style={{ borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}` }}>
                  <td style={{ textAlign: 'center', padding: '8px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(r._id)}
                      onChange={() => toggleSelect(r._id)}
                      style={{ cursor: 'pointer', width: 16, height: 16 }}
                    />
                  </td>
                  <td style={{ padding: '8px', color: textColor }}>{r.name || 'N/A'}</td>
                  <td style={{ padding: '8px', color: '#FFD700' }}>{'★'.repeat(r.stars)}</td>
                  <td style={{ padding: '8px', color: textColor }}>{r.feedback?.slice(0, 50) || '-'}</td>
                  <td style={{ padding: '8px' }}>{r.isMarketing ? 'Marketing' : 'Real'}</td>
                  <td style={{ padding: '8px', color: secondaryText, fontSize: 12 }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>
                    <button
                      onClick={() => { setSelectedRating(r); setEditData({ stars: r.stars, feedback: r.feedback, name: r.name }); setEditMode(false); }}
                      style={{ background: '#17a2b8', color: 'white', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', marginRight: 4 }}
                    >
                      View
                    </button>
                    <button
                      onClick={() => { setEditMode(true); setSelectedRating(r); setEditData({ stars: r.stars, feedback: r.feedback, name: r.name }); }}
                      style={{ background: '#ffc107', color: 'black', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', marginRight: 4 }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(r._id)}
                      style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}
                    >
                      {r.isDeleted ? 'Restore' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p-1))}
              disabled={page === 1}
              style={{ padding: '6px 12px', background: page === 1 ? '#ccc' : '#1e3c72', color: 'white', border: 'none', borderRadius: 4, cursor: page === 1 ? 'default' : 'pointer' }}
            >
              Prev
            </button>
            <span style={{ color: textColor }}>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p+1))}
              disabled={page === totalPages}
              style={{ padding: '6px 12px', background: page === totalPages ? '#ccc' : '#1e3c72', color: 'white', border: 'none', borderRadius: 4, cursor: page === totalPages ? 'default' : 'pointer' }}
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* ----- Detail Modal ----- */}
      {selectedRating && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: 20
        }}>
          <div style={{ background: cardBg, borderRadius: 20, padding: 28, maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h4 style={{ color: headingColor, marginBottom: 16 }}>Rating Details</h4>
            {editMode ? (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', color: textColor, fontWeight: 'bold' }}>Stars</label>
                  <input type="number" min="1" max="5" value={editData.stars} onChange={(e) => setEditData({ ...editData, stars: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #ccc', background: cardBg, color: textColor }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', color: textColor, fontWeight: 'bold' }}>Feedback</label>
                  <textarea value={editData.feedback} onChange={(e) => setEditData({ ...editData, feedback: e.target.value })} rows="3" style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #ccc', background: cardBg, color: textColor }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', color: textColor, fontWeight: 'bold' }}>Name</label>
                  <input type="text" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #ccc', background: cardBg, color: textColor }} />
                </div>
                <button onClick={() => handleUpdate(selectedRating._id)} style={{ background: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 4, cursor: 'pointer', marginRight: 8 }}>Save</button>
                <button onClick={() => { setEditMode(false); }} style={{ background: '#6c757d', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              </div>
            ) : (
              <>
                <p><strong>Name:</strong> {selectedRating.name}</p>
                <p><strong>Stars:</strong> {'★'.repeat(selectedRating.stars)}</p>
                <p><strong>Feedback:</strong> {selectedRating.feedback || 'None'}</p>
                <p><strong>Type:</strong> {selectedRating.isMarketing ? 'Marketing' : 'Real'}</p>
                <p><strong>Date:</strong> {new Date(selectedRating.createdAt).toLocaleString()}</p>

                <div style={{ marginTop: 16 }}>
                  <h5 style={{ color: headingColor }}>Admin Reply</h5>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows="3"
                    placeholder="Type your reply..."
                    style={{ width: '100%', padding: '8px', borderRadius: 4, border: '1px solid #ccc', background: cardBg, color: textColor }}
                  />
                  <button
                    onClick={() => handleReply(selectedRating._id)}
                    disabled={replying || !replyText.trim()}
                    style={{ marginTop: 8, background: '#1e3c72', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}
                  >
                    {replying ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>

                <div style={{ marginTop: 16, borderTop: `1px solid ${darkMode ? '#444' : '#ddd'}`, paddingTop: 16 }}>
                  <h5 style={{ color: headingColor }}>Add Marketing Reactions</h5>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Emoji (e.g., 👍)"
                      value={newReactionEmoji}
                      onChange={(e) => setNewReactionEmoji(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', background: cardBg, color: textColor, width: 80 }}
                    />
                    <input
                      type="number"
                      placeholder="Count"
                      value={newReactionCount}
                      onChange={(e) => setNewReactionCount(parseInt(e.target.value) || 1)}
                      style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #ccc', background: cardBg, color: textColor, width: 80 }}
                    />
                    <button
                      onClick={handleAddReaction}
                      disabled={!newReactionEmoji || newReactionCount < 1}
                      style={{ padding: '6px 16px', background: '#28a745', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                      Add Reaction
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: secondaryText, marginTop: 4 }}>
                    This reaction will be added as a marketing reaction (no user linked).
                  </p>
                </div>

                <button onClick={() => { setSelectedRating(null); setReplyText(''); setNewReactionEmoji(''); setNewReactionCount(1); }} style={{ marginTop: 16, background: '#6c757d', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}>Close</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ----- Delete All Marketing Confirmation Modal ----- */}
      {showDeleteAllMarketingModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: 20
        }}>
          <div style={{
            background: cardBg,
            borderRadius: 20,
            padding: 28,
            maxWidth: 450,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ color: headingColor, marginBottom: 12 }}>Delete All Marketing Ratings?</h3>
            <p style={{ color: secondaryText, marginBottom: 20 }}>
              This will permanently delete <strong>all Marketing ratings</strong> and their replies.
              Real user ratings will be kept.
              <br /><br />
              <strong style={{ color: '#dc3545' }}>This action cannot be undone!</strong>
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowDeleteAllMarketingModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'transparent',
                  border: `1px solid ${darkMode ? '#555' : '#ccc'}`,
                  borderRadius: 8,
                  color: secondaryText,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllMarketing}
                disabled={bulkDeleting}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {bulkDeleting ? 'Deleting...' : 'Yes, Delete All Marketing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----- Permanent Delete All Confirmation Modal ----- */}
      {showPermanentDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: 20
        }}>
          <div style={{
            background: cardBg,
            borderRadius: 20,
            padding: 28,
            maxWidth: 450,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💀</div>
            <h3 style={{ color: headingColor, marginBottom: 12 }}>Permanently Delete All?</h3>
            <p style={{ color: secondaryText, marginBottom: 20 }}>
              This will <strong style={{ color: '#dc3545' }}>permanently delete</strong> all soft-deleted ratings and their replies.
              <br /><br />
              <strong style={{ color: '#dc3545' }}>This action cannot be undone!</strong>
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowPermanentDeleteModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'transparent',
                  border: `1px solid ${darkMode ? '#555' : '#ccc'}`,
                  borderRadius: 8,
                  color: secondaryText,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllDeleted}
                disabled={bulkPermanentDeleting}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {bulkPermanentDeleting ? 'Deleting...' : 'Yes, Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RatingsTab;