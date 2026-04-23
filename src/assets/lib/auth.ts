import { supabase } from "./supabase";

export async function ensureUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) return session;

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) throw error;

  return data.session;
}