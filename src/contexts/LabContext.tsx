import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LabContextType {
    labId: string | null;
    setLabId: (id: string) => void;
    loading: boolean;
    error: string | null;
}

const LabContext = createContext<LabContextType | undefined>(undefined);

export const LabProvider = ({ children }: { children: ReactNode }) => {
    const [labId, setLabId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadUserLab = async () => {
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError) throw authError;
                if (!user) {
                    setError('Not authenticated');
                    setLoading(false);
                    return;
                }

                // Get user's team membership to find their lab
                const { data, error: queryError } = await supabase
                    .from('team_members')
                    .select('lab_id')
                    .eq('user_id', user.id)
                    .limit(1)
                    .single();

                if (queryError || !data) {
                    // NEW USER - Use default lab or create one
                    console.log('No lab membership found for user:', user.id);

                    // Try to use default lab first
                    const defaultLabId = '00000000-0000-0000-0000-000000000001';

                    // Check if default lab exists
                    const { data: defaultLab } = await supabase
                        .from('labs')
                        .select('id')
                        .eq('id', defaultLabId)
                        .single();

                    let labIdToUse = defaultLabId;

                    // If no default lab, create a personal one
                    if (!defaultLab) {
                        const { data: newLab, error: labCreateError } = await supabase
                            .from('labs')
                            .insert({
                                name: `${user.email?.split('@')[0]}'s Lab`,
                                description: 'Personal lab workspace'
                            })
                            .select()
                            .single();

                        if (labCreateError) {
                            console.error('Failed to create lab:', labCreateError);
                            setError('Failed to create lab workspace. Please try again.');
                            setLoading(false);
                            return;
                        }

                        labIdToUse = newLab.id;
                    }

                    // Add user as admin to the lab
                    const { error: memberError } = await supabase
                        .from('team_members')
                        .insert({
                            user_id: user.id,
                            lab_id: labIdToUse,
                            role: 'admin',
                            display_name: user.email?.split('@')[0] || 'User',
                            status: 'online'
                        });

                    if (memberError) {
                        console.error('Failed to add user to lab:', memberError);
                        // If error is duplicate, that's okay - user already exists
                        if (!memberError.message?.includes('duplicate')) {
                            setError('Failed to setup lab membership. Please try again.');
                            setLoading(false);
                            return;
                        }
                    }

                    // Create default channels if they don't exist
                    const { data: existingChannels } = await supabase
                        .from('chat_channels')
                        .select('id')
                        .eq('lab_id', labIdToUse)
                        .limit(1);

                    if (!existingChannels || existingChannels.length === 0) {
                        await supabase.from('chat_channels').insert([
                            {
                                lab_id: labIdToUse,
                                name: 'general',
                                display_name: 'General',
                                description: 'General discussion',
                                type: 'general',
                                created_by: user.id
                            },
                            {
                                lab_id: labIdToUse,
                                name: 'random',
                                display_name: 'Random',
                                description: 'Off-topic chat',
                                type: 'general',
                                created_by: user.id
                            }
                        ]);
                    }

                    setLabId(labIdToUse);
                    console.log('✓ Setup complete - user added to lab:', labIdToUse);
                } else {
                    setLabId(data.lab_id);
                }
            } catch (err: any) {
                console.error('Error loading user lab:', err);
                setError(err.message || 'Failed to load lab information');
            } finally {
                setLoading(false);
            }
        };

        loadUserLab();
    }, []);

    return (
        <LabContext.Provider value={{ labId, setLabId, loading, error }}>
            {children}
        </LabContext.Provider>
    );
};

export const useLab = () => {
    const context = useContext(LabContext);
    if (!context) {
        throw new Error('useLab must be used within LabProvider');
    }
    return context;
};
