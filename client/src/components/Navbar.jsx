import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ userName, onLogout, activeLink }) => {
    return (
        <nav className="client-home__nav">
            <div className="client-home__nav-inner">
                <div className="client-home__logo">
                    <div className="client-home__logo-icon">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <span className="client-home__logo-text">LearnCode</span>
                </div>

                <div className="client-home__nav-links">
                    <Link
                        to="/home"
                        className={`client-home__nav-link ${activeLink === '/home' ? 'client-home__nav-link--active' : ''}`}
                    >
                        Explore
                    </Link>
                    <Link
                        to="/modules"
                        className={`client-home__nav-link ${activeLink === '/modules' ? 'client-home__nav-link--active' : ''}`}
                    >
                        Modules
                    </Link>
                    <a href="#" className="client-home__nav-link">Problems</a>
                    <a href="#" className="client-home__nav-link">Discuss</a>
                </div>

                <div className="client-home__nav-actions">
                    <span className="client-home__user-name">{userName}</span>
                    <button onClick={onLogout} className="client-home__logout">Sign out</button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
