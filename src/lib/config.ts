// Supabase public config
// NEXT_PUBLIC_ vars must be accessed with literal property names
// so Turbopack/webpack can statically inline them at build time.
// process.env[variable] (computed access) is NOT inlined — use direct access only.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
