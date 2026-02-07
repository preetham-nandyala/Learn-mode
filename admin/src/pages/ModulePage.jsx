import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchModuleById, addQuestion, updateQuestion, deleteQuestion, bulkAddQuestions } from '../redux/thunks/moduleThunks';
import TechLogo from '../components/TechLogo';
import { getTechColors } from '../utils/themeUtils';
import './ModulePage.css';

const ModulePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [currentView, setCurrentView] = useState('selection'); // 'selection' | 'questions' | 'material'

    // Redux State
    const { currentModule: moduleData, loading, error } = useSelector(state => state.modules);

    // Local State
    const [questionText, setQuestionText] = useState('');
    const [explanation, setExplanation] = useState('');
    const [level, setLevel] = useState('Basics');
    const [options, setOptions] = useState(['', '', '', '']);
    const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
    const [adminActiveLevel, setAdminActiveLevel] = useState('Basics');

    const [isAdding, setIsAdding] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState(null);
    const [importMode, setImportMode] = useState(false);
    const [jsonInput, setJsonInput] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const filteredQuestions = moduleData?.questions?.filter(q => (q.level || 'Basics') === adminActiveLevel) || [];

    const toggleSelect = (qId) => {
        setSelectedIds(prev =>
            prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
        );
    };

    const toggleSelectAll = () => {
        if (!moduleData?.questions) return;
        const allIds = filteredQuestions.map(q => q._id);
        const isAllSelected = allIds.length > 0 && allIds.every(id => selectedIds.includes(id));

        if (isAllSelected) {
            setSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
        } else {
            setSelectedIds([...new Set([...selectedIds, ...allIds])]);
        }
    };

    const handleDeleteSelected = () => {
        if (selectedIds.length > 0) {
            setShowDeleteModal(true);
        }
    };

    const confirmDelete = async () => {
        try {
            await Promise.all(selectedIds.map(qId =>
                dispatch(deleteQuestion({ moduleId: id, questionId: qId })).unwrap()
            ));
            setSelectedIds([]);
        } catch (error) {
            console.error('Delete failed', error);
        } finally {
            setShowDeleteModal(false);
        }
    };

    useEffect(() => {
        // Only fetch if ID changed or we don't have data
        if (id) {
            dispatch(fetchModuleById(id));
        }
    }, [dispatch, id]);

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleAddQuestion = async (e) => {
        e.preventDefault();
        setIsAdding(true);
        try {
            const questionData = {
                questionText,
                options,
                correctOptionIndex: parseInt(correctOptionIndex),
                explanation,
                level
            };

            if (editingQuestionId) {
                await dispatch(updateQuestion({
                    moduleId: id,
                    questionId: editingQuestionId,
                    questionData
                })).unwrap();
            } else {
                await dispatch(addQuestion({
                    moduleId: id,
                    questionData
                })).unwrap();
            }

            setQuestionText('');
            setExplanation('');
            setOptions(['', '', '', '']);
            setCorrectOptionIndex(0);
            setEditingQuestionId(null);
        } catch (error) {
            console.error(error);
            alert(`Failed to ${editingQuestionId ? 'update' : 'add'} question`);
        } finally {
            setIsAdding(false);
        }
    };

    const handleEdit = (q) => {
        setQuestionText(q.questionText);
        setOptions([...q.options]);
        setCorrectOptionIndex(q.correctOptionIndex);
        setExplanation(q.explanation || '');
        setLevel(q.level || 'Basics');
        setEditingQuestionId(q._id);
    };

    const handleCancelEdit = () => {
        setQuestionText('');
        setExplanation('');
        setOptions(['', '', '', '']);
        setCorrectOptionIndex(0);
        setEditingQuestionId(null);
    };

    const handleBulkImport = async (e) => {
        e.preventDefault();
        setIsAdding(true);

        try {
            let parsedQuestions;
            try {
                parsedQuestions = JSON.parse(jsonInput);
            } catch (err) {
                alert('Invalid JSON format. Please check your input.');
                setIsAdding(false);
                return;
            }

            if (!Array.isArray(parsedQuestions)) {
                // Support single object as array
                parsedQuestions = [parsedQuestions];
            }

            // Normalize keys (allow 'question' for 'questionText')
            parsedQuestions = parsedQuestions.map(q => ({
                ...q,
                questionText: q.questionText || q.question
            }));

            // Basic validation
            const isValid = parsedQuestions.every(q =>
                q.questionText &&
                Array.isArray(q.options) &&
                q.options.length >= 2 &&
                q.correctOptionIndex !== undefined
            );

            if (!isValid) {
                alert('Invalid data structure. Each question must have questionText, options array, and correctOptionIndex.');
                setIsAdding(false);
                return;
            }

            await dispatch(bulkAddQuestions({ moduleId: id, questions: parsedQuestions })).unwrap();

            setJsonInput('');
            setImportMode(false);
            setSuccessMessage(`Successfully imported ${parsedQuestions.length} questions!`);
            setShowSuccessModal(true);
        } catch (error) {
            console.error(error);
            alert('Failed to import questions');
        } finally {
            setIsAdding(false);
        }
    };

    const getLevelClass = (lvl) => {
        switch (lvl) {
            case 'Basics': return 'easy';
            case 'Intermediate': return 'medium';
            case 'Advance': return 'hard';
            default: return 'easy';
        }
    };

    if (!moduleData) return (
        <div className="module-page__loading">
            <svg className="module-page__spinner" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading module...
        </div>
    );

    const levelClass = getLevelClass(adminActiveLevel);
    const techColors = moduleData ? getTechColors(moduleData.title) : {};

    const handleBack = (e) => {
        if (currentView !== 'selection') {
            e.preventDefault();
            setCurrentView('selection');
        }
    };

    return (
        <div className="module-page">
            <header className="module-page__header" style={{ borderBottomColor: `${techColors.secondary || '#282828'}40`, background: `linear-gradient(to right, ${techColors.primary || '#1A1A1A'}30, rgba(26,26,26,0.9))` }}>
                <div className="module-page__header-inner">
                    <div className="module-page__header-left">
                        <Link to="/modules" onClick={handleBack} className="module-page__back">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div className="module-page__header-logo" style={{ background: techColors.gradient, padding: 6, borderRadius: 8, marginRight: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TechLogo title={moduleData.title} style={{ width: 24, height: 24, display: 'block' }} />
                        </div>
                        <h1 className="module-page__title" style={{
                            background: techColors.gradient || '#EFEFEF',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>{moduleData.title}</h1>
                    </div>
                    <div className="module-page__header-right">
                        <div className="module-page__stats">
                            <p className="module-page__stats-value">{moduleData.questions?.length || 0}</p>
                            <p className="module-page__stats-label">Questions</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="module-page__content">
                {currentView === 'selection' && (
                    <div className="module-page__selection-grid">
                        <div
                            className="module-page__selection-card module-page__selection-card--material"
                            onClick={() => setCurrentView('material')}
                        >
                            <div className="module-page__selection-icon">
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="32" height="32">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h3 className="module-page__selection-title">Learning Material</h3>
                            <p className="module-page__selection-desc">Manage study notes, video links, and other educational resources for this module.</p>
                            <div className="module-page__selection-arrow">
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </div>

                        <div
                            className="module-page__selection-card module-page__selection-card--questions"
                            onClick={() => setCurrentView('questions')}
                        >
                            <div className="module-page__selection-icon">
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="32" height="32">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="module-page__selection-title">MCQ Questions</h3>
                            <p className="module-page__selection-desc">Create and manage multiple choice questions, quizzes, and difficulty levels.</p>
                            <div className="module-page__selection-arrow">
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )}

                {currentView === 'material' && (
                    <div className="module-page__empty">
                        <div className="module-page__empty-icon">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="module-page__empty-title">Learning Material Manager</h3>
                        <p className="module-page__empty-text">This feature is coming soon.</p>
                        <button onClick={() => setCurrentView('selection')} className="module-page__cancel-btn" style={{ marginTop: '24px', width: 'auto' }}>
                            Go Back
                        </button>
                    </div>
                )}

                {currentView === 'questions' && (
                    <div className="module-page__grid">
                        {/* Form (Left - Fixed) */}
                        <div className="module-page__form-section">
                            <div className="module-page__form-card" style={{ borderColor: `${techColors.secondary || '#282828'}40`, boxShadow: `0 4px 20px ${techColors.primary}10` }}>
                                <div className="module-page__form-header">
                                    <div className="module-page__form-header-left">
                                        <div className="module-page__form-icon">
                                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                        <h2 className="module-page__form-title">
                                            {importMode ? 'Bulk Import' : (editingQuestionId ? 'Edit Question' : 'Add Question')}
                                        </h2>
                                    </div>
                                    <div className="module-page__header-actions">
                                        <button
                                            type="button"
                                            onClick={() => setImportMode(!importMode)}
                                            className="module-page__mode-btn"
                                        >
                                            {importMode ? 'Single Add' : 'Bulk JSON'}
                                        </button>
                                    </div>
                                </div>
                                {importMode ? (
                                    <form onSubmit={handleBulkImport} className="module-page__form">
                                        <div className="module-page__field">
                                            <label className="module-page__label">
                                                Paste JSON Questions
                                                <span style={{ fontSize: '10px', color: '#666', marginLeft: '8px', fontWeight: 'normal' }}>
                                                    [{"{"} "questionText": "...", "options": ["..."], "correctOptionIndex": 0, "level": "Basics" {"}"}]
                                                </span>
                                            </label>
                                            <textarea
                                                className="module-page__textarea"
                                                rows={15}
                                                placeholder='[
    {
        "questionText": "What is 2+2?",
        "options": ["3", "4", "5", "6"],
        "correctOptionIndex": 1,
        "level": "Basics",
        "explanation": "Simple math"
    }
]'
                                                value={jsonInput}
                                                onChange={(e) => setJsonInput(e.target.value)}
                                                required
                                                style={{ fontFamily: 'monospace', fontSize: '12px' }}
                                            />
                                        </div>
                                        <div className="module-page__form-actions">
                                            <button type="submit" className="module-page__submit" disabled={isAdding}>
                                                {isAdding ? 'Importing...' : 'Import Questions'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <form onSubmit={handleAddQuestion} className="module-page__form">

                                        <div className="module-page__field">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <label className="module-page__label" style={{ margin: 0 }}>Question Text</label>
                                                <div className="module-page__header-levels">
                                                    {['Basics', 'Intermediate', 'Advance'].map((lvl) => (
                                                        <button
                                                            key={lvl}
                                                            type="button"
                                                            onClick={() => setLevel(lvl)}
                                                            className={`module-page__level-compact-btn module-page__level-compact-btn--${getLevelClass(lvl)} ${level === lvl ? 'active' : ''}`}
                                                            title={lvl === 'Basics' ? 'Easy' : lvl === 'Intermediate' ? 'Medium' : 'Hard'}
                                                        >
                                                            {lvl === 'Basics' ? 'Easy' : lvl === 'Intermediate' ? 'Medium' : 'Hard'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <textarea
                                                className="module-page__textarea"
                                                rows={3}
                                                placeholder="Enter the question..."
                                                value={questionText}
                                                onChange={(e) => setQuestionText(e.target.value)}
                                                required
                                            />
                                        </div>

                                        <div className="module-page__field">
                                            <label className="module-page__label">Answer Options</label>
                                            <div className="module-page__options">
                                                {options.map((opt, idx) => (
                                                    <div key={idx} className="module-page__option">
                                                        <button
                                                            type="button"
                                                            onClick={() => setCorrectOptionIndex(idx)}
                                                            className={`module-page__option-check ${correctOptionIndex === idx ? 'module-page__option-check--active' : ''}`}
                                                        >
                                                            {correctOptionIndex === idx && (
                                                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                        <input
                                                            type="text"
                                                            placeholder={`Option ${idx + 1}`}
                                                            className="module-page__option-input"
                                                            value={opt}
                                                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="module-page__hint">Click circle to mark correct answer</p>
                                        </div>

                                        <div className="module-page__field">
                                            <label className="module-page__label">Explanation (Optional)</label>
                                            <textarea
                                                className="module-page__textarea"
                                                rows={2}
                                                placeholder="Explain why this is correct..."
                                                value={explanation}
                                                onChange={(e) => setExplanation(e.target.value)}
                                            />
                                        </div>

                                        <div className="module-page__form-actions">
                                            <button type="submit" className="module-page__submit" disabled={isAdding}>
                                                {isAdding ? (
                                                    <>
                                                        <svg className="module-page__submit-spinner" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        {editingQuestionId ? 'Updating...' : 'Adding...'}
                                                    </>
                                                ) : (editingQuestionId ? 'Update Question' : 'Add Question')}
                                            </button>
                                            {editingQuestionId && (
                                                <button
                                                    type="button"
                                                    onClick={handleCancelEdit}
                                                    className="module-page__cancel-btn"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Questions List (Right - Scrollable) */}
                        <div className="module-page__questions-column">
                            <div className="module-page__questions-header-sticky">
                                <div className="module-page__questions-header-left">
                                    <div className="module-page__checkbox-wrapper">
                                        <input
                                            type="checkbox"
                                            className="module-page__checkbox"
                                            checked={filteredQuestions.length > 0 && filteredQuestions.every(q => selectedIds.includes(q._id))}
                                            onChange={toggleSelectAll}
                                            disabled={filteredQuestions.length === 0}
                                        />
                                    </div>
                                    <h2 className="module-page__questions-title">Questions ({filteredQuestions.length})</h2>
                                </div>

                                <div className="module-page__questions-actions">
                                    {selectedIds.length > 0 && (
                                        <button onClick={handleDeleteSelected} className="module-page__delete-btn">
                                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete ({selectedIds.length})
                                        </button>
                                    )}
                                    <div className="module-page__tabs">
                                        {['Basics', 'Intermediate', 'Advance'].map((lvl) => (
                                            <button
                                                key={lvl}
                                                onClick={() => { setAdminActiveLevel(lvl); setSelectedIds([]); }}
                                                className={`module-page__tab module-page__tab--${getLevelClass(lvl)} ${adminActiveLevel === lvl ? 'active' : ''}`}
                                            >
                                                {lvl === 'Basics' ? 'Easy' : lvl === 'Intermediate' ? 'Medium' : 'Hard'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {filteredQuestions.length === 0 ? (
                                <div className="module-page__empty">
                                    <div className="module-page__empty-icon">
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="module-page__empty-title">
                                        No {adminActiveLevel === 'Basics' ? 'Easy' : adminActiveLevel === 'Intermediate' ? 'Medium' : 'Hard'} questions
                                    </h3>
                                    <p className="module-page__empty-text">Add questions using the form</p>
                                </div>
                            ) : (
                                <div className="module-page__questions-list">
                                    {filteredQuestions.map((q, i) => (
                                        <div
                                            key={q._id}
                                            className={`module-page__question-card ${selectedIds.includes(q._id) ? 'selected' : ''}`}
                                            style={{
                                                borderColor: selectedIds.includes(q._id) ? (techColors.primary || '#FF375F') : `${techColors.secondary || '#282828'}40`,
                                                backgroundColor: selectedIds.includes(q._id) ? `${techColors.primary || '#FF375F'}10` : undefined
                                            }}
                                        >
                                            <div className="module-page__question-content">
                                                <div className="module-page__question-header">
                                                    <div className="module-page__checkbox-wrapper">
                                                        <input
                                                            type="checkbox"
                                                            className="module-page__checkbox"
                                                            checked={selectedIds.includes(q._id)}
                                                            onChange={() => toggleSelect(q._id)}
                                                        />
                                                    </div>
                                                    <span className={`module-page__question-number module-page__question-number--${levelClass}`}>
                                                        {i + 1}
                                                    </span>
                                                    <div className="module-page__question-info">
                                                        <div className="module-page__question-row">
                                                            <h3 className="module-page__question-text">{q.questionText}</h3>
                                                            <button
                                                                className="module-page__edit-icon-btn"
                                                                onClick={() => handleEdit(q)}
                                                                title="Edit Question"
                                                            >
                                                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="module-page__question-options">
                                                    {q.options.map((opt, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`module-page__question-option ${idx === q.correctOptionIndex ? 'module-page__question-option--correct' : ''}`}
                                                        >
                                                            <span className="module-page__question-option-letter">
                                                                {String.fromCharCode(65 + idx)}
                                                            </span>
                                                            {opt}
                                                            {idx === q.correctOptionIndex && (
                                                                <svg className="module-page__question-option-check" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                {q.explanation && (
                                                    <div className="module-page__question-explanation">
                                                        <svg className="module-page__question-explanation-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <p className="module-page__question-explanation-text">{q.explanation}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="module-page__modal-overlay">
                    <div className="module-page__modal">
                        <h3 className="module-page__modal-title">Delete Questions?</h3>
                        <p className="module-page__modal-text">
                            Are you sure you want to delete {selectedIds.length} selected question{selectedIds.length > 1 ? 's' : ''}? This action cannot be undone.
                        </p>
                        <div className="module-page__modal-actions">
                            <button
                                className="module-page__modal-btn module-page__modal-btn--cancel"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="module-page__modal-btn module-page__modal-btn--delete"
                                onClick={confirmDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="module-page__modal-overlay">
                    <div className="module-page__modal">
                        <div className="module-page__modal-icon-success">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 24, height: 24 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="module-page__modal-title">Success</h3>
                        <p className="module-page__modal-text">{successMessage}</p>
                        <div className="module-page__modal-actions">
                            <button
                                className="module-page__modal-btn module-page__modal-btn--confirm"
                                onClick={() => setShowSuccessModal(false)}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModulePage;
