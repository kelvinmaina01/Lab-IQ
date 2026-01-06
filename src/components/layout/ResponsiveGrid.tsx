import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    columns?: {
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
    };
    gap?: number;
}

export const ResponsiveGrid = ({
    children,
    className,
    columns = { sm: 1, md: 2, lg: 3, xl: 4 },
    gap = 4,
    ...props
}: ResponsiveGridProps) => {

    // Construct grid class names dynamically
    // Note: Tailwind classes must be full strings for purge/JIT usually, 
    // but here we use standard grid-cols-{n} which work if they are in the safelist or used elsewhere.
    // For safety, we map numbers to explicit classes.

    const getColClass = (cols: number | undefined, prefix: string) => {
        if (!cols) return '';
        const map: Record<number, string> = {
            1: 'grid-cols-1',
            2: 'grid-cols-2',
            3: 'grid-cols-3',
            4: 'grid-cols-4',
            5: 'grid-cols-5',
            6: 'grid-cols-6',
            12: 'grid-cols-12'
        };
        const cls = map[cols];
        return cls ? (prefix ? `${prefix}:${cls}` : cls) : '';
    };

    const gridClasses = cn(
        'grid',
        `gap-${gap}`,
        getColClass(columns.sm, 'sm'),
        getColClass(columns.md, 'md'),
        getColClass(columns.lg, 'lg'),
        getColClass(columns.xl, 'xl'),
        // Default to mobile 1 col if not specified or override
        !columns.sm ? 'grid-cols-1' : '',
        className
    );

    return (
        <div className={gridClasses} {...props}>
            {children}
        </div>
    );
};
