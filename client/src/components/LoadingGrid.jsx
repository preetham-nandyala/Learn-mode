import React from 'react';

const LoadingGrid = () => {
    return (
        <div className="client-home__loading-grid">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="client-home__loading-card">
                    <div className="client-home__loading-header"></div>
                    <div className="client-home__loading-line"></div>
                    <div className="client-home__loading-line client-home__loading-line--short"></div>
                </div>
            ))}
        </div>
    );
};

export default LoadingGrid;
