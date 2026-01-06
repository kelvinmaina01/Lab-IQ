import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    Cpu,
    HardDrive,
    maximize,
    RotateCcw,
    Expand,
    LayoutTemplate
} from 'lucide-react';

export function CodeSandboxStatus() {
    return (
        <div className="bg-[#252526] border border-[#454545] rounded-t-xl p-3 shadow-lg mx-1 -mb-1 relative z-20 w-[98%] mx-auto ring-1 ring-white/10">
            <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded bg-green-500/10 flex items-center justify-center">
                    <LayoutTemplate className="h-3.5 w-3.5 text-green-500" />
                </div>
                <div>
                    <h3 className="text-xs font-semibold text-[#e1e4e8]">Code Monitor</h3>
                    <p className="text-[10px] text-[#858585]">LabIQ Code Sandbox Ready</p>
                </div>

                {/* Compact Stats */}
                <div className="flex-1 flex gap-6 px-4">
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between text-[10px] text-[#cccccc]">
                            <span>RAM</span>
                            <span>0.8/2GB</span>
                        </div>
                        <Progress value={40} className="h-1 bg-[#3e3e42]" indicatorClassName="bg-green-500" />
                    </div>
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between text-[10px] text-[#cccccc]">
                            <span>CPU</span>
                            <span>2%</span>
                        </div>
                        <Progress value={2} className="h-1 bg-[#3e3e42]" indicatorClassName="bg-blue-500" />
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-[#858585] hover:text-[#cccccc] hover:bg-[#3e3e42]" title="Reset">
                        <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-[#858585] hover:text-[#cccccc] hover:bg-[#3e3e42]" title="Expand">
                        <Expand className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
