import React from 'react';

export const HealthAnimation = () => {
    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden opacity-30 pointer-events-none">
            {/* Central Pulse */}
            <div className="absolute w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />

            {/* Orbital Rings - CSS Animation */}
            <div className="absolute w-96 h-96 border border-primary/20 rounded-full animate-[spin_10s_linear_infinite]" />
            <div className="absolute w-[30rem] h-[30rem] border border-primary/10 rounded-full animate-[spin_15s_linear_infinite_reverse]" />

            {/* Floating Nodes */}
            <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-blue-500 rounded-full blur-[2px] animate-bounce" />
            <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-teal-500 rounded-full blur-[2px] animate-pulse" />
            <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-indigo-500 rounded-full blur-[1px] animate-ping" />

            {/* Waveform Line (SVG) */}
            <svg className="absolute w-full max-w-md h-32 stroke-primary/40" viewBox="0 0 400 100" fill="none">
                <path
                    d="M0 50 Q 50 50 75 50 T 100 20 T 125 80 T 150 50 T 200 50 T 250 50 T 275 10 T 300 90 T 325 50 T 400 50"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="animate-[dash_5s_linear_infinite]"
                    strokeDasharray="400"
                    strokeDashoffset="400"
                >
                    <animate attributeName="stroke-dashoffset" from="400" to="0" dur="3s" repeatCount="indefinite" />
                </path>
            </svg>
        </div>
    );
};
