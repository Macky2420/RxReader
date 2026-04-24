import { supabase } from "../../utils/supabase";

export async function ensureUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) return session;

  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) throw error;

  if (!data.session) {
    throw new Error("Failed to create anonymous session");
  }

  return data.session;
}