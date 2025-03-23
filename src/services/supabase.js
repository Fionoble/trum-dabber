import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zeedkzthmlrpsdlbvazj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplZWRrenRobWxycHNkbGJ2YXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NDAyNjEsImV4cCI6MjA1ODMxNjI2MX0.dOlrLFs_LmiCj9YOP7-XKAfbGHWgJvmbMVX489ceSoA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
