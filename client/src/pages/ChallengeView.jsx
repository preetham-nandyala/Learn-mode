import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchModuleById } from '../redux/thunks/moduleThunks';
import { fetchTestHistory } from '../redux/thunks/testResultThunks';
import TechLogo from '../components/TechLogo';
import { getTechColors } from '../utils/themeUtils';
import './ModuleView.css';
import Footer from '../components/Footer';

const ChallengeView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Redux State
    const { currentModule: moduleData } = useSelector(state => state.modules);
    const { history: allHistory, loading: loadingHistory } = useSelector(state => state.testResults);

    const [activeMode, setActiveMode] = useState('test'); // 'test', 'history'
    const [showHistory, setShowHistory] = useState(false);

    // Derived History
    const history = (allHistory || []).filter(h => h.moduleId && (h.moduleId._id === id || h.moduleId === id));

    const [levelFilter, setLevelFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest');
    const [activeSessions, setActiveSessions] = useState({});

    useEffect(() => {
        const checkSessions = () => {
            const sessions = {};
            ['Basics', 'Intermediate', 'Advance', 'Final'].forEach(lvl => {
                const key = `test_session_${id}_${lvl}`;
                const saved = localStorage.getItem(key);
                if (saved) {
                    const session = JSON.parse(saved);
                    const remaining = Math.max(0, Math.floor((session.endTime - Date.now()) / 1000));
                    if (remaining > 0) {
                        sessions[lvl] = remaining;
                    } else {
                        // Cleanup if expired while on this page
                        localStorage.removeItem(key);
                    }
                }
            });
            setActiveSessions(sessions);
        };

        checkSessions();
        const interval = setInterval(checkSessions, 5000);
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        if (!moduleData || moduleData._id !== id) {
            dispatch(fetchModuleById(id))
                .unwrap()
                .catch(error => {
                    console.error('Failed to fetch module', error);
                });
        }
    }, [dispatch, id, moduleData]);

    useEffect(() => {
        if ((!allHistory || allHistory.length === 0) && !loadingHistory) {
            dispatch(fetchTestHistory());
        }
    }, [dispatch, allHistory, loadingHistory]);

    useEffect(() => {
        if (showHistory) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showHistory]);

    const getLevelAverage = (lvl) => {
        const lvlHistory = history.filter(h => h.level === lvl);
        if (lvlHistory.length === 0) return 0;
        const total = lvlHistory.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0);
        return Math.round(total / lvlHistory.length);
    };

    const averages = {
        Basics: getLevelAverage('Basics'),
        Intermediate: getLevelAverage('Intermediate'),
        Advance: getLevelAverage('Advance')
    };

    const techColors = moduleData ? getTechColors(moduleData.title) : {};

    const getTotalQuestions = () => {
        return moduleData?.questions?.length || 0;
    };

    const getBestScore = () => {
        if (history.length === 0) return null;
        const best = Math.max(...history.map(h => Math.round((h.score / h.totalQuestions) * 100)));
        return best;
    };

    const levels = [
        { key: 'Basics', subtitle: 'Easy', cssClass: 'easy', icon: '🌱', time: '5 mins' },
        { key: 'Intermediate', subtitle: 'Medium', cssClass: 'medium', icon: '🔥', time: '10 mins' },
        { key: 'Advance', subtitle: 'Hard', cssClass: 'hard', icon: '⚡', time: '15 mins' }
    ];

    const bestScore = getBestScore();

    if (!moduleData) return (
        <div className="module-view__loading">
            <svg className="module-view__loading-spinner" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
        </div>
    );

    return (
        <div className="module-view">
            {/* Navigation */}
            <nav className="module-view__nav">
                <Link to="/challenges" className="module-view__back">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Challenges
                </Link>

                <div className="module-view__nav-items">
                    <button
                        className={`module-view__tab ${!showHistory ? 'module-view__tab--active module-view__tab--test' : ''}`}
                        onClick={() => setShowHistory(false)}
                        style={!showHistory ? { color: techColors.primary, background: `${techColors.primary}20` } : {}}
                    >
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Take Test
                    </button>
                    <Link
                        to={`/challenges/${id}/final-test`}
                        className={`module-view__tab ${activeSessions['Final'] ? 'module-view__tab--active-pulse' : ''}`}
                        style={{ textDecoration: 'none' }}
                    >
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {activeSessions['Final'] ? 'Continue Final' : 'Final Test'}
                    </Link>
                    <button
                        className={`module-view__tab ${showHistory ? 'module-view__tab--active module-view__tab--history' : ''}`}
                        onClick={() => setShowHistory(true)}
                        style={showHistory ? { color: techColors.primary, background: `${techColors.primary}20` } : {}}
                    >
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        History
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="module-view__hero">
                <div className="module-view__hero-left">
                    <div className="module-view__logo" style={{ background: techColors.gradient }}>
                        <TechLogo title={moduleData.title} className="module-view__tech-logo" />
                    </div>
                    <div className="module-view__hero-info">
                        <h1
                            className="module-view__title"
                            style={{
                                background: techColors.gradient,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text'
                            }}
                        >
                            {moduleData.title}
                        </h1>
                        <p className="module-view__description">
                            Challenge yourself with our rigorous tests.
                        </p>
                    </div>
                </div>

                <div className="module-view__hero-right">
                    <div className="module-view__stats">
                        <div className="module-view__stat">
                            <div className="module-view__stat-icon">
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div className="module-view__stat-content">
                                <span className="module-view__stat-value">{getTotalQuestions()}</span>
                                <span className="module-view__stat-label">Questions</span>
                            </div>
                        </div>
                        <div className="module-view__stat">
                            <div className="module-view__stat-icon">
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div className="module-view__stat-content">
                                <span className="module-view__stat-value">3</span>
                                <span className="module-view__stat-label">Levels</span>
                            </div>
                        </div>
                        {bestScore !== null && (
                            <div className="module-view__stat module-view__stat--highlight">
                                <div className="module-view__stat-icon">
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138z" />
                                    </svg>
                                </div>
                                <div className="module-view__stat-content">
                                    <span className="module-view__stat-value">{bestScore}%</span>
                                    <span className="module-view__stat-label">Best Score</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {/* Content Area - Always show challenges */}
            <div className="module-view__content">
                <div className="module-view__levels">
                    {levels.map((lvl, idx) => (
                        <Link
                            key={lvl.key}
                            to={`/challenges/${id}/test/${lvl.key}`}
                            className={`module-view__level-card module-view__level-card--${lvl.cssClass}`}
                            style={{ animationDelay: `${idx * 0.1}s` }}
                        >
                            <div className="module-view__level-inner">
                                <div className="module-view__level-cover">
                                    <div className="module-view__level-icon-box">
                                        {lvl.icon}
                                    </div>
                                </div>
                                <div className="module-view__level-content">
                                    <h3 className="module-view__level-subtitle">{lvl.subtitle} Challenge</h3>
                                    <div className="module-view__level-details">
                                        <span>30 Questions • {lvl.time}</span>
                                    </div>
                                    <p className="module-view__level-avg">Avg Score: {averages[lvl.key]}%</p>
                                </div>
                                <div className={`module-view__level-overlay ${activeSessions[lvl.key] ? 'module-view__level-overlay--active' : ''}`}>
                                    <div className="module-view__level-play-btn">
                                        {activeSessions[lvl.key] ? (
                                            <svg fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm-1 14.5c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L4.24 8.24C3.46 9.32 3 10.6 3 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
                                            </svg>
                                        ) : (
                                            <svg fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        )}
                                    </div>
                                    {activeSessions[lvl.key] && (
                                        <div className="module-view__level-continue-text">
                                            Continue Test
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}

                    {/* 4th Box: Averages Graph */}
                    <div className="module-view__avg-card">
                        <h3 className="module-view__avg-title">Level Averages</h3>
                        <div className="module-view__avg-chart">
                            {levels.map(lvl => (
                                <div key={lvl.key} className="module-view__avg-bar-container">
                                    <div className="module-view__avg-bar-wrapper">
                                        <div
                                            className={`module-view__avg-bar module-view__avg-bar--${lvl.cssClass}`}
                                            style={{ height: `${averages[lvl.key]}%` }}
                                        ></div>
                                    </div>
                                    <span className="module-view__avg-value">{averages[lvl.key]}%</span>
                                </div>
                            ))}
                        </div>
                        <div className="module-view__avg-labels">
                            <span className="module-view__avg-label">Easy</span>
                            <span className="module-view__avg-label">Med</span>
                            <span className="module-view__avg-label">Hard</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Drawer */}
            {showHistory && (
                <>
                    <div className="module-view__overlay" onClick={() => setShowHistory(false)}></div>
                    <div className="module-view__history-drawer">
                        <div className="module-view__history-header">
                            <h2>Your Test History</h2>
                            <button className="module-view__close-btn" onClick={() => setShowHistory(false)}>
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="module-view__history-content">
                            {!loadingHistory && history.length > 0 && (
                                <div className="module-view__filters">
                                    <div className="module-view__filter-group">
                                        <select
                                            className="module-view__filter-select"
                                            value={levelFilter}
                                            onChange={(e) => setLevelFilter(e.target.value)}
                                        >
                                            <option value="all">Level Filter</option>
                                            <option value="Basics">Easy</option>
                                            <option value="Intermediate">Medium</option>
                                            <option value="Advance">Hard</option>
                                            <option value="Final">Final</option>
                                        </select>
                                    </div>
                                    <div className="module-view__filter-group">
                                        <select
                                            className="module-view__filter-select"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <option value="all">Status Filter</option>
                                            <option value="passed">Passed</option>
                                            <option value="failed">Failed</option>
                                            <option value="perfect">100% Score</option>
                                        </select>
                                    </div>
                                    <div className="module-view__filter-group">
                                        <select
                                            className="module-view__filter-select"
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(e.target.value)}
                                        >
                                            <option value="newest">Newest First</option>
                                            <option value="oldest">Oldest First</option>
                                            <option value="highest">Highest Score</option>
                                            <option value="lowest">Lowest Score</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {loadingHistory ? (
                                <div className="module-view__history-loading">
                                    <div className="module-view__history-spinner"></div>
                                    Loading history...
                                </div>
                            ) : history.length === 0 ? (
                                <div className="module-view__history-empty">
                                    <h3>No Test Attempts Yet</h3>
                                    <p>Take a test to see your history here.</p>
                                </div>
                            ) : (
                                <div className="module-view__history-list">
                                    {history
                                        .filter(item => {
                                            const matchesLevel = levelFilter === 'all' || item.level === levelFilter;
                                            const score = Math.round((item.score / item.totalQuestions) * 100);

                                            let matchesStatus = true;
                                            if (statusFilter === 'passed') matchesStatus = score >= 50;
                                            else if (statusFilter === 'failed') matchesStatus = score < 50;
                                            else if (statusFilter === 'perfect') matchesStatus = score === 100;

                                            return matchesLevel && matchesStatus;
                                        })
                                        .sort((a, b) => {
                                            const dateA = new Date(a.completedAt);
                                            const dateB = new Date(b.completedAt);
                                            const scoreA = (a.score / a.totalQuestions) * 100;
                                            const scoreB = (b.score / b.totalQuestions) * 100;

                                            if (sortOrder === 'newest') return dateB - dateA;
                                            if (sortOrder === 'oldest') return dateA - dateB;
                                            if (sortOrder === 'highest') return scoreB - scoreA;
                                            if (sortOrder === 'lowest') return scoreA - scoreB;
                                            return 0;
                                        })
                                        .map((item, idx) => {
                                            const percentage = Math.round((item.score / item.totalQuestions) * 100);
                                            const statusClass = percentage >= 80 ? 'high' : percentage >= 50 ? 'mid' : 'low';
                                            return (
                                                <Link
                                                    key={item._id}
                                                    to={`/history/${item._id}`}
                                                    state={{ from: 'challenges' }}
                                                    className="module-view__history-item"
                                                    style={{ animationDelay: `${idx * 0.05}s` }}
                                                >
                                                    <div className={`module-view__history-bar module-view__history-bar--${statusClass}`}></div>
                                                    <div className="module-view__history-meta">
                                                        <span className="module-view__history-level">
                                                            {item.level === 'Basics' ? 'Easy' : item.level === 'Intermediate' ? 'Medium' : item.level === 'Advance' ? 'Hard' : 'Final'}
                                                        </span>
                                                        <span className="module-view__history-date">
                                                            {new Date(item.completedAt).toLocaleDateString()} • {item.score}/{item.totalQuestions} correct
                                                        </span>
                                                    </div>
                                                    <div className={`module-view__history-score module-view__history-score--${statusClass}`}>
                                                        {percentage}%
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
            <Footer />
        </div>
    );
};

export default ChallengeView;
