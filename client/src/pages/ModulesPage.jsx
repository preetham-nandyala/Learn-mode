import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchModules } from '../redux/thunks/moduleThunks';
import { fetchSections } from '../redux/thunks/sectionThunks';
import { logout } from '../redux/slices/authSlice';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ModuleCard from '../components/ModuleCard';
import LoadingGrid from '../components/LoadingGrid';
// api removed
import './ModulesPage.css';

const ModulesPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Redux State
    const { items: modules, loading: modulesLoading } = useSelector(state => state.modules);
    const { items: sections, loading: sectionsLoading } = useSelector(state => state.sections);
    const { user } = useSelector(state => state.auth);
    const userName = user?.name || 'Student';

    const isLoading = modulesLoading || sectionsLoading;

    useEffect(() => {
        if (modules.length === 0) dispatch(fetchModules());
        if (sections.length === 0) dispatch(fetchSections());
    }, [dispatch]);

    // Derive Final Sections
    const finalSections = useMemo(() => {
        const sortedDBSections = [...sections].sort((a, b) => a.order - b.order).map(s => s.name);
        // Find used section names in modules that might be missing in DB or are strings
        const usedSectionNames = modules.map(m => m.section?.name || (typeof m.section === 'string' ? m.section : 'Other'));
        // Unique merge
        return [...new Set([...sortedDBSections, ...usedSectionNames])];
    }, [modules, sections]);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    return (
        <div className="client-modules-page">
            <Navbar userName={userName} onLogout={handleLogout} activeLink="/modules" />

            <div className="client-modules-content">
                <div className="client-modules-header">
                    <h1 className="client-modules-title">All Learning Modules</h1>
                    <p className="client-modules-subtitle">Browse our complete collection of programming modules and enhance your technical skills.</p>
                </div>

                {isLoading ? (
                    <LoadingGrid />
                ) : modules.length === 0 ? (
                    <div className="client-home__empty">
                        <div className="client-home__empty-icon">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h3 className="client-home__empty-title">No modules available</h3>
                        <p className="client-home__empty-text">Check back later for new learning content</p>
                    </div>
                ) : (
                    <div className="client-home__modules-container">
                        {finalSections.map(secBranch => {
                            const sectionModules = modules
                                .filter(m => (m.section?.name || 'Other') === secBranch)
                                .sort((a, b) => (a.order || 0) - (b.order || 0));

                            if (sectionModules.length === 0) return null;

                            return (
                                <div key={secBranch} className="client-home__section-group" style={{ marginBottom: '48px' }}>
                                    <h3 className="client-home__section-title" style={{
                                        fontSize: '20px',
                                        fontWeight: '700',
                                        color: '#EFEFEF',
                                        marginBottom: '20px',
                                        paddingLeft: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}>
                                        <div style={{ width: 4, height: 24, background: '#FFA116', borderRadius: 2 }}></div>
                                        {secBranch}
                                    </h3>
                                    <div className="client-home__modules">
                                        {sectionModules.map((mod) => (
                                            <ModuleCard key={mod._id} module={mod} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default ModulesPage;
