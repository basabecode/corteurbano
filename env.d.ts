declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    TELEGRAM_BOT_TOKEN: string;
    TELEGRAM_ADMIN_CHAT_ID: string;
    NEXT_PUBLIC_SITE_URL?: string;
  }
}







