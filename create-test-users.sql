-- Create 8 test users for the Dibs app
-- Note: These need to be created through Supabase Dashboard or Auth API
-- This file provides reference data for manual creation

-- Use this as reference when creating users manually in Supabase Dashboard:
-- Go to Authentication > Users > Add user (manually)

-- User 1
-- Email: alice@example.com
-- Password: password123
-- Full Name: Alice Johnson

-- User 2
-- Email: bob@example.com
-- Password: password123
-- Full Name: Bob Smith

-- User 3
-- Email: carol@example.com
-- Password: password123
-- Full Name: Carol Williams

-- User 4
-- Email: david@example.com
-- Password: password123
-- Full Name: David Brown

-- User 5
-- Email: emma@example.com
-- Password: password123
-- Full Name: Emma Davis

-- User 6
-- Email: frank@example.com
-- Password: password123
-- Full Name: Frank Miller

-- User 7
-- Email: grace@example.com
-- Password: password123
-- Full Name: Grace Wilson

-- User 8
-- Email: henry@example.com
-- Password: password123
-- Full Name: Henry Moore

-- After creating users via Supabase Dashboard, profiles will be automatically created
-- via the trigger function we set up in supabase-schema.sql

-- Alternatively, you can create users programmatically using the Supabase Admin API:
/*
Example using Node.js:

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_SERVICE_ROLE_KEY' // Use service role key for admin operations
)

const users = [
  { email: 'alice@example.com', password: 'password123', full_name: 'Alice Johnson' },
  { email: 'bob@example.com', password: 'password123', full_name: 'Bob Smith' },
  // ... rest of users
]

async function createUsers() {
  for (const user of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name }
    })
    
    if (error) {
      console.error(`Error creating ${user.email}:`, error)
    } else {
      console.log(`Created user: ${user.email}`)
    }
  }
}

createUsers()
*/

