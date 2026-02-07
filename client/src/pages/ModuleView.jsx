import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchModuleById } from '../redux/thunks/moduleThunks';
import { fetchTestHistory } from '../redux/thunks/testResultThunks';
import TechLogo from '../components/TechLogo';
import { getTechColors } from '../utils/themeUtils';
// api removed
import './ModuleView.css';

const ModuleView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Redux State
    const { currentModule: moduleData, loading, error } = useSelector(state => state.modules);
    const { history: allHistory, loading: loadingHistory } = useSelector(state => state.testResults);

    const [activeMode, setActiveMode] = useState('learning-material'); // 'learning-material', 'practice', 'test', 'history'
    const [showHistory, setShowHistory] = useState(false);

    // Derived History
    const history = allHistory.filter(h => h.moduleId && h.moduleId._id === id);

    const [levelFilter, setLevelFilter] = useState('all'); // 'all', 'Basics', 'Intermediate', 'Advance'
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'passed', 'failed'
    const [sortOrder, setSortOrder] = useState('newest'); // 'newest', 'oldest', 'highest', 'lowest'

    useEffect(() => {
        if (!moduleData || moduleData._id !== id) {
            dispatch(fetchModuleById(id))
                .unwrap()
                .catch(error => {
                    console.error('Failed to fetch module', error);
                    // if (error.response?.status === 401) navigate('/'); // Handled by interceptor usually, or check error message
                });
        }
    }, [dispatch, id, moduleData]);

    useEffect(() => {
        if (showHistory && allHistory.length === 0) {
            dispatch(fetchTestHistory());
        }
    }, [showHistory, dispatch, allHistory.length]);

    const techColors = moduleData ? getTechColors(moduleData.title) : {};

    const getQuestionCount = (level) => {
        if (!moduleData?.questions) return 0;
        return moduleData.questions.filter(q => (q.level || 'Basics') === level).length;
    };

    const getTotalQuestions = () => {
        return moduleData?.questions?.length || 0;
    };

    const getBestScore = () => {
        if (history.length === 0) return null;
        const best = Math.max(...history.map(h => Math.round((h.score / h.totalQuestions) * 100)));
        return best;
    };

    if (!moduleData) return (
        <div className="module-view__loading">
            <svg className="module-view__loading-spinner" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
        </div>
    );

    const levels = [
        { key: 'Basics', name: 'Level 1', subtitle: 'Easy', cssClass: 'easy', icon: '🌱' },
        { key: 'Intermediate', name: 'Level 2', subtitle: 'Medium', cssClass: 'medium', icon: '🔥' },
        { key: 'Advance', name: 'Level 3', subtitle: 'Hard', cssClass: 'hard', icon: '⚡' }
    ];

    const bestScore = getBestScore();

    return (
        <div className="module-view">

            {/* Navigation */}
            {/* Navigation */}
            <nav className="module-view__nav">
                <Link to="/modules" className="module-view__back">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Modules
                </Link>

                <div className="module-view__nav-items">
                    <button
                        className={`module-view__tab ${activeMode === 'learning-material' ? 'module-view__tab--active' : ''}`}
                        onClick={() => setActiveMode('learning-material')}
                        style={activeMode === 'learning-material' ? { color: techColors.primary, background: `${techColors.primary}20` } : {}}
                    >
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Learning Material
                    </button>
                    <button
                        className={`module-view__tab ${activeMode === 'practice' ? 'module-view__tab--active module-view__tab--practice' : ''}`}
                        onClick={() => setActiveMode('practice')}
                        style={activeMode === 'practice' ? { color: techColors.primary, background: `${techColors.primary}20` } : {}}
                    >
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Practice
                    </button>
                    <button
                        className={`module-view__tab ${activeMode === 'test' ? 'module-view__tab--active module-view__tab--test' : ''}`}
                        onClick={() => setActiveMode('test')}
                        style={activeMode === 'test' ? { color: techColors.primary, background: `${techColors.primary}20` } : {}}
                    >
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Take Test
                    </button>
                    <button
                        className={`module-view__tab ${showHistory ? 'module-view__tab--active module-view__tab--history' : ''}`}
                        onClick={() => setShowHistory(true)}
                        style={showHistory ? { color: techColors.primary, background: `${techColors.primary}20` } : {}}
                    >
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        History
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="module-view__hero">
                {/* Left - Logo, Title, Description */}
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
                            {moduleData.description || 'Master this module by practicing questions across difficulty levels.'}
                        </p>
                    </div>
                </div>

                {/* Right - Stats */}
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
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
            <div className="module-view__content">
                {(activeMode === 'learning-material' || activeMode === 'practice' || activeMode === 'test') && (
                    <div className="module-view__levels">
                        {levels.map((lvl, idx) => (
                            <div
                                key={lvl.key}
                                className={`module-view__level-card module-view__level-card--${lvl.cssClass}`}
                                style={{ animationDelay: `${idx * 0.1}s` }}
                            >
                                <div className="module-view__level-info">
                                    <h3 className="module-view__level-name">{lvl.name}</h3>
                                    <span className={`module-view__level-badge module-view__level-badge--${lvl.cssClass}`}>
                                        {lvl.subtitle}
                                    </span>
                                </div>
                                <div className="module-view__level-count" style={activeMode === 'learning-material' ? { visibility: 'hidden' } : {}}>
                                    <span className="module-view__level-count-value">{getQuestionCount(lvl.key)}</span>
                                    <span className="module-view__level-count-label">questions</span>
                                </div>
                                <Link
                                    to={`/module/${id}/${activeMode === 'learning-material' ? 'learning' : activeMode === 'practice' ? 'practice' : 'test'}/${lvl.key}`}
                                    className={`module-view__level-btn module-view__level-btn--${activeMode}`}
                                    style={(() => {
                                        const levelColors = { easy: '#00B8A3', medium: '#FFC01E', hard: '#FF375F' };
                                        const color = levelColors[lvl.cssClass] || techColors.primary;
                                        return { background: color, color: lvl.cssClass === 'medium' ? '#1A1A1A' : '#fff' };
                                    })()}
                                >
                                    {activeMode === 'learning-material' ? 'View Guide' : activeMode === 'test' ? 'Start Test' : 'Practice'}
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* History Sidebar Drawer */}
            {showHistory && (
                <>
                    <div className="module-view__overlay" onClick={() => setShowHistory(false)}></div>
                    <div className="module-view__history-drawer">
                        <div className="module-view__history-header">
                            <h2>History</h2>
                            <button className="module-view__close-btn" onClick={() => setShowHistory(false)}>
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="module-view__history-content">
                            {/* Filters */}
                            {!loadingHistory && history.length > 0 && (
                                <div className="module-view__filters">
                                    <div className="module-view__filter-group">
                                        <select
                                            className="module-view__filter-select"
                                            value={levelFilter}
                                            onChange={(e) => setLevelFilter(e.target.value)}
                                        >
                                            <option value="all">Level</option>
                                            <option value="Basics">Easy</option>
                                            <option value="Intermediate">Medium</option>
                                            <option value="Advance">Hard</option>
                                        </select>
                                    </div>
                                    <div className="module-view__filter-group">
                                        <select
                                            className="module-view__filter-select"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <option value="all">Status</option>
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
                                <div className="module-view__history-empty">
                                    <svg className="module-view__loading-spinner" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Loading history...
                                </div>
                            ) : history.length === 0 ? (
                                <div className="module-view__history-empty">
                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                    <h3>No Test Attempts Yet</h3>
                                    <p>Take a test to see your history here.</p>
                                    <button onClick={() => { setActiveMode('test'); setShowHistory(false); }} className="module-view__history-cta">
                                        Take a Test
                                    </button>
                                </div>
                            ) : (
                                <>
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
                                                        className="module-view__history-item"
                                                        style={{ animationDelay: `${idx * 0.05}s` }}
                                                    >
                                                        <div className={`module-view__history-bar module-view__history-bar--${statusClass}`}></div>
                                                        <div className="module-view__history-meta">
                                                            <span className="module-view__history-level">{item.level}</span>
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
                                    {history.filter(item => {
                                        const matchesLevel = levelFilter === 'all' || item.level === levelFilter;
                                        const score = Math.round((item.score / item.totalQuestions) * 100);

                                        let matchesStatus = true;
                                        if (statusFilter === 'passed') matchesStatus = score >= 50;
                                        else if (statusFilter === 'failed') matchesStatus = score < 50;
                                        else if (statusFilter === 'perfect') matchesStatus = score === 100;

                                        return matchesLevel && matchesStatus;
                                    }).length === 0 && (
                                            <div className="module-view__history-empty module-view__history-empty--small">
                                                <p>No tests found for this filter.</p>
                                            </div>
                                        )}
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ModuleView;
