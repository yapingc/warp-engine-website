/// <reference types="vite/client" />
/// <reference types="@fuxi/vite-plugin-classnames-bind/modulecss" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_ID: string;
  readonly VITE_DEBUG: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_TARGET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
