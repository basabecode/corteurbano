/**
 * Mock Telegram API for testing
 * Prevents actual API calls during tests
 */

type TelegramMessage = {
    chatId: string;
    text: string;
    buttons?: Array<{ text: string; callback_data: string }>;
};

type TelegramCallbackQuery = {
    id: string;
    text: string;
};

// Store sent messages for assertions
export const sentMessages: TelegramMessage[] = [];
export const answeredQueries: TelegramCallbackQuery[] = [];

/**
 * Mock sendTelegramMessage function
 */
export async function mockSendTelegramMessage(message: TelegramMessage) {
    sentMessages.push(message);
    return { ok: true, message_id: Math.floor(Math.random() * 1000000) };
}

/**
 * Mock answerCallbackQuery function
 */
export async function mockAnswerCallbackQuery(id: string, text: string) {
    answeredQueries.push({ id, text });
    return { ok: true };
}

/**
 * Clear all mock data
 */
export function clearMockTelegramData() {
    sentMessages.length = 0;
    answeredQueries.length = 0;
}

/**
 * Get last sent message
 */
export function getLastSentMessage(): TelegramMessage | undefined {
    return sentMessages[sentMessages.length - 1];
}

/**
 * Get last answered query
 */
export function getLastAnsweredQuery(): TelegramCallbackQuery | undefined {
    return answeredQueries[answeredQueries.length - 1];
}

/**
 * Setup Telegram mocks for Jest
 */
export function setupTelegramMocks() {
    jest.mock('@/lib/telegram', () => ({
        sendTelegramMessage: mockSendTelegramMessage,
        answerCallbackQuery: mockAnswerCallbackQuery,
    }));
}
