import { useEffect } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useAtom } from 'jotai';

import { supabaseSessionAtom } from '@/atoms';
import { signUp as authSignUp, signIn as authSignIn, signOut as authSignOut, getSession, onAuthStateChange } from '@/services/supabase-auth';

interface UseSupabaseAuthReturn {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export function useSupabaseAuth(): UseSupabaseAuthReturn {
  const [session, setSession] = useAtom(supabaseSessionAtom);

  const signUp = async (email: string, password: string) => {
    await authSignUp(email, password);
  };

  const signIn = async (email: string, password: string) => {
    await authSignIn(email, password);
  };

  const signOut = async () => {
    await authSignOut();
  };

  useEffect(() => {
    getSession().then((s) => setSession(s));

    const unsubscribe = onAuthStateChange((newSession) => {
      setSession(newSession);
    });

    return unsubscribe;
  }, [setSession]);

  return {
    session,
    user: session?.user ?? null,
    isAuthenticated: session !== null,
    signUp,
    signIn,
    signOut,
  };
}
