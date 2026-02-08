import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTestHistory } from '../redux/thunks/testResultThunks';
// api removed
import './HistoryDetailPage.css';

const HistoryDetailPage = () => {
    const { historyId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const { history: allHistory, loading, error } = useSelector(state => state.testResults);

    // Derived state
    const historyData = (allHistory || []).find(h => h._id === historyId);

    useEffect(() => {
        if (!allHistory || allHistory.length === 0) {
            dispatch(fetchTestHistory());
        }
    }, [dispatch, allHistory]);

    // Handle error redirect if needed (unauthorized) - Slice error usually string
    useEffect(() => {
        if (error && (error.includes('401') || error.includes('auth'))) {
            navigate('/');
        }
    }, [error, navigate]);

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
            case 'Basics': return 'Easy';
            case 'Intermediate': return 'Medium';
            case 'Advance': return 'Hard';
            case 'Final': return 'Final Assessment';
            default: return lvl;
        }
    };

    if (loading) return (
        <div className="history-detail__loading">
            <svg className="history-detail__loading-spinner" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
        </div>
    );

    if (!historyData) {
        return (
            <div className="history-detail__empty">
                <h2 className="history-detail__empty-title">Test Result Not Found</h2>
                <p className="history-detail__empty-text">This test result may have been deleted or is unavailable.</p>
                <Link to="/home" className="history-detail__empty-btn">Back to Home</Link>
            </div>
        );
    }

    const percentage = Math.round((historyData.score / historyData.totalQuestions) * 100);
    const statusClass = percentage >= 80 ? 'high' : percentage >= 50 ? 'mid' : 'low';
    const levelClass = getLevelClass(historyData.level);
    const wrongCount = historyData.totalQuestions - historyData.score;
    const moduleId = historyData.moduleId?._id;
    const moduleTitle = historyData.moduleId?.title || 'Module';

    // Filter history for current module
    const moduleHistory = allHistory.filter(h => h.moduleId?._id === moduleId);

    return (
        <div className="history-detail">
            {/* Navigation - Shows current test info */}
            <nav className="history-detail__nav">
                <div className="history-detail__nav-left">
                    <Link to={moduleId && location.state?.from === 'challenges' ? `/challenges/${moduleId}` : (moduleId ? `/module/${moduleId}` : '/home')} className="history-detail__back">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </Link>
                    <span className="history-detail__nav-divider">|</span>
                    <span className="history-detail__nav-title">{moduleTitle}</span>
                    <span className={`history-detail__level-badge history-detail__level-badge--${levelClass}`}>
                        {getLevelName(historyData.level)}
                    </span>
                </div>
                <div className="history-detail__nav-right">
                    <span className="history-detail__nav-date">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(historyData.completedAt).toLocaleDateString()}
                    </span>
                    <span className="history-detail__nav-time">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(historyData.completedAt).toLocaleTimeString()}
                    </span>
                    <span className="history-detail__nav-score">
                        <span className={`history-detail__nav-score-badge history-detail__nav-score-badge--${statusClass}`}>
                            {historyData.score}/{historyData.totalQuestions}
                        </span>
                    </span>
                </div>
            </nav>

            {/* Split Layout */}
            <div className="history-detail__results">
                {/* Left - Scrollable Questions Review */}
                <div className="history-detail__results-left">
                    <div className="history-detail__review-header">
                        <h3 className="history-detail__review-title">Question Review</h3>
                        <div className="history-detail__review-stats">
                            <div className="history-detail__review-stat">
                                <span className="history-detail__review-stat-value history-detail__review-stat-value--percentage">{percentage}%</span>
                                <span className="history-detail__review-stat-label">Score</span>
                            </div>
                            <div className="history-detail__review-stat">
                                <span className="history-detail__review-stat-value history-detail__review-stat-value--correct">{historyData.score}</span>
                                <span className="history-detail__review-stat-label">Correct</span>
                            </div>
                            <div className="history-detail__review-stat">
                                <span className="history-detail__review-stat-value history-detail__review-stat-value--wrong">{wrongCount}</span>
                                <span className="history-detail__review-stat-label">Wrong</span>
                            </div>
                        </div>
                    </div>
                    <div className="history-detail__review-list">
                        {historyData.answers?.map((ans, idx) => {
                            const question = ans.questionId;
                            if (!question) return null;

                            const isCorrect = ans.isCorrect;
                            const selectedIdx = ans.selectedOptionIndex;
                            const correctIdx = question.correctOptionIndex;

                            return (
                                <div key={idx} className="history-detail__review-item">
                                    <div className="history-detail__review-item-header">
                                        <span className={`history-detail__review-item-number history-detail__review-item-number--${isCorrect ? 'correct' : 'wrong'}`}>
                                            {idx + 1}
                                        </span>
                                        <p className="history-detail__review-item-question">{question.questionText}</p>
                                        <span className={`history-detail__review-item-status history-detail__review-item-status--${isCorrect ? 'correct' : 'wrong'}`}>
                                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d={isCorrect ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                                            </svg>
                                            {isCorrect ? 'Correct' : 'Wrong'}
                                        </span>
                                    </div>
                                    <div className="history-detail__review-item-options">
                                        {question.options.map((opt, optIdx) => {
                                            const isThisCorrect = optIdx === correctIdx;
                                            const isThisSelected = optIdx === selectedIdx;

                                            let optionClass = 'history-detail__review-option';
                                            if (isThisCorrect) {
                                                optionClass += ' history-detail__review-option--correct';
                                            } else if (isThisSelected && !isCorrect) {
                                                optionClass += ' history-detail__review-option--wrong';
                                            }

                                            return (
                                                <div key={optIdx} className={optionClass}>
                                                    <div className="history-detail__review-option-left">
                                                        <span className="history-detail__review-option-letter">{String.fromCharCode(65 + optIdx)}</span>
                                                        <span className="history-detail__review-option-text">{opt}</span>
                                                    </div>
                                                    {isThisCorrect && (
                                                        <svg className="history-detail__review-option-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                    {isThisSelected && !isCorrect && (
                                                        <span className="history-detail__review-option-badge">Your Answer</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {question.explanation && (
                                        <div className="history-detail__explanation">
                                            <svg className="history-detail__explanation-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div className="history-detail__explanation-content">
                                                <h4 className="history-detail__explanation-title">Explanation</h4>
                                                <p className="history-detail__explanation-text">{question.explanation}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right - History List (70%) + Test Info (30%) */}
                <div className="history-detail__results-right">
                    {/* History List - 70% */}
                    <div className="history-detail__history-section">
                        <h3 className="history-detail__history-title">All Attempts</h3>
                        <div className="history-detail__history-list">
                            {moduleHistory.map(item => {
                                const pct = Math.round((item.score / item.totalQuestions) * 100);
                                const cls = pct >= 80 ? 'high' : pct >= 50 ? 'mid' : 'low';
                                const isActive = item._id === historyId;

                                return (
                                    <Link
                                        key={item._id}
                                        to={`/history/${item._id}`}
                                        state={location.state}
                                        className={`history-detail__history-item ${isActive ? 'history-detail__history-item--active' : ''}`}
                                    >
                                        <div className={`history-detail__history-bar history-detail__history-bar--${cls}`}></div>
                                        <div className="history-detail__history-info">
                                            <span className="history-detail__history-level">{getLevelName(item.level)}</span>
                                            <span className="history-detail__history-date">{new Date(item.completedAt).toLocaleDateString()}</span>
                                        </div>
                                        <span className={`history-detail__history-score history-detail__history-score--${cls}`}>{pct}%</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Test Info - 20% */}
                    <div key={historyId} className="history-detail__info-section">
                        <div className={`history-detail__info-score history-detail__info-score--${statusClass}`}>
                            <span className="history-detail__info-percentage">{percentage}%</span>
                        </div>
                        <div className="history-detail__info-stats">
                            <div className="history-detail__info-stat">
                                <span className="history-detail__info-stat-value history-detail__info-stat-value--correct">{historyData.score}</span>
                                <span className="history-detail__info-stat-label">Correct</span>
                            </div>
                            <div className="history-detail__info-stat">
                                <span className="history-detail__info-stat-value history-detail__info-stat-value--wrong">{wrongCount}</span>
                                <span className="history-detail__info-stat-label">Wrong</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoryDetailPage;
