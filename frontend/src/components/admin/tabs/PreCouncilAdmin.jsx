// src/components/admin/tabs/PreCouncilAdmin.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg } from '../../../utils/theme';

export const PreCouncilAdmin = ({ token, darkMode }) => {
  const headingColor = getHeadingColor(darkMode);
  const secondaryText = getSecondaryText(darkMode);
  const textColor = getTextColor(darkMode);
  const cardBg = getCardBg(darkMode);

  // ---- STATE ----
  const [categories, setCategories] = useState([]);
  const [papers, setPapers] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('categories');

  // ---- CATEGORY FORM ----
  const [catForm, setCatForm] = useState({ name: '', description: '', icon: '📚', order: 0, active: true });
  const [editCatId, setEditCatId] = useState(null);
  const [catModalOpen, setCatModalOpen] = useState(false);

  // ---- PAPER FORM ----
  const [paperForm, setPaperForm] = useState({ categoryId: '', name: '', description: '', hasCourses: false, courses: [], order: 0, active: true });
  const [editPaperId, setEditPaperId] = useState(null);
  const [paperModalOpen, setPaperModalOpen] = useState(false);
  const [courseInput, setCourseInput] = useState('');

  // ---- EXAM FORM ----
  const [examForm, setExamForm] = useState({ paperId: '', title: '', description: '', questions: [], timeLimit: 180, passingScore: 70, order: 0, isActive: true });
  const [editExamId, setEditExamId] = useState(null);
  const [examModalOpen, setExamModalOpen] = useState(false);
  // ---- NEW: Batch import state ----
  const [batchInput, setBatchInput] = useState('');
  const [batchResult, setBatchResult] = useState('');

  // ---- FETCH DATA ----
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [catRes, paperRes, examRes] = await Promise.all([
        axios.get('/api/admin/pre-council/categories', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/pre-council/papers', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/pre-council/exams', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setCategories(catRes.data.categories);
      setPapers(paperRes.data.papers);
      setExams(examRes.data.exams);
    } catch (error) {
      console.error('Failed to fetch pre-council data:', error);
      alert('Failed to load data. Check console.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ---- CATEGORY CRUD ----
  const handleCatSubmit = async () => {
    if (!catForm.name.trim()) return alert('Name is required');
    try {
      const url = editCatId ? `/api/admin/pre-council/categories/${editCatId}` : '/api/admin/pre-council/categories';
      const method = editCatId ? 'put' : 'post';
      const res = await axios[method](url, catForm, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        fetchAll();
        setCatModalOpen(false);
        setCatForm({ name: '', description: '', icon: '📚', order: 0, active: true });
        setEditCatId(null);
      }
    } catch (error) {
      alert('Failed to save category: ' + (error.response?.data?.error || error.message));
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category? All papers and exams in it will remain but become orphaned.')) return;
    try {
      await axios.delete(`/api/admin/pre-council/categories/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchAll();
    } catch (error) {
      alert('Failed to delete category');
    }
  };

  // ---- PAPER CRUD ----
  const handlePaperSubmit = async () => {
    if (!paperForm.categoryId || !paperForm.name.trim()) return alert('Category and Name are required');
    const payload = { ...paperForm };
    if (payload.courses && typeof payload.courses === 'string') {
      payload.courses = payload.courses.split(',').map(s => s.trim()).filter(Boolean);
    }
    try {
      const url = editPaperId ? `/api/admin/pre-council/papers/${editPaperId}` : '/api/admin/pre-council/papers';
      const method = editPaperId ? 'put' : 'post';
      const res = await axios[method](url, payload, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        fetchAll();
        setPaperModalOpen(false);
        setPaperForm({ categoryId: '', name: '', description: '', hasCourses: false, courses: [], order: 0, active: true });
        setEditPaperId(null);
        setCourseInput('');
      }
    } catch (error) {
      alert('Failed to save paper: ' + (error.response?.data?.error || error.message));
    }
  };

  const deletePaper = async (id) => {
    if (!window.confirm('Delete this paper? All exams in it will be deleted.')) return;
    try {
      await axios.delete(`/api/admin/pre-council/papers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchAll();
    } catch (error) {
      alert('Failed to delete paper');
    }
  };

  // ---- EXAM CRUD ----
  const handleExamSubmit = async () => {
    if (!examForm.paperId || !examForm.title.trim()) return alert('Paper and Title are required');
    if (!examForm.questions || examForm.questions.length === 0) return alert('Add at least one question');
    try {
      const url = editExamId ? `/api/admin/pre-council/exams/${editExamId}` : '/api/admin/pre-council/exams';
      const method = editExamId ? 'put' : 'post';
      const res = await axios[method](url, examForm, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        fetchAll();
        setExamModalOpen(false);
        setExamForm({ paperId: '', title: '', description: '', questions: [], timeLimit: 180, passingScore: 70, order: 0, isActive: true });
        setEditExamId(null);
        setBatchInput('');
        setBatchResult('');
      }
    } catch (error) {
      alert('Failed to save exam: ' + (error.response?.data?.error || error.message));
    }
  };

  const deleteExam = async (id) => {
    if (!window.confirm('Delete this exam?')) return;
    try {
      await axios.delete(`/api/admin/pre-council/exams/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchAll();
    } catch (error) {
      alert('Failed to delete exam');
    }
  };

  // ---- BATCH IMPORT FUNCTION (NEW) ----
  const handleBatchImport = () => {
    if (!batchInput.trim()) {
      alert('Please paste some questions first.');
      return;
    }

    const lines = batchInput.split('\n').map(l => l.trim()).filter(l => l);
    const parsedQuestions = [];
    
    let currentBlock = '';
    const blocks = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^Q\d+\./i)) {
        if (currentBlock.trim()) {
          blocks.push(currentBlock.trim());
        }
        currentBlock = line;
      } else {
        currentBlock += '\n' + line;
      }
    }
    if (currentBlock.trim()) {
      blocks.push(currentBlock.trim());
    }

    for (const block of blocks) {
      const qMatch = block.match(/^Q\d+\.\s*(.*)/i);
      if (!qMatch) continue;
      
      const fullText = qMatch[1];
      const options = [];
      let answerLetter = null;

      // Try to extract options from the block (in case they are on separate lines)
      const optionPattern = /\(([a-d])\)\s*([^(]+?)(?=\s*\([a-d]\)|$)/gi;
      let match;
      while ((match = optionPattern.exec(fullText)) !== null) {
        options.push(match[2].trim());
      }

      // If options not found, try other formats
      if (options.length !== 4) {
        const linesInBlock = block.split('\n');
        for (const line of linesInBlock) {
          const optMatch = line.match(/^\(([a-d])\)\s*(.*)/i);
          if (optMatch) {
            options.push(optMatch[2].trim());
          }
        }
      }

      // Clean question text
      let questionText = fullText.replace(/\s*\([a-d]\)[^(]*/g, '').trim();
      if (!questionText) {
        const firstLine = block.split('\n')[0];
        if (firstLine) {
          questionText = firstLine.replace(/^Q\d+\.\s*/i, '').trim();
        }
      }

      // Try to find answer
      const answerMatch = block.match(/Answer:\s*([a-d])/i);
      if (answerMatch) {
        answerLetter = answerMatch[1].toUpperCase();
      } else {
        const lastLines = block.split('\n').slice(-3);
        for (const line of lastLines) {
          const ansMatch = line.match(/^([a-d])\.?\s*$/i);
          if (ansMatch) {
            answerLetter = ansMatch[1].toUpperCase();
            break;
          }
        }
      }

      if (options.length === 4 && questionText) {
        const correctIndex = answerLetter ? answerLetter.charCodeAt(0) - 65 : 0;
        parsedQuestions.push({
          questionText: questionText,
          options: options,
          correctAnswer: correctIndex,
          points: 1
        });
      }
    }

    if (parsedQuestions.length === 0) {
      alert('No valid questions found. Please check the format.\n\nSupported formats:\n1. Q1. Question text? (a) Option (b) Option (c) Option (d) Option\n2. Q1. Question text?\n(a) Option\n(b) Option\n(c) Option\n(d) Option\nAnswer: a');
      return;
    }

    // Append to existing questions
    setExamForm(prev => ({
      ...prev,
      questions: [...prev.questions, ...parsedQuestions]
    }));
    setBatchInput('');
    setBatchResult(`✅ ${parsedQuestions.length} questions added to the exam.`);
  };

  // ---- HELPER ----
  const getCategoryName = (id) => {
    const cat = categories.find(c => c._id === id);
    return cat ? cat.name : 'Unknown';
  };

  const getPaperName = (id) => {
    const paper = papers.find(p => p._id === id);
    return paper ? paper.name : 'Unknown';
  };

  // ---- RENDER ----
  if (loading) return <div style={{ padding: 20, textAlign: 'center', color: secondaryText }}>Loading Pre Council data...</div>;

  return (
    <div style={{ padding: '10px 0' }}>
      <h3 style={{ color: headingColor, marginBottom: 16 }}>Pre Council Exam Management</h3>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid #ddd', paddingBottom: 12, flexWrap: 'wrap' }}>
        <button onClick={() => setActiveSubTab('categories')} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: activeSubTab === 'categories' ? '#1e3c72' : 'transparent', color: activeSubTab === 'categories' ? 'white' : '#1e3c72', fontWeight: 'bold', cursor: 'pointer' }}>Categories</button>
        <button onClick={() => setActiveSubTab('papers')} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: activeSubTab === 'papers' ? '#1e3c72' : 'transparent', color: activeSubTab === 'papers' ? 'white' : '#1e3c72', fontWeight: 'bold', cursor: 'pointer' }}>Papers</button>
        <button onClick={() => setActiveSubTab('exams')} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: activeSubTab === 'exams' ? '#1e3c72' : 'transparent', color: activeSubTab === 'exams' ? 'white' : '#1e3c72', fontWeight: 'bold', cursor: 'pointer' }}>Exams</button>
      </div>

      {/* ===== CATEGORIES ===== */}
      {activeSubTab === 'categories' && (
        <div>
          <button onClick={() => { setCatForm({ name: '', description: '', icon: '📚', order: 0, active: true }); setEditCatId(null); setCatModalOpen(true); }} style={{ background: '#28a745', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', marginBottom: 16 }}>+ Add Category</button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {categories.map(c => (
              <div key={c._id} style={{ background: darkMode ? '#1a1a2e' : '#f8f9fa', padding: 16, borderRadius: 12, border: '1px solid ' + (darkMode ? '#444' : '#e0e0e0') }}>
                <div style={{ fontSize: 28 }}>{c.icon || '📚'}</div>
                <h4 style={{ margin: '6px 0', color: headingColor }}>{c.name}</h4>
                <p style={{ fontSize: 13, color: secondaryText }}>{c.description}</p>
                <p style={{ fontSize: 12, color: secondaryText }}>Slug: {c.slug} | Order: {c.order} | {c.active ? '✅ Active' : '❌ Inactive'}</p>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button onClick={() => { setCatForm({ name: c.name, description: c.description || '', icon: c.icon || '📚', order: c.order, active: c.active }); setEditCatId(c._id); setCatModalOpen(true); }} style={{ background: '#ffc107', color: '#333', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                  <button onClick={() => deleteCategory(c._id)} style={{ background: '#dc3545', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== PAPERS ===== */}
      {activeSubTab === 'papers' && (
        <div>
          <button onClick={() => { setPaperForm({ categoryId: '', name: '', description: '', hasCourses: false, courses: [], order: 0, active: true }); setEditPaperId(null); setPaperModalOpen(true); }} style={{ background: '#28a745', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', marginBottom: 16 }}>+ Add Paper</button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {papers.map(p => (
              <div key={p._id} style={{ background: darkMode ? '#1a1a2e' : '#f8f9fa', padding: 16, borderRadius: 12, border: '1px solid ' + (darkMode ? '#444' : '#e0e0e0') }}>
                <h4 style={{ color: headingColor }}>{p.name}</h4>
                <p style={{ fontSize: 13, color: secondaryText }}>Category: {getCategoryName(p.categoryId)}</p>
                <p style={{ fontSize: 13, color: secondaryText }}>Courses: {p.hasCourses ? p.courses?.join(', ') || 'None' : 'N/A'}</p>
                <p style={{ fontSize: 12, color: secondaryText }}>Order: {p.order} | {p.active ? '✅ Active' : '❌ Inactive'}</p>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button onClick={() => { setPaperForm({ categoryId: p.categoryId, name: p.name, description: p.description || '', hasCourses: p.hasCourses, courses: p.courses || [], order: p.order, active: p.active }); setEditPaperId(p._id); setPaperModalOpen(true); }} style={{ background: '#ffc107', color: '#333', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                  <button onClick={() => deletePaper(p._id)} style={{ background: '#dc3545', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== EXAMS ===== */}
      {activeSubTab === 'exams' && (
        <div>
          <button onClick={() => { setExamForm({ paperId: '', title: '', description: '', questions: [], timeLimit: 180, passingScore: 70, order: 0, isActive: true }); setEditExamId(null); setExamModalOpen(true); }} style={{ background: '#28a745', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', marginBottom: 16 }}>+ Add Exam</button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {exams.map(e => (
              <div key={e._id} style={{ background: darkMode ? '#1a1a2e' : '#f8f9fa', padding: 16, borderRadius: 12, border: '1px solid ' + (darkMode ? '#444' : '#e0e0e0') }}>
                <h4 style={{ color: headingColor }}>{e.title}</h4>
                <p style={{ fontSize: 13, color: secondaryText }}>Paper: {getPaperName(e.paperId)}</p>
                <p style={{ fontSize: 13, color: secondaryText }}>Questions: {e.questionCount || 0} | Time: {e.timeLimit || 180} min</p>
                <p style={{ fontSize: 12, color: secondaryText }}>Passing: {e.passingScore || 70}% | Order: {e.order} | {e.isActive ? '✅ Active' : '❌ Inactive'}</p>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button onClick={() => { setExamForm({ paperId: e.paperId, title: e.title, description: e.description || '', questions: e.questions || [], timeLimit: e.timeLimit || 180, passingScore: e.passingScore || 70, order: e.order, isActive: e.isActive }); setEditExamId(e._id); setExamModalOpen(true); }} style={{ background: '#ffc107', color: '#333', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                  <button onClick={() => deleteExam(e._id)} style={{ background: '#dc3545', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== CATEGORY MODAL ===== */}
      {catModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}>
          <div style={{ background: cardBg, borderRadius: 20, padding: 28, maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: headingColor, marginBottom: 16 }}>{editCatId ? 'Edit' : 'Add'} Category</h3>
            <label style={{ color: textColor, fontWeight: 'bold' }}>Name *</label>
            <input type="text" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} style={{ width: '100%', padding: 10, margin: '8px 0 16px', borderRadius: 6, border: '1px solid #ccc', background: darkMode ? '#1a1a2e' : 'white', color: textColor }} />
            <label style={{ color: textColor, fontWeight: 'bold' }}>Description</label>
            <textarea value={catForm.description} onChange={e => setCatForm({ ...catForm, description: e.target.value })} rows="2" style={{ width: '100%', padding: 10, margin: '8px 0 16px', borderRadius: 6, border: '1px solid #ccc', background: darkMode ? '#1a1a2e' : 'white', color: textColor }} />
            <label style={{ color: textColor, fontWeight: 'bold' }}>Icon (emoji)</label>
            <input type="text" value={catForm.icon} onChange={e => setCatForm({ ...catForm, icon: e.target.value })} style={{ width: '100%', padding: 10, margin: '8px 0 16px', borderRadius: 6, border: '1px solid #ccc', background: darkMode ? '#1a1a2e' : 'white', color: textColor }} />
            <label style={{ color: textColor, fontWeight: 'bold' }}>Order</label>
            <input type="number" value={catForm.order} onChange={e => setCatForm({ ...catForm, order: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: 10, margin: '8px 0 16px', borderRadius: 6, border: '1px solid #ccc', background: darkMode ? '#1a1a2e' : 'white', color: textColor }} />
            <label style={{ color: textColor, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={catForm.active} onChange={e => setCatForm({ ...catForm, active: e.target.checked })} />
              Active
            </label>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={() => setCatModalOpen(false)} style={{ flex: 1, background: '#6c757d', color: 'white', padding: '10px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              <button onClick={handleCatSubmit} style={{ flex: 1, background: '#28a745', color: 'white', padding: '10px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PAPER MODAL ===== */}
      {paperModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}>
          <div style={{ background: cardBg, borderRadius: 20, padding: 28, maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: headingColor, marginBottom: 16 }}>{editPaperId ? 'Edit' : 'Add'} Paper</h3>
            <label style={{ color: textColor, fontWeight: 'bold' }}>Category *</label>
            <select value={paperForm.categoryId} onChange={e => setPaperForm({ ...paperForm, categoryId: e.target.value })} style={{ width: '100%', padding: 10, margin: '8px 0 16px', borderRadius: 6, border: '1px solid #ccc', background: darkMode ? '#1a1a2e' : 'white', color: textColor }}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <label style={{ color: textColor, fontWeight: 'bold' }}>Name *</label>
            <input type="text" value={paperForm.name} onChange={e => setPaperForm({ ...paperForm, name: e.target.value })} style={{ width: '100%', padding: 10, margin: '8px 0 16px', borderRadius: 6, border: '1px solid #ccc', background: darkMode ? '#1a1a2e' : 'white', color: textColor }} />
            <label style={{ color: textColor, fontWeight: 'bold' }}>Description</label>
            <textarea value={paperForm.description} onChange={e => setPaperForm({ ...paperForm, description: e.target.value })} rows="2" style={{ width: '100%', padding: 10, margin: '8px 0 16px', borderRadius: 6, border: '1px solid #ccc', background: darkMode ? '#1a1a2e' : 'white', color: textColor }} />
            <label style={{ color: textColor, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={paperForm.hasCourses} onChange={e => setPaperForm({ ...paperForm, hasCourses: e.target.checked })} />
              Has Courses
            </label>
            {paperForm.hasCourses && (
              <>
                <label style={{ color: textColor, fontWeight: 'bold' }}>Courses (comma separated)</label>
                <input type="text" value={paperForm.courses.join(', ')} onChange={e => setPaperForm({ ...paperForm, courses: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} style={{ width: '100%', padding: 10, margin: '8px 0 16px', borderRadius: 6, border: '1px solid #ccc', background: darkMode ? '#1a1a2e' : 'white', color: textColor }} placeholder="Anatomy, Physiology, Pharmacology" />
              </>
            )}
            <label style={{ color: textColor, fontWeight: 'bold' }}>Order</label>
            <input type="number" value={paperForm.order} onChange={e => setPaperForm({ ...paperForm, order: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: 10, margin: '8px 0 16px', borderRadius: 6, border: '1px solid #ccc', background: darkMode ? '#1a1a2e' : 'white', color: textColor }} />
            <label style={{ color: textColor, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={paperForm.active} onChange={e => setPaperForm({ ...paperForm, active: e.target.checked })} />
              Active
            </label>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={() => setPaperModalOpen(false)} style={{ flex: 1, background: '#6c757d', color: 'white', padding: '10px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              <button onClick={handlePaperSubmit} style={{ flex: 1, background: '#28a745', color: 'white', padding: '10px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EXAM MODAL (UPDATED WITH BATCH IMPORT) ===== */}
      {examModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}>
          <div style={{ background: cardBg, borderRadius: 20, padding: 28, maxWidth: 700, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: headingColor, marginBottom: 16 }}>{editExamId ? 'Edit' : 'Add'} Exam</h3>
            <label style={{ color: textColor, fontWeight: 'bold' }}>Paper *</label>
            <select value={examForm.paperId} onChange={e => setExamForm({ ...examForm, paperId: e.target.value })} style={{ width: '100%', padding: 10, margin: '8px 0 16px', borderRadius: 6, border: '1px solid #ccc', background: darkMode ? '#1a1a2e' : 'white', color: textColor }}>
              <option value="">Select Paper</option>
              {papers.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
            <label style={{ color: textColor, fontWeight: 'bold' }}>Title *</label>
            <input type="text" value={examForm.title} onChange={e => setExamForm({ ...examForm, title: e.target.value })} style={{ width: '100%', padding: 10, margin: '8px 0 16px', borderRadius: 6, border: '1px solid #ccc', background: darkMode ? '#1a1a2e' : 'white', color: textColor }} />
            <label style={{ color: textColor, fontWeight: 'bold' }}>Description</label>
            <textarea value={examForm.description} onChange={e => setExamForm({ ...examForm, description: e.target.value })} rows="2" style={{ width: '100%', padding: 10, margin: '8px 0 16px', borderRadius: 6, border: '1px solid #ccc', background: darkMode ? '#1a1a2e' : 'white', color: textColor }} />
            <label style={{ color: textColor, fontWeight: 'bold' }}>Time Limit (minutes)</label>
            <input type="number" value={examForm.timeLimit} onChange={e => setExamForm({ ...examForm, timeLimit: parseInt(e.target.value) || 180 })} style={{ width: '100%', padding: 10, margin: '8px 0 16px', borderRadius: 6, border: '1px solid #ccc', background: darkMode ? '#1a1a2e' : 'white', color: textColor }} />
            <label style={{ color: textColor, fontWeight: 'bold' }}>Passing Score (%)</label>
            <input type="number" value={examForm.passingScore} onChange={e => setExamForm({ ...examForm, passingScore: parseInt(e.target.value) || 70 })} style={{ width: '100%', padding: 10, margin: '8px 0 16px', borderRadius: 6, border: '1px solid #ccc', background: darkMode ? '#1a1a2e' : 'white', color: textColor }} />
            <label style={{ color: textColor, fontWeight: 'bold' }}>Order</label>
            <input type="number" value={examForm.order} onChange={e => setExamForm({ ...examForm, order: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: 10, margin: '8px 0 16px', borderRadius: 6, border: '1px solid #ccc', background: darkMode ? '#1a1a2e' : 'white', color: textColor }} />
            <label style={{ color: textColor, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={examForm.isActive} onChange={e => setExamForm({ ...examForm, isActive: e.target.checked })} />
              Active
            </label>

            {/* ===== NEW: BATCH IMPORT SECTION ===== */}
            <div style={{ margin: '16px 0', padding: '12px', background: darkMode ? '#1a1a2e' : '#f8f9fa', borderRadius: 8, border: '1px dashed ' + (darkMode ? '#555' : '#aaa') }}>
              <p style={{ fontWeight: 'bold', color: headingColor }}>📥 Batch Import Questions</p>
              <p style={{ fontSize: 13, color: secondaryText, marginBottom: 8 }}>
                Paste questions in the format below. Each question must start with Q1., Q2., etc.
              </p>
              <textarea
                rows="6"
                placeholder='Q1. What is the normal heart rate? (a) 60-100 (b) 40-60 (c) 100-140 (d) 80-120
Q2. Which organ produces insulin? (a) Liver (b) Pancreas (c) Kidney (d) Stomach

Answer: b'
                value={batchInput}
                onChange={e => setBatchInput(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14, background: darkMode ? '#1a1a2e' : 'white', color: textColor, fontFamily: 'monospace', boxSizing: 'border-box', resize: 'vertical' }}
              />
              <button
                onClick={handleBatchImport}
                style={{ marginTop: 8, background: '#17a2b8', color: 'white', padding: '6px 16px', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}
              >
                Import Questions
              </button>
              {batchResult && <p style={{ marginTop: 6, color: '#28a745', fontSize: 13 }}>{batchResult}</p>}
            </div>

            <label style={{ color: textColor, fontWeight: 'bold' }}>Current Questions ({examForm.questions.length})</label>
            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12, padding: '8px', background: darkMode ? '#1a1a2e' : '#f8f9fa', borderRadius: 6, border: '1px solid #ddd' }}>
              {examForm.questions.length === 0 ? (
                <p style={{ color: secondaryText, fontSize: 13, textAlign: 'center' }}>No questions added yet.</p>
              ) : (
                examForm.questions.map((q, idx) => (
                  <div key={idx} style={{ padding: '4px 0', borderBottom: '1px solid ' + (darkMode ? '#444' : '#eee'), fontSize: 13, color: textColor }}>
                    <strong>{idx+1}.</strong> {q.questionText}
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button onClick={() => setExamModalOpen(false)} style={{ flex: 1, background: '#6c757d', color: 'white', padding: '10px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              <button onClick={handleExamSubmit} style={{ flex: 1, background: '#28a745', color: 'white', padding: '10px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};