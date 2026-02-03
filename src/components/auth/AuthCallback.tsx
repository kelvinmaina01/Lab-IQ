import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Handles the callback from Supabase Auth (e.g. Google Sign In).
 * The Supabase client library automatically processes the hash fragment
 * to establish the session. We just need to wait for it and redirect.
 */
export const AuthCallback = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // The onAuthStateChange listener in useAuth (or elsewhere) will likely
        // detect the session. We can also explicitly check here.
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                // Successful login
                navigate("/upload", { replace: true });
            } else {
                // If no session found immediately, wait a shorter bit or
                // let the auth listener handle it.
                // Usually for OAuth flow, the URL contains the token, 
                // and supabase-js parses it on initialization.

                // Fallback: redirects to login if something failed after a timeout
                const timer = setTimeout(() => {
                    navigate("/login", { replace: true });
                }, 3000);
                return () => clearTimeout(timer);
            }
        });
    }, [navigate]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#030712] text-white">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
            <p className="text-slate-400">Completing sign in...</p>
        </div>
    );
};
