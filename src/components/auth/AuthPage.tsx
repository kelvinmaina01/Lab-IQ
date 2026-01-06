import { AuthCard } from "./AuthCard";
import { BrandPanel } from "./BrandPanel";
import { HeartPulse } from "lucide-react";

export const AuthPage = () => {
    return (
        <div className="min-h-screen w-full flex bg-[#030712] relative overflow-hidden">
            {/* Left Side - Auth Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 md:p-12 lg:p-20 relative z-10">
                <div className="w-full max-w-md">
                    {/* Logo for Mobile/Form Side */}
                    <div className="mb-10 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <HeartPulse className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">
                            LabIQ Health
                        </span>
                    </div>

                    <AuthCard />

                    <div className="mt-8 text-center text-xs text-slate-500">
                        © 2026 LabIQ Health Inc. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Side - Brand & Visuals */}
            <BrandPanel />
        </div>
    );
};
