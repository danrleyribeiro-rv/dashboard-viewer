// src/components/logotype.tsx
import React from 'react';
import Image from 'next/image';
import logo from '../assets/images/corp-logo.png';

interface LogotypeProps {
    className?: string;
}

export const Logotype: React.FC<LogotypeProps> = ({ className }) => (
    <Image
        src={logo}
        alt="Company Logo"
        width={50}
        height={50}
        className={className}
    />
);