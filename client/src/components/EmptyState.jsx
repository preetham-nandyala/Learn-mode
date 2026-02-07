import React from 'react';
import './EmptyState.css';

const EmptyState = ({
    title = 'No Data Found',
    message = 'We couldn\'t find what you were looking for.',
    icon,
    action,
    className = ''
}) => {
    return (
        <div className={`empty-state ${className}`}>
            <div className="empty-state__icon">
                {icon || (
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
            </div>
            <h3 className="empty-state__title">{title}</h3>
            <p className="empty-state__message">{message}</p>
            {action && (
                <div className="empty-state__action">
                    {action}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
