import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchModuleById } from '../redux/thunks/moduleThunks';
import { fetchTestHistory } from '../redux/thunks/testResultThunks';
import TechLogo from '../components/TechLogo';
import { getTechColors } from '../utils/themeUtils';
// api removed
import './ModuleView.css';
import Footer from '../components/Footer';

const ModuleView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Redux State
    const { currentModule: moduleData, loading, error } = useSelector(state => state.modules);
    const { history: allHistory, loading: loadingHistory } = useSelector(state => state.testResults);

    const [activeMode, setActiveMode] = useState('learning-material'); // 'learning-material', 'interview', 'practice', 'test', 'history'
    const [showHistory, setShowHistory] = useState(false);

    // Derived History
    const history = (allHistory || []).filter(h => h.moduleId && (h.moduleId._id === id || h.moduleId === id));

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
                        className={`module-view__tab ${activeMode === 'interview' ? 'module-view__tab--active' : ''}`}
                        onClick={() => setActiveMode('interview')}
                        style={activeMode === 'interview' ? { color: techColors.primary, background: `${techColors.primary}20` } : {}}
                    >
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        Interview Questions
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
            <div className="module-view__content">
                {(activeMode === 'learning-material' || activeMode === 'interview' || activeMode === 'practice' || activeMode === 'test') && (
                    <div className="module-view__levels">
                        {levels.map((lvl, idx) => (
                            <Link
                                key={lvl.key}
                                to={`/module/${id}/${activeMode === 'learning-material' ? 'learning' : activeMode === 'interview' ? 'interview' : activeMode === 'practice' ? 'practice' : 'test'}/${lvl.key}`}
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
                                        <h3 className="module-view__level-subtitle">{lvl.name}</h3>
                                        <div className="module-view__level-details">
                                            {activeMode === 'learning-material' ? (
                                                <span>Learning Guide</span>
                                            ) : activeMode === 'interview' ? (
                                                <span>Interview Prep Q&A</span>
                                            ) : (
                                                <span>{getQuestionCount(lvl.key)} Questions • {lvl.subtitle}</span>
                                            )}
                                        </div>
                                        <p className="module-view__level-avg">
                                            {activeMode === 'learning-material' ? 'Master the basics' : activeMode === 'interview' ? 'Common Q&A' : `Avg Score: ${averages[lvl.key]}%`}
                                        </p>
                                    </div>
                                    <div className="module-view__level-overlay">
                                        <div className="module-view__level-play-btn">
                                            <svg fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                        </div>
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
                )}
            </div>

            <Footer />
        </div>
    );
};

export default ModuleView;
