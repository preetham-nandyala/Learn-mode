import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchModules, updateModule } from '../redux/thunks/moduleThunks';
import Navbar from '../components/Navbar';
import TechLogo from '../components/TechLogo';
import Spinner from '../components/Spinner';
import { getTechColors } from '../utils/themeUtils';
import './Dashboard.css';

const Dashboard = () => {
    // Redux State
    const { items: modules, loading: isLoading } = useSelector(state => state.modules);

    const [localModules, setLocalModules] = useState([]); // For managing edits locally
    const [selectedSection, setSelectedSection] = useState('Featured');
    const [sections, setSections] = useState(['Featured', 'All']);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // const navigate = useNavigate(); // Not used currently

    const dispatch = useDispatch();

    useEffect(() => {
        if (modules.length === 0) dispatch(fetchModules());
    }, [dispatch]);

    useEffect(() => {
        if (modules.length > 0) {
            // Sort by featured order initially
            const sortedData = [...modules].sort((a, b) => (b.isFeatured === a.isFeatured) ? (a.featuredOrder - b.featuredOrder) : (b.isFeatured ? 1 : -1));
            setLocalModules(sortedData);

            // Extract unique sections
            const dbSections = new Set(sortedData.map(m => m.section?.name || 'Other'));
            // Ensure specific options are present
            const allSections = ['Featured', 'All', ...Array.from(dbSections), 'Other'];
            // Remove duplicates
            const uniqueSections = [...new Set(allSections)].filter(Boolean);

            setSections(uniqueSections);
        }
    }, [modules]);

    const handleFeaturedChange = (modId, isFeatured) => {
        setLocalModules(prev => prev.map(m =>
            m._id === modId ? { ...m, isFeatured } : m
        ));
        setHasChanges(true);
    };

    const handleOrderChange = (modId, featuredOrder) => {
        setLocalModules(prev => prev.map(m =>
            m._id === modId ? { ...m, featuredOrder: Number(featuredOrder) } : m
        ));
        setHasChanges(true);
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            const changedModules = localModules.filter(localMod => {
                const originalMod = modules.find(m => m._id === localMod._id);
                return originalMod && (localMod.isFeatured !== originalMod.isFeatured || localMod.featuredOrder !== originalMod.featuredOrder);
            });

            if (changedModules.length === 0) {
                setHasChanges(false);
                setIsSaving(false);
                return;
            }

            // Execute all updates
            await Promise.all(changedModules.map(mod =>
                dispatch(updateModule({
                    id: mod._id,
                    isFeatured: mod.isFeatured,
                    featuredOrder: Number(mod.featuredOrder)
                })).unwrap()
            ));

            setHasChanges(false);
        } catch (error) {
            console.error('Failed to save changes', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Filter displayed modules
    const displayedModules = localModules.filter(m => {
        if (selectedSection === 'Featured') return m.isFeatured;
        if (selectedSection === 'All') return true;
        return (m.section?.name || 'Other') === selectedSection;
    });

    return (
        <div className="dashboard">
            <Navbar />

            {/* Hero */}
            <div className="dashboard__hero">
                <div className="dashboard__hero-bg"></div>
                <div className="dashboard__hero-content">
                    <div className="dashboard__hero-left">
                        <h1 className="dashboard__hero-title">Overview</h1>
                        <p className="dashboard__hero-subtitle">
                            Welcome back, Admin. Manage your featured content and system performance.
                        </p>
                        <div className="dashboard__hero-stats">
                            <div className="dashboard__stat-card">
                                <p className="dashboard__stat-value">{modules.length}</p>
                                <p className="dashboard__stat-label">Total Modules</p>
                            </div>
                            <div className="dashboard__stat-card">
                                <p className="dashboard__stat-value">{modules.reduce((acc, m) => acc + (m.questions?.length || 0), 0)}</p>
                                <p className="dashboard__stat-label">Total Questions</p>
                            </div>
                        </div>
                    </div>
                    <Link to="/modules" className="dashboard__create-btn" style={{ textDecoration: 'none' }}>
                        Manage Modules
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>

            <div className="dashboard__modules-section">
                <div className="dashboard__section-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h2 className="dashboard__section-title">Featured Content Manager</h2>
                        {hasChanges && (
                            <span style={{ fontSize: '12px', color: '#FF375F', background: 'rgba(255, 55, 95, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                                Unsaved Changes
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        {/* Filter Dropdown */}
                        <select
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            style={{
                                background: '#282828',
                                border: '1px solid #3E3E3E',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            {sections.map(sec => (
                                <option key={sec} value={sec}>{sec}</option>
                            ))}
                        </select>

                        <button
                            onClick={handleSubmit}
                            disabled={!hasChanges || isSaving}
                            style={{
                                background: hasChanges ? '#FF375F' : '#3E3E3E',
                                color: hasChanges ? 'white' : '#8A8A8A',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                fontWeight: '600',
                                cursor: hasChanges ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {isSaving ? (
                                <>
                                    <Spinner size={16} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    Submit Changes
                                    {!isSaving && hasChanges && (
                                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {isLoading && modules.length === 0 ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                        <Spinner size={40} color="#FF375F" />
                    </div>
                ) : (
                    <div className="dashboard__modules-grid">
                        {displayedModules.length === 0 ? (
                            <div className="dashboard__empty">No modules found in this section.</div>
                        ) : (
                            displayedModules.map(mod => {
                                const techColors = getTechColors(mod.title);
                                return (
                                    <div key={mod._id} className="dashboard__module-card">
                                        <div className="dashboard__module-inner" style={{
                                            background: techColors.gradient,
                                            '--text-primary': techColors.text || '#ffffff',
                                            '--text-secondary': techColors.text ? `${techColors.text}CC` : 'rgba(255, 255, 255, 0.9)',
                                        }}>
                                            <div className="dashboard__module-cover">
                                                <div className="dashboard__module-logo">
                                                    <TechLogo title={mod.title} className="dashboard__tech-logo" />
                                                </div>
                                            </div>
                                            <div className="dashboard__module-content">
                                                <h3 className="dashboard__module-title">{mod.title}</h3>
                                                <p className="dashboard__module-subtitle">{mod.section?.name || 'Other'}</p>

                                                {/* Admin Controls */}
                                                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase' }}>Featured</span>
                                                        <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={mod.isFeatured || false}
                                                                onChange={(e) => handleFeaturedChange(mod._id, e.target.checked)}
                                                                style={{ opacity: 0, width: 0, height: 0 }}
                                                            />
                                                            <span className="slider round" style={{
                                                                position: 'absolute',
                                                                cursor: 'pointer',
                                                                top: 0, left: 0, right: 0, bottom: 0,
                                                                backgroundColor: mod.isFeatured ? 'white' : 'rgba(0,0,0,0.3)',
                                                                transition: '.4s',
                                                                borderRadius: '34px'
                                                            }}>
                                                                <span style={{
                                                                    position: 'absolute',
                                                                    content: '""',
                                                                    height: '14px',
                                                                    width: '14px',
                                                                    left: '3px',
                                                                    bottom: '3px',
                                                                    backgroundColor: mod.isFeatured ? '#FF375F' : '#888',
                                                                    transition: '.4s',
                                                                    borderRadius: '50%',
                                                                    transform: mod.isFeatured ? 'translateX(16px)' : 'translateX(0)'
                                                                }}></span>
                                                            </span>
                                                        </label>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', textTransform: 'uppercase' }}>Order</span>
                                                        <input
                                                            type="number"
                                                            value={mod.featuredOrder || 0}
                                                            disabled={!mod.isFeatured}
                                                            onChange={(e) => handleOrderChange(mod._id, e.target.value)}
                                                            style={{
                                                                background: 'rgba(0,0,0,0.2)',
                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                color: 'white',
                                                                padding: '4px 8px',
                                                                borderRadius: '6px',
                                                                width: '50px',
                                                                textAlign: 'center',
                                                                fontSize: '13px',
                                                                opacity: mod.isFeatured ? 1 : 0.4
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
