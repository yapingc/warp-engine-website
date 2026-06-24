import type { Session } from '@supabase/supabase-js';
import { atom } from 'jotai';

export const themeAtom = atom<'light' | 'dark'>('light');

/** Supabase 认证 session，null 表示未登录（独立于 RBAC 认证） */
export const supabaseSessionAtom = atom<Session | null>(null);
