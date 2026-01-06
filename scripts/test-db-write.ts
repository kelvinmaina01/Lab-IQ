
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase credentials (SERVICE KEY required for auth bypass) in .env');
    process.exit(1);
}

// Use SERVICE KEY to write as a simulated user or system
const supabase = createClient(supabaseUrl, serviceKey);

async function testWrite() {
    console.log('Testing Write Access to "pinned_dashboards"...');

    // We need a valid user ID. Usually we'd fetch one or use a dummy if FK allows.
    // Let's try to fetch an existing user.
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();

    if (userError || !users.users.length) {
        console.error('❌ Cannot find any users to attach dashboard to:', userError?.message);
        return;
    }

    const testUserId = users.users[0].id; // Pick first user
    console.log(`Target User ID: ${testUserId}`);

    const testDashboard = {
        user_id: testUserId,
        title: 'VERIFICATION_TEST_DASHBOARD',
        description: 'Temporary dashboard to verify write access.',
        type: 'chart',
        source: 'system',
        config: { chartType: 'bar' },
        data: { summary: 'System test' },
        category: 'general',
        tags: ['test']
    };

    const { data, error } = await supabase
        .from('pinned_dashboards')
        .insert(testDashboard)
        .select()
        .single();

    if (error) {
        console.error('❌ WRITE FAILED:', error.message);
        console.error(JSON.stringify(error, null, 2));
    } else {
        console.log('✅ WRITE SUCCESS!');
        console.log('Inserted Dashboard ID:', data.id);

        // Cleanup
        const { error: delError } = await supabase
            .from('pinned_dashboards')
            .delete()
            .eq('id', data.id);

        if (delError) console.warn('⚠️ Cleanup failed:', delError.message);
        else console.log('✅ Cleanup (Delete) SUCCESS.');
    }
}

testWrite();
