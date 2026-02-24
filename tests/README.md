# 🧪 Test Suite Documentation

## Overview

This directory contains a comprehensive test suite for the Corte Urbano appointment scheduling application, covering:

- **Unit Tests** - Business logic and utilities
- **Integration Tests** - API routes with database
- **E2E Tests** - Complete user workflows
- **Performance Tests** - Load and rendering performance
- **Security Tests** - Authentication, authorization, and input validation
- **Usability Tests** - Accessibility and responsive design

## Directory Structure

```
tests/
├── unit/                    # Unit tests (isolated logic)
│   ├── validation.test.ts   # Zod schema validation
│   ├── telegram.test.ts     # Telegram API utilities
│   └── utils.test.ts        # Helper functions
├── integration/             # Integration tests (with DB)
│   ├── api/
│   │   ├── booking.test.ts  # Booking API endpoint
│   │   └── ...
│   └── database/
│       └── rls-policies.test.ts
├── e2e/                     # End-to-end tests (Playwright)
│   ├── customer-booking-flow.spec.ts
│   ├── admin-management-flow.spec.ts
│   └── authentication.spec.ts
├── performance/             # Performance tests
├── security/                # Security tests
├── usability/               # Accessibility tests
│   └── accessibility.test.ts
├── fixtures/                # Test data
│   ├── appointments.json
│   ├── services.json
│   └── users.json
├── helpers/                 # Test utilities
│   ├── test-db.ts          # Database helpers
│   ├── mock-telegram.ts    # Telegram mocks
│   └── test-auth.ts        # Auth helpers
└── setup/                   # Configuration
    ├── jest.config.js
    ├── jest.setup.ts
    └── playwright.config.ts
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
pnpm test:unit

# Run specific test file
pnpm test tests/unit/validation.test.ts

# Watch mode
pnpm test:watch
```

### Integration Tests
```bash
# Run all integration tests
pnpm test:integration

# Note: Requires test database setup
```

### E2E Tests
```bash
# Run all E2E tests (headless)
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Run specific test
pnpm test:e2e tests/e2e/customer-booking-flow.spec.ts
```

### Accessibility Tests
```bash
pnpm test:a11y
```

### All Tests
```bash
# Run complete test suite
pnpm test:all
```

### Coverage Report
```bash
# Generate coverage report
pnpm test:coverage

# View HTML report
# Open coverage/lcov-report/index.html
```

## Test Environment Setup

### 1. Install Dependencies

```bash
# Install testing dependencies
pnpm add -D jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom @playwright/test axe-playwright
```

### 2. Setup Test Database

Create a separate Supabase project or database for testing:

```bash
# Copy .env.local to .env.test
cp .env.local .env.test

# Update with test database credentials
TEST_SUPABASE_URL=https://your-test-project.supabase.co
TEST_SUPABASE_ANON_KEY=your-test-anon-key
TEST_SUPABASE_SERVICE_KEY=your-test-service-key
```

### 3. Install Playwright Browsers

```bash
pnpm playwright:install
```

## Writing Tests

### Unit Test Example

```typescript
import { createBookingSchema } from '@/lib/validation';

describe('Validation', () => {
  it('should accept valid booking data', () => {
    const result = createBookingSchema.safeParse({
      serviceId: '550e8400-e29b-41d4-a716-446655440000',
      start: '2025-12-15T10:00:00Z',
    });
    expect(result.success).toBe(true);
  });
});
```

### Integration Test Example

```typescript
import { createTestSupabaseClient } from '../../helpers/test-db';

describe('Booking API', () => {
  it('should create appointment', async () => {
    const supabase = createTestSupabaseClient();
    const { data, error } = await supabase
      .from('appointments')
      .insert({ /* ... */ });
    expect(error).toBeNull();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('should complete booking flow', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Reservar Cita');
  // ... test steps
  await expect(page.locator('text=Cita creada')).toBeVisible();
});
```

## Test Helpers

### Database Helpers (`test-db.ts`)

```typescript
import { createTestUser, createTestAppointment, cleanupTestData } from '../helpers/test-db';

// Create test user
const user = await createTestUser({
  id: 'test-user-001',
  email: 'test@test.com',
  fullName: 'Test User',
});

// Cleanup after tests
afterAll(async () => {
  await cleanupTestData();
});
```

### Telegram Mocks (`mock-telegram.ts`)

```typescript
import { setupTelegramMocks, sentMessages } from '../helpers/mock-telegram';

beforeAll(() => {
  setupTelegramMocks();
});

// Assert message was sent
expect(sentMessages).toHaveLength(1);
expect(sentMessages[0].text).toContain('Nueva cita');
```

### Auth Helpers (`test-auth.ts`)

```typescript
import { createMockSession, signInTestUser } from '../helpers/test-auth';

const session = createMockSession('user-id', 'test@test.com');
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data after tests
3. **Mocking**: Mock external services (Telegram, etc.)
4. **Assertions**: Use descriptive expect messages
5. **Data**: Use fixtures for consistent test data
6. **Naming**: Use descriptive test names

## CI/CD Integration

Add to GitHub Actions workflow:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:unit
      - run: pnpm test:integration
      - run: pnpm playwright:install
      - run: pnpm test:e2e
```

## Troubleshooting

### Tests Failing Due to Database Connection
- Verify `.env.test` has correct credentials
- Ensure test database is accessible
- Check RLS policies allow test operations

### Playwright Tests Timing Out
- Increase timeout in `playwright.config.ts`
- Ensure dev server is running
- Check network connectivity

### Coverage Not Generated
- Run with `--coverage` flag
- Check `collectCoverageFrom` in `jest.config.js`

## Contributing

When adding new features:
1. Write unit tests for business logic
2. Add integration tests for API routes
3. Create E2E tests for user workflows
4. Ensure coverage stays above 70%

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [axe-core](https://github.com/dequelabs/axe-core)
