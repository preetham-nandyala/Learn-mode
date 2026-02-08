import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchModuleById } from '../redux/thunks/moduleThunks';
import api from '../api';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import './InterviewPage.css';

const InterviewPage = () => {
    const { id, level } = useParams();
    const dispatch = useDispatch();
    const { currentModule: moduleData } = useSelector(state => state.modules);

    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Persist selected question index
    const [selectedIdx, setSelectedIdx] = useState(() => {
        const saved = localStorage.getItem(`interview_idx_${id}_${level}`);
        return saved ? parseInt(saved, 10) : 0;
    });

    // Persist viewed questions set
    const [viewedQuestions, setViewedQuestions] = useState(() => {
        const saved = localStorage.getItem(`interview_viewed_${id}_${level}`);
        return saved ? new Set(JSON.parse(saved)) : new Set([0]);
    });

    useEffect(() => {
        if (!moduleData || moduleData._id !== id) {
            dispatch(fetchModuleById(id));
        }
    }, [dispatch, id, moduleData]);

    useEffect(() => {
        const fetchInterviewQuestions = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/modules/${id}/interview-questions/${level}`);
                const data = Array.isArray(response.data) ? response.data : [];
                setQuestions(data);

                // If the saved index is out of bounds, reset to 0
                const savedIdx = localStorage.getItem(`interview_idx_${id}_${level}`);
                const idx = savedIdx ? parseInt(savedIdx, 10) : 0;
                if (idx >= data.length) {
                    setSelectedIdx(0);
                    localStorage.setItem(`interview_idx_${id}_${level}`, '0');
                }
            } catch (error) {
                console.error('Failed to fetch interview questions', error);
                setQuestions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchInterviewQuestions();
    }, [id, level]);

    useEffect(() => {
        if (questions.length > 0) {
            localStorage.setItem(`interview_idx_${id}_${level}`, selectedIdx.toString());
            setViewedQuestions(prev => {
                const next = new Set([...prev, selectedIdx]);
                localStorage.setItem(`interview_viewed_${id}_${level}`, JSON.stringify([...next]));
                return next;
            });
        }
    }, [selectedIdx, id, level, questions.length]);

    const getLevelName = (lvl) => {
        switch (lvl) {
            case 'Basics': return 'Level 1 - Easy';
            case 'Intermediate': return 'Level 2 - Medium';
            case 'Advance': return 'Level 3 - Hard';
            default: return lvl;
        }
    };



    if (loading && !moduleData) return (
        <div className="interview-page__loading">
            <Spinner />
            <span>Loading Interview Preparation...</span>
        </div>
    );

    const activeQuestion = questions[selectedIdx];

    return (
        <div className="interview-page">
            <nav className="interview-page__nav">
                <div className="interview-page__nav-left">
                    <Link to={`/module/${id}`} className="interview-page__back">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Exit
                    </Link>
                    <div className="interview-page__progress-badge">
                        Q {selectedIdx + 1}/{questions.length}
                    </div>
                    <span className={`interview-page__level-badge interview-page__level-badge--${level.toLowerCase()}`}>
                        {getLevelName(level)}
                    </span>
                </div>

                <div className="interview-page__nav-center">
                    <h1 className="interview-page__nav-main-title">Interview Q&A</h1>
                </div>

                <div className="interview-page__nav-right">
                    <div style={{ width: '100px' }}></div>
                </div>
            </nav>

            <div className="interview-page__container">
                <div className="interview-page__main-content">
                    <div className="interview-page__detail-content">
                        {loading ? (
                            <div className="interview-page__list-loading">
                                <Spinner />
                            </div>
                        ) : questions.length === 0 ? (
                            <div className="interview-page__empty-state">
                                <EmptyState
                                    title="No Interview Questions Found"
                                    action={<Link to={`/module/${id}`} className="interview-page__empty-btn">Back to Module</Link>}
                                />
                            </div>
                        ) : activeQuestion ? (
                            <div className="interview-page__question-detail">
                                <div className="interview-page__question-card-study">
                                    <div className="interview-page__question-header-row">
                                        <div className="interview-page__question-number-badge">{selectedIdx + 1}</div>
                                        <h2 className="interview-page__question-text-large">{activeQuestion.questionText}</h2>
                                    </div>

                                    <div className="interview-page__answer-detail">
                                        <div className="interview-page__answer-text-large">
                                            {activeQuestion.answerText.split('\n').map((line, i) => (
                                                <p key={i}>{line}</p>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="interview-page__nav-footer">
                                        <button
                                            onClick={() => setSelectedIdx(prev => Math.max(0, prev - 1))}
                                            disabled={selectedIdx === 0}
                                            className="interview-page__nav-btn interview-page__nav-btn--prev"
                                        >
                                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setSelectedIdx(prev => Math.min(questions.length - 1, prev + 1))}
                                            disabled={selectedIdx === questions.length - 1}
                                            className="interview-page__nav-btn interview-page__nav-btn--next"
                                        >
                                            Next
                                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Right Sidebar - Full Question List */}
                <div className="interview-page__sidebar">
                    <div className="interview-page__sidebar-header">
                        <h3 className="interview-page__sidebar-title">Questions</h3>
                    </div>
                    <div className="interview-page__question-index-list">
                        {questions.map((q, i) => (
                            <div
                                key={i}
                                onClick={() => setSelectedIdx(i)}
                                className={`interview-page__index-item ${selectedIdx === i ? 'interview-page__index-item--active' :
                                    viewedQuestions.has(i) ? 'interview-page__index-item--viewed' : ''}`}
                            >
                                <span className="interview-page__list-number">{i + 1}</span>
                                <span className="interview-page__list-text">{q.questionText}</span>
                            </div>
                        ))}
                    </div>
                    <div className="interview-page__stats">
                        <div className="interview-page__stat">
                            <div className="interview-page__stat-dot interview-page__stat-dot--viewed"></div>
                            <span className="interview-page__stat-text">Viewed: <strong>{viewedQuestions.size}</strong></span>
                        </div>
                        <div className="interview-page__stat">
                            <div className="interview-page__stat-dot interview-page__stat-dot--remaining"></div>
                            <span className="interview-page__stat-text">Remaining: <strong>{questions.length - viewedQuestions.size}</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterviewPage;
