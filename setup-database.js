#!/usr/bin/env node

// Setup script for KANE Footwear Supabase database
// Run this with: node setup-database.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Your Supabase configuration
const SUPABASE_URL = 'https://ofocvxnnkwegfrdmxsaj.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to set this

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('Get your service role key from: https://supabase.com/dashboard/project/ofocvxnnkwegfrdmxsaj/settings/api');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  console.log('🚀 Setting up KANE Footwear database...');
  
  try {
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'supabase-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`   ${i + 1}/${statements.length}: ${statement.split('\n')[0].substring(0, 50)}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error);
        // Continue with other statements
      }
    }
    
    console.log('✅ Database setup completed!');
    console.log('\n📊 Verifying tables...');
    
    // Verify tables were created
    const tables = ['colorways', 'size_variants', 'saved_designs', 'order_configurations'];
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Created successfully`);
      }
    }
    
    console.log('\n🎉 Setup complete! Your database is ready for KANE Footwear.');
    console.log('\nNext steps:');
    console.log('1. Update your frontend to use Supabase');
    console.log('2. Create Netlify functions for Shopify integration');
    console.log('3. Test the sharing functionality');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Alternative setup using direct SQL execution
async function setupWithDirectSQL() {
  console.log('🚀 Setting up database with direct SQL execution...');
  
  // Create a custom SQL function to execute raw SQL
  const createExecFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;
  
  try {
    // First create the exec function
    const { error: funcError } = await supabase.rpc('exec_sql', { sql: createExecFunction });
    if (funcError) {
      console.log('Function creation error (may already exist):', funcError.message);
    }
    
    await setupDatabase();
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n🔧 Alternative: Run the SQL manually in Supabase dashboard');
    console.log('1. Go to https://supabase.com/dashboard/project/ofocvxnnkwegfrdmxsaj/editor');
    console.log('2. Copy and paste the contents of supabase-schema.sql');
    console.log('3. Click "Run"');
  }
}

if (require.main === module) {
  setupWithDirectSQL();
}

module.exports = { setupDatabase };
