import React from 'react';
import { Link } from 'react-router-dom';

import './AuthLayout.css';

const AuthLayout = ({
    title,
    subtitle,
    error,
    children,
    footerText,
    footerLinkText,
    footerLinkTo,
    className = 'auth-layout'
}) => {
    return (
        <div className={className}>
            <div className={`${className}__hero-bg`}></div>

            <div className={`${className}__content`}>
                <div className={`${className}__wrapper`}>
                    <div className={`${className}__header`}>
                        <div className={`${className}__logo`}>
                            <div className={`${className}__logo-icon`}>
                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <span className={`${className}__logo-text`}>LearnCode</span>
                        </div>
                        <h1 className={`${className}__title`}>{title}</h1>
                        <p className={`${className}__subtitle`}>{subtitle}</p>
                    </div>

                    <div className={`${className}__card`}>
                        {error && (
                            <div className={`${className}__error`}>
                                <svg className={`${className}__error-icon`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className={`${className}__error-text`}>{error}</p>
                            </div>
                        )}

                        {children}

                        <div className={`${className}__footer`}>
                            {footerText}{' '}
                            <Link to={footerLinkTo} className={`${className}__link`}>{footerLinkText}</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
