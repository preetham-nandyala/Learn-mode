import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchModuleById } from '../redux/thunks/moduleThunks';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
// api removed
import './PracticePage.css';

const PracticePage = () => {
    const { id, level } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Redux
    const { currentModule: moduleData, loading } = useSelector(state => state.modules);

    // Local
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [results, setResults] = useState({});

    // Fetch
    useEffect(() => {
        if (!moduleData || moduleData._id !== id) {
            dispatch(fetchModuleById(id));
        }
    }, [dispatch, id, moduleData]);

    // Init Questions
    useEffect(() => {
        if (moduleData && (moduleData._id === id || moduleData._id)) {
            const filtered = (moduleData.questions || []).filter(q => (q.level || 'Basics') === level);
            setQuestions(filtered);
        }
    }, [moduleData, level, id]);

    const handleSelectAnswer = (optionIndex) => {
        if (showResult) return;
        setSelectedAnswer(optionIndex);
    };

    const handleSubmitAnswer = () => {
        if (selectedAnswer === null) return;
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = selectedAnswer === currentQuestion.correctOptionIndex;
        setResults(prev => ({ ...prev, [currentQuestion._id]: isCorrect ? 'correct' : 'wrong' }));
        setShowResult(true);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setShowResult(false);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            const prevQuestion = questions[currentQuestionIndex - 1];
            setShowResult(results[prevQuestion._id] !== undefined);
            setSelectedAnswer(null);
        }
    };

    const goToQuestion = (index) => {
        setCurrentQuestionIndex(index);
        const question = questions[index];
        setShowResult(results[question._id] !== undefined);
        setSelectedAnswer(null);
    };

    const getLevelClass = (lvl) => {
        switch (lvl) {
            case 'Basics': return 'easy';
            case 'Intermediate': return 'medium';
            case 'Advance': return 'hard';
            default: return 'easy';
        }
    };

    const getLevelName = (lvl) => {
        switch (lvl) {
            case 'Basics': return 'Level 1 - Easy';
            case 'Intermediate': return 'Level 2 - Medium';
            case 'Advance': return 'Level 3 - Hard';
            default: return lvl;
        }
    };

    if (!moduleData) return (
        <div className="practice-page__loading">
            <Spinner />
            Loading...
        </div>
    );

    if (questions.length === 0) {
        return (
            <div className="practice-page__container">
                <EmptyState
                    title="No Questions Available"
                    message="There are no questions for this level yet."
                    action={
                        <Link to={`/module/${id}`} className="practice-page__empty-btn">Back to Module</Link>
                    }
                />
            </div>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];
    const levelClass = getLevelClass(level);
    const correctCount = Object.values(results).filter(r => r === 'correct').length;
    const wrongCount = Object.values(results).filter(r => r === 'wrong').length;
    const remainingCount = questions.length - Object.keys(results).length;

    const handleRestart = () => {
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setResults({});
    };

    return (
        <div className="practice-page">
            {/* Navigation */}
            <nav className="practice-page__nav">
                <div className="practice-page__nav-left">
                    <Link to={`/module/${id}`} className="practice-page__back">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Exit
                    </Link>
                    <span className="practice-page__progress">Q {currentQuestionIndex + 1}/{questions.length}</span>
                    <span className={`practice-page__level-badge practice-page__level-badge--${levelClass}`}>
                        {getLevelName(level)}
                    </span>
                </div>
                <div className="practice-page__nav-right">
                    <span className="practice-page__mode-badge">Practice Mode</span>
                    <button onClick={handleRestart} className="practice-page__restart-btn">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Restart
                    </button>
                </div>
            </nav>

            {/* Content */}
            <div className="practice-page__content">
                {/* Main Question Area */}
                <div className="practice-page__main">
                    <div className="practice-page__question-card">
                        <div className="practice-page__question-header">
                            <p className="practice-page__question-number">Question {currentQuestionIndex + 1}</p>
                            <h2 className="practice-page__question-text">{currentQuestion.questionText}</h2>
                        </div>
                        <div className="practice-page__options">
                            {currentQuestion.options.map((opt, idx) => {
                                const isSelected = selectedAnswer === idx;
                                const isCorrectOption = idx === currentQuestion.correctOptionIndex;

                                let optionClass = 'practice-page__option';
                                if (showResult) {
                                    optionClass += ' practice-page__option--disabled';
                                    if (isCorrectOption) {
                                        optionClass += ' practice-page__option--correct';
                                    } else if (isSelected && !isCorrectOption) {
                                        optionClass += ' practice-page__option--wrong';
                                    }
                                } else if (isSelected) {
                                    optionClass += ' practice-page__option--selected';
                                }

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => handleSelectAnswer(idx)}
                                        className={optionClass}
                                    >
                                        <div className="practice-page__option-radio">
                                            {showResult && isCorrectOption && (
                                                <svg className="practice-page__option-radio-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                            {showResult && isSelected && !isCorrectOption && (
                                                <svg className="practice-page__option-radio-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                            {!showResult && isSelected && <div className="practice-page__option-radio-dot"></div>}
                                        </div>
                                        <span className="practice-page__option-letter">{String.fromCharCode(65 + idx)}</span>
                                        <span className="practice-page__option-label">{opt}</span>
                                        {showResult && isCorrectOption && (
                                            <span className="practice-page__option-badge practice-page__option-badge--correct">Correct</span>
                                        )}
                                        {showResult && isSelected && !isCorrectOption && (
                                            <span className="practice-page__option-badge practice-page__option-badge--wrong">Wrong</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Explanation */}
                        {showResult && currentQuestion.explanation && (
                            <div className="practice-page__explanation">
                                <svg className="practice-page__explanation-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="practice-page__explanation-content">
                                    <h4 className="practice-page__explanation-title">Explanation</h4>
                                    <p className="practice-page__explanation-text">{currentQuestion.explanation}</p>
                                </div>
                            </div>
                        )}

                        {/* Nav Buttons */}
                        <div className="practice-page__nav-buttons">
                            <button
                                onClick={handlePrevQuestion}
                                disabled={currentQuestionIndex === 0}
                                className="practice-page__nav-btn practice-page__nav-btn--prev"
                            >
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Previous
                            </button>
                            {!showResult ? (
                                <button
                                    onClick={handleSubmitAnswer}
                                    disabled={selectedAnswer === null}
                                    className="practice-page__nav-btn practice-page__nav-btn--next"
                                >
                                    Check Answer
                                </button>
                            ) : (
                                <button
                                    onClick={handleNextQuestion}
                                    disabled={currentQuestionIndex === questions.length - 1}
                                    className="practice-page__nav-btn practice-page__nav-btn--next"
                                >
                                    Next
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="practice-page__sidebar">
                    <div className="practice-page__sidebar-header">
                        <h3 className="practice-page__sidebar-title">Questions</h3>
                    </div>
                    <div className="practice-page__question-map-container">
                        <div className="practice-page__question-map">
                            {questions.map((q, i) => {
                                let btnClass = 'practice-page__question-map-btn';
                                if (currentQuestionIndex === i) {
                                    btnClass += ' practice-page__question-map-btn--current';
                                } else if (results[q._id] === 'correct') {
                                    btnClass += ' practice-page__question-map-btn--correct';
                                } else if (results[q._id] === 'wrong') {
                                    btnClass += ' practice-page__question-map-btn--wrong';
                                }
                                return (
                                    <button
                                        key={i}
                                        onClick={() => goToQuestion(i)}
                                        className={btnClass}
                                    >
                                        {i + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="practice-page__stats">
                        <div className="practice-page__stat">
                            <div className="practice-page__stat-dot practice-page__stat-dot--correct"></div>
                            <span className="practice-page__stat-text">Correct: <strong>{correctCount}</strong></span>
                        </div>
                        <div className="practice-page__stat">
                            <div className="practice-page__stat-dot practice-page__stat-dot--wrong"></div>
                            <span className="practice-page__stat-text">Wrong: <strong>{wrongCount}</strong></span>
                        </div>
                        <div className="practice-page__stat">
                            <div className="practice-page__stat-dot practice-page__stat-dot--remaining"></div>
                            <span className="practice-page__stat-text">Remaining: <strong>{remainingCount}</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PracticePage;
