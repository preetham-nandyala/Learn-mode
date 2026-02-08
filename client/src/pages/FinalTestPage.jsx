import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchModuleById, fetchTestQuestions } from '../redux/thunks/moduleThunks';
import { submitTestResult } from '../redux/thunks/testResultThunks';
import Spinner from '../components/Spinner';
import api from '../api';
import './TestPage.css';

const FinalTestPage = ({ secureMode = false }) => {
    const { id } = useParams();
    const level = 'Final';
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { currentModule: moduleData, testQuestions: reduxQuestions, loading } = useSelector(state => state.modules);
    const { user: currentUser } = useSelector(state => state.auth);

    const [testState, setTestState] = useState(secureMode ? 'ready' : 'instructions');
    const [testQuestions, setTestQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30 * 60);
    const [testAnswers, setTestAnswers] = useState({});
    const [testResult, setTestResult] = useState(null);
    const [showInstructions, setShowInstructions] = useState(!secureMode);

    const [warningCount, setWarningCount] = useState(0);
    const [showWarningModal, setShowWarningModal] = useState(false);
    const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [verificationState, setVerificationState] = useState(secureMode ? 'pending' : 'verified');
    const [verificationEmail, setVerificationEmail] = useState(currentUser?.email || '');
    const [verificationPassword, setVerificationPassword] = useState('');
    const [verificationError, setVerificationError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [hasActiveSession, setHasActiveSession] = useState(false);

    // Update email if currentUser loads after initial render
    useEffect(() => {
        if (currentUser?.email && !verificationEmail) {
            setVerificationEmail(currentUser.email);
        }
    }, [currentUser, verificationEmail]);

    const timerRef = useRef(null);
    const containerRef = useRef(null);
    const fullscreenRestoringRef = useRef(false);
    const fullscreenTimeoutRef = useRef(null);

    useEffect(() => {
        setTestQuestions([]);
        if (!moduleData || moduleData._id !== id) {
            dispatch(fetchModuleById(id));
        }
        dispatch(fetchTestQuestions({ id, level }));
    }, [dispatch, id]);

    useEffect(() => {
        if (reduxQuestions && reduxQuestions.length > 0) {
            setTestQuestions(reduxQuestions);

            const storageKey = `test_session_${id}_Final`;
            const savedSession = localStorage.getItem(storageKey);

            if (savedSession) {
                const session = JSON.parse(savedSession);
                const remaining = Math.max(0, Math.floor((session.endTime - Date.now()) / 1000));

                // If time left AND warnings below limit, it's an active resumable session
                if (remaining > 0 && (session.warningCount || 0) < 3) {
                    setHasActiveSession(true);
                }

                if (secureMode) {
                    setTestAnswers(session.answers || {});
                    setCurrentQuestionIndex(session.currentIndex || 0);
                    setTestState('running');
                    setWarningCount(session.warningCount || 0);
                    setTimeLeft(remaining);

                    if (remaining <= 0) {
                        submitTest();
                    }
                }
            } else if (secureMode) {
                setTimeLeft(30 * 60);
            }
        } else if (!loading && reduxQuestions && reduxQuestions.length === 0) {
            setTestQuestions([]);
        }
    }, [reduxQuestions, loading, id, secureMode]);

    useEffect(() => {
        if (secureMode && testState === 'running' && testQuestions.length > 0) {
            const storageKey = `test_session_${id}_Final`;
            const session = {
                answers: testAnswers,
                currentIndex: currentQuestionIndex,
                endTime: Date.now() + (timeLeft * 1000),
                warningCount
            };
            localStorage.setItem(storageKey, JSON.stringify(session));
        }
    }, [testAnswers, currentQuestionIndex, timeLeft, testState, id, warningCount, testQuestions.length, secureMode]);

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

    useEffect(() => {
        if (!secureMode || testState !== 'running' || verificationState !== 'verified') return;

        // Prevent Back Navigation
        window.history.pushState(null, null, window.location.pathname);
        const handlePopState = (e) => {
            window.history.pushState(null, null, window.location.pathname);
            triggerWarning("back_navigation");
        };

        // Prevent Refresh/Close
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = '';
            return '';
        };

        // --- UPDATED HANDLERS WITH GUARDS ---

        const handleVisibilityChange = () => {
            if (fullscreenRestoringRef.current || showWarningModal) return;
            if (document.hidden) triggerWarning("tab_switch");
        };

        const handleBlur = () => {
            if (fullscreenRestoringRef.current || showWarningModal) return;

            // FIX: Only trigger warning if the *entire document* loses focus.
            // This prevents warnings when buttons become disabled (which naturally clears focus).
            if (!document.hasFocus()) {
                triggerWarning("blur");
            }
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

        // --- COPY/PASTE PROTECTION ---
        const preventCopyPaste = (e) => {
            e.preventDefault();
            return false;
        };

        // --- INPUT BLOCKING ---

        const handleContextMenu = (e) => {
            e.preventDefault();
            return false;
        };

        const handleKeyDown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        const handleKeyUp = (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        const handleKeyPress = (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        // --- CLICK HANDLER (Safe Zones Logic) ---
        const handleClick = (e) => {
            const target = e.target;

            // 1. Define "Safe Zones"
            // These are the CLASS NAMES of the containers (parents) that are safe to click.
            // This fixes issues with icons, disabled buttons, and map numbers.
            const safeZones = [
                '.test-page__nav-buttons',      // The Prev/Next container
                '.test-page__question-map',     // The Minimap container
                '.test-page__modal',            // The Warning Modal
                '.test-page__options',          // The Answers area
                '.test-page__finish'            // The Submit button
            ];

            // 2. Allow the click if it's inside a Safe Zone
            const isSafe = safeZones.some(selector => target.closest(selector));
            if (isSafe) {
                return true;
            }

            // 3. Block if it is a Button outside a Safe Zone
            if (target.tagName === 'BUTTON' || target.closest('button')) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                if (!showWarningModal) {
                    triggerWarning("button_click");
                }
                return false;
            }

            // 4. Allow generic background clicks (prevents issues with disabled buttons falling through)
            return true;
        };


        // Register Listeners
        window.addEventListener('popstate', handlePopState, true);
        window.addEventListener('beforeunload', handleBeforeUnload, true);
        window.addEventListener('blur', handleBlur, true);
        window.addEventListener('resize', handleResize, true);
        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);
        window.addEventListener('keypress', handleKeyPress, true);
        window.addEventListener('click', handleClick, true);
        document.addEventListener('contextmenu', handleContextMenu, true);
        document.addEventListener('fullscreenchange', handleFullscreenChange, true);
        document.addEventListener('visibilitychange', handleVisibilityChange, true);
        document.addEventListener('copy', preventCopyPaste, true);
        document.addEventListener('cut', preventCopyPaste, true);
        document.addEventListener('paste', preventCopyPaste, true);

        // Cleanup
        return () => {
            window.removeEventListener('popstate', handlePopState, true);
            window.removeEventListener('beforeunload', handleBeforeUnload, true);
            window.removeEventListener('blur', handleBlur, true);
            window.removeEventListener('resize', handleResize, true);
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp, true);
            window.removeEventListener('keypress', handleKeyPress, true);
            window.removeEventListener('click', handleClick, true);
            document.removeEventListener('contextmenu', handleContextMenu, true);
            document.removeEventListener('fullscreenchange', handleFullscreenChange, true);
            document.removeEventListener('visibilitychange', handleVisibilityChange, true);
            document.removeEventListener('copy', preventCopyPaste, true);
            document.removeEventListener('cut', preventCopyPaste, true);
            document.removeEventListener('paste', preventCopyPaste, true);
        };
    }, [testState, warningCount, secureMode, isAutoSubmitting, showWarningModal, verificationState]);

    const triggerWarning = (type) => {
        if (isAutoSubmitting || testState !== 'running') return;

        setWarningCount(prev => {
            const newCount = prev + 1;

            // Set warning message based on type
            let message = 'Unauthorized action detected. ';
            switch (type) {
                case 'back_navigation':
                    message += 'Back navigation attempt detected.';
                    break;
                case 'button_click':
                    message += 'Button click blocked - only Submit is allowed.';
                    break;
                case 'tab_switch':
                    message += 'Tab switching detected.';
                    break;
                case 'blur':
                    message += 'Window focus lost detected.';
                    break;
                case 'fullscreen_exit':
                    message += 'Fullscreen exit detected.';
                    break;
                case 'resize':
                    message += 'Window resize detected.';
                    break;
                default:
                    message += 'Policy violation.';
            }

            setWarningMessage(message);

            if (newCount >= 3) {
                setIsAutoSubmitting(true);
                submitTest(true);
            } else {
                setShowWarningModal(true);
            }

            return newCount;
        });
    };

    const submitTest = async (isViolation = false) => {
        if (testState === 'submitted') return;

        clearInterval(timerRef.current);
        if (fullscreenTimeoutRef.current) {
            clearTimeout(fullscreenTimeoutRef.current);
        }

        let score = 0;
        const questionsToUse = testQuestions.length > 0 ? testQuestions : reduxQuestions;

        const answersPayload = questionsToUse.map(q => {
            const selected = testAnswers[q._id];
            const isCorrect = selected === q.correctOptionIndex;
            if (isCorrect) score++;
            return { questionId: q._id, selectedOptionIndex: selected !== undefined ? selected : -1, isCorrect };
        });

        const resultData = {
            moduleId: id,
            level,
            score,
            totalQuestions: questionsToUse.length,
            answers: answersPayload,
        };

        localStorage.removeItem(`test_session_${id}_Final`);
        setTestResult({ ...resultData, questions: questionsToUse });
        setTestState('submitted');

        if (document.fullscreenElement) {
            document.exitFullscreen().catch(err => console.error(err));
        }

        try {
            await dispatch(submitTestResult(resultData)).unwrap();
        } catch (error) {
            console.error('Failed to save test result', error);
        }
    };

    const [popupBlocked, setPopupBlocked] = useState(false);

    const startTest = async () => {
        try {
            // 1. Register test intent with backend (creates a 2-min permit)
            await api.post(`/modules/${id}/register-test/${level}`);

            // 2. Open secure window
            const features = 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes';
            const secureUrl = `/challenges/${id}/secure-test`;
            const newWin = window.open(secureUrl, 'SecureTestWindow', features);

            if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
                setPopupBlocked(true);
            } else {
                setPopupBlocked(false);
                // Navigate back or to a success page after a small delay
                setTimeout(() => {
                    navigate(`/challenges/${id}`);
                }, 1000);
            }
        } catch (err) {
            console.error('Failed to register test:', err);
            alert('Failed to initialize test. Please try again.');
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const enterFullscreen = () => {
        // Set the flag to prevent fullscreen exit warnings during restoration
        fullscreenRestoringRef.current = true;

        if (containerRef.current) {
            containerRef.current.requestFullscreen().catch(err => {
                console.warn("Fullscreen failed:", err);
                fullscreenRestoringRef.current = false;
            });
        }

        // Clear the flag after a longer timeout to ensure fullscreen is settled
        if (fullscreenTimeoutRef.current) {
            clearTimeout(fullscreenTimeoutRef.current);
        }

        fullscreenTimeoutRef.current = setTimeout(() => {
            fullscreenRestoringRef.current = false;
        }, 1500);

        setTestState('running');
    };

    useEffect(() => {
        if (secureMode && testState === 'running' && !document.fullscreenElement && !showWarningModal && !fullscreenRestoringRef.current && verificationState === 'verified') {
            document.documentElement.requestFullscreen().catch(err => console.warn(err));
        }
    }, [secureMode, testState, showWarningModal, verificationState]);

    const handleVerification = async (e) => {
        e.preventDefault();
        setIsVerifying(true);
        setVerificationError('');

        try {
            // Use the dedicated verify-test endpoint
            const response = await api.post(`/modules/${id}/verify-test/${level}`, {
                email: verificationEmail,
                password: verificationPassword
            });

            // If success, the backend confirmed permit + credentials
            setVerificationState('verified');
        } catch (err) {
            setVerificationError(err.response?.data?.message || 'Verification failed. Try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    if (secureMode && verificationState === 'pending') {
        return (
            <div className="test-page test-page--instructions">
                <div className="test-page__instructions-container">
                    <div className="test-page__instructions-card" style={{ maxWidth: '450px', margin: '0 auto' }}>
                        <div className="test-page__instructions-header">
                            <div className="test-page__instructions-icon">🔐</div>
                            <h1>Identity Verification</h1>
                            <p>Please enter your credentials to verify your identity and start the assessment.</p>
                        </div>

                        <form onSubmit={handleVerification} className="test-page__verification-form">
                            <div className="test-page__form-group" style={{ marginBottom: '16px', textAlign: 'left' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#8A8A8A' }}>Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={verificationEmail}
                                    onChange={(e) => setVerificationEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: '#1A1A1A',
                                        border: '1px solid #3E3E3E',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div className="test-page__form-group" style={{ marginBottom: '20px', textAlign: 'left' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#8A8A8A' }}>Password</label>
                                <input
                                    type="password"
                                    required
                                    value={verificationPassword}
                                    onChange={(e) => setVerificationPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: '#1A1A1A',
                                        border: '1px solid #3E3E3E',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            {verificationError && (
                                <p style={{ color: '#FF375F', fontSize: '13px', marginBottom: '16px', fontWeight: '500' }}>
                                    {verificationError}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isVerifying}
                                className="test-page__begin-btn"
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                {isVerifying ? 'Verifying...' : 'Verify & Continue'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    if (!secureMode && showInstructions) {
        return (
            <div className="test-page test-page--instructions">
                <div className="test-page__instructions-container" style={{ position: 'relative' }}>
                    <button
                        onClick={() => navigate(`/challenges/${id}`)}
                        className="test-page__back-link"
                        style={{
                            position: 'absolute',
                            top: '24px',
                            left: '24px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            padding: '8px 16px',
                            color: '#AFAFAF',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        Back to Challenges
                    </button>

                    <div className="test-page__instructions-card">
                        <div className="test-page__instructions-header">
                            <div className="test-page__instructions-icon">🔒</div>
                            <h1>Final Assessment Rules</h1>
                            <p>This is a strictly monitored test. Please review the security rules.</p>
                        </div>
                        <div className="test-page__rules-grid">
                            <div className="test-page__rule-item">
                                <div className="test-page__rule-icon">🛡️</div>
                                <div className="test-page__rule-text">
                                    <h3>Secure Environment</h3>
                                    <p>The test opens in a dedicated window. Tab switching is strictly forbidden.</p>
                                </div>
                            </div>
                            <div className="test-page__rule-item">
                                <div className="test-page__rule-icon">⚠️</div>
                                <div className="test-page__rule-text">
                                    <h3>3 Warning Limit</h3>
                                    <p>Upon the 3rd violation, your test will be <strong>auto-submitted</strong>.</p>
                                </div>
                            </div>
                            <div className="test-page__rule-item">
                                <div className="test-page__rule-icon">🖥️</div>
                                <div className="test-page__rule-text">
                                    <h3>Auto Full-Screen</h3>
                                    <p>Test window will maximize and fit your screen. Resize is not permitted.</p>
                                </div>
                            </div>
                            <div className="test-page__rule-item">
                                <div className="test-page__rule-icon">❓</div>
                                <div className="test-page__rule-text">
                                    <h3>Mixed Difficulty</h3>
                                    <p>Questions are picked from all levels (15 Easy, 15 Medium, 15 Hard).</p>
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
                                    <p>Strict 30-minute limit. Finish before the timer hits zero.</p>
                                </div>
                            </div>
                        </div>
                        <div className="test-page__instructions-footer">
                            <button onClick={startTest} className={`test-page__begin-btn ${hasActiveSession ? 'test-page__begin-btn--continue' : ''}`}>
                                {hasActiveSession ? 'Continue Final Assessment' : 'Open Secure Test Window'}
                            </button>
                            {hasActiveSession && (
                                <p style={{ color: '#3EB489', fontSize: '13px', marginTop: '10px', fontWeight: '500' }}>
                                    You have an active session. Click above to resume.
                                </p>
                            )}
                            {popupBlocked && (
                                <div className="test-page__popup-warning" style={{ color: '#ff4b4b', marginTop: '15px' }}>
                                    <p>Popup was blocked! Please allow popups or click below:</p>
                                    <Link to={`/challenges/${id}/secure-test`} style={{ color: '#fff', textDecoration: 'underline' }}>
                                        Open Test in Current Tab
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // In secure mode, if not running, we need a user gesture to enter fullscreen
    if (secureMode && (testState === 'running' || testState === 'ready') && !document.fullscreenElement && !showWarningModal && !fullscreenRestoringRef.current) {
        return (
            <div className="test-page test-page--instructions" ref={containerRef}>
                <div className="test-page__instructions-container">
                    <div className="test-page__instructions-card" style={{ textAlign: 'center' }}>
                        <div className="test-page__instructions-header">
                            <div className="test-page__instructions-icon">🚀</div>
                            <h1>Ready to begin</h1>
                            <p>Click below to maximize the window and start your final assessment.</p>
                        </div>
                        <button onClick={enterFullscreen} className="test-page__begin-btn">
                            Enter Fullscreen & Start Test
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const questionsToUse = testQuestions.length > 0 ? testQuestions : reduxQuestions;

    if (loading || (reduxQuestions && reduxQuestions.length > 0 && testQuestions.length === 0)) {
        return <div className="test-page__loading"><Spinner /> Preparing Environment...</div>;
    }

    if (!loading && questionsToUse.length === 0) {
        return (
            <div className="test-page__empty">
                <div className="test-page__empty-container">
                    <h1>No Questions Available</h1>
                    <p>There are no questions available for this module's final assessment yet.</p>
                    <button onClick={() => navigate(`/challenges/${id}`)} className="test-page__results-btn">
                        Back to Challenges
                    </button>
                </div>
            </div>
        );
    }

    if (testState === 'submitted' && testResult) {
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
                        <h2 className="test-page__results-title">{isAutoSubmitting ? 'Test Voided & Submitted' : 'Test Complete!'}</h2>
                        <p className="test-page__results-subtitle">
                            {isAutoSubmitting ? 'Automatically submitted due to proctoring violations.' : 'Final Assessment Result'}
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

    return (
        <div className="test-page" ref={containerRef}>
            <nav className="test-page__nav">
                <div className="test-page__nav-left">
                    <span className="test-page__progress">Q {currentQuestionIndex + 1}/{questionsToUse.length}</span>
                    <span className="test-page__level-badge test-page__level-badge--hard" style={{ marginLeft: '12px' }}>SECURE</span>
                </div>
                <div className={`test-page__timer ${timeLeft < 60 ? 'test-page__timer--warning' : ''}`}>
                    {formatTime(timeLeft)}
                </div>
                <div className="test-page__warnings-display">Warnings: {warningCount}/3</div>
                <button onClick={() => setShowSubmitModal(true)} className="test-page__finish">Submit Final</button>
            </nav>

            <div className="test-page__content">
                <div className="test-page__main">
                    <div className="test-page__question-card">
                        <div className="test-page__question-header">
                            <p className="test-page__question-number">Question {currentQuestionIndex + 1}</p>
                            <h2 className="test-page__question-text">{questionsToUse[currentQuestionIndex].questionText}</h2>
                        </div>
                        <div className="test-page__options">
                            {questionsToUse[currentQuestionIndex].options.map((opt, idx) => {
                                const isSelected = testAnswers[questionsToUse[currentQuestionIndex]._id] === idx;
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => setTestAnswers(prev => ({ ...prev, [questionsToUse[currentQuestionIndex]._id]: idx }))}
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
                                disabled={currentQuestionIndex === 0}
                                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                className="test-page__nav-btn"
                                style={currentQuestionIndex === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                            >
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" style={{ marginRight: 8 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Previous
                            </button>
                            <button
                                disabled={currentQuestionIndex === questionsToUse.length - 1}
                                onClick={() => setCurrentQuestionIndex(prev => Math.min(questionsToUse.length - 1, prev + 1))}
                                className="test-page__nav-btn"
                                style={currentQuestionIndex === questionsToUse.length - 1 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                            >
                                Next
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" style={{ marginLeft: 8 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
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
                            {questionsToUse.map((q, i) => (
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
                            <span className="test-page__stat-text">Remaining: <strong>{questionsToUse.length - Object.keys(testAnswers).length}</strong></span>
                        </div>
                    </div>
                </div>
            </div>

            {showWarningModal && (
                <div className="test-page__modal-overlay">
                    <div className="test-page__modal">
                        <h2 className="test-page__modal-title">🚨 Warning {warningCount}/3</h2>
                        <p className="test-page__modal-text">{warningMessage}</p>
                        <button
                            onClick={() => {
                                setShowWarningModal(false);
                                enterFullscreen();
                            }}
                            className="test-page__modal-btn test-page__modal-btn--confirm"
                        >
                            Continue Test
                        </button>
                    </div>
                </div>
            )}

            {showSubmitModal && (
                <div className="test-page__modal-overlay">
                    <div className="test-page__modal">
                        <div className="test-page__modal-icon">✅</div>
                        <h2 className="test-page__modal-title">Ready to Submit?</h2>
                        <p className="test-page__modal-text">
                            You have answered <strong>{Object.keys(testAnswers).length}</strong> out of <strong>{questionsToUse.length}</strong> questions. Are you sure you want to finish the assessment?
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

export default FinalTestPage;