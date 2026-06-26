import { createClient } from '@supabase/supabase-js';

const rawUrl = "https://gaenhzzgsxrqamkbjnjt.supabase.co/rest/v1/";
// Strip /rest/v1/ from the end if present to ensure auth calls to /auth/v1 function correctly
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "");
const supabaseKey = "sb_publishable_vQHh4i74O5TOb4-x6_wIjA_CiICqOLi";

export const supabase = createClient(supabaseUrl, supabaseKey);
