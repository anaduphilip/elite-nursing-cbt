// src/components/admin/tabs/QuestionEditorTab.jsx
import React, { useState } from 'react';
import CloudinaryUpload from '../CloudinaryUpload';

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
  fetchQuestions,
  openEditQuestionInQuiz,
  updateQuestionImage,
  removeQuestionImage,
  darkMode,
  headingColor,
  secondaryText,
  textColor,
  cardBg
}) => {
  // ===== IMAGE UPLOAD STATE =====
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [imageQuestion, setImageQuestion] = useState(null);
  const [imageQuestionId, setImageQuestionId] = useState(null);
  const [imageQuestionIndex, setImageQuestionIndex] = useState(null);

  // ===== OPEN IMAGE UPLOAD MODAL =====
  const openImageUpload = (q, idx) => {
    setImageQuestion(q);
    setImageQuestionId(q._id);
    setImageQuestionIndex(idx);
    setShowImageUpload(true);
  };

  // ===== HANDLE IMAGE UPLOAD SUCCESS =====
  const handleImageUploadSuccess = async (url) => {
    if (updateQuestionImage && imageQuestionId) {
      await updateQuestionImage(imageQuestionId, url);
    }
    setShowImageUpload(false);
    setImageQuestion(null);
    setImageQuestionId(null);
    setImageQuestionIndex(null);
  };

  // ===== HANDLE IMAGE REMOVE =====
  const handleImageRemove = async () => {
    if (removeQuestionImage && imageQuestionId) {
      await removeQuestionImage(imageQuestionId);
    }
    setShowImageUpload(false);
    setImageQuestion(null);
    setImageQuestionId(null);
    setImageQuestionIndex(null);
  };

  // ===== CLOSE MODAL =====
  const closeImageUpload = () => {
    setShowImageUpload(false);
    setImageQuestion(null);
    setImageQuestionId(null);
    setImageQuestionIndex(null);
  };

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
                        {q.imageUrl && (
                          <div style={{ marginTop: 4 }}>
                            <img src={q.imageUrl} alt="Question" style={{ maxHeight: 40, maxWidth: 80, borderRadius: 4 }} />
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => openEditQuestionInQuiz(q)}
                          style={{ background: '#ffc107', color: '#333', border: 'none', padding: '4px 10px', borderRadius: 4, cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                        {/* ===== Image Button ===== */}
                        <button
                          onClick={() => openImageUpload(q, idx)}
                          style={{
                            background: q.imageUrl ? '#28a745' : '#17a2b8',
                            color: 'white',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: 12
                          }}
                        >
                          {q.imageUrl ? '🔄 Image' : '📷 Image'}
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

      {/* ===== IMAGE UPLOAD MODAL ===== */}
      {showImageUpload && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: 20
        }}>
          <div style={{
            background: cardBg,
            borderRadius: 20,
            padding: 28,
            maxWidth: 500,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            textAlign: 'center'
          }}>
            <h3 style={{ color: headingColor, marginBottom: 8 }}>📷 Question Image</h3>
            <p style={{ color: secondaryText, marginBottom: 20, fontSize: 14 }}>
              Upload an image to display with this question.
            </p>

            {imageQuestion?.imageUrl && (
              <div style={{ marginBottom: 16 }}>
                <img
                  src={imageQuestion.imageUrl}
                  alt="Current"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '150px',
                    borderRadius: 8,
                    objectFit: 'contain',
                    background: '#f0f0f0'
                  }}
                />
                <button
                  onClick={handleImageRemove}
                  style={{
                    marginTop: 8,
                    background: '#dc3545',
                    color: 'white',
                    padding: '6px 16px',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13
                  }}
                >
                  🗑️ Remove Image
                </button>
              </div>
            )}

            <CloudinaryUpload
              onUploadSuccess={handleImageUploadSuccess}
              onClose={closeImageUpload}
              buttonText="📤 Upload Image"
            />

            <button
              onClick={closeImageUpload}
              style={{
                marginTop: 16,
                background: '#6c757d',
                color: 'white',
                padding: '8px 20px',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};