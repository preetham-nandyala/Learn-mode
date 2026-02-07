import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import './Navbar.css';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    const isActive = (path) => location.pathname === path ? 'navbar__link--active' : '';

    return (
        <nav className="navbar">
            <div className="navbar__inner">
                <div className="navbar__logo">
                    <div className="navbar__logo-icon">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <span className="navbar__logo-text">AdminPanel</span>
                </div>

                <div className="navbar__links">
                    <Link to="/dashboard" className={`navbar__link ${isActive('/dashboard')}`}>Dashboard</Link>
                    <Link to="/modules" className={`navbar__link ${isActive('/modules')}`}>Modules</Link>
                    <span className="navbar__link">Users</span>
                    <span className="navbar__link">Settings</span>
                </div>

                <div className="navbar__actions">
                    <span className="navbar__admin-badge">ADMIN</span>
                    <button onClick={handleLogout} className="navbar__logout">Sign out</button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
