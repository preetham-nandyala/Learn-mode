import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchModuleById } from '../redux/thunks/moduleThunks';
import { submitTestResult } from '../redux/thunks/testResultThunks';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import './TestPage.css';

const TestPage = () => {
    const { id, level } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Redux State
    const { currentModule: moduleData, loading } = useSelector(state => state.modules);

    // const [moduleData ... removed
    const [testState, setTestState] = useState('running'); // running, submitted
    const [testQuestions, setTestQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [testAnswers, setTestAnswers] = useState({});
    const [testResult, setTestResult] = useState(null);
    const timerRef = useRef(null);

    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    useEffect(() => {
        if (!moduleData || moduleData._id !== id) {
            dispatch(fetchModuleById(id));
        }
    }, [dispatch, id, moduleData]);

    useEffect(() => {
        if (moduleData && (moduleData._id === id || moduleData._id)) {
            const filtered = (moduleData.questions || []).filter(q => (q.level || 'Basics') === level);
            if (filtered.length > 0) {
                // Check if we haven't initialized yet or strict reset needed? 
                // Since component remounts on route change, testQuestions starts []
                // We should only set if empty to avoid reset on re-renders, 
                // UNLESS level changed. Dependencies cover it.
                // But better to check testQuestions.length === 0
                const shuffled = shuffleArray([...filtered]);
                setTestQuestions(shuffled);
                setTimeLeft(shuffled.length * 60);
            }
        }
    }, [moduleData, level, id]);

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
            // questions: testQuestions // Redundant to send full questions back to API usually, but local state uses it
        };
        setTestResult({ ...resultData, questions: testQuestions }); // Keep questions for local review
        setTestState('submitted');

        try {
            await dispatch(submitTestResult(resultData)).unwrap();
        } catch (error) {
            console.error('Failed to save test result', error);
        }
    };

    const resetTest = () => {
        const filtered = (moduleData.questions || []).filter(q => (q.level || 'Basics') === level);
        if (filtered.length > 0) {
            const shuffled = shuffleArray([...filtered]);
            setTestQuestions(shuffled);
            setTimeLeft(shuffled.length * 60);
        }
        setTestAnswers({});
        setTestResult(null);
        setTestState('running');
        setCurrentQuestionIndex(0);
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
        <div className="test-page__loading">
            <Spinner />
            Loading...
        </div>
    );

    if (testQuestions.length === 0) {
        return (
            <div className="test-page__empty">
                <EmptyState
                    title="No Questions Available"
                    message="There are no questions for this level yet."
                    action={
                        <Link to={`/module/${id}`} className="test-page__empty-btn">Back to Module</Link>
                    }
                />
            </div>
        );
    }

    const levelClass = getLevelClass(level);

    // RESULTS VIEW - Split Layout
    if (testState === 'submitted' && testResult) {
        const percentage = Math.round((testResult.score / testResult.totalQuestions) * 100);
        const statusClass = percentage >= 80 ? 'high' : percentage >= 50 ? 'mid' : 'low';
        const wrongCount = testResult.totalQuestions - testResult.score;

        return (
            <div className="test-page">
                <nav className="test-page__nav">
                    <div className="test-page__nav-left">
                        <Link to={`/module/${id}`} className="test-page__back">
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
                        <Link to={`/module/${id}`} className="test-page__results-btn">Back to Module</Link>
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
                    <Link to={`/module/${id}`} className="test-page__back">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Exit
                    </Link>
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
                <button onClick={submitTest} className="test-page__finish">Finish Test</button>
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
        </div>
    );
};

export default TestPage;
