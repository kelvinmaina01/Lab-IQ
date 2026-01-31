import { AuthCard } from "./AuthCard";
import { BrandPanel } from "./BrandPanel";

export const AuthPage = () => {
    return (
        <div className="min-h-screen w-full flex bg-white relative overflow-hidden">
            {/* Left Side - Auth Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 md:p-12 lg:p-20 relative z-10">
                <div className="w-full max-w-md">
                    {/* Logo for Mobile/Form Side */}
                    <div className="mb-10 flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <img
                                src="/dataiq-logo-transparent.png"
                                alt="DataIQ Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <span className="text-xl font-bold text-slate-900 tracking-tight">
                            dataiq
                        </span>
                    </div>

                    <AuthCard />

                    <div className="mt-8 text-center text-xs text-slate-500">
                        © 2026 DataIQ. All rights reserved.
                    </div>
                </div>
            </div>

            {/* Right Side - Brand & Visuals */}
            <BrandPanel />
        </div>
    );
};
