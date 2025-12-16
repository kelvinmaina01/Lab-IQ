import React, { createContext, useContext } from "react";
import { IServiceContainer } from "./interfaces";
import { SupabaseAuthService, SupabaseStorageService, PythonMLService, SupabaseCollaborationService } from "./services";

// Initialize services (Singletons)
const services: IServiceContainer = {
    auth: new SupabaseAuthService(),
    storage: new SupabaseStorageService(),
    ml: new PythonMLService(),
    collaboration: new SupabaseCollaborationService(),
};

const ServiceContext = createContext<IServiceContainer>(services);

export const ServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <ServiceContext.Provider value={services}>
            {children}
        </ServiceContext.Provider>
    );
};

// Custom hook to use services
export const useServices = () => {
    const context = useContext(ServiceContext);
    if (!context) {
        throw new Error("useServices must be used within a ServiceProvider");
    }
    return context;
};
