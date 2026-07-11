// src/components/admin/tabs/CategoriesTab.jsx
import React from 'react';

export const CategoriesTab = ({
  categories,
  catLoading,
  catName,
  setCatName,
  catIcon,
  setCatIcon,
  catDescription,
  setCatDescription,
  catOrder,
  setCatOrder,
  catActive,
  setCatActive,
  editingCatId,
  catResult,
  handleSaveCategory,
  handleDeleteCategory,
  editCategory,
  darkMode,
  headingColor,
  secondaryText,
  textColor,
  cardBg
}) => {
  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ color: headingColor, marginBottom: 20 }}>📂 Categories</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <input placeholder="Category name" value={catName} onChange={(e) => setCatName(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
        <input placeholder="Icon (emoji)" value={catIcon} onChange={(e) => setCatIcon(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor, width: 80 }} />
        <input placeholder="Description" value={catDescription} onChange={(e) => setCatDescription(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
        <input type="number" placeholder="Order" value={catOrder} onChange={(e) => setCatOrder(parseInt(e.target.value))} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor, width: 80 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={catActive} onChange={(e) => setCatActive(e.target.checked)} /> Active
        </label>
        <button onClick={handleSaveCategory} disabled={catLoading} style={{ background: '#1e3c72', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>{editingCatId ? 'Update' : 'Add'}</button>
        {editingCatId && <button onClick={() => { setEditingCatId(null); setCatName(''); setCatIcon('📚'); setCatDescription(''); setCatOrder(0); setCatActive(true); }} style={{ background: '#6c757d', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>}
      </div>
      {catResult && <p style={{ marginBottom: 16, color: catResult.includes('✅') ? '#2e7d32' : '#dc3545' }}>{catResult}</p>}
      {catLoading ? <p>Loading...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {categories.map(c => (
            <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: '12px 16px', borderRadius: 8, border: '1px solid ' + (darkMode ? '#444' : '#eee') }}>
              <div><span style={{ fontSize: 24 }}>{c.icon}</span> <strong>{c.name}</strong> {c.active ? '✅' : '❌'} <span style={{ color: secondaryText, fontSize: 12 }}>({c.slug})</span></div>
              <div>
                <button onClick={() => editCategory(c)} style={{ background: '#ffc107', color: '#333', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 8 }}>Edit</button>
                <button onClick={() => handleDeleteCategory(c._id)} style={{ background: '#dc3545', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Deactivate</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};