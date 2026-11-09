import React from 'react';

export const GeminiLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 0C12 6.62742 6.62742 12 0 12C6.62742 12 12 17.3726 12 24C12 17.3726 17.3726 12 24 12C17.3726 12 12 6.62742 12 0Z"
      fill="url(#geminiGrad)"
    />
    <defs>
      <linearGradient
        id="geminiGrad"
        x1="2"
        y1="2"
        x2="22"
        y2="22"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#4da2ff" />
        <stop offset="50%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#ffffff" />
      </linearGradient>
    </defs>
  </svg>
);
