// src/components/admin/components/QuestionModal.jsx
import React from 'react';

export const QuestionModal = ({
  showQuestionModal,
  setShowQuestionModal,
  editingQuestion,
  questionForm,
  setQuestionForm,
  resetQuestionForm,
  handleAddQuestionToQuiz,
  handleUpdateQuestionInQuiz,
  cardBg,
  headingColor,
  textColor
}) => {
  if (!showQuestionModal) return null;
  const isEditing = !!editingQuestion;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div style={{
        background: cardBg,
        borderRadius: 20,
        padding: 24,
        maxWidth: 600,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h3 style={{ color: headingColor, marginBottom: 20 }}>
          {isEditing ? 'Edit Question' : 'Add New Question'}
        </h3>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, color: textColor, fontWeight: 'bold' }}>Question Text</label>
          <input
            type="text"
            value={questionForm.questionText}
            onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
            style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: '#f8f9fa', color: textColor }}
          />
        </div>
        {questionForm.options.map((opt, idx) => (
          <div key={idx} style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, color: textColor }}>Option {String.fromCharCode(65 + idx)}</label>
            <input
              type="text"
              value={opt}
              onChange={(e) => {
                const newOpts = [...questionForm.options];
                newOpts[idx] = e.target.value;
                setQuestionForm({ ...questionForm, options: newOpts });
              }}
              style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 6, fontSize: 14, background: '#f8f9fa', color: textColor }}
            />
          </div>
        ))}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, color: textColor }}>Correct Answer (A-D)</label>
          <select
            value={questionForm.correctAnswer}
            onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: parseInt(e.target.value) })}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', background: cardBg, color: textColor, fontSize: 14 }}
          >
            {questionForm.options.map((_, idx) => (
              <option key={idx} value={idx}>{String.fromCharCode(65 + idx)}</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 4, color: textColor }}>Points (optional)</label>
          <input
            type="number"
            value={questionForm.points}
            onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 1 })}
            style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 6, fontSize: 14, background: '#f8f9fa', color: textColor }}
            min="1"
          />
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={() => { setShowQuestionModal(false); resetQuestionForm(); }}
            style={{ background: '#6c757d', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={isEditing ? handleUpdateQuestionInQuiz : handleAddQuestionToQuiz}
            style={{ background: '#1e3c72', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
          >
            {isEditing ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};