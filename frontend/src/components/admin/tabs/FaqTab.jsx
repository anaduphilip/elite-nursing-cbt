// src/components/admin/tabs/FaqTab.jsx
import React from 'react';

export const FaqTab = ({
  faqs,
  faqLoading,
  faqQuestion,
  setFaqQuestion,
  faqAnswer,
  setFaqAnswer,
  faqCategory,
  setFaqCategory,
  faqOrder,
  setFaqOrder,
  faqActive,
  setFaqActive,
  editingFaqId,
  faqResult,
  handleSaveFaq,
  handleDeleteFaq,
  editFaq,
  darkMode,
  headingColor,
  secondaryText,
  textColor,
  cardBg
}) => {
  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ color: headingColor, marginBottom: 20 }}>📄 FAQ</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        <input placeholder="Question" value={faqQuestion} onChange={(e) => setFaqQuestion(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
        <textarea placeholder="Answer" value={faqAnswer} onChange={(e) => setFaqAnswer(e.target.value)} rows="3" style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
        <input placeholder="Category (e.g. Payments)" value={faqCategory} onChange={(e) => setFaqCategory(e.target.value)} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor }} />
        <input type="number" placeholder="Order" value={faqOrder} onChange={(e) => setFaqOrder(parseInt(e.target.value))} style={{ padding: 8, border: '1px solid #ccc', borderRadius: 6, background: cardBg, color: textColor, width: 80 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={faqActive} onChange={(e) => setFaqActive(e.target.checked)} /> Active
        </label>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button onClick={handleSaveFaq} disabled={faqLoading} style={{ background: '#1e3c72', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>{editingFaqId ? 'Update' : 'Add'}</button>
        {editingFaqId && <button onClick={() => { setEditingFaqId(null); setFaqQuestion(''); setFaqAnswer(''); setFaqCategory('General'); setFaqOrder(0); setFaqActive(true); }} style={{ background: '#6c757d', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>}
      </div>
      {faqResult && <p style={{ marginBottom: 16, color: faqResult.includes('✅') ? '#2e7d32' : '#dc3545' }}>{faqResult}</p>}
      {faqLoading ? <p>Loading...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {faqs.map(f => (
            <div key={f._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: darkMode ? '#2d2d3d' : '#f8f9fa', padding: '12px 16px', borderRadius: 8, border: '1px solid ' + (darkMode ? '#444' : '#eee') }}>
              <div><strong>{f.question}</strong> - <span style={{ color: secondaryText }}>{f.category}</span> {f.active ? '✅' : '❌'}</div>
              <div>
                <button onClick={() => editFaq(f)} style={{ background: '#ffc107', color: '#333', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 8 }}>Edit</button>
                <button onClick={() => handleDeleteFaq(f._id)} style={{ background: '#dc3545', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};