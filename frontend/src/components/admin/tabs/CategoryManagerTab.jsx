// src/components/admin/tabs/CategoryManagerTab.jsx
import React from 'react';

export const CategoryManagerTab = ({
  categoryManagerCategory,
  setCategoryManagerCategory,
  categoryManagerTitle,
  setCategoryManagerTitle,
  categoryManagerTopic,
  setCategoryManagerTopic,
  categoryManagerQuestions,
  setCategoryManagerQuestions,
  categoryManagerBatch,
  setCategoryManagerBatch,
  categoryManagerSingleQ,
  setCategoryManagerSingleQ,
  categoryManagerSingleOpts,
  setCategoryManagerSingleOpts,
  categoryManagerSingleCorrect,
  setCategoryManagerSingleCorrect,
  categoryManagerSearch,
  setCategoryManagerSearch,
  categoryManagerQuizzes,
  setCategoryManagerQuizzes,
  categoryManagerLoading,
  categoryManagerResult,
  setCategoryManagerResult,
  categoryManagerEditingIdx,
  setCategoryManagerEditingIdx,
  categoryManagerExistingQuizId,
  setCategoryManagerExistingQuizId,
  handleCategoryManagerBatchImport,
  handleCategoryManagerAddSingle,
  handleCategoryManagerEditQuestion,
  handleCategoryManagerDeleteQuestion,
  handleCategoryManagerSaveQuiz,
  handleCategoryManagerEditQuiz,
  handleCategoryManagerDeleteQuiz,
  handleClearCategoryManager,
  categories,
  darkMode,
  headingColor,
  secondaryText,
  textColor,
  cardBg
}) => {
  // Shared input style
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: `1px solid ${darkMode ? '#444' : '#ccc'}`,
    borderRadius: 8,
    fontSize: 14,
    background: cardBg,
    color: textColor,
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s ease'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: 6,
    color: textColor,
    fontWeight: 'bold',
    fontSize: 14
  };

  return (
    <div style={{ padding: '16px 20px', maxWidth: '100%', boxSizing: 'border-box' }}>
      <h3 style={{ color: headingColor, marginBottom: 20 }}>📂 Category Question Manager</h3>
      <p style={{ color: secondaryText, marginBottom: 16, fontSize: 14, lineHeight: 1.6 }}>
        Create a new quiz under any category with your own questions. The first 20 questions will be available in Free Mode; all questions will be available in Premium Mode.
        <br/><br/>
        <strong>Title:</strong> This becomes the quiz title (e.g., "CARDIOVASCULAR NURSING - Questions 1 to 20").<br/>
        <strong>Topic:</strong> This becomes the topic name (e.g., "CARDIOVASCULAR NURSING").<br/>
        <em>If a quiz with the same Title already exists under this Category, new questions will be appended to it.</em>
      </p>

      {/* Search existing quizzes */}
      <div style={{ marginBottom: 20 }}>
        <label style={labelStyle}>Search Existing Quizzes</label>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by title or category..."
            value={categoryManagerSearch}
            onChange={(e) => setCategoryManagerSearch(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: '180px' }}
          />
        </div>
        <div style={{
          marginTop: 10,
          maxHeight: 200,
          overflowY: 'auto',
          background: darkMode ? '#1a1a2e' : '#f8f9fa',
          borderRadius: 8,
          border: `1px solid ${darkMode ? '#444' : '#ddd'}`
        }}>
          {categoryManagerQuizzes
            .filter(q => {
              const search = categoryManagerSearch.toLowerCase();
              return q.title.toLowerCase().includes(search) || q.category.toLowerCase().includes(search);
            })
            .slice(0, 20)
            .map(q => (
              <div key={q._id} style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderBottom: `1px solid ${darkMode ? '#444' : '#eee'}`,
                gap: 6
              }}>
                <span style={{ color: textColor, fontSize: 14, wordBreak: 'break-word' }}>
                  {q.title} <span style={{ color: secondaryText, fontSize: 12 }}>({q.category})</span>
                </span>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleCategoryManagerEditQuiz(q._id)}
                    style={{ background: '#ffc107', color: '#333', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                  >
                    Load
                  </button>
                  <button
                    onClick={() => handleCategoryManagerDeleteQuiz(q._id)}
                    style={{ background: '#dc3545', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          {categoryManagerQuizzes.length === 0 && <p style={{ padding: 12, color: secondaryText }}>No quizzes found.</p>}
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${darkMode ? '#444' : '#ddd'}`, paddingTop: 20, marginTop: 10 }}>
        <h4 style={{ color: headingColor, marginBottom: 16 }}>Create / Add Questions</h4>

        {/* Category, Title, Topic – Responsive grid */}
        <div className="cm-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Category <span style={{ color: '#dc3545' }}>*</span></label>
            <select
              value={categoryManagerCategory}
              onChange={(e) => setCategoryManagerCategory(e.target.value)}
              style={inputStyle}
            >
              <option value="">-- Select a category --</option>
              {categories.filter(c => c.active).map(c => (
                <option key={c._id} value={c.slug}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Title <span style={{ color: '#dc3545' }}>*</span></label>
            <input
              type="text"
              placeholder="e.g., CARDIOVASCULAR NURSING - Questions 1 to 20"
              value={categoryManagerTitle}
              onChange={(e) => setCategoryManagerTitle(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Topic <span style={{ color: '#dc3545' }}>*</span></label>
            <input
              type="text"
              placeholder="e.g., CARDIOVASCULAR NURSING"
              value={categoryManagerTopic}
              onChange={(e) => setCategoryManagerTopic(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Batch Import */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Batch Import Questions</label>
          <textarea
            placeholder="Paste multiple questions at once...&#10;Q1. Question text? (a) Option (b) Option (c) Option (d) Option&#10;Answer: a"
            value={categoryManagerBatch}
            onChange={(e) => setCategoryManagerBatch(e.target.value)}
            rows="5"
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', width: '100%' }}
          />
          <button
            onClick={handleCategoryManagerBatchImport}
            style={{
              marginTop: 8,
              background: '#17a2b8',
              color: 'white',
              padding: '8px 20px',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 13,
              width: 'auto',
              minWidth: '120px'
            }}
          >
            Import Batch
          </button>
        </div>

        {/* Add Single Question */}
        <div style={{ borderTop: `1px solid ${darkMode ? '#444' : '#ddd'}`, paddingTop: 16, marginBottom: 16 }}>
          <h5 style={{ color: headingColor, marginBottom: 10, fontSize: 15 }}>Add Single Question</h5>
          <div style={{ marginBottom: 10 }}>
            <input
              type="text"
              placeholder="Question text"
              value={categoryManagerSingleQ}
              onChange={(e) => setCategoryManagerSingleQ(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div className="cm-grid-options" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 10 }}>
            {categoryManagerSingleOpts.map((opt, idx) => (
              <input
                key={idx}
                type="text"
                placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                value={opt}
                onChange={(e) => {
                  const newOpts = [...categoryManagerSingleOpts];
                  newOpts[idx] = e.target.value;
                  setCategoryManagerSingleOpts(newOpts);
                }}
                style={inputStyle}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 13, fontWeight: 'bold', color: textColor }}>Correct Answer:</label>
            <select
              value={categoryManagerSingleCorrect}
              onChange={(e) => setCategoryManagerSingleCorrect(parseInt(e.target.value))}
              style={{ ...inputStyle, width: 'auto', minWidth: '100px' }}
            >
              {categoryManagerSingleOpts.map((_, idx) => (
                <option key={idx} value={idx}>Option {String.fromCharCode(65 + idx)}</option>
              ))}
            </select>
            <button
              onClick={handleCategoryManagerAddSingle}
              style={{
                background: '#2E7D64',
                color: 'white',
                padding: '6px 16px',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: 13,
                minWidth: '80px'
              }}
            >
              {categoryManagerEditingIdx !== null ? 'Update' : '➕ Add'}
            </button>
            {categoryManagerEditingIdx !== null && (
              <button
                onClick={() => { setCategoryManagerEditingIdx(null); setCategoryManagerSingleQ(''); setCategoryManagerSingleOpts(['', '', '', '']); setCategoryManagerSingleCorrect(0); }}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  padding: '6px 12px',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Question List */}
        {categoryManagerQuestions.length > 0 && (
          <div style={{ marginBottom: 16, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
            <h5 style={{ color: headingColor, marginBottom: 10, fontSize: 15 }}>Questions ({categoryManagerQuestions.length})</h5>
            {categoryManagerQuestions.map((q, idx) => (
              <div key={idx} style={{
                background: darkMode ? '#2d2d3d' : 'white',
                padding: '10px 12px',
                borderRadius: 8,
                marginBottom: 8,
                border: `1px solid ${darkMode ? '#444' : '#eee'}`,
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8
              }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ color: headingColor, fontSize: 14 }}>Q{idx+1}:</strong>
                    <span style={{ color: textColor, fontSize: 14, wordBreak: 'break-word' }}>{q.questionText}</span>
                  </div>
                  <div style={{ fontSize: 12, color: secondaryText, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {q.options.map((opt, i) => (
                      <span key={i} style={{ background: darkMode ? '#333' : '#f0f0f0', padding: '2px 8px', borderRadius: 4 }}>
                        {String.fromCharCode(65 + i)}: {opt}
                      </span>
                    ))}
                    <span style={{ color: '#2E7D64', fontWeight: 'bold' }}>✓ Answer: {String.fromCharCode(65 + q.correctAnswer)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleCategoryManagerEditQuestion(idx)}
                    style={{ background: '#ffc107', color: '#333', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleCategoryManagerDeleteQuestion(idx)}
                    style={{ background: '#dc3545', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Save / Clear Buttons */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
          <button
            onClick={handleCategoryManagerSaveQuiz}
            disabled={categoryManagerLoading || categoryManagerQuestions.length === 0}
            style={{
              flex: 1,
              minWidth: '150px',
              background: '#28a745',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: 8,
              cursor: (categoryManagerLoading || categoryManagerQuestions.length === 0) ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: 16,
              opacity: (categoryManagerLoading || categoryManagerQuestions.length === 0) ? 0.7 : 1
            }}
          >
            {categoryManagerLoading ? 'Saving...' : '📤 Save / Append Questions'}
          </button>
          <button
            onClick={handleClearCategoryManager}
            style={{
              background: '#6c757d',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: 16,
              minWidth: '100px'
            }}
          >
            Clear
          </button>
        </div>
        {categoryManagerResult && (
          <p style={{ marginTop: 16, color: categoryManagerResult.includes('✅') ? '#2e7d32' : '#dc3545', fontSize: 14 }}>
            {categoryManagerResult}
          </p>
        )}
      </div>

      {/* ===== RESPONSIVE MEDIA QUERIES ===== */}
      <style>{`
        @media (max-width: 600px) {
          .cm-grid-3 {
            grid-template-columns: 1fr !important;
          }
          .cm-grid-options {
            grid-template-columns: 1fr 1fr !important;
          }
          .cm-grid-options input {
            width: 100% !important;
          }
        }
        @media (max-width: 400px) {
          .cm-grid-options {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};