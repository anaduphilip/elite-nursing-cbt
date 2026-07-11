// src/components/admin/tabs/WeeklyQuizTab.jsx
import React from 'react';

export const WeeklyQuizTab = ({
  weeklyQuizzes,
  loadingQuizzes,
  quizTitle,
  setQuizTitle,
  quizDescription,
  setQuizDescription,
  quizInstructions,
  setQuizInstructions,
  quizWeekNumber,
  setQuizWeekNumber,
  quizQuestions,
  quizPassingScore,
  setQuizPassingScore,
  quizTimeLimit,
  setQuizTimeLimit,
  quizStartDate,
  setQuizStartDate,
  quizEndDate,
  setQuizEndDate,
  quizIsPremium,
  setQuizIsPremium,
  editingQuizId,
  showQuizForm,
  setShowQuizForm,
  qText,
  setQText,
  qOptions,
  setQOptions,
  qCorrect,
  setQCorrect,
  editingQuestionIndex,
  batchInput,
  setBatchInput,
  selectedQuizResults,
  showResults,
  setShowResults,
  handleAddQuestion,
  handleBatchImport,
  handleEditQuestion,
  handleDeleteQuestion,
  handleSaveQuiz,
  handlePublishQuiz,
  handleTogglePublish,
  handleTogglePremium,
  handleDeleteQuiz,
  handleViewResults,
  editQuiz,
  resetQuizForm,
  fetchWeeklyQuizzes,
  setActiveTab,
  darkMode,
  headingColor,
  secondaryText,
  textColor,
  cardBg
}) => {
  const getQuizStatus = (quiz) => {
    if (!quiz.isActive) return { label: 'Draft', color: '#6c757d' };
    if (quiz.startDate && new Date(quiz.startDate) > new Date()) return { label: 'Scheduled', color: '#17a2b8' };
    if (quiz.endDate && new Date(quiz.endDate) < new Date()) return { label: 'Expired', color: '#dc3545' };
    return { label: 'Published', color: '#28a745' };
  };

  return (
    <div style={{ padding: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h3 style={{ color: headingColor, margin: 0 }}>Manage Weekly Quizzes</h3>
        <button onClick={() => setShowQuizForm(!showQuizForm)} style={{ background: showQuizForm ? '#dc3545' : '#2E7D64', color: 'white', padding: '10px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>{showQuizForm ? '✕ Cancel' : '+ Create New Quiz'}</button>
      </div>

      {showQuizForm && (
        <div style={{ background: darkMode ? '#1a1a2e' : '#f8f9fa', padding: '24px 28px', borderRadius: 16, marginBottom: 28, border: `1px solid ${darkMode ? '#444' : '#ddd'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h4 style={{ color: headingColor, marginBottom: 20, fontSize: 18 }}>{editingQuizId ? ' Edit Quiz' : ' New Weekly Quiz'}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px', marginBottom: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Quiz Title <span style={{ color: '#dc3545' }}>*</span></label>
              <input type="text" placeholder="e.g., Week 1 - Fundamentals" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Week Number <span style={{ color: '#dc3545' }}>*</span></label>
              <input type="number" placeholder="1, 2, 3..." value={quizWeekNumber} onChange={(e) => setQuizWeekNumber(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }} min="1" />
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Description <span style={{ color: '#999', fontWeight: 'normal' }}>(optional)</span></label>
            <input type="text" placeholder="Brief description of the quiz" value={quizDescription} onChange={(e) => setQuizDescription(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Instructions <span style={{ color: '#999', fontWeight: 'normal' }}>(shown before quiz starts)</span></label>
            <textarea placeholder="e.g., Answer all questions carefully. You cannot go back after submitting." value={quizInstructions} onChange={(e) => setQuizInstructions(e.target.value)} rows="3" style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px', marginBottom: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Start Date <span style={{ color: '#999', fontWeight: 'normal' }}>(optional)</span></label>
              <input type="datetime-local" value={quizStartDate} onChange={(e) => setQuizStartDate(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>End Date <span style={{ color: '#999', fontWeight: 'normal' }}>(optional)</span></label>
              <input type="datetime-local" value={quizEndDate} onChange={(e) => setQuizEndDate(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '12px 16px', background: darkMode ? '#2d2d3d' : '#f0f7f4', borderRadius: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 'bold', color: textColor, cursor: 'pointer' }}>
              <input type="checkbox" checked={quizIsPremium} onChange={(e) => setQuizIsPremium(e.target.checked)} style={{ marginRight: 8, width: 18, height: 18, cursor: 'pointer' }} />
              Premium Quiz <span style={{ fontWeight: 'normal', color: secondaryText }}>(users need premium to access)</span>
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px', marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Passing Score (%)</label>
              <input type="number" placeholder="70" value={quizPassingScore} onChange={(e) => setQuizPassingScore(parseInt(e.target.value) || 70)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }} min="0" max="100" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6, color: textColor }}>Time Limit (minutes)</label>
              <input type="number" placeholder="20" value={quizTimeLimit} onChange={(e) => setQuizTimeLimit(parseInt(e.target.value) || 20)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }} min="1" />
            </div>
          </div>
          <div style={{ marginBottom: 20, borderTop: `2px solid ${darkMode ? '#444' : '#e0e0e0'}`, paddingTop: 20 }}>
            <h5 style={{ color: headingColor, marginBottom: 14, fontSize: 16 }}>Questions ({quizQuestions.length})</h5>
            
            <div style={{ background: darkMode ? '#2d2d3d' : '#f0f7f4', padding: '16px 18px', borderRadius: 12, marginBottom: 18, border: `1px dashed ${darkMode ? '#666' : '#aaa'}` }}>
              <p style={{ fontSize: 13, color: secondaryText, marginBottom: 8 }}><strong>Batch Import:</strong> Paste multiple questions at once.</p>
              <textarea placeholder="Paste your questions here...&#10;Q1. Question text? (a) Option (b) Option (c) Option (d) Option&#10;Answer: a" value={batchInput} onChange={(e) => setBatchInput(e.target.value)} rows="4" style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'monospace' }} />
              <button onClick={handleBatchImport} style={{ marginTop: 10, background: '#17a2b8', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}> Import Questions</button>
            </div>

            <div style={{ background: darkMode ? '#2d2d3d' : 'white', padding: '18px 20px', borderRadius: 12, marginBottom: 16, border: `1px solid ${darkMode ? '#555' : '#eee'}` }}>
              <div style={{ marginBottom: 14 }}><input type="text" placeholder="Enter question text" value={qText} onChange={(e) => setQText(e.target.value)} style={{ width: '100%', padding: '12px 14px', border: '1px solid #ccc', borderRadius: 8, fontSize: 14, background: cardBg, color: textColor, boxSizing: 'border-box' }} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: 14 }}>
                {qOptions.map((opt, idx) => (
                  <input key={idx} type="text" placeholder={`Option ${String.fromCharCode(65 + idx)}`} value={opt} onChange={(e) => { const newOpts = [...qOptions]; newOpts[idx] = e.target.value; setQOptions(newOpts); }} style={{ padding: '10px 12px', border: '1px solid #ccc', borderRadius: 6, fontSize: 13, background: cardBg, color: textColor, boxSizing: 'border-box' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'nowrap' }}>
                <label style={{ fontSize: 13, fontWeight: 'bold', color: textColor }}>Correct Answer:</label>
                <select value={qCorrect} onChange={(e) => setQCorrect(parseInt(e.target.value))} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #ccc', background: cardBg, color: textColor, fontSize: 13 }}>
                  {qOptions.map((_, idx) => <option key={idx} value={idx}>Option {String.fromCharCode(65 + idx)}</option>)}
                </select>
                <button onClick={handleAddQuestion} style={{ background: '#2E7D64', color: 'white', padding: '8px 20px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>{editingQuestionIndex !== null ? 'Update' : '➕ Add'}</button>
                {editingQuestionIndex !== null && <button onClick={() => { setEditingQuestionIndex(null); setQText(''); setQOptions(['', '', '', '']); setQCorrect(0); }} style={{ background: '#6c757d', color: 'white', padding: '6px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Cancel</button>}
              </div>
            </div>

            {quizQuestions.length > 0 && (
              <div style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                {quizQuestions.map((q, idx) => (
                  <div key={idx} style={{ background: darkMode ? '#2d2d3d' : 'white', padding: '14px 16px', borderRadius: 10, marginBottom: 10, border: `1px solid ${darkMode ? '#444' : '#eee'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}><strong style={{ color: headingColor, fontSize: 14 }}>Q{idx+1}:</strong> <span style={{ color: textColor, fontSize: 14, wordBreak: 'break-word' }}>{q.questionText}</span></div>
                      <div style={{ fontSize: 12, color: secondaryText, marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {q.options.map((opt, i) => <span key={i} style={{ background: darkMode ? '#333' : '#f0f0f0', padding: '2px 8px', borderRadius: 4 }}>{String.fromCharCode(65 + i)}: {opt}</span>)}
                        <span style={{ color: '#2E7D64', fontWeight: 'bold' }}>✓ Answer: {String.fromCharCode(65 + q.correctAnswer)}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                      <button onClick={() => handleEditQuestion(idx)} style={{ background: '#ffc107', color: '#333', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                      <button onClick={() => handleDeleteQuestion(idx)} style={{ background: '#dc3545', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={handleSaveQuiz} style={{ flex: 1, background: '#6c757d', color: 'white', padding: '14px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 16, transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#5a6268'} onMouseLeave={(e) => e.currentTarget.style.background = '#6c757d'}> Save as Draft</button>
            <button onClick={handlePublishQuiz} style={{ flex: 1, background: '#28a745', color: 'white', padding: '14px', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 16, transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#218838'} onMouseLeave={(e) => e.currentTarget.style.background = '#28a745'}>{editingQuizId ? ' Update & Publish' : ' Publish Now'}</button>
          </div>
        </div>
      )}

      {loadingQuizzes ? <p style={{ textAlign: 'center', color: secondaryText, padding: '30px 0' }}>Loading quizzes...</p> : weeklyQuizzes.length === 0 ? <p style={{ textAlign: 'center', color: secondaryText, padding: '30px 0' }}>No weekly quizzes created yet.</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20 }}>
          {weeklyQuizzes.map(quiz => {
            const status = getQuizStatus(quiz);
            return (
              <div key={quiz._id} style={{ background: darkMode ? '#1a1a2e' : 'white', padding: '18px 20px', borderRadius: 14, border: `1px solid ${darkMode ? '#444' : '#ddd'}`, transition: 'box-shadow 0.2s', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ color: headingColor, margin: 0, fontSize: 16 }}>{quiz.title}</h4>
                    <p style={{ fontSize: 12, color: secondaryText, marginTop: 4 }}>Week {quiz.weekNumber} • {quiz.questions.length} questions</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      <span style={{ background: status.color, color: 'white', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 'bold' }}>{status.label}</span>
                      {quiz.isPremium && <span style={{ background: '#ff9800', color: 'white', padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 'bold' }}>⭐ Premium</span>}
                      {quiz.startDate && <span style={{ background: '#17a2b8', color: 'white', padding: '2px 10px', borderRadius: 12, fontSize: 11 }}>Time Published {new Date(quiz.startDate).toLocaleDateString()}</span>}
                    </div>
                    <p style={{ fontSize: 12, color: secondaryText, marginTop: 4 }}>Pass: {quiz.passingScore}% • Time: {quiz.timeLimit}min</p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button onClick={() => editQuiz(quiz)} style={{ background: '#ffc107', color: '#333', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Edit</button>
                    <button onClick={() => handleTogglePublish(quiz._id, quiz.isActive)} style={{ background: quiz.isActive ? '#dc3545' : '#28a745', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>{quiz.isActive ? ' Unpublish' : ' Publish'}</button>
                    <button onClick={() => handleTogglePremium(quiz._id, quiz.isPremium)} style={{ background: quiz.isPremium ? '#dc3545' : '#ff9800', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>{quiz.isPremium ? '⭐ Remove Premium' : '⭐ Make Premium'}</button>
                    <button onClick={() => handleViewResults(quiz._id)} style={{ background: '#17a2b8', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Quiz Results</button>
                    <button onClick={() => handleDeleteQuiz(quiz._id)} style={{ background: '#dc3545', color: 'white', padding: '4px 10px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showResults && selectedQuizResults && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: cardBg, borderRadius: 20, padding: 28, maxWidth: 600, width: '100%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ color: headingColor, margin: 0 }}>Quiz Results</h3>
              <button onClick={() => setShowResults(false)} style={{ background: '#6c757d', color: 'white', padding: '6px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Close</button>
            </div>
            {selectedQuizResults.length === 0 ? <p style={{ color: secondaryText, textAlign: 'center', padding: '20px 0' }}>No attempts yet.</p> : (
              <div>
                <p style={{ color: secondaryText, marginBottom: 14 }}>Total Attempts: <strong>{selectedQuizResults.length}</strong></p>
                {selectedQuizResults.map((attempt, idx) => (
                  <div key={idx} style={{ background: darkMode ? '#1a1a2e' : '#f8f9fa', padding: '14px 16px', borderRadius: 10, marginBottom: 10, borderLeft: `4px solid ${attempt.passed ? '#2e7d32' : '#dc3545'}` }}>
                    <p style={{ margin: 0, color: textColor, fontWeight: 'bold' }}>{attempt.userId?.name || 'Unknown'}</p>
                    <p style={{ margin: 0, fontSize: 13, color: secondaryText }}>{attempt.userId?.email || 'No email'} • Score: <strong>{attempt.score}/{attempt.total}</strong> ({attempt.percentage.toFixed(1)}%) {attempt.passed ? ' ✅' : ' ❌'}</p>
                    <p style={{ margin: 0, fontSize: 11, color: secondaryText }}>{new Date(attempt.completedAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};