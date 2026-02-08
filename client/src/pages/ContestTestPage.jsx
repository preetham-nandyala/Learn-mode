import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchContestById } from '../redux/slices/contestSlice';
import { submitTestResult } from '../redux/thunks/testResultThunks';
import Spinner from '../components/Spinner';
import api from '../api';
import './TestPage.css';

const ContestTestPage = ({ secureMode = false }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { currentContest, loading } = useSelector(state => state.contests);
    const { user: currentUser } = useSelector(state => state.auth);

    const [testState, setTestState] = useState(secureMode ? 'ready' : 'instructions');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [answers, setAnswers] = useState({});
    const [testResult, setTestResult] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showInstructions, setShowInstructions] = useState(!secureMode);

    // Proctoring State
    const [warningCount, setWarningCount] = useState(0);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');
    const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
    const [verificationState, setVerificationState] = useState(secureMode ? 'pending' : 'verified');
    const [verificationEmail, setVerificationEmail] = useState(currentUser?.email || '');
    const [verificationPassword, setVerificationPassword] = useState('');
    const [verificationError, setVerificationError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [popupBlocked, setPopupBlocked] = useState(false);

    const timerRef = useRef(null);
    const containerRef = useRef(null);
    const fullscreenRestoringRef = useRef(false);
    const fullscreenTimeoutRef = useRef(null);

    useEffect(() => {
        dispatch(fetchContestById(id));
    }, [dispatch, id]);

    useEffect(() => {
        if (currentContest) {
            setTimeLeft(currentContest.duration * 60);
        }
    }, [currentContest]);

    useEffect(() => {
        if (currentUser?.email && !verificationEmail) {
            setVerificationEmail(currentUser.email);
        }
    }, [currentUser, verificationEmail]);

    // Timer Logic
    useEffect(() => {
        if (testState === 'running' && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleSubmit(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [testState, timeLeft, isAutoSubmitting]);

    // Proctoring Guard Logic
    useEffect(() => {
        if (!secureMode || testState !== 'running' || verificationState !== 'verified') return;

        // Prevent Back Navigation
        window.history.pushState(null, null, window.location.pathname);
        const handlePopState = () => {
            window.history.pushState(null, null, window.location.pathname);
            triggerWarning("back_navigation");
        };

        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = '';
            return '';
        };

        const handleVisibilityChange = () => {
            if (fullscreenRestoringRef.current || showWarningModal) return;
            if (document.hidden) triggerWarning("tab_switch");
        };

        const handleBlur = () => {
            if (fullscreenRestoringRef.current || showWarningModal) return;
            if (!document.hasFocus()) triggerWarning("blur");
        };

        const handleResize = () => {
            if (fullscreenRestoringRef.current || showWarningModal) return;
            if (window.innerWidth < 800 || window.innerHeight < 600) triggerWarning("resize");
        };

        const handleFullscreenChange = () => {
            if (fullscreenRestoringRef.current || showWarningModal) return;
            if (!document.fullscreenElement && testState === 'running' && !isAutoSubmitting) {
                triggerWarning("fullscreen_exit");
            }
        };

        const preventCopyPaste = (e) => e.preventDefault();
        const preventKeyboard = (e) => {
            // Allow F11, F12 (debugging), but block others if strictly proctored?
            // Final test blocks everything.
            e.preventDefault();
            return false;
        };

        window.addEventListener('popstate', handlePopState, true);
        window.addEventListener('beforeunload', handleBeforeUnload, true);
        window.addEventListener('blur', handleBlur, true);
        window.addEventListener('resize', handleResize, true);
        window.addEventListener('keydown', preventKeyboard, true);
        window.addEventListener('keyup', preventKeyboard, true);
        window.addEventListener('keypress', preventKeyboard, true);
        document.addEventListener('fullscreenchange', handleFullscreenChange, true);
        document.addEventListener('visibilitychange', handleVisibilityChange, true);
        document.addEventListener('copy', preventCopyPaste, true);
        document.addEventListener('cut', preventCopyPaste, true);
        document.addEventListener('paste', preventCopyPaste, true);
        document.addEventListener('contextmenu', preventCopyPaste, true);

        return () => {
            window.removeEventListener('popstate', handlePopState, true);
            window.removeEventListener('beforeunload', handleBeforeUnload, true);
            window.removeEventListener('blur', handleBlur, true);
            window.removeEventListener('resize', handleResize, true);
            window.removeEventListener('keydown', preventKeyboard, true);
            window.removeEventListener('keyup', preventKeyboard, true);
            window.removeEventListener('keypress', preventKeyboard, true);
            document.removeEventListener('fullscreenchange', handleFullscreenChange, true);
            document.removeEventListener('visibilitychange', handleVisibilityChange, true);
            document.removeEventListener('copy', preventCopyPaste, true);
            document.removeEventListener('cut', preventCopyPaste, true);
            document.removeEventListener('paste', preventCopyPaste, true);
            document.removeEventListener('contextmenu', preventCopyPaste, true);
        };
    }, [testState, warningCount, secureMode, isAutoSubmitting, showWarningModal, verificationState]);

    const triggerWarning = (type) => {
        if (isAutoSubmitting || testState !== 'running') return;

        setWarningCount(prev => {
            const newCount = prev + 1;
            let message = 'Unauthorized action detected. ';
            switch (type) {
                case 'back_navigation': message += 'Back navigation attempt detected.'; break;
                case 'tab_switch': message += 'Tab switching detected.'; break;
                case 'blur': message += 'Window focus lost detected.'; break;
                case 'fullscreen_exit': message += 'Fullscreen exit detected.'; break;
                case 'resize': message += 'Window resize detected.'; break;
                default: message += 'Policy violation.';
            }
            setWarningMessage(message);

            if (newCount >= 3) {
                setIsAutoSubmitting(true);
                handleSubmit(true);
            } else {
                setShowWarningModal(true);
            }
            return newCount;
        });
    };

    const handleStartSecure = async () => {
        try {
            await api.post(`/contests/${id}/register-test`);
            const features = 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';
            const secureUrl = `/contest/${id}/secure`;
            const newWin = window.open(secureUrl, 'SecureContestWindow', features);

            if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
                setPopupBlocked(true);
            } else {
                setPopupBlocked(false);
                navigate('/contests');
            }
        } catch (err) {
            console.error('Failed to register contest:', err);
            alert('Failed to initialize contest session.');
        }
    };

    const enterFullscreen = () => {
        fullscreenRestoringRef.current = true;
        if (containerRef.current) {
            containerRef.current.requestFullscreen().catch(() => {
                fullscreenRestoringRef.current = false;
            });
        }
        if (fullscreenTimeoutRef.current) clearTimeout(fullscreenTimeoutRef.current);
        fullscreenTimeoutRef.current = setTimeout(() => {
            fullscreenRestoringRef.current = false;
        }, 1500);
        setTestState('running');
    };

    const handleVerification = async (e) => {
        e.preventDefault();
        setIsVerifying(true);
        setVerificationError('');
        try {
            await api.post(`/contests/${id}/verify-test`, {
                email: verificationEmail,
                password: verificationPassword
            });
            setVerificationState('verified');
        } catch (err) {
            setVerificationError(err.response?.data?.message || 'Verification failed.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleAnswer = (questionId, optionIndex) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    };

    const handleSubmit = async (isAuto = false) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setShowSubmitModal(false);
        clearInterval(timerRef.current);

        try {
            const formattedAnswers = currentContest.questions.map(q => ({
                questionId: q._id,
                selectedOption: answers[q._id] !== undefined ? answers[q._id] : -1,
                isCorrect: answers[q._id] === q.correctOptionIndex
            }));

            const score = formattedAnswers.filter(a => a.isCorrect).length;
            const resultData = {
                contestId: id,
                level: 'Contest',
                score,
                totalQuestions: currentContest.questions.length,
                answers: formattedAnswers
            };

            const response = await dispatch(submitTestResult(resultData)).unwrap();
            setTestResult(response);
            setTestState('completed');
            if (document.fullscreenElement) document.exitFullscreen().catch(e => console.error(e));
        } catch (error) {
            console.error('Submit failed', error);
            if (!isAuto) alert('Failed to submit test');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (loading || !currentContest) return <div className="test-page__loading"><Spinner /> Preparing Assessment...</div>;

    // 1. Verification Screen
    if (secureMode && verificationState === 'pending') {
        return (
            <div className="test-page test-page--instructions">
                <div className="test-page__instructions-container">
                    <div className="test-page__instructions-card" style={{ maxWidth: '450px', margin: '0 auto' }}>
                        <div className="test-page__instructions-header">
                            <div className="test-page__instructions-icon">🔐</div>
                            <h1>Identity Verification</h1>
                            <p>Enter your credentials to verify your identity for this proctored contest.</p>
                        </div>
                        <form onSubmit={handleVerification} className="test-page__verification-form">
                            <div className="test-page__form-group" style={{ marginBottom: '16px', textAlign: 'left' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#8A8A8A' }}>Email Address</label>
                                <input type="email" required value={verificationEmail} onChange={(e) => setVerificationEmail(e.target.value)}
                                    placeholder="Enter your email" style={{ width: '100%', padding: '12px', background: '#1A1A1A', border: '1px solid #3E3E3E', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                            </div>
                            <div className="test-page__form-group" style={{ marginBottom: '20px', textAlign: 'left' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#8A8A8A' }}>Password</label>
                                <input type="password" required value={verificationPassword} onChange={(e) => setVerificationPassword(e.target.value)}
                                    placeholder="Enter your password" style={{ width: '100%', padding: '12px', background: '#1A1A1A', border: '1px solid #3E3E3E', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                            </div>
                            {verificationError && <p style={{ color: '#FF375F', fontSize: '13px', marginBottom: '16px', fontWeight: '500' }}>{verificationError}</p>}
                            <button type="submit" disabled={isVerifying} className="test-page__begin-btn" style={{ width: '100%', justifyContent: 'center' }}>
                                {isVerifying ? 'Verifying...' : 'Verify & Continue'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // 2. Instructions Screen
    if (!secureMode && showInstructions) {
        return (
            <div className="test-page test-page--instructions">
                <div className="test-page__instructions-container" style={{ position: 'relative' }}>
                    <button onClick={() => navigate('/contests')} className="test-page__back-link" style={{
                        position: 'absolute', top: '24px', left: '24px', background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '8px 16px',
                        color: '#AFAFAF', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to Contests
                    </button>

                    <div className="test-page__instructions-card">
                        <div className="test-page__instructions-header">
                            <div className="test-page__instructions-icon">🏆</div>
                            <h1>{currentContest.title} Rules</h1>
                            <p>This is a proctored assessment. Please review the security rules.</p>
                        </div>

                        <div className="test-page__rules-grid">
                            <div className="test-page__rule-item">
                                <div className="test-page__rule-icon">🛡️</div>
                                <div className="test-page__rule-text">
                                    <h3>Secure Mode</h3>
                                    <p>The test opens in a dedicated window. Tab switching is strictly forbidden.</p>
                                </div>
                            </div>
                            <div className="test-page__rule-item">
                                <div className="test-page__rule-icon">⚠️</div>
                                <div className="test-page__rule-text">
                                    <h3>3 Warning Limit</h3>
                                    <p>Upon the 3rd violation, your contest will be <strong>auto-submitted</strong>.</p>
                                </div>
                            </div>
                            <div className="test-page__rule-item">
                                <div className="test-page__rule-icon">🖥️</div>
                                <div className="test-page__rule-text">
                                    <h3>Auto Full-Screen</h3>
                                    <p>Window will maximize. Resizing is not permitted during the session.</p>
                                </div>
                            </div>
                            <div className="test-page__rule-item">
                                <div className="test-page__rule-icon">🔐</div>
                                <div className="test-page__rule-text">
                                    <h3>Identity Check</h3>
                                    <p>You must verify your credentials before the contest begins.</p>
                                </div>
                            </div>
                            <div className="test-page__rule-item">
                                <div className="test-page__rule-icon">⌨️</div>
                                <div className="test-page__rule-text">
                                    <h3>Keyboard Disabled</h3>
                                    <p>All keyboard input is completely disabled during the test.</p>
                                </div>
                            </div>
                            <div className="test-page__rule-item">
                                <div className="test-page__rule-icon">⏱️</div>
                                <div className="test-page__rule-text">
                                    <h3>Time Management</h3>
                                    <p>Strict {currentContest.duration}-minute limit. Finish before the timer hits zero.</p>
                                </div>
                            </div>
                        </div>

                        <div className="test-page__instructions-footer">
                            <button onClick={handleStartSecure} className="test-page__begin-btn">
                                Open Secure Contest Window
                            </button>
                            {popupBlocked && (
                                <div className="test-page__popup-warning" style={{ color: '#ff4b4b', marginTop: '15px' }}>
                                    <p>Popup was blocked! Please allow popups or click below:</p>
                                    <Link to={`/contest/${id}/secure`} style={{ color: '#fff', textDecoration: 'underline' }}>
                                        Open in Current Tab
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Ready Screen (Secure Mode Launch)
    if (secureMode && (testState === 'running' || testState === 'ready') && !document.fullscreenElement && !showWarningModal && !fullscreenRestoringRef.current) {
        return (
            <div className="test-page test-page--instructions" ref={containerRef}>
                <div className="test-page__instructions-container">
                    <div className="test-page__instructions-card" style={{ textAlign: 'center' }}>
                        <div className="test-page__instructions-header">
                            <div className="test-page__instructions-icon">🚀</div>
                            <h1>Contest Ready</h1>
                            <p>Click below to maximize and start the {currentContest.title}.</p>
                        </div>
                        <button onClick={enterFullscreen} className="test-page__begin-btn">
                            Enter Fullscreen & Start Contest
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 4. Completed Screen
    if (testState === 'completed' && testResult) {
        const percentage = Math.round((testResult.score / testResult.totalQuestions) * 100);
        const statusClass = percentage >= 80 ? 'high' : percentage >= 50 ? 'mid' : 'low';

        return (
            <div className="test-page">
                <div className="test-page__results">
                    <div className="test-page__results-right" style={{ margin: '0 auto', maxWidth: '600px' }}>
                        <div className={`test-page__results-score test-page__results-score--${statusClass}`}>
                            <span className="test-page__results-percentage">{percentage}%</span>
                            <span className="test-page__results-label">Score</span>
                        </div>
                        <h2 className="test-page__results-title">{isAutoSubmitting ? 'Contest Voided & Submitted' : 'Contest Complete!'}</h2>
                        <p className="test-page__results-subtitle">
                            {isAutoSubmitting ? 'Automatically submitted due to proctoring violations.' : `Final result for ${currentContest.title}.`}
                        </p>
                        <div className="test-page__results-stats">
                            <div className="test-page__results-stat">
                                <p className="test-page__results-stat-value">{testResult.score}</p>
                                <p className="test-page__results-stat-label">Correct</p>
                            </div>
                            <div className="test-page__results-stat">
                                <p className="test-page__results-stat-value">{testResult.totalQuestions}</p>
                                <p className="test-page__results-stat-label">Total</p>
                            </div>
                        </div>
                        <button onClick={() => window.close()} className="test-page__results-btn">Close Assessment</button>
                    </div>
                </div>
            </div>
        );
    }

    const questions = currentContest.questions;
    const currentQuestion = questions[currentQuestionIndex];

    // 5. Running Test UI
    return (
        <div className="test-page" ref={containerRef}>
            <nav className="test-page__nav">
                <div className="test-page__nav-left">
                    <span className="test-page__progress">Q {currentQuestionIndex + 1}/{questions.length}</span>
                    <span className="test-page__level-badge test-page__level-badge--mid" style={{ marginLeft: '12px' }}>SECURE CONTEST</span>
                </div>
                <div className={`test-page__timer ${timeLeft < 300 ? 'test-page__timer--warning' : ''}`}>
                    {formatTime(timeLeft)}
                </div>
                {secureMode && <div className="test-page__warnings-display">Warnings: {warningCount}/3</div>}
                <button onClick={() => setShowSubmitModal(true)} className="test-page__finish" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Finish Contest'}
                </button>
            </nav>

            <div className="test-page__content">
                <div className="test-page__main">
                    <div className="test-page__question-card">
                        <div className="test-page__question-header">
                            <p className="test-page__question-number">Question {currentQuestionIndex + 1}</p>
                            <h2 className="test-page__question-text">{currentQuestion.questionText}</h2>
                        </div>
                        <div className="test-page__options">
                            {currentQuestion.options.map((opt, idx) => {
                                const isSelected = answers[currentQuestion._id] === idx;
                                return (
                                    <div key={idx} onClick={() => handleAnswer(currentQuestion._id, idx)}
                                        className={`test-page__option ${isSelected ? 'test-page__option--selected' : ''}`} >
                                        <div className="test-page__option-radio">{isSelected && <div className="test-page__option-radio-dot"></div>}</div>
                                        <span className="test-page__option-letter">{String.fromCharCode(65 + idx)}</span>
                                        <span className="test-page__option-label">{opt}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="test-page__nav-buttons">
                            <button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                className="test-page__nav-btn" style={currentQuestionIndex === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : {}} >
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" style={{ marginRight: 8 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg> Previous
                            </button>
                            <button disabled={currentQuestionIndex === questions.length - 1} onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                className="test-page__nav-btn" style={currentQuestionIndex === questions.length - 1 ? { opacity: 0.4, cursor: 'not-allowed' } : {}} >
                                Next <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" style={{ marginLeft: 8 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sidebar Minimap */}
                <div className="test-page__sidebar">
                    <div className="test-page__sidebar-header">
                        <h3 className="test-page__sidebar-title">Questions</h3>
                    </div>
                    <div className="test-page__question-map-container">
                        <div className="test-page__question-map">
                            {questions.map((q, i) => (
                                <button key={i} onClick={() => setCurrentQuestionIndex(i)}
                                    className={`test-page__question-map-btn ${currentQuestionIndex === i ? 'test-page__question-map-btn--current' :
                                        answers[q._id] !== undefined ? 'test-page__question-map-btn--answered' : ''}`} > {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="test-page__stats">
                        <div className="test-page__stat">
                            <div className="test-page__stat-dot test-page__stat-dot--answered" style={{ background: '#3EB489' }}></div>
                            <span className="test-page__stat-text">Answered: <strong>{Object.keys(answers).length}</strong></span>
                        </div>
                        <div className="test-page__stat">
                            <div className="test-page__stat-dot test-page__stat-dot--remaining" style={{ background: '#333' }}></div>
                            <span className="test-page__stat-text">Remaining: <strong>{questions.length - Object.keys(answers).length}</strong></span>
                        </div>
                    </div>
                </div>
            </div>

            {showWarningModal && (
                <div className="test-page__modal-overlay">
                    <div className="test-page__modal">
                        <h2 className="test-page__modal-title">🚨 Warning {warningCount}/3</h2>
                        <p className="test-page__modal-text">{warningMessage}</p>
                        <button onClick={() => { setShowWarningModal(false); enterFullscreen(); }} className="test-page__modal-btn test-page__modal-btn--confirm" > Continue Contest </button>
                    </div>
                </div>
            )}

            {showSubmitModal && (
                <div className="test-page__modal-overlay">
                    <div className="test-page__modal">
                        <div className="test-page__modal-icon">✅</div>
                        <h2 className="test-page__modal-title">Finish Contest?</h2>
                        <p className="test-page__modal-text"> You have answered <strong>{Object.keys(answers).length}</strong> out of <strong>{questions.length}</strong> questions. Are you sure you want to exit? </p>
                        <div className="test-page__modal-actions">
                            <button onClick={() => setShowSubmitModal(false)} className="test-page__modal-btn test-page__modal-btn--cancel" > No, Keep Working </button>
                            <button onClick={() => handleSubmit()} className="test-page__modal-btn test-page__modal-btn--confirm" disabled={isSubmitting} > {isSubmitting ? 'Sumitting...' : 'Yes, Submit Now'} </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContestTestPage;
