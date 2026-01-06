/**
 * useMediaQuery Hook - Responsive Design Support
 * 
 * Per Blueprint Phase 11: Mobile Responsiveness
 * Provides breakpoint detection for responsive layouts
 */

import { useState, useEffect, useCallback } from 'react';

// =============================================================================
// BREAKPOINTS (matching Tailwind defaults)
// =============================================================================

export const BREAKPOINTS = {
    mobile: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Check if viewport matches a media query
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);

        const handler = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        // Modern browsers
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        } else {
            // Fallback for older browsers
            mediaQuery.addListener(handler);
            return () => mediaQuery.removeListener(handler);
        }
    }, [query]);

    return matches;
}

/**
 * Check if viewport is mobile (< 640px)
 */
export function useIsMobile(): boolean {
    return useMediaQuery(`(max-width: ${BREAKPOINTS.sm - 1}px)`);
}

/**
 * Check if viewport is tablet (640px - 1023px)
 */
export function useIsTablet(): boolean {
    return useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`);
}

/**
 * Check if viewport is desktop (>= 1024px)
 */
export function useIsDesktop(): boolean {
    return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
}

/**
 * Get current breakpoint name
 */
export function useBreakpoint(): Breakpoint {
    const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.sm - 1}px)`);
    const isSm = useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px) and (max-width: ${BREAKPOINTS.md - 1}px)`);
    const isMd = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`);
    const isLg = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px) and (max-width: ${BREAKPOINTS.xl - 1}px)`);
    const isXl = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px) and (max-width: ${BREAKPOINTS['2xl'] - 1}px)`);

    if (isMobile) return 'mobile';
    if (isSm) return 'sm';
    if (isMd) return 'md';
    if (isLg) return 'lg';
    if (isXl) return 'xl';
    return '2xl';
}

/**
 * Check if viewport is at least a certain breakpoint
 */
export function useBreakpointAtLeast(breakpoint: Breakpoint): boolean {
    const minWidth = BREAKPOINTS[breakpoint];
    return useMediaQuery(`(min-width: ${minWidth}px)`);
}

/**
 * Check if viewport is at most a certain breakpoint
 */
export function useBreakpointAtMost(breakpoint: Breakpoint): boolean {
    const maxWidth = BREAKPOINTS[breakpoint] - 1;
    return useMediaQuery(`(max-width: ${maxWidth}px)`);
}

/**
 * Get window dimensions (with SSR safety)
 */
export function useWindowSize(): { width: number; height: number } {
    const [size, setSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
    });

    const handleResize = useCallback(() => {
        setSize({
            width: window.innerWidth,
            height: window.innerHeight,
        });
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        window.addEventListener('resize', handleResize);
        handleResize(); // Set initial size

        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);

    return size;
}

/**
 * Get responsive value based on current breakpoint
 */
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>, defaultValue: T): T {
    const breakpoint = useBreakpoint();

    // Find the closest matching breakpoint value
    const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'mobile'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);

    for (let i = currentIndex; i < breakpointOrder.length; i++) {
        const bp = breakpointOrder[i];
        if (values[bp] !== undefined) {
            return values[bp] as T;
        }
    }

    return defaultValue;
}
