import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cyswcuqgyhmnwmtxzfiy.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5c3djdXFneWhtbndtdHh6Zml5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTM2ODQsImV4cCI6MjA3NTUyOTY4NH0.I-yybzcOzeFQb38Osug2-DZGWtX4ktqNScqrm4h15q0";

// 🔒 Sessão guardada apenas enquanto a aba está aberta
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: sessionStorage,
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: true,
  },
});
