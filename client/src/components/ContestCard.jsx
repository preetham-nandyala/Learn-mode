import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TechLogo from './TechLogo';
import { getTechColors } from '../utils/themeUtils';
import './ModuleCard.css';

const ContestCard = ({ contest }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isLocked, setIsLocked] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const start = new Date(contest.startTime).getTime();
            const distance = start - now;

            if (distance <= 0) {
                setIsLocked(false);
                setTimeLeft('Live Now');
                clearInterval(timer);
            } else {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                let str = "";
                if (days > 0) str += `${days}d `;
                str += `${hours}h ${minutes}m ${seconds}s`;
                setTimeLeft(str);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [contest.startTime]);

    const colors = getTechColors(contest.title);

    return (
        <div
            className={`client-home__module-card ${isLocked ? 'contest-card--locked' : ''}`}
            style={{ position: 'relative' }}
        >
            <Link
                to={isLocked ? '#' : `/contest/${contest._id}`}
                style={{
                    textDecoration: 'none',
                    pointerEvents: isLocked ? 'none' : 'auto',
                    cursor: isLocked ? 'not-allowed' : 'pointer'
                }}
            >
                <div
                    className="client-home__module-inner"
                    style={{
                        background: colors.gradient,
                        '--text-primary': colors.text || '#ffffff',
                        '--text-secondary': colors.text ? `${colors.text}CC` : 'rgba(255, 255, 255, 0.9)',
                        '--border-color': colors.border,
                        opacity: isLocked ? 0.6 : 1
                    }}
                >
                    <div className="client-home__module-cover">
                        <div className="client-home__module-logo">
                            <TechLogo title={contest.title} className="client-home__tech-logo" />
                        </div>
                    </div>
                    <div className="client-home__module-content">
                        <h3 className="client-home__module-title">{contest.title}</h3>
                        <p className="client-home__module-subtitle">
                            {isLocked ? `Starts in: ${timeLeft}` : 'Contest is Live!'}
                        </p>
                    </div>
                    {!isLocked && (
                        <div className="client-home__module-overlay">
                            <div className="client-home__module-play-btn" style={{ color: '#000' }}>
                                <svg fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>
                        </div>
                    )}
                </div>
            </Link>

            {isLocked && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    pointerEvents: 'none'
                }}>
                    <div style={{
                        background: 'rgba(0,0,0,0.6)',
                        borderRadius: '50%',
                        padding: '12px',
                        marginBottom: '10px',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="32" height="32">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <span style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        background: 'rgba(0,0,0,0.4)',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        backdropFilter: 'blur(4px)',
                        color: colors.border || '#FFA116'
                    }}>
                        LOCKED
                    </span>
                </div>
            )}
        </div>
    );
};

export default ContestCard;
