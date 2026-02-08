import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchContests, fetchContestSections } from '../redux/slices/contestSlice';
import { fetchTestHistory } from '../redux/thunks/testResultThunks';
import ContestCard from '../components/ContestCard';
import LoadingGrid from '../components/LoadingGrid';
import Spinner from '../components/Spinner';
import './ModulesPage.css';

const ContestsPage = () => {
    const dispatch = useDispatch();
    const { items: contests, sections, loading } = useSelector(state => state.contests);
    const { history, loading: historyLoading } = useSelector(state => state.testResults);

    const [showDetailedHistory, setShowDetailedHistory] = React.useState(false);
    const [levelFilter, setLevelFilter] = React.useState('all');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [sortOrder, setSortOrder] = React.useState('newest');

    useEffect(() => {
        dispatch(fetchContestSections());
        dispatch(fetchContests());
        dispatch(fetchTestHistory());
    }, [dispatch]);

    const finalSections = useMemo(() => {
        const sortedDBSections = [...sections].sort((a, b) => a.order - b.order).map(s => s.name);
        const usedSectionNames = contests.map(c => c.section?.name || 'Other');
        return [...new Set([...sortedDBSections, ...usedSectionNames])];
    }, [contests, sections]);

    const contestHistory = useMemo(() => {
        return history.filter(h => h.level === 'Contest' || h.contestId);
    }, [history]);

    const filteredHistory = useMemo(() => {
        return contestHistory
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
                const dateA = new Date(a.createdAt);
                const dateB = new Date(b.completedAt || b.createdAt);
                const scoreA = (a.score / a.totalQuestions) * 100;
                const scoreB = (b.score / b.totalQuestions) * 100;

                if (sortOrder === 'newest') return dateB - dateA;
                if (sortOrder === 'oldest') return dateA - dateB;
                if (sortOrder === 'highest') return scoreB - scoreA;
                if (sortOrder === 'lowest') return scoreA - scoreB;
                return 0;
            });
    }, [contestHistory, levelFilter, statusFilter, sortOrder]);

    useEffect(() => {
        if (showDetailedHistory) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showDetailedHistory]);

    return (
        <div className="client-modules-page">
            <div className="client-modules-content">
                <div className="client-modules-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 className="client-modules-title">Contests & Assessments</h1>
                        <p className="client-modules-subtitle">Challenge yourself with scheduled competitive assessments and earn your spot on the leaderboard.</p>
                    </div>
                    <button
                        className="module-view__tab module-view__tab--active module-view__tab--history"
                        onClick={() => setShowDetailedHistory(true)}
                        style={{ marginTop: '5px', padding: '10px 18px' }}
                    >
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        History
                    </button>
                </div>

                <div className="client-modules-main">
                    {loading && contests.length === 0 ? (
                        <LoadingGrid />
                    ) : contests.length === 0 ? (
                        <div className="client-home__empty">
                            <div className="client-home__empty-icon">
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332 4.77-4.5 1.253" />
                                </svg>
                            </div>
                            <h3 className="client-home__empty-title">No contests scheduled</h3>
                            <p className="client-home__empty-text">Check back later for upcoming challenges.</p>
                        </div>
                    ) : (
                        <div className="client-home__modules-container">
                            {finalSections.map(secBranch => {
                                const sectionContests = contests
                                    .filter(c => (c.section?.name || 'Other') === secBranch)
                                    .sort((a, b) => (a.order || 0) - (b.order || 0));

                                if (sectionContests.length === 0) return null;

                                return (
                                    <div key={secBranch} className="client-home__section-group" style={{ marginBottom: '48px' }}>
                                        <h3 className="client-home__section-title" style={{
                                            fontSize: '18px',
                                            fontWeight: '700',
                                            color: '#EFEFEF',
                                            marginBottom: '20px',
                                            paddingLeft: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px'
                                        }}>
                                            <div style={{ width: 4, height: 24, background: '#FF375F', borderRadius: 2 }}></div>
                                            {secBranch}
                                        </h3>
                                        <div className="client-home__modules" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                                            {sectionContests.map((contest) => (
                                                <ContestCard key={contest._id} contest={contest} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Detailed History Drawer - Opens like challenges history */}
            {showDetailedHistory && (
                <>
                    <div className="module-view__overlay" onClick={() => setShowDetailedHistory(false)}></div>
                    <div className="module-view__history-drawer">
                        <div className="module-view__history-header">
                            <h2>Contest History</h2>
                            <button className="module-view__close-btn" onClick={() => setShowDetailedHistory(false)}>
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="module-view__history-content">
                            {contestHistory.length > 0 && (
                                <div className="module-view__filters">
                                    <div className="module-view__filter-group">
                                        <select
                                            className="module-view__filter-select"
                                            value={levelFilter}
                                            onChange={(e) => setLevelFilter(e.target.value)}
                                        >
                                            <option value="all">Any Contest</option>
                                            <option value="Contest">Active Contests</option>
                                        </select>
                                    </div>
                                    <div className="module-view__filter-group">
                                        <select
                                            className="module-view__filter-select"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <option value="all">All Status</option>
                                            <option value="passed">Passed (50%+)</option>
                                            <option value="failed">Failed (&lt;50%)</option>
                                            <option value="perfect">Perfect (100%)</option>
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

                            {historyLoading ? (
                                <div className="module-view__history-loading">
                                    <Spinner size="small" />
                                    <span>Loading contest records...</span>
                                </div>
                            ) : filteredHistory.length === 0 ? (
                                <div className="module-view__history-empty">
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
                                    <h3>No records found</h3>
                                    <p>Participate in a contest to see your performance history here.</p>
                                </div>
                            ) : (
                                <div className="module-view__history-list">
                                    {filteredHistory.map((item, idx) => {
                                        const percentage = Math.round((item.score / item.totalQuestions) * 100);
                                        const statusClass = percentage >= 80 ? 'high' : percentage >= 50 ? 'mid' : 'low';
                                        return (
                                            <Link
                                                key={item._id}
                                                to={`/history/${item._id}`}
                                                state={{ from: 'contests' }}
                                                className="module-view__history-item"
                                                style={{ animationDelay: `${idx * 0.05}s` }}
                                            >
                                                <div className={`module-view__history-bar module-view__history-bar--${statusClass}`}></div>
                                                <div className="module-view__history-meta">
                                                    <span className="module-view__history-level" style={{ fontSize: '15px' }}>
                                                        {item.contestId?.title || item.moduleId?.title || 'Unknown Contest'}
                                                    </span>
                                                    <span className="module-view__history-date" style={{ fontSize: '12px' }}>
                                                        {new Date(item.completedAt || item.createdAt).toLocaleDateString()} • {item.score}/{item.totalQuestions} correct
                                                    </span>
                                                </div>
                                                <div className={`module-view__history-score module-view__history-score--${statusClass}`} style={{ fontSize: '13px' }}>
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
        </div>
    );
};

export default ContestsPage;
