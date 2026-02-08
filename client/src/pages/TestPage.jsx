import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchModuleById, fetchTestQuestions } from '../redux/thunks/moduleThunks';
import { submitTestResult } from '../redux/thunks/testResultThunks';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import './TestPage.css';

const TestPage = () => {
    const { id, level } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect old Final URL to new secure page
    useEffect(() => {
        if (level === 'Final') {
            navigate(`/challenges/${id}/final-test`, { replace: true });
        }
    }, [level, id, navigate]);
    const dispatch = useDispatch();

    const isChallenge = location.pathname.includes('/challenges');
    const backLink = isChallenge ? `/challenges/${id}` : `/module/${id}`;

    // Redux State
    const { currentModule: moduleData, testQuestions: reduxQuestions, loading } = useSelector(state => state.modules);

    const [testState, setTestState] = useState('running'); // running, submitted
    const [testQuestions, setTestQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [testAnswers, setTestAnswers] = useState({});
    const [testResult, setTestResult] = useState(null);
    const [showInstructions, setShowInstructions] = useState(level === 'Final');
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const timerRef = useRef(null);

    // Initial Fetch (Module and Questions)
    useEffect(() => {
        setTestQuestions([]); // Clear current local questions to force loading UI
        if (!moduleData || moduleData._id !== id) {
            dispatch(fetchModuleById(id));
        }
        dispatch(fetchTestQuestions({ id, level }));
    }, [dispatch, id, level]);

    // Initialize Test state when Questions are loaded
    useEffect(() => {
        if (reduxQuestions && reduxQuestions.length > 0) {
            setTestQuestions(reduxQuestions);

            // Try to restore session from localStorage
            const storageKey = `test_session_${id}_${level}`;
            const savedSession = localStorage.getItem(storageKey);

            if (savedSession) {
                const session = JSON.parse(savedSession);
                setTestAnswers(session.answers || {});
                setCurrentQuestionIndex(session.currentIndex || 0);
                setShowInstructions(false);
                setTestState('running');

                // Calculate remaining time based on saved end time
                const remaining = Math.max(0, Math.floor((session.endTime - Date.now()) / 1000));
                setTimeLeft(remaining);

                if (remaining <= 0) {
                    submitTest();
                }
            } else {
                // Set fresh time based on level
                let timeInSeconds = 0;
                if (level === 'Basics') timeInSeconds = 5 * 60;
                else if (level === 'Intermediate') timeInSeconds = 10 * 60;
                else if (level === 'Advance') timeInSeconds = 15 * 60;
                else if (level === 'Final') timeInSeconds = 30 * 60;
                else timeInSeconds = reduxQuestions.length * 60;

                setTimeLeft(timeInSeconds);

                // Don't auto-start if in instructions mode
                if (level !== 'Final') {
                    setTestState('running');
                } else {
                    setTestState('instructions');
                }

                setCurrentQuestionIndex(0);
                setTestAnswers({});
            }
        } else if (!loading && reduxQuestions && reduxQuestions.length === 0) {
            setTestQuestions([]);
        }
    }, [reduxQuestions, loading, level, id]);

    // Save session to localStorage whenever state changes
    useEffect(() => {
        if (testState === 'running' && testQuestions.length > 0) {
            const storageKey = `test_session_${id}_${level}`;
            const session = {
                answers: testAnswers,
                currentIndex: currentQuestionIndex,
                endTime: Date.now() + (timeLeft * 1000)
            };
            localStorage.setItem(storageKey, JSON.stringify(session));
        }
    }, [testAnswers, currentQuestionIndex, timeLeft, testState, id, level, testQuestions.length]);

    useEffect(() => {
        if (testState !== 'running') return;

        const preventDefault = (e) => {
            e.preventDefault();
            return false;
        };

        const handleKeyDown = (e) => {
            // Block Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+U, etc.
            if (e.ctrlKey || e.metaKey) {
                const blockedKeys = ['c', 'v', 'x', 'u', 's', 'p', 'a'];
                if (blockedKeys.includes(e.key.toLowerCase())) {
                    e.preventDefault();
                    return false;
                }
            }
            // Block F12
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }
        };

        document.addEventListener('copy', preventDefault, true);
        document.addEventListener('cut', preventDefault, true);
        document.addEventListener('paste', preventDefault, true);
        document.addEventListener('contextmenu', preventDefault, true);
        document.addEventListener('keydown', handleKeyDown, true);

        return () => {
            document.removeEventListener('copy', preventDefault, true);
            document.removeEventListener('cut', preventDefault, true);
            document.removeEventListener('paste', preventDefault, true);
            document.removeEventListener('contextmenu', preventDefault, true);
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [testState]);

    useEffect(() => {
        if (testState === 'running' && timeLeft > 0 && testQuestions.length > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        submitTest();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [testState, testQuestions.length]);

    const handleTestAnswer = (questionId, optionIndex) => {
        setTestAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    };

    const submitTest = async () => {
        clearInterval(timerRef.current);
        let score = 0;
        const answersPayload = testQuestions.map(q => {
            const selected = testAnswers[q._id];
            const isCorrect = selected === q.correctOptionIndex;
            if (isCorrect) score++;
            return { questionId: q._id, selectedOptionIndex: selected !== undefined ? selected : -1, isCorrect };
        });

        const resultData = {
            moduleId: id,
            level,
            score,
            totalQuestions: testQuestions.length,
            answers: answersPayload,
        };

        // Clear saved session upon submission
        localStorage.removeItem(`test_session_${id}_${level}`);

        setTestResult({ ...resultData, questions: testQuestions }); // Keep questions for local review
        setTestState('submitted');

        try {
            await dispatch(submitTestResult(resultData)).unwrap();
        } catch (error) {
            console.error('Failed to save test result', error);
        }
    };

    const resetTest = () => {
        // Clear local state to trigger loading view if needed
        setTestQuestions([]);
        setTestResult(null);
        setTestState('running');
        // To restart, we should actually re-fetch test questions 
        // because the submission just rotated the queue!
        dispatch(fetchTestQuestions({ id, level }));
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const getLevelClass = (lvl) => {
        switch (lvl) {
            case 'Basics': return 'easy';
            case 'Intermediate': return 'medium';
            case 'Advance': return 'hard';
            case 'Final': return 'hard';
            default: return 'easy';
        }
    };

    const getLevelName = (lvl) => {
        switch (lvl) {
            case 'Basics': return 'Level 1 - Easy';
            case 'Intermediate': return 'Level 2 - Medium';
            case 'Advance': return 'Level 3 - Hard';
            case 'Final': return 'Challenge Assessment';
            default: return lvl;
        }
    };

    const startTest = () => {
        setShowInstructions(false);
        setTestState('running');
    };

    const levelClass = getLevelClass(level);

    // INSTRUCTIONS VIEW - Show this immediately even if questions are loading
    if (showInstructions && level === 'Final') {
        return (
            <div className="test-page test-page--instructions">
                <nav className="test-page__nav">
                    <div className="test-page__nav-left">
                        <Link to={backLink} className="test-page__back">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </Link>
                        <span className="test-page__level-badge test-page__level-badge--hard">
                            <svg className="test-page__badge-icon" fill="currentColor" viewBox="0 0 24 24" style={{ width: '14px', height: '14px', marginRight: '6px', verticalAlign: 'middle' }}>
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                            FINAL ASSESSMENT
                        </span>
                    </div>
                </nav>

                <div className="test-page__instructions-container">
                    <div className="test-page__instructions-card">
                        <div className="test-page__instructions-header">
                            <div className="test-page__instructions-icon">📜</div>
                            <h1>Final Assessment Rules</h1>
                            <p>Please read the following instructions carefully before starting the test.</p>
                        </div>

                        <div className="test-page__rules-grid">
                            <div className="test-page__rule-item">
                                <div className="test-page__rule-icon">🕒</div>
                                <div className="test-page__rule-text">
                                    <h3>30 Minutes</h3>
                                    <p>The test window is strictly 30 minutes. Timer starts once you click 'Begin Test'.</p>
                                </div>
                            </div>
                            <div className="test-page__rule-item">
                                <div className="test-page__rule-icon">❓</div>
                                <div className="test-page__rule-text">
                                    <h3>Comprehensive</h3>
                                    <p>Questions are pooled from all difficulty levels (Easy, Medium, Hard).</p>
                                </div>
                            </div>
                            <div className="test-page__rule-item">
                                <div className="test-page__rule-icon">📈</div>
                                <div className="test-page__rule-text">
                                    <h3>Passing Grade</h3>
                                    <p>You need at least 50% score to pass this final assessment.</p>
                                </div>
                            </div>
                            <div className="test-page__rule-item">
                                <div className="test-page__rule-icon">🔒</div>
                                <div className="test-page__rule-text">
                                    <h3>No Tab Switching</h3>
                                    <p>Please stay on this tab. Switching tabs may result in automatic submission.</p>
                                </div>
                            </div>
                        </div>

                        <ul className="test-page__rules-list">
                            <li>You can skip questions and return to them using the navigation map.</li>
                            <li>Each question has 4 options with only one correct answer.</li>
                            <li>There is no negative marking for incorrect answers.</li>
                            <li>The test will automatically submit when the timer hits zero.</li>
                        </ul>

                        <div className="test-page__instructions-footer">
                            <button onClick={startTest} className="test-page__begin-btn">
                                I Understand, Begin Test
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading || testQuestions.length === 0) {
        if (!loading && testQuestions.length === 0 && reduxQuestions && reduxQuestions.length === 0) {
            return (
                <div className="test-page__empty">
                    <EmptyState
                        title="No Questions Available"
                        message="There are no questions for this level yet."
                        action={
                            <Link to={backLink} className="test-page__empty-btn">Back to Module</Link>
                        }
                    />
                </div>
            );
        }

        return (
            <div className="test-page__loading">
                <Spinner />
                Loading Questions...
            </div>
        );
    }

    // RESULTS VIEW - Split Layout
    if (testState === 'submitted' && testResult) {
        const percentage = Math.round((testResult.score / testResult.totalQuestions) * 100);
        const statusClass = percentage >= 80 ? 'high' : percentage >= 50 ? 'mid' : 'low';
        const wrongCount = testResult.totalQuestions - testResult.score;

        return (
            <div className="test-page">
                <nav className="test-page__nav">
                    <div className="test-page__nav-left">
                        <Link to={backLink} className="test-page__back">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </Link>
                        <span className={`test-page__level-badge test-page__level-badge--${levelClass}`}>
                            {getLevelName(level)}
                        </span>
                    </div>
                    <button onClick={resetTest} className="test-page__again-btn">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 16, height: 16 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Again
                    </button>
                </nav>

                <div className="test-page__results">
                    {/* Left - Scrollable Questions Review */}
                    <div className="test-page__results-left">
                        <div className="test-page__review-header">
                            <h3 className="test-page__review-title">Question Review</h3>
                        </div>
                        <div className="test-page__review-list">
                            {testResult.answers.map((ans, idx) => {
                                const question = testResult.questions[idx];
                                const isCorrect = ans.isCorrect;
                                const selectedIdx = ans.selectedOptionIndex;
                                const correctIdx = question.correctOptionIndex;

                                return (
                                    <div key={idx} className="test-page__review-item">
                                        <div className="test-page__review-item-header">
                                            <span className={`test-page__review-item-number test-page__review-item-number--${isCorrect ? 'correct' : 'wrong'}`}>
                                                {idx + 1}
                                            </span>
                                            <p className="test-page__review-item-question">{question.questionText}</p>
                                            <span className={`test-page__review-item-status test-page__review-item-status--${isCorrect ? 'correct' : 'wrong'}`}>
                                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d={isCorrect ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                                                </svg>
                                                {isCorrect ? 'Correct' : 'Wrong'}
                                            </span>
                                        </div>
                                        <div className="test-page__review-item-options">
                                            {question.options.map((opt, optIdx) => {
                                                const isThisCorrect = optIdx === correctIdx;
                                                const isThisSelected = optIdx === selectedIdx;

                                                let optionClass = 'test-page__review-option';
                                                if (isThisSelected && isCorrect) {
                                                    optionClass += ' test-page__review-option--correct';
                                                } else if (isThisSelected && !isCorrect) {
                                                    optionClass += ' test-page__review-option--wrong';
                                                } else if (isThisCorrect && !isCorrect) {
                                                    optionClass += ' test-page__review-option--correct';
                                                }

                                                return (
                                                    <div key={optIdx} className={optionClass}>
                                                        <span className="test-page__review-option-letter">{String.fromCharCode(65 + optIdx)}</span>
                                                        <span className="test-page__review-option-text">{opt}</span>
                                                        {isThisCorrect && (
                                                            <span className="test-page__review-option-badge test-page__review-option-badge--correct">Correct</span>
                                                        )}
                                                        {isThisSelected && !isCorrect && (
                                                            <span className="test-page__review-option-badge test-page__review-option-badge--your">Your Answer</span>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                        </div>
                                        {question.explanation && (
                                            <div className="test-page__explanation">
                                                <svg className="test-page__explanation-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="test-page__explanation-content">
                                                    <h4 className="test-page__explanation-title">Explanation</h4>
                                                    <p className="test-page__explanation-text">{question.explanation}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right - Fixed Score Panel */}
                    <div className="test-page__results-right">
                        <div className={`test-page__results-score test-page__results-score--${statusClass}`}>
                            <span className="test-page__results-percentage">{percentage}%</span>
                            <span className="test-page__results-label">Score</span>
                        </div>
                        <h2 className="test-page__results-title">Test Complete!</h2>
                        <p className="test-page__results-subtitle">{moduleData?.title}</p>
                        <div className="test-page__results-stats">
                            <div className="test-page__results-stat">
                                <p className="test-page__results-stat-value test-page__results-stat-value--correct">{testResult.score}</p>
                                <p className="test-page__results-stat-label">Correct</p>
                            </div>
                            <div className="test-page__results-stat">
                                <p className="test-page__results-stat-value test-page__results-stat-value--wrong">{wrongCount}</p>
                                <p className="test-page__results-stat-label">Wrong</p>
                            </div>
                        </div>
                        <Link to={backLink} className="test-page__results-btn">Back to Module</Link>
                    </div>
                </div>
            </div>
        );
    }



    // RUNNING TEST VIEW
    return (
        <div className="test-page">
            <nav className="test-page__nav">
                <div className="test-page__nav-left">
                    <button onClick={() => setShowExitConfirm(true)} className="test-page__back-btn">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Exit
                    </button>
                    <span className="test-page__progress">Q {currentQuestionIndex + 1}/{testQuestions.length}</span>
                    <span className={`test-page__level-badge test-page__level-badge--${levelClass}`}>
                        {getLevelName(level)}
                    </span>
                </div>
                <div className={`test-page__timer ${timeLeft < 60 ? 'test-page__timer--warning' : ''}`}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatTime(timeLeft)}
                </div>
                <button onClick={() => setShowSubmitModal(true)} className="test-page__finish">Finish Test</button>
            </nav>

            <div className="test-page__content">
                {/* Main Question Area */}
                <div className="test-page__main">
                    <div className="test-page__question-card">
                        <div className="test-page__question-header">
                            <p className="test-page__question-number">Question {currentQuestionIndex + 1}</p>
                            <h2 className="test-page__question-text">{testQuestions[currentQuestionIndex].questionText}</h2>
                        </div>
                        <div className="test-page__options">
                            {testQuestions[currentQuestionIndex].options.map((opt, idx) => {
                                const isSelected = testAnswers[testQuestions[currentQuestionIndex]._id] === idx;
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => handleTestAnswer(testQuestions[currentQuestionIndex]._id, idx)}
                                        className={`test-page__option ${isSelected ? 'test-page__option--selected' : ''}`}
                                    >
                                        <div className="test-page__option-radio">
                                            {isSelected && <div className="test-page__option-radio-dot"></div>}
                                        </div>
                                        <span className="test-page__option-letter">{String.fromCharCode(65 + idx)}</span>
                                        <span className="test-page__option-label">{opt}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="test-page__nav-buttons">
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestionIndex === 0}
                                className="test-page__nav-btn test-page__nav-btn--prev"
                            >
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.min(testQuestions.length - 1, prev + 1))}
                                disabled={currentQuestionIndex === testQuestions.length - 1}
                                className="test-page__nav-btn test-page__nav-btn--next"
                            >
                                Next
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="test-page__sidebar">
                    <div className="test-page__sidebar-header">
                        <h3 className="test-page__sidebar-title">Questions</h3>
                    </div>
                    <div className="test-page__question-map-container">
                        <div className="test-page__question-map">
                            {testQuestions.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentQuestionIndex(i)}
                                    className={`test-page__question-map-btn ${currentQuestionIndex === i ? 'test-page__question-map-btn--current' :
                                        testAnswers[q._id] !== undefined ? 'test-page__question-map-btn--answered' : ''
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="test-page__stats">
                        <div className="test-page__stat">
                            <div className="test-page__stat-dot test-page__stat-dot--answered"></div>
                            <span className="test-page__stat-text">Answered: <strong>{Object.keys(testAnswers).length}</strong></span>
                        </div>
                        <div className="test-page__stat">
                            <div className="test-page__stat-dot test-page__stat-dot--remaining"></div>
                            <span className="test-page__stat-text">Remaining: <strong>{testQuestions.length - Object.keys(testAnswers).length}</strong></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Exit Confirmation Modal */}
            {showExitConfirm && (
                <div className="test-page__modal-overlay">
                    <div className="test-page__modal">
                        <div className="test-page__modal-icon">⚠️</div>
                        <h2 className="test-page__modal-title">Caution</h2>
                        <p className="test-page__modal-text">
                            Are you sure you want to exit? Your progress will be lost and this attempt will NOT be saved.
                        </p>
                        <div className="test-page__modal-actions">
                            <button
                                onClick={() => setShowExitConfirm(false)}
                                className="test-page__modal-btn test-page__modal-btn--cancel"
                            >
                                No, Continue
                            </button>
                            <button
                                onClick={() => {
                                    clearInterval(timerRef.current);
                                    localStorage.removeItem(`test_session_${id}_${level}`);
                                    navigate(backLink);
                                }}
                                className="test-page__modal-btn test-page__modal-btn--confirm"
                            >
                                Yes, Exit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit Confirmation Modal */}
            {showSubmitModal && (
                <div className="test-page__modal-overlay">
                    <div className="test-page__modal">
                        <div className="test-page__modal-icon">✅</div>
                        <h2 className="test-page__modal-title">Ready to Submit?</h2>
                        <p className="test-page__modal-text">
                            You have answered <strong>{Object.keys(testAnswers).length}</strong> out of <strong>{testQuestions.length}</strong> questions. Are you sure you want to finish the test?
                        </p>
                        <div className="test-page__modal-actions">
                            <button
                                onClick={() => setShowSubmitModal(false)}
                                className="test-page__modal-btn test-page__modal-btn--cancel"
                            >
                                No, Continue
                            </button>
                            <button
                                onClick={() => {
                                    setShowSubmitModal(false);
                                    submitTest();
                                }}
                                className="test-page__modal-btn test-page__modal-btn--confirm"
                            >
                                Yes, Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestPage;
