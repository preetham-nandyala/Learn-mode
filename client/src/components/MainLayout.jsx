import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { fetchModules } from '../redux/thunks/moduleThunks';
import { fetchSections } from '../redux/thunks/sectionThunks';
import { logout } from '../redux/slices/authSlice';
import Navbar from './Navbar';
import Footer from './Footer';

const MainLayout = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useSelector(state => state.auth);
    const { items: modules } = useSelector(state => state.modules);
    const { items: sections } = useSelector(state => state.sections);

    useEffect(() => {
        // Only fetch if logged in and data is missing
        if (user) {
            if (modules.length === 0) {
                dispatch(fetchModules());
            }
            if (sections.length === 0) {
                dispatch(fetchSections());
            }
        }
    }, [dispatch, user, modules.length, sections.length]);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    const userName = user?.name || 'Student';

    return (
        <div className="main-layout">
            <Navbar
                userName={userName}
                onLogout={handleLogout}
                activeLink={location.pathname}
            />
            <main>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default MainLayout;
