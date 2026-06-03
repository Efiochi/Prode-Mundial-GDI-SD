import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Public values — safe to hardcode (anon key is rate-limited + RLS protected)
    NEXT_PUBLIC_SUPABASE_URL: "https://htbjfvgujgbcxclxmgnz.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Ympmdmd1amdiY3hjbHhtZ256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0ODU0MDUsImV4cCI6MjA5NjA2MTQwNX0.AjxrJGIdwd9j8ex-kZz9bCQWe5LP8_MBfuOqx93ZvQg",
  },
};

export default nextConfig;
