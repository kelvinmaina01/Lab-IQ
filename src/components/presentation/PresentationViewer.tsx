/**
 * Presentation Viewer - Full-screen slide viewer with navigation
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, X, Edit, Download, Share2, Maximize2 } from 'lucide-react';
import { Presentation, PRESENTATION_THEMES, Slide } from '@/lib/services/presentationService';
import { SlideCanvas } from './SlideCanvas';
import { cn } from '@/lib/utils';

interface PresentationViewerProps {
    presentation: Presentation;
    onClose?: () => void;
    onEdit?: () => void;
}

export function PresentationViewer({ presentation, onClose, onEdit }: PresentationViewerProps) {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const theme = PRESENTATION_THEMES[presentation.theme];
    const currentSlide = presentation.slides[currentSlideIndex];

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                previousSlide();
            } else if (e.key === 'Escape') {
                if (isFullscreen) {
                    setIsFullscreen(false);
                } else {
                    onClose?.();
                }
            } else if (e.key === 'f') {
                setIsFullscreen(!isFullscreen);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentSlideIndex, isFullscreen, onClose]);

    const nextSlide = () => {
        if (currentSlideIndex < presentation.slides.length - 1) {
            setCurrentSlideIndex(prev => prev + 1);
        }
    };

    const previousSlide = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(prev => prev - 1);
        }
    };

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            document.documentElement.requestFullscreen?.();
        } else {
            document.exitFullscreen?.();
        }
        setIsFullscreen(!isFullscreen);
    };

    return (
        <div
            className={cn(
                'fixed inset-0 z-50 bg-background',
                isFullscreen ? 'p-0' : 'p-4'
            )}
            style={{ backgroundColor: theme.colors.background }}
        >
            {/* Top Control Bar */}
            {!isFullscreen && (
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-10 w-10 bg-background/80 backdrop-blur-sm hover:bg-background"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                        <div className="bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2">
                            <p className="font-semibold text-sm">{presentation.title}</p>
                            <p className="text-xs text-muted-foreground">
                                Slide {currentSlideIndex + 1} of {presentation.slides.length}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onEdit}
                            className="gap-2 bg-background/80 backdrop-blur-sm"
                        >
                            <Edit className="h-4 w-4" />
                            Edit
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 bg-background/80 backdrop-blur-sm"
                        >
                            <Share2 className="h-4 w-4" />
                            Share
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 bg-background/80 backdrop-blur-sm"
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={toggleFullscreen}
                            className="h-9 w-9 bg-background/80 backdrop-blur-sm"
                        >
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Slide Area */}
            <div className="h-full flex items-center justify-center">
                <div
                    className={cn(
                        'relative transition-all duration-300',
                        isFullscreen ? 'w-full h-full' : 'w-full max-w-6xl aspect-[16/9]'
                    )}
                >
                    <SlideCanvas
                        slide={currentSlide}
                        theme={theme}
                        isFullscreen={isFullscreen}
                    />
                </div>
            </div>

            {/* Navigation Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={previousSlide}
                    disabled={currentSlideIndex === 0}
                    className="h-12 w-12 rounded-full bg-background/90 backdrop-blur-sm shadow-lg hover:bg-background"
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>

                {/* Slide Indicators */}
                <div className="flex items-center gap-2 px-4 py-2 bg-background/90 backdrop-blur-sm rounded-full shadow-lg">
                    {presentation.slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlideIndex(index)}
                            className={cn(
                                'w-2 h-2 rounded-full transition-all',
                                index === currentSlideIndex
                                    ? 'bg-primary w-8'
                                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                            )}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={nextSlide}
                    disabled={currentSlideIndex === presentation.slides.length - 1}
                    className="h-12 w-12 rounded-full bg-background/90 backdrop-blur-sm shadow-lg hover:bg-background"
                >
                    <ChevronRight className="h-6 w-6" />
                </Button>
            </div>

            {/* Keyboard Shortcuts Hint */}
            {!isFullscreen && (
                <div className="absolute bottom-4 right-4 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-2 rounded-lg">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded">←</kbd>{' '}
                    <kbd className="px-1.5 py-0.5 bg-muted rounded">→</kbd> Navigate •{' '}
                    <kbd className="px-1.5 py-0.5 bg-muted rounded">F</kbd> Fullscreen •{' '}
                    <kbd className="px-1.5 py-0.5 bg-muted rounded">Esc</kbd> Exit
                </div>
            )}
        </div>
    );
}
