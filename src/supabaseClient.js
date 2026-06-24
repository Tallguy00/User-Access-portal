import { createClient } from '@supabase/supabase-js';

const rawUrl = "https://ayqpacuajyikmnayncrt.supabase.co/rest/v1/";
// Strip /rest/v1/ from the end if present to ensure auth calls to /auth/v1 function correctly
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "");
const supabaseKey = "sb_publishable_-Vztpkn16fgpWPbrgxIttg_dogBJzVr";

export const supabase = createClient(supabaseUrl, supabaseKey);
