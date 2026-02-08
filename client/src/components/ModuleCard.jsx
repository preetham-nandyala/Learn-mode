import React from 'react';
import { Link } from 'react-router-dom';
import TechLogo from './TechLogo';
import { getTechColors } from '../utils/themeUtils';
import './ModuleCard.css';

const ModuleCard = ({ module, to }) => {
    const colors = getTechColors(module.title);

    return (
        <Link
            to={to || `/module/${module._id}`}
            className="client-home__module-card"
            style={{
                pointerEvents: module.isDisplay === false ? 'none' : 'auto',
                position: 'relative'
            }}
        >
            <div
                className="client-home__module-inner"
                style={{
                    background: colors.gradient,
                    '--text-primary': colors.text || '#ffffff',
                    '--text-secondary': colors.text ? `${colors.text}CC` : 'rgba(255, 255, 255, 0.9)',
                    '--border-color': colors.border,
                    filter: 'none',
                    opacity: module.isDisplay === false ? 0.7 : 1
                }}
            >
                <div className="client-home__module-cover">
                    <div className="client-home__module-logo">
                        <TechLogo title={module.title} className="client-home__tech-logo" />
                    </div>
                </div>
                <div className="client-home__module-content">
                    <h3 className="client-home__module-title">{module.title}</h3>
                    <p className="client-home__module-subtitle">{module.questions?.length || 0} Questions</p>
                </div>
                <div className="client-home__module-overlay">
                    <div className="client-home__module-play-btn" style={{ color: '#000' }}>
                        <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>
            </div>
            {module.isDisplay === false && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                }}>
                    <div style={{
                        background: 'rgba(0,0,0,0.6)',
                        borderRadius: '50%',
                        padding: '12px'
                    }}>
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="32" height="32">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                </div>
            )}
        </Link>
    );
};

export default ModuleCard;
