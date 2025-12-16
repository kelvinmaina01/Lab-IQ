import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface GlobalErrorFallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
}

export const GlobalErrorFallback: React.FC<GlobalErrorFallbackProps> = ({
    error,
    resetErrorBoundary,
}) => {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-foreground">
            <div className="w-full max-w-md space-y-6 text-center">
                <div className="flex justify-center">
                    <div className="rounded-full bg-destructive/10 p-4">
                        <AlertCircle className="h-12 w-12 text-destructive" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
                    <p className="text-muted-foreground">
                        We encountered an unexpected error. Our team has been notified.
                    </p>
                </div>

                <Alert variant="destructive" className="text-left">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Details</AlertTitle>
                    <AlertDescription className="mt-2 font-mono text-xs break-all">
                        {error.message}
                    </AlertDescription>
                </Alert>

                <div className="flex justify-center gap-4">
                    <Button onClick={() => window.location.reload()} variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Reload Page
                    </Button>
                    <Button onClick={resetErrorBoundary}>Try Again</Button>
                </div>
            </div>
        </div>
    );
};
