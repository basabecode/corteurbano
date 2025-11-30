// Jest setup file - runs before all tests
import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.TEST_SUPABASE_URL || 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY || 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.TEST_SUPABASE_SERVICE_KEY || 'test-service-key';
process.env.TELEGRAM_BOT_TOKEN = process.env.TEST_TELEGRAM_BOT_TOKEN || 'test-bot-token';
process.env.TELEGRAM_ADMIN_CHAT_ID = process.env.TEST_TELEGRAM_ADMIN_CHAT_ID || '123456789';

// Global test timeout
jest.setTimeout(10000);

// Suppress console errors in tests (optional)
global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
};
