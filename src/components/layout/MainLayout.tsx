import { useSidebar } from "@/components/layout/SidebarContext";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
    children: React.ReactNode;
}

import { GlobalCommandPalette } from "@/components/layout/GlobalCommandPalette";

export const MainLayout = ({ children }: MainLayoutProps) => {
    const { isCollapsed } = useSidebar();

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <GlobalCommandPalette />
            <Sidebar />
            <div
                className={cn(
                    "flex-1 transition-all duration-300 ease-in-out flex flex-col",
                    isCollapsed ? "md:ml-20" : "md:ml-64"
                )}
            >
                <TopBar />
                <main className="flex-1 p-4 md:p-8 overflow-x-hidden w-full max-w-full">
                    {children}
                </main>
            </div>
            <MobileNav />
        </div>
    );
};
