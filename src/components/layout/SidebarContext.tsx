import { createContext, useContext, useState, useEffect } from "react";

type SidebarContextType = {
    isCollapsed: boolean;
    toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Persist state
    useEffect(() => {
        const saved = localStorage.getItem("sidebarCollapsed");
        if (saved) setIsCollapsed(saved === 'true');
    }, []);

    const toggleSidebar = () => {
        setIsCollapsed(prev => {
            const newState = !prev;
            localStorage.setItem("sidebarCollapsed", String(newState));
            return newState;
        });
    };

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
    return context;
};
