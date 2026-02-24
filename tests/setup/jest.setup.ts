// Jest setup file - runs before all tests
import '@testing-library/jest-dom';
import * as fs from 'fs';
import * as path from 'path';

// ── Cargar .env.local para tests de integración (Jest no los carga automáticamente)
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0 && !process.env[key.trim()]) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

// ── Variables de entorno: TEST_* sobreescriben .env.local; fallback a valores dummy para unit tests
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';
process.env.TELEGRAM_BOT_TOKEN = process.env.TEST_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || 'test-bot-token';
process.env.TELEGRAM_ADMIN_CHAT_ID = process.env.TEST_TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || '123456789';

// Global test timeout
jest.setTimeout(15000);

// Suppress console errors in tests (optional)
global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
};
