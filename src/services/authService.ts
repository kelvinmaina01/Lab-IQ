import { supabase } from "@/integrations/supabase/client";
import { IAuthService, UserProfile } from "@/core/interfaces";

export class SupabaseAuthService implements IAuthService {
    async signIn(email: string) {
        return await supabase.auth.signInWithOtp({ email });
    }

    async signOut() {
        return await supabase.auth.signOut();
    }

    async getUser(): Promise<UserProfile | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        return {
            id: user.id,
            email: user.email || "",
            full_name: user.user_metadata?.full_name,
            avatar_url: user.user_metadata?.avatar_url,
        };
    }

    async getSession() {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    }
}

export const authService = new SupabaseAuthService();
