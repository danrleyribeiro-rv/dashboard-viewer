import React from 'react';
import logo from '@/assets/images/corp-logo.png';

interface LogotypeProps {
    className?: string;
}

export const Logotype: React.FC<LogotypeProps> = ({ className }) => (
    <img
        src={logo}
        alt="Company Logo"
        width={50}
        height={50}
        className={className}
    />
);
