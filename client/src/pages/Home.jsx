import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ModuleCard from '../components/ModuleCard';
import LoadingGrid from '../components/LoadingGrid';
import './Home.css';

const Home = () => {
    const { items: modules, loading: isLoading } = useSelector(state => state.modules);

    return (
        <div className="client-home">
            {/* Hero */}
            <div className="client-home__hero">
                <div className="client-home__hero-bg"></div>

                <div className="client-home__hero-content">
                    <div>
                        <h1 className="client-home__hero-title">A New Way to Learn</h1>
                        <p className="client-home__hero-subtitle">
                            The best platform to help you enhance your skills, expand your knowledge and prepare for technical interviews.
                        </p>
                        <button className="client-home__hero-btn">
                            Start Learning
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    <div className="client-home__hero-illustration">
                        <div className="client-home__illustration-card">
                            <div className="client-home__illustration-colors">
                                <div className="client-home__illustration-color client-home__illustration-color--blue"></div>
                                <div className="client-home__illustration-color client-home__illustration-color--red"></div>
                                <div className="client-home__illustration-color client-home__illustration-color--green"></div>
                            </div>
                            <div className="client-home__illustration-lines">
                                <div className="client-home__illustration-line client-home__illustration-line--1"></div>
                                <div className="client-home__illustration-line client-home__illustration-line--2"></div>
                                <div className="client-home__illustration-line client-home__illustration-line--3"></div>
                            </div>
                            <div className="client-home__illustration-footer">
                                <div className="client-home__illustration-dots">
                                    <div className="client-home__illustration-dot client-home__illustration-dot--green"></div>
                                    <div className="client-home__illustration-dot client-home__illustration-dot--orange"></div>
                                    <div className="client-home__illustration-dot client-home__illustration-dot--red"></div>
                                </div>
                                <div className="client-home__illustration-play">
                                    <svg fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Featured */}
            <div className="client-home__featured">
                <div className="client-home__featured-header">
                    <h2 className="client-home__featured-title">Featured</h2>
                    <Link to="/modules" className="client-home__more-btn" style={{ textDecoration: 'none' }}>More</Link>
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
                        <h3 className="client-home__empty-title">No modules available</h3>
                        <p className="client-home__empty-text">Check back later for new learning content</p>
                    </div>
                ) : (
                    <div className="client-home__modules-container">
                        <div className="client-home__modules-container">
                            <div className="client-home__modules">
                                {modules
                                    .filter(m => m.isFeatured)
                                    .sort((a, b) => (a.featuredOrder || 0) - (b.featuredOrder || 0))
                                    .map((mod) => (
                                        <ModuleCard key={mod._id} module={mod} />
                                    ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
