import { createClient } from "@supabase/supabase-js";

// Browser/server reads use the public anon key and stay constrained by RLS.
export const supabasePublic = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// Server-only writes use the service role key and bypass RLS.
// Never import this helper into a client component.
export const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );