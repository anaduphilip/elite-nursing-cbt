// src/components/admin/tabs/PreCouncilAdmin.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getHeadingColor, getSecondaryText, getTextColor, getCardBg } from '../../../utils/theme';
import CloudinaryUpload from '../CloudinaryUpload'; // ← NEW

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
  const [coursesRaw, setCoursesRaw] = useState('');
  const [editPaperId, setEditPaperId] = useState(null);
  const [paperModalOpen, setPaperModalOpen] = useState(false);
  const [courseInput, setCourseInput] = useState('');

  // ---- EXAM FORM (now includes categoryId for filtering) ----
  const [examForm, setExamForm] = useState({
    categoryId: '',       // NEW: used only to filter papers, not saved
    paperId: '',
    title: '',
    description: '',
    questions: [],
    timeLimit: 180,
    passingScore: 70,
    order: 0,
    isActive: true
  });
  const [editExamId, setEditExamId] = useState(null);
  const [examModalOpen, setExamModalOpen] = useState(false);
  // ---- Batch import state ----
  const [batchInput, setBatchInput] = useState('');
  const [batchResult, setBatchResult] = useState('');

  // ---- Single question form ----
  const [questionForm, setQuestionForm] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 1
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);

  // ===== NEW: IMAGE UPLOAD STATE =====
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [imageQuestionIndex, setImageQuestionIndex] = useState(null);
  const [imageQuestionId, setImageQuestionId] = useState(null);
  const [currentExamIdForImage, setCurrentExamIdForImage] = useState(null);

  // ---- FETCH DATA ----
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [catRes, paperRes, examRes] = await Promise.all([
        axios.get('/api/admin/pre-council/categories', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/pre-council/papers', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/admin/pre-council/exams', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setCategories(catRes.data.categories || []);
      setPapers(paperRes.data.papers || []);
      setExams(examRes.data.exams || []);
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
    if (payload.hasCourses && coursesRaw.trim()) {
      payload.courses = coursesRaw.split(',').map(s => s.trim()).filter(Boolean);
    } else {
      payload.courses = [];
    }
    try {
      const url = editPaperId ? `/api/admin/pre-council/papers/${editPaperId}` : '/api/admin/pre-council/papers';
      const method = editPaperId ? 'put' : 'post';
      const res = await axios[method](url, payload, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        fetchAll();
        setPaperModalOpen(false);
        setPaperForm({ categoryId: '', name: '', description: '', hasCourses: false, courses: [], order: 0, active: true });
        setCoursesRaw('');
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
        setExamForm({ categoryId: '', paperId: '', title: '', description: '', questions: [], timeLimit: 180, passingScore: 70, order: 0, isActive: true });
        setEditExamId(null);
        setBatchInput('');
        setBatchResult('');
        setQuestionForm({ questionText: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 });
        setEditingQuestionIndex(null);
        setShowQuestionForm(false);
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

  // ---- BATCH IMPORT ----
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

      const optionPattern = /\(([a-d])\)\s*([^(]+?)(?=\s*\([a-d]\)|$)/gi;
      let match;
      while ((match = optionPattern.exec(fullText)) !== null) {
        options.push(match[2].trim());
      }

      if (options.length !== 4) {
        const linesInBlock = block.split('\n');
        for (const line of linesInBlock) {
          const optMatch = line.match(/^\(([a-d])\)\s*(.*)/i);
          if (optMatch) {
            options.push(optMatch[2].trim());
          }
        }
      }

      let questionText = fullText.replace(/\s*\([a-d]\)[^(]*/g, '').trim();
      if (!questionText) {
        const firstLine = block.split('\n')[0];
        if (firstLine) {
          questionText = firstLine.replace(/^Q\d+\.\s*/i, '').trim();
        }
      }

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

    setExamForm(prev => ({
      ...prev,
      questions: [...prev.questions, ...parsedQuestions]
    }));
    setBatchInput('');
    setBatchResult(`✅ ${parsedQuestions.length} questions added to the exam.`);
  };

  // ===== HELPER: Extract category ID from a paper (handles both string and populated object) =====
  const getPaperCategoryId = (paper) => {
    if (!paper) return '';
    const catId = paper.categoryId;
    if (!catId) return '';
    if (typeof catId === 'object' && catId._id) {
      return String(catId._id);
    }
    return String(catId);
  };

  // ===== HELPER: Get category name (handles both string and populated object) =====
  const getCategoryName = (catId) => {
    if (!catId) return '⚠️ Category not set';
    if (typeof catId === 'object' && catId.name) {
      return catId.name;
    }
    const cat = categories.find(c => String(c._id) === String(catId));
    return cat ? cat.name : `⚠️ Category not found (ID: ${String(catId)})`;
  };

  const getPaperName = (paperId) => {
    if (!paperId) return '⚠️ Paper not set';
    if (typeof paperId === 'object' && paperId.name) {
      return paperId.name;
    }
    const paper = papers.find(p => String(p._id) === String(paperId));
    return paper ? paper.name : `⚠️ Paper not found (ID: ${String(paperId)})`;
  };

  // ===== NEW: IMAGE UPLOAD HANDLERS =====
  const openImageUpload = (questionIndex, questionId, examId) => {
    setImageQuestionIndex(questionIndex);
    setImageQuestionId(questionId);
    setCurrentExamIdForImage(examId);
    setShowImageUpload(true);
  };

  const handleImageUploadSuccess = async (url) => {
    try {
      const res = await axios.patch(
        `/api/admin/pre-council/exams/${currentExamIdForImage}/questions/${imageQuestionId}/image`,
        { imageUrl: url },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        // Update the local examForm.questions array
        const updatedQuestions = [...examForm.questions];
        updatedQuestions[imageQuestionIndex] = {
          ...updatedQuestions[imageQuestionIndex],
          imageUrl: url
        };
        setExamForm({ ...examForm, questions: updatedQuestions });
        setShowImageUpload(false);
        alert('✅ Image added successfully!');
      }
    } catch (error) {
      alert('Failed to save image: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleImageRemove = async () => {
    if (!window.confirm('Remove this image?')) return;
    try {
      const res = await axios.delete(
        `/api/admin/pre-council/exams/${currentExamIdForImage}/questions/${imageQuestionId}/image`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        const updatedQuestions = [...examForm.questions];
        updatedQuestions[imageQuestionIndex] = {
          ...updatedQuestions[imageQuestionIndex],
          imageUrl: null
        };
        setExamForm({ ...examForm, questions: updatedQuestions });
        setShowImageUpload(false);
        alert('✅ Image removed');
      }
    } catch (error) {
      alert('Failed to remove image: ' + (error.response?.data?.error || error.message));
    }
  };

  // ===== END IMAGE UPLOAD =====

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

      {/* ===== CATEGORIES (unchanged) ===== */}
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

      {/* ===== PAPERS – GROUPED BY CATEGORY (unchanged) ===== */}
      {activeSubTab === 'papers' && (
        <div>
          <button onClick={() => { setPaperForm({ categoryId: '', name: '', description: '', hasCourses: false, courses: [], order: 0, active: true }); setCoursesRaw(''); setEditPaperId(null); setPaperModalOpen(true); }} style={{ background: '#28a745', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', marginBottom: 16 }}>+ Add Paper</button>
          
          {papers.length === 0 ? (
            <p style={{ color: secondaryText }}>No papers found.</p>
          ) : (
            (() => {
              const grouped = {};
              papers.forEach(p => {
                const catId = getPaperCategoryId(p);
                const key = catId || 'unknown';
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(p);
              });
              
              return Object.keys(grouped).map(catId => {
                const catName = getCategoryName(catId);
                const catPapers = grouped[catId];
                return (
                  <div key={catId} style={{ marginBottom: 24 }}>
                    <h4 style={{ color: headingColor, borderBottom: '2px solid #1e3c72', paddingBottom: 6, marginBottom: 12 }}>
                      {catName} ({catPapers.length})
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                      {catPapers.map(p => (
                        <div key={p._id} style={{ background: darkMode ? '#1a1a2e' : '#f8f9fa', padding: 16, borderRadius: 12, border: '1px solid ' + (darkMode ? '#444' : '#e0e0e0') }}>
                          <h4 style={{ color: headingColor }}>{p.name}</h4>
                          <p style={{ fontSize: 13, color: secondaryText }}>Category: {getCategoryName(getPaperCategoryId(p))}</p>
                          <p style={{ fontSize: 13, color: secondaryText }}>Courses: {p.hasCourses ? (p.courses?.join(', ') || 'None') : 'N/A'}</p>
                          <p style={{ fontSize: 12, color: secondaryText }}>Order: {p.order} | {p.active ? '✅ Active' : '❌ Inactive'}</p>
                          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                            <button onClick={() => { setPaperForm({ categoryId: getPaperCategoryId(p), name: p.name, description: p.description || '', hasCourses: p.hasCourses, courses: p.courses || [], order: p.order, active: p.active }); setCoursesRaw(p.courses?.join(', ') || ''); setEditPaperId(p._id); setPaperModalOpen(true); }} style={{ background: '#ffc107', color: '#333', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                            <button onClick={() => deletePaper(p._id)} style={{ background: '#dc3545', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>
      )}

      {/* ===== EXAMS – GROUPED BY PAPER (unchanged) ===== */}
      {activeSubTab === 'exams' && (
        <div>
          <button onClick={() => { 
            setExamForm({ 
              categoryId: '', 
              paperId: '', 
              title: '', 
              description: '', 
              questions: [], 
              timeLimit: 180, 
              passingScore: 70, 
              order: 0, 
              isActive: true 
            }); 
            setEditExamId(null); 
            setExamModalOpen(true); 
          }} style={{ background: '#28a745', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', marginBottom: 16 }}>+ Add Exam</button>
          
          {exams.length === 0 ? (
            <p style={{ color: secondaryText }}>No exams found.</p>
          ) : (
            (() => {
              const grouped = {};
              exams.forEach(e => {
                let paperId = e.paperId;
                if (paperId && typeof paperId === 'object' && paperId._id) {
                  paperId = paperId._id;
                }
                const key = String(paperId) || 'unknown';
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(e);
              });
              
              return Object.keys(grouped).map(paperIdKey => {
                const paper = papers.find(p => String(p._id) === String(paperIdKey));
                const paperName = paper ? paper.name : `⚠️ Paper not found (ID: ${String(paperIdKey)})`;
                let categoryName = '⚠️ Category not found';
                if (paper) {
                  categoryName = getCategoryName(getPaperCategoryId(paper));
                }
                const paperExams = grouped[paperIdKey];
                return (
                  <div key={paperIdKey} style={{ marginBottom: 24 }}>
                    <h4 style={{ color: headingColor, borderBottom: '2px solid #1e3c72', paddingBottom: 6, marginBottom: 12 }}>
                      {paperName} <span style={{ fontWeight: 'normal', fontSize: 14, color: secondaryText }}>({categoryName})</span>
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                      {paperExams.map(e => {
                        const examPaperName = (typeof e.paperId === 'object' && e.paperId.name) ? e.paperId.name : paperName;
                        return (
                          <div key={e._id} style={{ background: darkMode ? '#1a1a2e' : '#f8f9fa', padding: 16, borderRadius: 12, border: '1px solid ' + (darkMode ? '#444' : '#e0e0e0') }}>
                            <h4 style={{ color: headingColor }}>{e.title}</h4>
                            <p style={{ fontSize: 13, color: secondaryText }}>Paper: {examPaperName}</p>
                            <p style={{ fontSize: 13, color: secondaryText }}>Questions: {e.questionCount || 0} | Time: {e.timeLimit || 180} min</p>
                            <p style={{ fontSize: 12, color: secondaryText }}>Passing: {e.passingScore || 70}% | Order: {e.order} | {e.isActive ? '✅ Active' : '❌ Inactive'}</p>
                            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                              <button onClick={() => {
                                // When editing, pre‑select the category based on the paper
                                const paperObj = papers.find(p => String(p._id) === String(e.paperId));
                                const catId = paperObj ? getPaperCategoryId(paperObj) : '';
                                setExamForm({
                                  categoryId: catId,
                                  paperId: e.paperId,
                                  title: e.title,
                                  description: e.description || '',
                                  questions: e.questions || [],
                                  timeLimit: e.timeLimit || 180,
                                  passingScore: e.passingScore || 70,
                                  order: e.order,
                                  isActive: e.isActive
                                });
                                setEditExamId(e._id);
                                setExamModalOpen(true);
                              }} style={{ background: '#ffc107', color: '#333', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Edit</button>
                              <button onClick={() => deleteExam(e._id)} style={{ background: '#dc3545', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}>Delete</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>
      )}

      {/* ===== CATEGORY MODAL (unchanged) ===== */}
      {catModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}>
          <div style={{ background: cardBg, borderRadius: 20, padding: 28, maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: headingColor, marginBottom: 16 }}>{editCatId ? 'Edit' : 'Add'} Category</h3>
            <label style={{ color: textColor, fontWeight: 'bold' }}>Name *</label>
            <input
              type="text"
              value={catForm.name}
              onChange={e => setCatForm({ ...catForm, name: e.target.value })}
              style={{
                width: '100%',
                padding: 10,
                margin: '8px 0 16px',
                borderRadius: 6,
                border: '1px solid #ccc',
                background: darkMode ? '#1a1a2e' : 'white',
                color: textColor,
                boxSizing: 'border-box'
              }}
            />
            <label style={{ color: textColor, fontWeight: 'bold' }}>Description</label>
            <textarea
              value={catForm.description}
              onChange={e => setCatForm({ ...catForm, description: e.target.value })}
              rows="2"
              style={{
                width: '100%',
                padding: 10,
                margin: '8px 0 16px',
                borderRadius: 6,
                border: '1px solid #ccc',
                background: darkMode ? '#1a1a2e' : 'white',
                color: textColor,
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
            <label style={{ color: textColor, fontWeight: 'bold' }}>Icon (emoji)</label>
            <input
              type="text"
              value={catForm.icon}
              onChange={e => setCatForm({ ...catForm, icon: e.target.value })}
              style={{
                width: '100%',
                padding: 10,
                margin: '8px 0 16px',
                borderRadius: 6,
                border: '1px solid #ccc',
                background: darkMode ? '#1a1a2e' : 'white',
                color: textColor,
                boxSizing: 'border-box'
              }}
            />
            <label style={{ color: textColor, fontWeight: 'bold' }}>Order</label>
            <input
              type="number"
              value={catForm.order}
              onChange={e => setCatForm({ ...catForm, order: parseInt(e.target.value) || 0 })}
              style={{
                width: '100%',
                padding: 10,
                margin: '8px 0 16px',
                borderRadius: 6,
                border: '1px solid #ccc',
                background: darkMode ? '#1a1a2e' : 'white',
                color: textColor,
                boxSizing: 'border-box'
              }}
            />
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

      {/* ===== PAPER MODAL (unchanged) ===== */}
      {paperModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}>
          <div style={{ background: cardBg, borderRadius: 20, padding: 28, maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: headingColor, marginBottom: 16 }}>{editPaperId ? 'Edit' : 'Add'} Paper</h3>
            <label style={{ color: textColor, fontWeight: 'bold' }}>Category *</label>
            <select
              value={paperForm.categoryId}
              onChange={e => setPaperForm({ ...paperForm, categoryId: e.target.value })}
              style={{
                width: '100%',
                padding: 10,
                margin: '8px 0 16px',
                borderRadius: 6,
                border: '1px solid #ccc',
                background: darkMode ? '#1a1a2e' : 'white',
                color: textColor,
                boxSizing: 'border-box'
              }}
            >
              <option value="">Select Category</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <label style={{ color: textColor, fontWeight: 'bold' }}>Name *</label>
            <input
              type="text"
              value={paperForm.name}
              onChange={e => setPaperForm({ ...paperForm, name: e.target.value })}
              style={{
                width: '100%',
                padding: 10,
                margin: '8px 0 16px',
                borderRadius: 6,
                border: '1px solid #ccc',
                background: darkMode ? '#1a1a2e' : 'white',
                color: textColor,
                boxSizing: 'border-box'
              }}
            />
            <label style={{ color: textColor, fontWeight: 'bold' }}>Description</label>
            <textarea
              value={paperForm.description}
              onChange={e => setPaperForm({ ...paperForm, description: e.target.value })}
              rows="2"
              style={{
                width: '100%',
                padding: 10,
                margin: '8px 0 16px',
                borderRadius: 6,
                border: '1px solid #ccc',
                background: darkMode ? '#1a1a2e' : 'white',
                color: textColor,
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />
            <label style={{ color: textColor, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={paperForm.hasCourses} onChange={e => setPaperForm({ ...paperForm, hasCourses: e.target.checked })} />
              Has Courses
            </label>
            {paperForm.hasCourses && (
              <>
                <label style={{ color: textColor, fontWeight: 'bold' }}>Courses (comma separated)</label>
                <input
                  type="text"
                  value={coursesRaw}
                  onChange={e => setCoursesRaw(e.target.value)}
                  style={{
                    width: '100%',
                    padding: 10,
                    margin: '8px 0 16px',
                    borderRadius: 6,
                    border: '1px solid #ccc',
                    background: darkMode ? '#1a1a2e' : 'white',
                    color: textColor,
                    boxSizing: 'border-box'
                  }}
                  placeholder="Anatomy, Physiology, Pharmacology"
                />
                <p style={{ fontSize: 12, color: secondaryText, marginTop: -8, marginBottom: 12 }}>
                  Separate each course with a comma.
                </p>
              </>
            )}
            <label style={{ color: textColor, fontWeight: 'bold' }}>Order</label>
            <input
              type="number"
              value={paperForm.order}
              onChange={e => setPaperForm({ ...paperForm, order: parseInt(e.target.value) || 0 })}
              style={{
                width: '100%',
                padding: 10,
                margin: '8px 0 16px',
                borderRadius: 6,
                border: '1px solid #ccc',
                background: darkMode ? '#1a1a2e' : 'white',
                color: textColor,
                boxSizing: 'border-box'
              }}
            />
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

      {/* ===== EXAM MODAL – WITH CATEGORY DROPDOWN & FILTERING (and NEW Image button in question list) ===== */}
      {examModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 }}>
          <div style={{ background: cardBg, borderRadius: 20, padding: 28, maxWidth: 700, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ color: headingColor, marginBottom: 16 }}>{editExamId ? 'Edit' : 'Add'} Exam</h3>

            {/* ----- NEW: Category dropdown (filters papers) ----- */}
            <label style={{ color: textColor, fontWeight: 'bold' }}>Category *</label>
            <select
              value={examForm.categoryId}
              onChange={e => {
                const catId = e.target.value;
                setExamForm({
                  ...examForm,
                  categoryId: catId,
                  paperId: '' // Reset paper when category changes
                });
              }}
              style={{
                width: '100%',
                padding: 10,
                margin: '8px 0 16px',
                borderRadius: 6,
                border: '1px solid #ccc',
                background: darkMode ? '#1a1a2e' : 'white',
                color: textColor,
                boxSizing: 'border-box'
              }}
            >
              <option value="">Select Category</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>

            {/* ----- Paper dropdown (filtered by selected category) ----- */}
            <label style={{ color: textColor, fontWeight: 'bold' }}>Paper *</label>
            <select
              value={examForm.paperId}
              onChange={e => setExamForm({ ...examForm, paperId: e.target.value })}
              style={{
                width: '100%',
                padding: 10,
                margin: '8px 0 16px',
                borderRadius: 6,
                border: '1px solid #ccc',
                background: darkMode ? '#1a1a2e' : 'white',
                color: textColor,
                boxSizing: 'border-box'
              }}
              disabled={!examForm.categoryId}
            >
              <option value="">{examForm.categoryId ? 'Select Paper' : 'Select a category first'}</option>
              {papers
                .filter(p => {
                  const paperCatId = getPaperCategoryId(p);
                  return paperCatId === String(examForm.categoryId);
                })
                .map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>

            {/* ----- Rest of the exam fields (unchanged) ----- */}
            <label style={{ color: textColor, fontWeight: 'bold' }}>Title *</label>
            <input
              type="text"
              value={examForm.title}
              onChange={e => setExamForm({ ...examForm, title: e.target.value })}
              style={{
                width: '100%',
                padding: 10,
                margin: '8px 0 16px',
                borderRadius: 6,
                border: '1px solid #ccc',
                background: darkMode ? '#1a1a2e' : 'white',
                color: textColor,
                boxSizing: 'border-box'
              }}
            />

            <label style={{ color: textColor, fontWeight: 'bold' }}>Description</label>
            <textarea
              value={examForm.description}
              onChange={e => setExamForm({ ...examForm, description: e.target.value })}
              rows="2"
              style={{
                width: '100%',
                padding: 10,
                margin: '8px 0 16px',
                borderRadius: 6,
                border: '1px solid #ccc',
                background: darkMode ? '#1a1a2e' : 'white',
                color: textColor,
                boxSizing: 'border-box',
                resize: 'vertical'
              }}
            />

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label style={{ color: textColor, fontWeight: 'bold' }}>Time (min)</label>
                <input
                  type="number"
                  value={examForm.timeLimit}
                  onChange={e => setExamForm({ ...examForm, timeLimit: parseInt(e.target.value) || 180 })}
                  style={{
                    width: '100%',
                    padding: 10,
                    margin: '8px 0',
                    borderRadius: 6,
                    border: '1px solid #1e3c72',
                    background: darkMode ? '#1a1a2e' : 'white',
                    color: textColor,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '120px' }}>
                <label style={{ color: textColor, fontWeight: 'bold' }}>Passing %</label>
                <input
                  type="number"
                  value={examForm.passingScore}
                  onChange={e => setExamForm({ ...examForm, passingScore: parseInt(e.target.value) || 70 })}
                  style={{
                    width: '100%',
                    padding: 10,
                    margin: '8px 0',
                    borderRadius: 6,
                    border: '1px solid #1e3c72',
                    background: darkMode ? '#1a1a2e' : 'white',
                    color: textColor,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div style={{ flex: '0 0 100px' }}>
                <label style={{ color: textColor, fontWeight: 'bold' }}>Order</label>
                <input
                  type="number"
                  value={examForm.order}
                  onChange={e => setExamForm({ ...examForm, order: parseInt(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    padding: 10,
                    margin: '8px 0',
                    borderRadius: 6,
                    border: '1px solid #1e3c72',
                    background: darkMode ? '#1a1a2e' : 'white',
                    color: textColor,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <label style={{ color: textColor, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <input type="checkbox" checked={examForm.isActive} onChange={e => setExamForm({ ...examForm, isActive: e.target.checked })} />
              Active
            </label>

            {/* ----- Batch Import (unchanged) ----- */}
            <div style={{ margin: '16px 0', padding: '12px', background: darkMode ? '#1a1a2e' : '#f8f9fa', borderRadius: 8, border: '1px dashed ' + (darkMode ? '#555' : '#aaa') }}>
              <p style={{ fontWeight: 'bold', color: headingColor }}>📥 Batch Import Questions</p>
              <p style={{ fontSize: 13, color: secondaryText, marginBottom: 8 }}>
                Paste questions in the format below. Each question must start with Q1., Q2., etc.
              </p>
              <textarea
                rows="4"
                placeholder='Q1. What is the normal heart rate? (a) 60-100 (b) 40-60 (c) 100-140 (d) 80-120
Q2. Which organ produces insulin? (a) Liver (b) Pancreas (c) Kidney (d) Stomach

Answer: b'
                value={batchInput}
                onChange={e => setBatchInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: 10,
                  border: '1px solid #ccc',
                  borderRadius: 6,
                  fontSize: 14,
                  background: darkMode ? '#1a1a2e' : 'white',
                  color: textColor,
                  fontFamily: 'monospace',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
              <button
                onClick={handleBatchImport}
                style={{ marginTop: 8, background: '#17a2b8', color: 'white', padding: '6px 16px', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}
              >
                Import Questions
              </button>
              {batchResult && <p style={{ marginTop: 6, color: '#28a745', fontSize: 13 }}>{batchResult}</p>}
            </div>

            {/* ----- Add Single Question (unchanged) ----- */}
            <div style={{ margin: '16px 0', padding: '12px', background: darkMode ? '#1a1a2e' : '#f8f9fa', borderRadius: 8, border: '1px solid ' + (darkMode ? '#555' : '#ddd') }}>
              <button
                onClick={() => {
                  setShowQuestionForm(!showQuestionForm);
                  if (!showQuestionForm) {
                    setEditingQuestionIndex(null);
                    setQuestionForm({ questionText: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 });
                  }
                }}
                style={{ background: '#007bff', color: 'white', padding: '4px 12px', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}
              >
                {showQuestionForm ? 'Hide Question Form' : '➕ Add Single Question'}
              </button>

              {showQuestionForm && (
                <div style={{ marginTop: 12 }}>
                  <input
                    type="text"
                    placeholder="Question text"
                    value={questionForm.questionText}
                    onChange={e => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                    style={{
                      width: '100%',
                      padding: 8,
                      marginBottom: 8,
                      borderRadius: 4,
                      border: '1px solid #ccc',
                      background: darkMode ? '#1a1a2e' : 'white',
                      color: textColor,
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {questionForm.options.map((opt, idx) => (
                      <input
                        key={idx}
                        type="text"
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        value={opt}
                        onChange={e => {
                          const newOpts = [...questionForm.options];
                          newOpts[idx] = e.target.value;
                          setQuestionForm({ ...questionForm, options: newOpts });
                        }}
                        style={{
                          padding: 6,
                          borderRadius: 4,
                          border: '1px solid #ccc',
                          background: darkMode ? '#1a1a2e' : 'white',
                          color: textColor,
                          boxSizing: 'border-box'
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <label style={{ color: textColor, fontSize: 13 }}>Correct Answer:</label>
                    <select
                      value={questionForm.correctAnswer}
                      onChange={e => setQuestionForm({ ...questionForm, correctAnswer: parseInt(e.target.value) })}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        border: '1px solid #ccc',
                        background: darkMode ? '#1a1a2e' : 'white',
                        color: textColor,
                        boxSizing: 'border-box'
                      }}
                    >
                      {questionForm.options.map((_, idx) => (
                        <option key={idx} value={idx}>Option {String.fromCharCode(65 + idx)}</option>
                      ))}
                    </select>
                    <label style={{ color: textColor, fontSize: 13 }}>Points:</label>
                    <input
                      type="number"
                      value={questionForm.points}
                      onChange={e => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 1 })}
                      style={{
                        width: 60,
                        padding: 4,
                        borderRadius: 4,
                        border: '1px solid #ccc',
                        background: darkMode ? '#1a1a2e' : 'white',
                        color: textColor,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!questionForm.questionText.trim()) return alert('Question text is required');
                      if (questionForm.options.some(o => !o.trim())) return alert('All options must be filled');
                      const newQ = {
                        questionText: questionForm.questionText.trim(),
                        options: questionForm.options.map(o => o.trim()),
                        correctAnswer: questionForm.correctAnswer,
                        points: questionForm.points || 1
                      };
                      if (editingQuestionIndex !== null) {
                        const updated = [...examForm.questions];
                        updated[editingQuestionIndex] = newQ;
                        setExamForm({ ...examForm, questions: updated });
                        setEditingQuestionIndex(null);
                      } else {
                        setExamForm({ ...examForm, questions: [...examForm.questions, newQ] });
                      }
                      setQuestionForm({ questionText: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 });
                      setShowQuestionForm(false);
                    }}
                    style={{ marginTop: 8, background: '#28a745', color: 'white', padding: '6px 16px', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}
                  >
                    {editingQuestionIndex !== null ? 'Update Question' : 'Add Question'}
                  </button>
                  {editingQuestionIndex !== null && (
                    <button
                      onClick={() => { setEditingQuestionIndex(null); setQuestionForm({ questionText: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 }); }}
                      style={{ marginLeft: 8, background: '#6c757d', color: 'white', padding: '6px 16px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ----- Question List – with NEW Image button ----- */}
            <label style={{ color: textColor, fontWeight: 'bold' }}>Current Questions ({examForm.questions.length})</label>
            <div style={{ maxHeight: 250, overflowY: 'auto', marginBottom: 12, padding: '8px', background: darkMode ? '#1a1a2e' : '#f8f9fa', borderRadius: 6, border: '1px solid #ddd' }}>
              {examForm.questions.length === 0 ? (
                <p style={{ color: secondaryText, fontSize: 13, textAlign: 'center' }}>No questions added yet.</p>
              ) : (
                examForm.questions.map((q, idx) => {
                  const currentExamId = editExamId || (examForm._id); // use editExamId if editing, else form id (but we only have examForm)
                  // We'll use the editExamId if available, otherwise the new exam hasn't been saved yet, so we can't upload images.
                  // For new exam, we'll store the exam id after creation.
                  // For now, we'll pass a dummy id if not saved – the backend will reject, but we handle it.
                  const examIdForImage = editExamId || 'new';
                  return (
                    <div key={idx} style={{ padding: '8px', borderBottom: '1px solid ' + (darkMode ? '#444' : '#eee'), fontSize: 13, color: textColor }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <strong>{idx+1}.</strong> {q.questionText}
                          <div style={{ fontSize: 12, color: secondaryText, marginTop: 2 }}>
                            {q.options.map((opt, i) => (
                              <span key={i} style={{ marginRight: 8, background: darkMode ? '#333' : '#f0f0f0', padding: '2px 6px', borderRadius: 4 }}>
                                {String.fromCharCode(65 + i)}: {opt}
                                {i === q.correctAnswer && <span style={{ color: '#28a745', marginLeft: 4 }}>✓</span>}
                              </span>
                            ))}
                          </div>
                          {q.imageUrl && (
                            <div style={{ marginTop: 4 }}>
                              <img src={q.imageUrl} alt="Question" style={{ maxHeight: 40, maxWidth: 80, borderRadius: 4 }} />
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => {
                              setEditingQuestionIndex(idx);
                              setQuestionForm({
                                questionText: q.questionText,
                                options: [...q.options],
                                correctAnswer: q.correctAnswer,
                                points: q.points || 1
                              });
                              setShowQuestionForm(true);
                            }}
                            style={{ background: '#ffc107', color: '#333', padding: '2px 8px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
                          >
                            Edit
                          </button>
                          {/* ===== NEW: Image button ===== */}
                          <button
                            onClick={() => {
                              if (!editExamId) {
                                alert('Please save the exam first before adding images.');
                                return;
                              }
                              openImageUpload(idx, q._id, editExamId);
                            }}
                            style={{
                              background: q.imageUrl ? '#28a745' : '#17a2b8',
                              color: 'white',
                              padding: '2px 8px',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: 11,
                              fontWeight: 'bold'
                            }}
                          >
                            {q.imageUrl ? '🔄 Image' : '📷 Image'}
                          </button>
                          <button
                            onClick={() => {
                              if (!window.confirm('Delete this question?')) return;
                              const updated = [...examForm.questions];
                              updated.splice(idx, 1);
                              setExamForm({ ...examForm, questions: updated });
                            }}
                            style={{ background: '#dc3545', color: 'white', padding: '2px 8px', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button onClick={() => setExamModalOpen(false)} style={{ flex: 1, background: '#6c757d', color: 'white', padding: '10px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
              <button onClick={handleExamSubmit} style={{ flex: 1, background: '#28a745', color: 'white', padding: '10px', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== IMAGE UPLOAD MODAL (NEW) ===== */}
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

            {imageQuestionIndex !== null && examForm.questions[imageQuestionIndex]?.imageUrl && (
              <div style={{ marginBottom: 16 }}>
                <img
                  src={examForm.questions[imageQuestionIndex].imageUrl}
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
              onClose={() => setShowImageUpload(false)}
              buttonText="📤 Upload Image"
            />

            <button
              onClick={() => setShowImageUpload(false)}
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