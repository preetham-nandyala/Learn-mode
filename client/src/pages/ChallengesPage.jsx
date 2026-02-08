import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import ModuleCard from '../components/ModuleCard';
import LoadingGrid from '../components/LoadingGrid';
import './ModulesPage.css';

const ChallengesPage = () => {
    const { items: modules, loading: modulesLoading } = useSelector(state => state.modules);
    const { items: sections, loading: sectionsLoading } = useSelector(state => state.sections);

    const isLoading = modulesLoading || sectionsLoading;

    // Derive Final Sections
    const finalSections = useMemo(() => {
        const sortedDBSections = [...sections].sort((a, b) => a.order - b.order).map(s => s.name);
        const usedSectionNames = modules.map(m => m.section?.name || (typeof m.section === 'string' ? m.section : 'Other'));
        return [...new Set([...sortedDBSections, ...usedSectionNames])];
    }, [modules, sections]);

    return (
        <div className="client-modules-page">
            <div className="client-modules-content">
                <div className="client-modules-header">
                    <h1 className="client-modules-title">All Challenges</h1>
                    <p className="client-modules-subtitle">Put your skills to the test with our comprehensive challenge modules.</p>
                </div>

                {isLoading && modules.length === 0 ? (
                    <LoadingGrid />
                ) : modules.length === 0 ? (
                    <div className="client-home__empty">
                        <div className="client-home__empty-icon">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h3 className="client-home__empty-title">No challenges available</h3>
                        <p className="client-home__empty-text">Check back later for new challenges</p>
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
                                            <ModuleCard key={mod._id} module={mod} to={`/challenges/${mod._id}`} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChallengesPage;
