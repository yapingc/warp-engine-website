import type { Session, User } from '@supabase/supabase-js';

import { supabase } from './supabase';

export interface SupabaseAuthResult {
  user: User | null;
  session: Session | null;
}

/** 邮箱注册 */
export async function signUp(email: string, password: string): Promise<SupabaseAuthResult> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return { user: data.user, session: data.session };
}

/** 邮箱密码登录 */
export async function signIn(email: string, password: string): Promise<SupabaseAuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { user: data.user, session: data.session };
}

/** 登出 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** 获取当前 session */
export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

/** 获取当前用户 */
export async function getUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

/** 监听认证状态变化，返回取消订阅函数 */
export function onAuthStateChange(callback: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data.subscription.unsubscribe();
}
