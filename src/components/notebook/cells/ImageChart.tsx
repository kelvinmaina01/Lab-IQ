
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Maximize2 } from 'lucide-react';

interface ImageChartProps {
    data: string; // Base64
    onExpand: () => void;
    onDownload: () => void;
}

export const ImageChart: React.FC<ImageChartProps> = ({ data, onExpand, onDownload }) => {
    return (
        <div className="relative group">
            <img
                src={`data:image/png;base64,${data}`}
                alt="Analysis Chart"
                className="w-full h-auto rounded-md border border-border"
            />
            {/* Overlay Controls */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <Button variant="secondary" size="icon" className="h-8 w-8" onClick={onExpand}>
                    <Maximize2 className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="icon" className="h-8 w-8" onClick={onDownload}>
                    <Download className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};
