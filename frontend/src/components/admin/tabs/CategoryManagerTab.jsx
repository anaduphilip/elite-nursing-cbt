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
  setCategoryManagerQuestions,      // ← ADDED
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
  setCategoryManagerQuizzes,        // ← ADDED
  categoryManagerLoading,
  categoryManagerResult,
  setCategoryManagerResult,         // ← ADDED
  categoryManagerEditingIdx,
  setCategoryManagerEditingIdx,     // ← ADDED
  categoryManagerExistingQuizId,
  setCategoryManagerExistingQuizId, // ← ADDED
  handleCategoryManagerBatchImport,
  handleCategoryManagerAddSingle,
  handleCategoryManagerEditQuestion,
  handleCategoryManagerDeleteQuestion,
  handleCategoryManagerSaveQuiz,
  handleCategoryManagerEditQuiz,
  handleCategoryManagerDeleteQuiz,
  handleClearCategoryManager,       // ← ADDED
  categories,
  darkMode,
  headingColor,
  secondaryText,
  textColor,
  cardBg
}) => {
  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ color: headingColor, marginBottom: 20 }}>📂 Category Question Manager</h3>
      <p style={{ color: secondaryText, marginBottom: 16 }}>
        Create a new quiz under any category with your own questions. The first 20 questions will be available in Free Mode; all questions will be available in Premium Mode.
        <br/><br/>
        <strong>Title:</strong> This becomes the quiz title (e.g., "CARDIOVASCULAR NURSING - Questions 1 to 20").<br/>
        <strong>Topic:</strong> This becomes the topic name (e.g., "CARDIOVASCULAR NURSING").<br/>
        <em>If a quiz with the same Title already exists under this Category, new questions will be appended to it.</em>
      </p>

      {/* Search existing quizzes */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Search Existing Quizzes</label>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            placeholder="Search by title or category..."
            value={categoryManagerSearch}
            onChange={(e) => setCategoryManagerSearch(e.target.value)}
            style={{ flex: 1, padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: textColor }}
          />
        </div>
        <div style={{ marginTop: 10, maxHeight: 200, overflowY: 'auto', background: darkMode ? '#1a1a2e' : '#f8f9fa', borderRadius: 8, border: '1px solid ' + (darkMode ? '#444' : '#ddd') }}>
          {categoryManagerQuizzes
            .filter(q => {
              const search = categoryManagerSearch.toLowerCase();
              return q.title.toLowerCase().includes(search) || q.category.toLowerCase().includes(search);
            })
            .slice(0, 20)
            .map(q => (
              <div key={q._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid ' + (darkMode ? '#444' : '#eee') }}>
                <span style={{ color: textColor }}>{q.title} <span style={{ color: secondaryText, fontSize: 12 }}>({q.category})</span></span>
                <div>
                  <button onClick={() => handleCategoryManagerEditQuiz(q._id)} style={{ background: '#ffc107', color: '#333', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 6, fontSize: 12 }}>Load</button>
                  <button onClick={() => handleCategoryManagerDeleteQuiz(q._id)} style={{ background: '#dc3545', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Delete</button>
                </div>
              </div>
            ))}
          {categoryManagerQuizzes.length === 0 && <p style={{ padding: 12, color: secondaryText }}>No quizzes found.</p>}
        </div>
      </div>

      <div style={{ borderTop: '1px solid ' + (darkMode ? '#444' : '#ddd'), paddingTop: 20, marginTop: 10 }}>
        <h4 style={{ color: headingColor, marginBottom: 16 }}>Create / Add Questions</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Category <span style={{ color: '#dc3545' }}>*</span></label>
            <select
              value={categoryManagerCategory}
              onChange={(e) => setCategoryManagerCategory(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor }}
            >
              <option value="">-- Select a category --</option>
              {categories.filter(c => c.active).map(c => (
                <option key={c._id} value={c.slug}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Title <span style={{ color: '#dc3545' }}>*</span></label>
            <input
              type="text"
              placeholder="e.g., CARDIOVASCULAR NURSING - Questions 1 to 20"
              value={categoryManagerTitle}
              onChange={(e) => setCategoryManagerTitle(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Topic <span style={{ color: '#dc3545' }}>*</span></label>
            <input
              type="text"
              placeholder="e.g., CARDIOVASCULAR NURSING"
              value={categoryManagerTopic}
              onChange={(e) => setCategoryManagerTopic(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Batch Import Questions</label>
          <textarea
            placeholder="Paste multiple questions at once...&#10;Q1. Question text? (a) Option (b) Option (c) Option (d) Option&#10;Answer: a"
            value={categoryManagerBatch}
            onChange={(e) => setCategoryManagerBatch(e.target.value)}
            rows="5"
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, resize: 'vertical', fontFamily: 'monospace' }}
          />
          <button
            onClick={handleCategoryManagerBatchImport}
            style={{ marginTop: 8, background: '#17a2b8', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}
          >
            Import Batch
          </button>
        </div>

        <div style={{ borderTop: '1px solid ' + (darkMode ? '#444' : '#ddd'), paddingTop: 16, marginBottom: 16 }}>
          <h5 style={{ color: headingColor, marginBottom: 10, fontSize: 15 }}>Add Single Question</h5>
          <div style={{ marginBottom: 10 }}>
            <input
              type="text"
              placeholder="Question text"
              value={categoryManagerSingleQ}
              onChange={(e) => setCategoryManagerSingleQ(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14, background: cardBg, color: textColor }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
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
                style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, background: cardBg, color: textColor }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 13, fontWeight: 'bold', color: textColor }}>Correct Answer:</label>
            <select
              value={categoryManagerSingleCorrect}
              onChange={(e) => setCategoryManagerSingleCorrect(parseInt(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ccc', background: cardBg, color: textColor, fontSize: 13 }}
            >
              {categoryManagerSingleOpts.map((_, idx) => (
                <option key={idx} value={idx}>Option {String.fromCharCode(65 + idx)}</option>
              ))}
            </select>
            <button
              onClick={handleCategoryManagerAddSingle}
              style={{ background: '#2E7D64', color: 'white', padding: '6px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}
            >
              {categoryManagerEditingIdx !== null ? 'Update' : '➕ Add'}
            </button>
            {categoryManagerEditingIdx !== null && (
              <button
                onClick={() => { setCategoryManagerEditingIdx(null); setCategoryManagerSingleQ(''); setCategoryManagerSingleOpts(['', '', '', '']); setCategoryManagerSingleCorrect(0); }}
                style={{ background: '#6c757d', color: 'white', padding: '6px 12px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
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
              <div key={idx} style={{ background: darkMode ? '#2d2d3d' : 'white', padding: '10px 12px', borderRadius: 8, marginBottom: 8, border: '1px solid ' + (darkMode ? '#444' : '#eee'), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <strong style={{ color: headingColor, fontSize: 14 }}>Q{idx+1}:</strong>
                    <span style={{ color: textColor, fontSize: 14, wordBreak: 'break-word' }}>{q.questionText}</span>
                  </div>
                  <div style={{ fontSize: 12, color: secondaryText, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {q.options.map((opt, i) => (
                      <span key={i} style={{ background: darkMode ? '#333' : '#f0f0f0', padding: '2px 8px', borderRadius: 4 }}>{String.fromCharCode(65 + i)}: {opt}</span>
                    ))}
                    <span style={{ color: '#2E7D64', fontWeight: 'bold' }}>✓ Answer: {String.fromCharCode(65 + q.correctAnswer)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                  <button onClick={() => handleCategoryManagerEditQuestion(idx)} style={{ background: '#ffc107', color: '#333', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                  <button onClick={() => handleCategoryManagerDeleteQuestion(idx)} style={{ background: '#dc3545', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button
            onClick={handleCategoryManagerSaveQuiz}
            disabled={categoryManagerLoading || categoryManagerQuestions.length === 0}
            style={{ flex: 1, background: '#28a745', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 16, opacity: (categoryManagerLoading || categoryManagerQuestions.length === 0) ? 0.7 : 1 }}
          >
            {categoryManagerLoading ? 'Saving...' : '📤 Save / Append Questions'}
          </button>
          <button
            onClick={handleClearCategoryManager}
            style={{ background: '#6c757d', color: 'white', padding: '12px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
          >
            Clear
          </button>
        </div>
        {categoryManagerResult && <p style={{ marginTop: 16, color: categoryManagerResult.includes('✅') ? '#2e7d32' : '#dc3545' }}>{categoryManagerResult}</p>}
      </div>
    </div>
  );
};