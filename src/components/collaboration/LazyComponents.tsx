import { lazy, Suspense } from 'react';
import { ScientificLoadingSkeleton } from './ScientificComponents';

// Lazy load heavy components for better performance
export const CanvasView = lazy(() => import('./CanvasView'));
export const FileSharing = lazy(() => import('./FileSharing'));
export const ResourceShareModal = lazy(() => import('./ResourceShareModal'));

// Wrapper with scientific loading
export function LazyCanvasView(props: any) {
    return (
        <Suspense fallback={<ScientificLoadingSkeleton />}>
            <CanvasView {...props} />
        </Suspense>
    );
}

export function LazyFileSharing(props: any) {
    return (
        <Suspense fallback={<ScientificLoadingSkeleton />}>
            <FileSharing {...props} />
        </Suspense>
    );
}

export function LazyResourceShareModal(props: any) {
    return (
        <Suspense fallback={<ScientificLoadingSkeleton />}>
            <ResourceShareModal {...props} />
        </Suspense>
    );
}
