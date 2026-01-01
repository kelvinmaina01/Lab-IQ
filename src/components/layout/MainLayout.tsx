import { useSidebar } from "@/components/layout/SidebarContext";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
    children: React.ReactNode;
}

import { GlobalCommandPalette } from "@/components/layout/GlobalCommandPalette";

import { useLocation } from "react-router-dom";

export const MainLayout = ({ children }: MainLayoutProps) => {
    const { isCollapsed } = useSidebar();
    const location = useLocation();
    const isAssistant = location.pathname === '/insights';

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <GlobalCommandPalette />
            <Sidebar />
            <div
                className={cn(
                    "flex-1 transition-all duration-300 ease-in-out flex flex-col",
                    isCollapsed ? "md:ml-0" : "md:ml-64",
                    isAssistant && "h-screen overflow-hidden" // Full height for assistant
                )}
            >
                {!isAssistant && <TopBar />}
                <main className={cn(
                    "flex-1 overflow-x-hidden w-full max-w-full",
                    !isAssistant && "p-4 md:p-8" // Remove padding for assistant
                )}>
                    {children}
                </main>
            </div>
            <MobileNav />
        </div>
    );
};
