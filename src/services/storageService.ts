import { supabase } from "@/integrations/supabase/client";
import { IStorageService } from "@/core/interfaces";

export class SupabaseStorageService implements IStorageService {
    async uploadFile(bucket: string, path: string, file: File) {
        const { data, error } = await supabase.storage.from(bucket).upload(path, file);
        if (error) return { path: "", error };
        return { path: data.path, error: null };
    }

    getPublicUrl(bucket: string, path: string): string {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    }
}

export const storageService = new SupabaseStorageService();
