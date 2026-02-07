import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchModules, createModule, updateModule, deleteModule } from '../redux/thunks/moduleThunks';
import { fetchSections, createSection, updateSection, deleteSection, migrateModules } from '../redux/thunks/sectionThunks';
import Navbar from '../components/Navbar';
import TechLogo from '../components/TechLogo';
import { getTechColors } from '../utils/themeUtils';
// api removed
import './ModulesPage.css';

const ModulesPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Redux State
    const { items: modules, loading: modulesLoading } = useSelector(state => state.modules);
    const { items: sectionObjects, loading: sectionsLoading } = useSelector(state => state.sections);

    // Derived state (legacy support if needed, but better to use sectionObjects directly)
    const sections = sectionObjects.map(s => s.name);

    // Local UI State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [section, setSection] = useState(''); // Stores Section ID
    const [order, setOrder] = useState(0);
    const [isDisplay, setIsDisplay] = useState(true);

    const [isCreating, setIsCreating] = useState(false);
    const [editingModule, setEditingModule] = useState(null); // ID of module being edited
    const [showDrawer, setShowDrawer] = useState(false);
    const [drawerMode, setDrawerMode] = useState('MODULE'); // 'MODULE' or 'SECTION'

    // Section Management State
    const [sectionToManage, setSectionToManage] = useState(null); // String (name) - code uses name for management selection
    const [newSectionName, setNewSectionName] = useState('');
    const [newSectionOrder, setNewSectionOrder] = useState(0); // For section management
    const [isEditingSection, setIsEditingSection] = useState(false); // For section management

    useEffect(() => {
        if (sectionObjects.length === 0) {
            dispatch(fetchSections())
                .unwrap()
                .then(data => {
                    // Ensure 'Other' exists check could be moved to backend or handled here once
                    const otherExists = data.find(s => s.name === 'Other');
                    if (!otherExists) {
                        dispatch(createSection({ name: 'Other', order: 999 }));
                    }
                });
        }
        if (modules.length === 0) {
            dispatch(fetchModules());
        }
    }, [dispatch]);

    // Prevent background scroll when drawer is open
    useEffect(() => {
        if (showDrawer) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showDrawer]);

    const handleSaveModule = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            let sectionIdToUse = section;
            // If no section is selected, try to find a default or the first one
            if (!sectionIdToUse && sectionObjects.length > 0) {
                const defaultSection = sectionObjects.find(s => s.name === 'Frontend') || sectionObjects[0];
                sectionIdToUse = defaultSection._id;
            }

            if (editingModule) {
                // Update existing module (send section ID)
                await dispatch(updateModule({
                    id: editingModule,
                    title,
                    description,
                    section: sectionIdToUse,
                    order: Number(order),
                    isDisplay
                })).unwrap();
            } else {
                // Create new module (send section ID)
                await dispatch(createModule({
                    title,
                    description,
                    section: sectionIdToUse,
                    order: Number(order),
                    isDisplay
                })).unwrap();
            }

            setTitle('');
            setDescription('');
            setSection(''); // Clear section ID
            setOrder(0);
            setEditingModule(null);
            setShowDrawer(false);
            // fetchModules handled by redux slice update
        } catch (error) {
            console.error('Failed to save module', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteModule = async () => {
        if (!editingModule) return;
        if (!window.confirm('Are you sure you want to delete this module? This action cannot be undone.')) return;

        try {
            await dispatch(deleteModule(editingModule)).unwrap();
            setEditingModule(null);
            setShowDrawer(false);
        } catch (error) {
            console.error('Failed to delete module', error);
            alert('Failed to delete module');
        }
    };

    const handleEditClick = (bgEvent, mod) => {
        bgEvent.preventDefault(); // Prevent navigation
        bgEvent.stopPropagation();

        setTitle(mod.title);
        setDescription(mod.description || '');
        // mod.section is now likely an object due to populate, or string ID if not populated? 
        // Controller populates it. So it is { _id, name }.
        // If "Other" fallback was used, it might be undefined or string?
        // Let's handle both.
        setSection(mod.section?._id || (typeof mod.section === 'string' ? mod.section : ''));
        setOrder(mod.order || 0);
        setIsDisplay(mod.isDisplay !== undefined ? mod.isDisplay : true);
        setEditingModule(mod._id);
        setDrawerMode('MODULE');
        setShowDrawer(true);
    };

    const handleEditSectionClick = (secName) => {
        if (secName === 'Other') return; // Prevent editing 'Other'
        const secObj = sectionObjects.find(s => s.name === secName);
        setSectionToManage(secName); // Still using name for display in the list
        setNewSectionName(secName);
        // Use real order from DB object
        setNewSectionOrder(secObj ? secObj.order : 0);
        setIsEditingSection(true);
        setDrawerMode('SECTION');
        setShowDrawer(true);
    };

    const handleSectionSubmit = async () => {
        if (!newSectionName.trim()) return;

        const name = newSectionName.trim();
        const order = Number(newSectionOrder);

        if (isEditingSection) {
            // Update Existing
            const oldName = sectionToManage.trim();
            const sectionObj = sectionObjects.find(s => s.name === oldName);

            if (!sectionObj) return;

            try {
                // Update Name & Order
                await dispatch(updateSection({ id: sectionObj._id, name, order })).unwrap();

                // If name changed, migrate modules
                if (oldName !== name) {
                    await dispatch(migrateModules({
                        oldSection: oldName,
                        newSection: name
                    })).unwrap();
                    dispatch(fetchModules());
                }

                resetSectionForm();
            } catch (error) {
                console.error('Failed to update section', error);
            }
        } else {
            // Create New
            if (sections.includes(name)) {
                // Section already exists
                return;
            }
            try {
                const newSection = await dispatch(createSection({ name, order })).unwrap();
                setSection(newSection._id);
                setNewSectionName('');
                setNewSectionOrder(0);
            } catch (error) {
                console.error(error);
            }
        }
    };

    const confirmDeleteSection = async () => {
        if (!sectionToManage) return;

        // Prevent deleting 'Other'
        if (sectionToManage === 'Other') {
            console.error("Cannot delete 'Other' section.");
            return;
        }

        const sectionObj = sectionObjects.find(s => s.name === sectionToManage);
        if (!sectionObj) return;

        try {
            // Find 'Other' section ID for fallback
            let otherSection = sectionObjects.find(s => s.name === 'Other');
            let otherSectionId = otherSection ? otherSection._id : null;

            if (!otherSectionId) {
                // Create 'Other' section if missing
                try {
                    const createdOther = await dispatch(createSection({ name: 'Other', order: 999 })).unwrap();
                    otherSectionId = createdOther._id;
                } catch (err) {
                    console.error("Failed to create 'Other' section fallback", err);
                    return;
                }
            }

            // Migrate modules to 'Other'
            await dispatch(migrateModules({
                oldSection: sectionObj._id,
                newSection: otherSectionId
            })).unwrap();

            // Delete Section
            await dispatch(deleteSection(sectionObj._id)).unwrap();

            // Reset current selection if it was the deleted section
            if (section === sectionObj._id) {
                setSection(otherSectionId);
            }

            resetSectionForm();
            dispatch(fetchModules());
        } catch (error) {
            console.error('Failed to delete section', error);
        }
    };

    const handleAddSectionClick = () => {
        setNewSectionName('');
        setDrawerMode('SECTION');
        setShowDrawer(true);
    };



    const resetSectionForm = () => {
        setSectionToManage(null);
        setNewSectionName('');
        setNewSectionOrder(0);
        setIsEditingSection(false);
    };

    const openCreateForm = () => {
        setTitle('');
        setDescription('');
        // Set default section to 'Frontend' ID if available, otherwise first available section ID
        const defaultSection = sectionObjects.find(s => s.name === 'Frontend') || sectionObjects[0];
        setSection(defaultSection ? defaultSection._id : '');
        setOrder(0);
        setIsDisplay(true);
        setEditingModule(null);
        setDrawerMode('MODULE');
        setShowDrawer(true);
    };

    const openCreateSection = () => {
        resetSectionForm();
        setDrawerMode('SECTION');
        setShowDrawer(true);
    };


    return (
        <div className="admin-modules-page">
            <Navbar />

            {/* Header */}
            <div className="admin-modules-header">
                <div className="admin-modules-title-group">
                    <h1>Manage Modules</h1>
                    <p>Create, update and reorganize learning content</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button onClick={openCreateSection} className="dashboard__form-btn-secondary" style={{ padding: '12px 20px', fontSize: '15px', color: '#fff', borderColor: '#3E3E3E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        Sections
                    </button>
                    <button onClick={openCreateForm} className="dashboard__create-btn">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Module
                    </button>
                </div>
            </div>

            {/* Modules Section Grouped by Section */}
            <div className="dashboard__modules-section">
                {modules.length === 0 ? (
                    <div className="dashboard__empty">
                        <h3 className="dashboard__empty-title">No modules found</h3>
                        <p className="dashboard__empty-text">Create your first module to get started.</p>
                        <button onClick={openCreateForm} className="dashboard__create-btn" style={{ marginTop: 16 }}>Create Module</button>
                    </div>
                ) : (
                    <div className="dashboard__modules-container">
                        {sectionObjects.map(secObj => {
                            const secBranch = secObj.name;
                            const sectionModules = modules.filter(m => {
                                // m.section is object { _id, name }. 
                                // Match by ID best, or name as fallback
                                return (m.section?._id === secObj._id) || (m.section?.name === secBranch) || (!m.section && secBranch === 'Other');
                            });

                            if (sectionModules.length === 0 && secBranch !== 'Other') {
                                // Consider showing empty sections if they exist in DB
                                // But keeping logic similar to before: show if exists
                            }
                            // Sort modules
                            sectionModules.sort((a, b) => (a.order || 0) - (b.order || 0));

                            return (
                                <div key={secBranch} className="dashboard__section-group" style={{ marginBottom: '40px' }}>
                                    <div className="dashboard__section-header">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <h2 className="dashboard__section-title">{secBranch}</h2>
                                            {/* Allow editing custom sections or even defaults if needed, but maybe not 'Other' */}
                                            {secBranch !== 'Other' && (
                                                <button
                                                    className="dashboard__section-delete-btn"
                                                    onClick={() => handleEditSectionClick(secBranch)}
                                                    title="Edit Section"
                                                >
                                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="dashboard__modules-grid">
                                        {sectionModules.map((mod) => {
                                            const colors = getTechColors(mod.title);
                                            return (
                                                <Link key={mod._id} to={`/module/${mod._id}`} className="dashboard__module-card">
                                                    <div
                                                        className="dashboard__module-inner"
                                                        style={{
                                                            background: colors.gradient,
                                                            '--text-primary': colors.text || '#ffffff',
                                                            '--text-secondary': colors.text ? `${colors.text}CC` : 'rgba(255, 255, 255, 0.9)',
                                                            '--border-color': colors.border,
                                                            // Removed blur for Admin
                                                            // filter: mod.isDisplay === false ? 'blur(4px)' : 'none',
                                                            opacity: mod.isDisplay === false ? 0.9 : 1
                                                        }}
                                                    >
                                                        <div className="dashboard__module-cover">
                                                            <div className="dashboard__module-logo">
                                                                <TechLogo title={mod.title} className="dashboard__tech-logo" />
                                                            </div>
                                                        </div>
                                                        <div className="dashboard__module-content">
                                                            <h3 className="dashboard__module-title">{mod.title}</h3>
                                                            <p className="dashboard__module-subtitle">{mod.questions?.length || 0} Questions</p>
                                                        </div>
                                                        <div className="dashboard__module-overlay">
                                                            <div className="dashboard__module-actions-row">
                                                                <button
                                                                    className="dashboard__module-btn-edit"
                                                                    onClick={(e) => handleEditClick(e, mod)}
                                                                    title="Edit Module"
                                                                >
                                                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </button>
                                                                <div className="dashboard__module-btn">
                                                                    Manage
                                                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {mod.isDisplay === false && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '12px',
                                                            right: '12px',
                                                            zIndex: 20,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            pointerEvents: 'auto'
                                                        }}>
                                                            <div style={{
                                                                background: 'rgba(0,0,0,0.6)',
                                                                borderRadius: '50%',
                                                                padding: '6px',
                                                                backdropFilter: 'blur(4px)'
                                                            }}>
                                                                <svg fill="none" viewBox="0 0 24 24" stroke="white" width="20" height="20">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Right Drawer */}
            <div className={`dashboard__drawer-overlay ${showDrawer ? 'dashboard__drawer-overlay--active' : ''}`} onClick={() => setShowDrawer(false)}></div>
            <div className={`dashboard__drawer ${showDrawer ? 'dashboard__drawer--active' : ''}`}>
                <div className="dashboard__drawer-header">
                    <h2 className="dashboard__drawer-title">
                        {drawerMode === 'MODULE'
                            ? (editingModule ? 'Edit Module' : 'Create Module')
                            : 'Manage Sections'
                        }
                    </h2>
                    <button onClick={() => setShowDrawer(false)} className="dashboard__drawer-close">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24" height="24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="dashboard__drawer-content">
                    {drawerMode === 'MODULE' ? (
                        <form onSubmit={handleSaveModule} className="dashboard__form" style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '32px' }}>
                            {/* Left Column */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div className="dashboard__form-field" style={{ margin: 0 }}>
                                    <label className="dashboard__form-label">Module Title</label>
                                    <input
                                        type="text"
                                        className="dashboard__form-input"
                                        placeholder="e.g. React Basics"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div className="dashboard__form-field" style={{ margin: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <label className="dashboard__form-label">Description</label>
                                    <textarea
                                        className="dashboard__form-textarea"
                                        style={{ flex: 1, resize: 'none', minHeight: '200px' }}
                                        placeholder="Describe what students will learn..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                            </div>

                            {/* Divider - Middle Line */}
                            <div style={{ width: '1px', background: '#2E2E2E', height: '100%', alignSelf: 'stretch' }}></div>

                            {/* Right Column */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div className="dashboard__form-field" style={{ margin: 0 }}>
                                    <label className="dashboard__form-label">Section</label>
                                    <select
                                        className="dashboard__form-select"
                                        value={section}
                                        onChange={(e) => setSection(e.target.value)}
                                    >
                                        <option value="" disabled>Select Section</option>
                                        {sectionObjects.map(s => (
                                            <option key={s._id} value={s._id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="dashboard__form-field" style={{ margin: 0 }}>
                                    <label className="dashboard__form-label">Display Order</label>
                                    <input
                                        type="number"
                                        className="dashboard__form-input"
                                        placeholder="0"
                                        value={order}
                                        onChange={(e) => setOrder(e.target.value)}
                                        min="0"
                                    />
                                </div>

                                <div className="dashboard__form-field" style={{ margin: 0 }}>
                                    <label className="dashboard__form-label">Display Module?</label>
                                    <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: isDisplay ? 'white' : '#8A8A8A' }}>
                                            <input
                                                type="radio"
                                                name="isDisplay"
                                                checked={isDisplay === true}
                                                onChange={() => setIsDisplay(true)}
                                            />
                                            Yes
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: !isDisplay ? 'white' : '#8A8A8A' }}>
                                            <input
                                                type="radio"
                                                name="isDisplay"
                                                checked={isDisplay === false}
                                                onChange={() => setIsDisplay(false)}
                                            />
                                            No
                                        </label>
                                    </div>
                                </div>

                                <div style={{ marginTop: 'auto' }}>
                                    <button type="submit" className="dashboard__form-submit" disabled={isCreating}>
                                        {isCreating ? 'Saving...' : (editingModule ? 'Update Module' : 'Create Module')}
                                    </button>
                                    {editingModule && (
                                        <button
                                            type="button"
                                            onClick={handleDeleteModule}
                                            className="dashboard__form-submit"
                                            style={{ marginTop: '12px', background: '#1A1A1A', border: '1px solid #FF375F', color: '#FF375F' }}
                                        >
                                            Delete Module
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="dashboard__section-manager" style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '32px', height: '100%', marginTop: '32px', paddingLeft: '40px', paddingRight: '40px' }}>
                            {/* Left Column: Section List */}
                            <div className="dashboard__section-list-container" style={{ flex: 'none', width: 'auto', border: 'none', padding: 0, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                                <div style={{ height: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexShrink: 0 }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#8A8A8A', margin: 0, textTransform: 'uppercase' }}>SECTIONS</h3>
                                    <button
                                        onClick={() => {
                                            setIsEditingSection(false);
                                            setSectionToManage(null);
                                            setNewSectionName('');
                                            setNewSectionOrder('');
                                        }}
                                        style={{
                                            background: '#FF375F',
                                            border: 'none',
                                            color: 'white',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            boxShadow: '0 2px 8px rgba(255, 55, 95, 0.3)'
                                        }}
                                    >
                                        + Add New
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
                                    {sections.map((sec, idx) => (
                                        <div key={idx} className={`dashboard__section-item ${sectionToManage === sec ? 'dashboard__section-item--active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => handleEditSectionClick(sec)}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                                                <span className="dashboard__section-order" style={{ width: '20px', textAlign: 'center', opacity: 0.5 }}>{idx + 1}</span>
                                                <span className="dashboard__section-name" style={{ flex: 1, fontWeight: '500' }}>{sec}</span>
                                                <button
                                                    className="dashboard__section-edit-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditSectionClick(sec);
                                                    }}
                                                    title="Edit Section"
                                                >
                                                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{ width: '1px', background: '#2E2E2E', height: '100%', alignSelf: 'stretch' }}></div>

                            {/* Right Column: Form */}
                            <div className="dashboard__section-form-fixed" style={{ position: 'relative', top: 0, width: 'auto', border: 'none', padding: 0, background: 'transparent' }}>
                                <div style={{ height: '32px', display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#8A8A8A', margin: 0, textTransform: 'uppercase' }}>
                                        {isEditingSection ? 'EDIT SECTION' : 'ADD NEW SECTION'}
                                    </h3>
                                </div>

                                <div className="dashboard__form-field">
                                    <label className="dashboard__form-label">Name</label>
                                    <input
                                        type="text"
                                        className="dashboard__form-input"
                                        placeholder="Section Name"
                                        value={newSectionName}
                                        onChange={(e) => setNewSectionName(e.target.value)}
                                    />
                                </div>
                                <div className="dashboard__form-field">
                                    <label className="dashboard__form-label">Order Priority</label>
                                    <input
                                        type="number"
                                        className="dashboard__form-input"
                                        placeholder="0"
                                        value={newSectionOrder}
                                        onChange={(e) => setNewSectionOrder(e.target.value)}
                                    />
                                </div>

                                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {isEditingSection ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <button
                                                onClick={handleSectionSubmit}
                                                disabled={!newSectionName.trim()}
                                                className="dashboard__form-submit"
                                                style={{ marginTop: 0 }}
                                            >
                                                Update Section
                                            </button>
                                            <button
                                                onClick={confirmDeleteSection}
                                                className="dashboard__form-submit"
                                                style={{ marginTop: 0, background: '#282828', border: '1px solid #FF375F', color: '#FF375F' }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleSectionSubmit}
                                            disabled={!newSectionName.trim()}
                                            className="dashboard__form-submit"
                                            style={{ marginTop: 0 }}
                                        >
                                            Add Section
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default ModulesPage;
