import React from 'react';

const Spinner = ({ className = '', size = 24, color = 'currentColor' }) => {
    return (
        <svg
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            width={size}
            height={size}
            style={{ animation: 'spin 1s linear infinite' }}
        >
            <style>
                {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
            </style>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke={color} strokeWidth="4" opacity="0.25"></circle>
            <path className="opacity-75" fill={color} opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );
};

export default Spinner;
