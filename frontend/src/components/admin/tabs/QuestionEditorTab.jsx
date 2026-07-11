// src/components/admin/tabs/QuestionEditorTab.jsx
import React from 'react';

export const QuestionEditorTab = ({
  selectedQuiz,
  setSelectedQuiz,
  quizzes,
  questions,
  loadingQuestions,
  questionSearch,
  setQuestionSearch,
  setShowQuestionModal,
  resetQuestionForm,
  handleDeleteQuestionFromQuiz,
  fetchQuestions,          // ← NEW
  openEditQuestionInQuiz,  // ← NEW
  darkMode,
  headingColor,
  secondaryText,
  textColor,
  cardBg
}) => {
  return (
    <div style={{ padding: 20 }}>
      <h3 style={{ color: headingColor, marginBottom: 20 }}>📝 Question Editor</h3>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Select a Quiz:</label>
        <select
          value={selectedQuiz || ''}
          onChange={(e) => { 
            const quizId = e.target.value;
            setSelectedQuiz(quizId); 
            if (quizId) fetchQuestions(quizId); 
          }}
          style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', fontSize: 14, background: cardBg, color: textColor }}
        >
          <option value="">-- Choose a quiz --</option>
          {quizzes.map(q => (
            <option key={q._id} value={q._id}>{q.title} ({q.category})</option>
          ))}
        </select>
      </div>

      {selectedQuiz && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <span style={{ color: secondaryText }}>{questions.length} questions</span>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Search questions..."
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                style={{ padding: '8px 14px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14, background: darkMode ? '#1a1a2e' : '#f8f9fa', color: textColor, width: 200 }}
              />
              <button
                onClick={() => { resetQuestionForm(); setShowQuestionModal(true); }}
                style={{ background: '#2E7D64', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
              >
                + Add Question
              </button>
            </div>
          </div>

          {loadingQuestions ? (
            <p style={{ color: secondaryText }}>Loading questions...</p>
          ) : questions.length === 0 ? (
            <p style={{ color: secondaryText }}>No questions in this quiz.</p>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {questions
                .filter(q => {
                  const search = questionSearch.toLowerCase();
                  return q.questionText.toLowerCase().includes(search) ||
                         q.options.some(o => o.toLowerCase().includes(search));
                })
                .map((q, idx) => (
                  <div key={q._id} style={{ background: darkMode ? '#1a1a2e' : '#f8f9fa', padding: 12, borderRadius: 8, marginBottom: 10, border: '1px solid ' + (darkMode ? '#444' : '#ddd') }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <p><strong>Q{idx+1}:</strong> {q.questionText}</p>
                        <div style={{ fontSize: 13, color: secondaryText }}>
                          {q.options.map((opt, i) => (
                            <div key={i}>
                              {String.fromCharCode(65 + i)}: {opt} {i === q.correctAnswer && '✅ Correct'}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button
                          onClick={() => openEditQuestionInQuiz(q)}
                          style={{ background: '#ffc107', color: '#333', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteQuestionFromQuiz(q._id)}
                          style={{ background: '#dc3545', color: 'white', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};