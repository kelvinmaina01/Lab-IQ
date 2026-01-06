
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // needed for some admin checks if available

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

// Use service key if available for better checks, otherwise anon
const supabase = createClient(supabaseUrl, serviceKey || supabaseKey);

async function checkTable(tableName: string) {
    process.stdout.write(`Checking table '${tableName}'... `);
    const { data, error } = await supabase.from(tableName).select('*').limit(1);

    if (error) {
        if (error.code === 'PGRST301') {
            console.log('⚠️  Exists (RLS enabled, no rows visible)');
            return true;
        } else if (error.code === '42P01') { // undefined_table
            console.log('❌  MISSING!');
            return false;
        } else {
            console.log(`❌  Error: ${error.message} (${error.code})`);
            return false;
        }
    } else {
        console.log('✅  OK');
        return true;
    }
}

async function verify() {
    console.log('==========================================');
    console.log('     FULL DATABASE VERIFICATION      ');
    console.log('==========================================');
    console.log(`Target: ${supabaseUrl}\n`);

    const tablesToCheck = [
        'datasets',
        'analyses',
        'pinned_dashboards',
        'pinned_insights',
        'experiments',
        'workflows',
        'ml_models',
        'team_members'
    ];

    let missing = 0;

    for (const table of tablesToCheck) {
        const exists = await checkTable(table);
        if (!exists) missing++;
    }

    console.log('\n==========================================');
    if (missing === 0) {
        console.log('✅  ALL CRITICAL TABLES DETECTED.');
        console.log('    The database appears ready for the Drill Down Dashboard.');
    } else {
        console.log(`❌  ${missing} TABLES MISSING OR INACCESSIBLE.`);
        console.log('    Please run migrations using the Python script.');
    }
    console.log('==========================================');
}

verify();
