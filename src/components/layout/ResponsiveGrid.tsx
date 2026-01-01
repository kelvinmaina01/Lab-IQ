/**
 * ResponsiveGrid Component - Adaptive Grid Layout
 * 
 * Per Blueprint Phase 11: Mobile Responsiveness
 * Provides a grid that automatically adjusts columns based on viewport
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { useBreakpoint, Breakpoint } from '@/hooks/useMediaQuery';

// =============================================================================
// TYPES
// =============================================================================

export interface ResponsiveGridProps {
    children: React.ReactNode;
    /** Columns per breakpoint */
    columns?: Partial<Record<Breakpoint, number>>;
    /** Gap between items (Tailwind spacing scale) */
    gap?: number | string;
    /** Additional className */
    className?: string;
    /** Minimum item width (for auto-fit) */
    minItemWidth?: string;
    /** Use auto-fit instead of fixed columns */
    autoFit?: boolean;
}

// Default column configuration
const DEFAULT_COLUMNS: Record<Breakpoint, number> = {
    mobile: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4,
    '2xl': 4,
};

// =============================================================================
// COMPONENT
// =============================================================================

export function ResponsiveGrid({
    children,
    columns = DEFAULT_COLUMNS,
    gap = 4,
    className,
    minItemWidth = '280px',
    autoFit = false,
}: ResponsiveGridProps) {
    const breakpoint = useBreakpoint();

    // Merge user columns with defaults
    const mergedColumns = { ...DEFAULT_COLUMNS, ...columns };

    // Get current column count
    const currentColumns = mergedColumns[breakpoint] || 1;

    // Build grid style
    const gridStyle: React.CSSProperties = autoFit
        ? {
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`,
            gap: typeof gap === 'number' ? `${gap * 0.25}rem` : gap,
        }
        : {
            display: 'grid',
            gridTemplateColumns: `repeat(${currentColumns}, minmax(0, 1fr))`,
            gap: typeof gap === 'number' ? `${gap * 0.25}rem` : gap,
        };

    return (
        <div className={cn('w-full', className)} style={gridStyle}>
            {children}
        </div>
    );
}

// =============================================================================
// GRID ITEM COMPONENT
// =============================================================================

export interface ResponsiveGridItemProps {
    children: React.ReactNode;
    /** Span multiple columns */
    colSpan?: Partial<Record<Breakpoint, number>>;
    /** Span multiple rows */
    rowSpan?: number;
    /** Additional className */
    className?: string;
}

export function ResponsiveGridItem({
    children,
    colSpan,
    rowSpan = 1,
    className,
}: ResponsiveGridItemProps) {
    const breakpoint = useBreakpoint();

    // Get current column span
    const currentColSpan = colSpan?.[breakpoint] || 1;

    const itemStyle: React.CSSProperties = {
        gridColumn: currentColSpan > 1 ? `span ${currentColSpan}` : undefined,
        gridRow: rowSpan > 1 ? `span ${rowSpan}` : undefined,
    };

    return (
        <div className={className} style={itemStyle}>
            {children}
        </div>
    );
}

// =============================================================================
// RESPONSIVE STACK COMPONENT
// =============================================================================

export interface ResponsiveStackProps {
    children: React.ReactNode;
    /** Direction per breakpoint */
    direction?: Partial<Record<Breakpoint, 'row' | 'column'>>;
    /** Gap between items */
    gap?: number;
    /** Align items */
    align?: 'start' | 'center' | 'end' | 'stretch';
    /** Justify content */
    justify?: 'start' | 'center' | 'end' | 'between' | 'around';
    /** Additional className */
    className?: string;
}

export function ResponsiveStack({
    children,
    direction = { mobile: 'column', lg: 'row' },
    gap = 4,
    align = 'stretch',
    justify = 'start',
    className,
}: ResponsiveStackProps) {
    const breakpoint = useBreakpoint();

    // Merge with defaults
    const mergedDirection = { mobile: 'column' as const, lg: 'row' as const, ...direction };
    const currentDirection = mergedDirection[breakpoint] || 'column';

    const alignMap = {
        start: 'flex-start',
        center: 'center',
        end: 'flex-end',
        stretch: 'stretch',
    };

    const justifyMap = {
        start: 'flex-start',
        center: 'center',
        end: 'flex-end',
        between: 'space-between',
        around: 'space-around',
    };

    const stackStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: currentDirection,
        gap: `${gap * 0.25}rem`,
        alignItems: alignMap[align],
        justifyContent: justifyMap[justify],
    };

    return (
        <div className={cn('w-full', className)} style={stackStyle}>
            {children}
        </div>
    );
}

// =============================================================================
// SHOW/HIDE AT BREAKPOINT
// =============================================================================

export interface ShowAtProps {
    children: React.ReactNode;
    breakpoint: Breakpoint;
    /** Show at this breakpoint and above (default: true) */
    andAbove?: boolean;
}

export function ShowAt({ children, breakpoint, andAbove = true }: ShowAtProps) {
    const currentBreakpoint = useBreakpoint();
    const breakpointOrder: Breakpoint[] = ['mobile', 'sm', 'md', 'lg', 'xl', '2xl'];

    const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
    const targetIndex = breakpointOrder.indexOf(breakpoint);

    const shouldShow = andAbove
        ? currentIndex >= targetIndex
        : currentIndex === targetIndex;

    if (!shouldShow) return null;
    return <>{children}</>;
}

export interface HideAtProps {
    children: React.ReactNode;
    breakpoint: Breakpoint;
    /** Hide at this breakpoint and above (default: true) */
    andAbove?: boolean;
}

export function HideAt({ children, breakpoint, andAbove = true }: HideAtProps) {
    const currentBreakpoint = useBreakpoint();
    const breakpointOrder: Breakpoint[] = ['mobile', 'sm', 'md', 'lg', 'xl', '2xl'];

    const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
    const targetIndex = breakpointOrder.indexOf(breakpoint);

    const shouldHide = andAbove
        ? currentIndex >= targetIndex
        : currentIndex === targetIndex;

    if (shouldHide) return null;
    return <>{children}</>;
}
