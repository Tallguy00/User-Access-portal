import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://kcgibypwlbshqkprgptf.supabase.co";
const supabaseKey = "sb_publishable_mFkrNtjEn8A2rvFsf32zHw_FiBMpNj3";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'super@company.com',
      password: 'SuperAdmin123'
    });

    if (authError) {
      console.error("Auth failed:", authError);
      return;
    }

    console.log("Authenticated as:", authData.user.email);

    const { data: requests, error: rError } = await supabase
      .from('access_requests')
      .select('id, user_full_name, user_email, department_id, title, status, created_at, manager, current_approver');
    
    if (rError) {
      console.error("Error fetching access_requests:", rError);
    } else {
      console.log("Access Requests Rows:", requests);
    }

    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, department_id');
    
    if (pError) {
      console.error("Error fetching profiles:", pError);
    } else {
      console.log("Profiles Rows:", profiles);
    }

  } catch (err) {
    console.error("Exception:", err);
  }
}
run();
