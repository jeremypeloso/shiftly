import { supabase } from "./supabase";

let cachedUser = null;
let initialized = false;
let initializingPromise = null;

export async function initAuth() {
  if (initialized) return cachedUser;

  if (initializingPromise) {
    return initializingPromise;
  }

  initializingPromise = supabase.auth.getSession().then(({ data }) => {
    cachedUser = data.session?.user || null;

    supabase.auth.onAuthStateChange((_event, session) => {
      cachedUser = session?.user || null;
    });

    initialized = true;
    return cachedUser;
  });

  return initializingPromise;
}

export async function getCurrentUser() {
  if (initialized) return cachedUser;
  return await initAuth();
}