import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    PhoneOff,
    Users,
    Maximize2,
    Settings,
    Signal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HuddleBarProps {
    isActive: boolean;
    channelName: string;
    onLeave: () => void;
    participantCount?: number;
}

export const HuddleBar = ({ isActive, channelName, onLeave, participantCount = 1 }: HuddleBarProps) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(false);

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 200 }}
                    className="absolute bottom-4 left-4 right-4 z-50 pointer-events-none"
                >
                    <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-4 flex items-center justify-between pointer-events-auto">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-sm font-bold text-white tracking-wide">Huddle: {channelName}</span>
                            </div>
                            <div className="h-4 w-px bg-white/10 hidden sm:block" />
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium bg-white/5 px-2 py-1 rounded-full border border-white/5">
                                <Users className="h-3 w-3" />
                                <span>{participantCount} {participantCount === 1 ? 'Person' : 'People'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <TooltipProvider>
                                <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5 shadow-inner">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                    "h-10 w-10 rounded-lg transition-all",
                                                    isMuted ? "text-rose-400 hover:text-rose-300 bg-rose-500/10" : "text-white hover:bg-white/10"
                                                )}
                                                onClick={() => setIsMuted(!isMuted)}
                                            >
                                                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                    "h-10 w-10 rounded-lg transition-all",
                                                    isVideoOn ? "text-emerald-400 bg-emerald-500/10 hover:text-emerald-300" : "text-white hover:bg-white/10"
                                                )}
                                                onClick={() => setIsVideoOn(!isVideoOn)}
                                            >
                                                {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{isVideoOn ? "Stop Video" : "Start Video"}</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg text-white hover:bg-white/10">
                                                <Maximize2 className="h-5 w-5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Open View</TooltipContent>
                                    </Tooltip>
                                </div>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-10 w-10 rounded-xl shadow-lg shadow-rose-500/20"
                                            onClick={onLeave}
                                        >
                                            <PhoneOff className="h-5 w-5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Leave Huddle</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
