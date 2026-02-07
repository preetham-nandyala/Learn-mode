import React from 'react';

const TechLogo = ({ title, className = '', style = {}, ...props }) => {
    const lowerTitle = title?.toLowerCase() || '';

    const commonProps = {
        viewBox: "0 0 32 32",
        className,
        style,
        ...props
    };

    if (lowerTitle.includes('html')) {
        return (
            <svg {...commonProps}>
                <path fill="#E44D26" d="M6 28L4 3h24l-2 25-10 3-10-3z" />
                <path fill="#F16529" d="M16 27.25l8-2.25 1.75-19.5H16v21.75z" />
                <path fill="#EBEBEB" d="M16 13.5H11l-.35-4H16v-4H6.35L7 10l.65 8H16v-4.5z" />
                <path fill="#fff" d="M16 21.35l-.05.02-4-1.1-.25-3.02h-4l.5 5.7 7.75 2.15.05-.02V21.35z" />
                <path fill="#fff" d="M16 13.5v4.5h4.5l-.45 4.75-4.05 1.1v4.23l7.75-2.15.05-.7.9-10.23.1-.95.2-2.55H16v4h5.2l-.2 2.3H16z" />
            </svg>
        );
    }

    if (lowerTitle.includes('css')) {
        return (
            <svg {...commonProps}>
                <path fill="#1572B6" d="M6 28L4 3h24l-2 25-10 3-10-3z" />
                <path fill="#33A9DC" d="M16 27.25l8-2.25 1.75-19.5H16v21.75z" />
                <path fill="#EBEBEB" d="M16 13.5H11l-.35-4H16v-4H6.35L7 10l.65 8H16v-4.5z" />
                <path fill="#fff" d="M16 21.35l-.05.02-4-1.1-.25-3.02h-4l.5 5.7 7.75 2.15.05-.02V21.35z" />
                <path fill="#fff" d="M16 13.5v4.5h4.5l-.45 4.75-4.05 1.1v4.23l7.75-2.15.05-.7.9-10.23.1-.95.2-2.55H16v4h5.2l-.2 2.3H16z" />
            </svg>
        );
    }

    if (lowerTitle.includes('javascript') || lowerTitle.includes('js')) {
        return (
            <svg {...commonProps}>
                <rect fill="#F7DF1E" width="32" height="32" rx="2" />
                <path fill="#323330" d="M21.5 24.2c.5.9 1.2 1.5 2.4 1.5 1 0 1.7-.5 1.7-1.2 0-.8-.7-1.1-1.8-1.6l-.6-.3c-1.8-.8-3-1.7-3-3.8 0-1.9 1.4-3.3 3.7-3.3 1.6 0 2.7.6 3.6 2l-2 1.3c-.4-.8-1-1.1-1.6-1.1-.7 0-1.2.5-1.2 1.1 0 .8.5 1.1 1.6 1.5l.6.3c2.1.9 3.3 1.8 3.3 3.9 0 2.2-1.8 3.4-4.1 3.4-2.3 0-3.8-1.1-4.5-2.6l2-1.1zm-8.7.3c.4.7.7 1.3 1.6 1.3.8 0 1.3-.3 1.3-1.5v-8.1h2.5v8.2c0 2.5-1.5 3.6-3.6 3.6-2 0-3.1-1-3.7-2.2l1.9-1.3z" />
            </svg>
        );
    }

    if (lowerTitle.includes('react')) {
        return (
            <svg {...commonProps}>
                <circle cx="16" cy="16" r="2.5" fill="#61DAFB" />
                <g stroke="#61DAFB" strokeWidth="1.5" fill="none">
                    <ellipse cx="16" cy="16" rx="11" ry="4.2" />
                    <ellipse cx="16" cy="16" rx="11" ry="4.2" transform="rotate(60 16 16)" />
                    <ellipse cx="16" cy="16" rx="11" ry="4.2" transform="rotate(120 16 16)" />
                </g>
            </svg>
        );
    }

    if (lowerTitle.includes('python')) {
        return (
            <svg {...commonProps}>
                <path fill="#366A96" d="M15.9 3c-7.1 0-6.6 3.1-6.6 3.1l0 3.2h6.7v1H5.8S2 9.9 2 17c0 7.1 3.2 6.8 3.2 6.8h1.9v-3.3s-.1-3.2 3.2-3.2h5.5s3.1 0 3.1-3V7c0 0 .5-4-3-4zm-3.7 2.3c.6 0 1.1.5 1.1 1.1s-.5 1.1-1.1 1.1c-.6 0-1.1-.5-1.1-1.1s.5-1.1 1.1-1.1z" />
                <path fill="#FFC331" d="M16.1 29c7.1 0 6.6-3.1 6.6-3.1l0-3.2h-6.7v-1h10.2S30 22.1 30 15c0-7.1-3.2-6.8-3.2-6.8h-1.9v3.3s.1 3.2-3.2 3.2h-5.5s-3.1 0-3.1 3V25s-.5 4 3 4zm3.7-2.3c-.6 0-1.1-.5-1.1-1.1s.5-1.1 1.1-1.1c.6 0 1.1.5 1.1 1.1s-.5 1.1-1.1 1.1z" />
            </svg>
        );
    }

    if (lowerTitle.includes('node')) {
        return (
            <svg {...commonProps}>
                <path fill="#83CD29" d="M16 30c-.5 0-1-.1-1.4-.4l-4.5-2.7c-.7-.4-.3-.5-.1-.6.9-.3 1.1-.4 2-1 .1-.1.2 0 .3 0l3.5 2.1c.1.1.3.1.4 0l13.5-7.8c.1-.1.2-.2.2-.4V7.4c0-.2-.1-.3-.2-.4L16.2 3.2c-.1-.1-.3-.1-.4 0L2.3 11c-.1.1-.2.2-.2.4v15.6c0 .2.1.3.2.4l3.7 2.1c2 1 3.2-.2 3.2-1.4V12.8c0-.2.2-.4.4-.4h1.8c.2 0 .4.2.4.4v15.3c0 2.8-1.5 4.4-4.2 4.4-.8 0-1.5 0-3.3-.9l-3.5-2c-.9-.5-1.4-1.4-1.4-2.4V11.6c0-1 .5-1.9 1.4-2.4L14.6.4c.9-.5 2-.5 2.9 0l13.5 7.8c.9.5 1.4 1.4 1.4 2.4v15.6c0 1-.5 1.9-1.4 2.4l-13.5 7.8c-.5.4-1 .6-1.5.6z" />
            </svg>
        );
    }

    if (lowerTitle.includes('java') && !lowerTitle.includes('javascript')) {
        return (
            <svg {...commonProps}>
                <path fill="#E76F00" d="M12.6 23s-1.2.7.8 1c2.5.3 3.8.3 6.5-.3 0 0 .7.5 1.7.9-6.1 2.6-13.8-.2-9-1.6zm-.8-3.6s-1.3 1 .7 1.2c2.6.3 4.8.3 8.5-.4 0 0 .5.5 1.3.8-7.4 2.2-15.6.2-10.5-1.6zM17.8 14.3c1.5 1.8-.4 3.4-.4 3.4s3.9-2 2.1-4.5c-1.7-2.4-3-3.5 4-7.6 0 0-10.9 2.7-5.7 8.7z" />
                <path fill="#5382A1" d="M24.4 25.2s.9.7-1 1.3c-3.5 1-14.7 1.3-17.8 0-1.1-.5 1-1.1 1.7-1.3.7-.2 1.1-.1 1.1-.1-1.2-.9-8 1.7-3.4 2.4 12.4 2 22.6-.9 19.4-2.3zm-12-8.6s-5.7 1.4-2 1.9c1.5.2 4.6.2 7.4-.1 2.3-.2 4.6-.7 4.6-.7s-.8.4-1.4.8c-5.7 1.5-16.7.8-13.6-.7 2.7-1.3 5-1.2 5-1.2zm10 5.6c5.8-3 3.1-5.9 1.2-5.5-.5.1-.7.2-.7.2s.2-.3.5-.4c3.7-1.3 6.6 3.9-1.2 6 0-.1.1-.2.2-.3zm-8.8 7.6c5.6.4 14.1-.2 14.3-2.8 0 0-.4 1-4.6 1.7-4.7.8-10.6.7-14.1.2 0 0 .7.6 4.4.9z" />
            </svg>
        );
    }

    if (lowerTitle.includes('sql') || lowerTitle.includes('database')) {
        return (
            <svg {...commonProps}>
                <ellipse cx="16" cy="8" rx="12" ry="5" fill="#00758F" />
                <path fill="#00758F" d="M4 8v16c0 2.8 5.4 5 12 5s12-2.2 12-5V8c0 2.8-5.4 5-12 5S4 10.8 4 8z" />
                <ellipse cx="16" cy="8" rx="12" ry="5" fill="#00A4C7" opacity="0.5" />
            </svg>
        );
    }

    // Default code icon
    return (
        <svg {...commonProps}>
            <path fill="#3EB489" d="M10.5 22.5L3 16l7.5-6.5 1.5 1.7-5.5 4.8 5.5 4.8-1.5 1.7zm11 0l-1.5-1.7 5.5-4.8-5.5-4.8 1.5-1.7L29 16l-7.5 6.5z" />
            <path fill="#00B8A3" d="M13 25l6-18h2l-6 18h-2z" />
        </svg>
    );
};

export default TechLogo;
