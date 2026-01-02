import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { authService } from "@/services/authService";

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        return await supabase.auth.signInWithPassword({ email, password });
    };

    const signUp = async (email: string, password: string) => {
        return await supabase.auth.signUp({ email, password });
    };

    const signInWithGoogle = async () => {
        return await supabase.auth.signInWithOAuth({ provider: 'google' });
    };

    const signInWithGithub = async () => {
        return await supabase.auth.signInWithOAuth({ provider: 'github' });
    };

    const signOut = async () => {
        return await supabase.auth.signOut();
    };

    return {
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithGithub,
        signOut
    };
};
