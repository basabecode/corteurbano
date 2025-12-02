import { sendTelegramMessage, answerCallbackQuery } from '@/lib/telegram';

// Mock fetch globally
global.fetch = jest.fn();

describe('Telegram Utilities', () => {
    const mockBotToken = 'test-bot-token';

    beforeAll(() => {
        process.env.TELEGRAM_BOT_TOKEN = mockBotToken;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockClear();
    });

    describe('sendTelegramMessage', () => {
        it('should send message without buttons successfully', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ ok: true, result: { message_id: 123 } }),
            });

            await sendTelegramMessage({
                chatId: '123456789',
                text: 'Test message',
            });

            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(global.fetch).toHaveBeenCalledWith(
                `https://api.telegram.org/bot${mockBotToken}/sendMessage`,
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: '123456789',
                        text: 'Test message',
                        parse_mode: 'Markdown',
                    }),
                })
            );
        });

        it('should send message with inline buttons', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ ok: true, result: { message_id: 123 } }),
            });

            const buttons = [
                { text: '✅ Confirmar', callback_data: 'confirm:123' },
                { text: '❌ Rechazar', callback_data: 'cancel:123' },
            ];

            await sendTelegramMessage({
                chatId: '123456789',
                text: 'Nueva cita pendiente',
                buttons,
            });

            expect(global.fetch).toHaveBeenCalledWith(
                `https://api.telegram.org/bot${mockBotToken}/sendMessage`,
                expect.objectContaining({
                    body: JSON.stringify({
                        chat_id: '123456789',
                        text: 'Nueva cita pendiente',
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [buttons],
                        },
                    }),
                })
            );
        });

        it('should throw error when TELEGRAM_BOT_TOKEN is not set', async () => {
            const originalToken = process.env.TELEGRAM_BOT_TOKEN;
            process.env.TELEGRAM_BOT_TOKEN = '';

            await expect(
                sendTelegramMessage({
                    chatId: '123456789',
                    text: 'Test message',
                })
            ).rejects.toThrow('TELEGRAM_BOT_TOKEN no configurado');

            process.env.TELEGRAM_BOT_TOKEN = originalToken;
        });

        it('should throw error when API request fails', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                text: async () => 'Bad Request: chat not found',
            });

            await expect(
                sendTelegramMessage({
                    chatId: 'invalid-chat-id',
                    text: 'Test message',
                })
            ).rejects.toThrow('Telegram error: Bad Request: chat not found');
        });

        it('should handle network errors', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            await expect(
                sendTelegramMessage({
                    chatId: '123456789',
                    text: 'Test message',
                })
            ).rejects.toThrow('Network error');
        });

        it('should format message with Markdown', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ ok: true }),
            });

            const markdownText = '*Bold text* and _italic text_';

            await sendTelegramMessage({
                chatId: '123456789',
                text: markdownText,
            });

            const callBody = JSON.parse(
                (global.fetch as jest.Mock).mock.calls[0][1].body
            );
            expect(callBody.parse_mode).toBe('Markdown');
            expect(callBody.text).toBe(markdownText);
        });
    });

    describe('answerCallbackQuery', () => {
        it('should answer callback query successfully', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ ok: true }),
            });

            await answerCallbackQuery('callback-query-id-123', 'Cita confirmada');

            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(global.fetch).toHaveBeenCalledWith(
                `https://api.telegram.org/bot${mockBotToken}/answerCallbackQuery`,
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        callback_query_id: 'callback-query-id-123',
                        text: 'Cita confirmada',
                    }),
                })
            );
        });

        it('should throw error when TELEGRAM_BOT_TOKEN is not set', async () => {
            const originalToken = process.env.TELEGRAM_BOT_TOKEN;
            process.env.TELEGRAM_BOT_TOKEN = '';

            await expect(
                answerCallbackQuery('callback-query-id-123', 'Test')
            ).rejects.toThrow('TELEGRAM_BOT_TOKEN no configurado');

            process.env.TELEGRAM_BOT_TOKEN = originalToken;
        });

        it('should handle API errors gracefully', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                text: async () => 'Query is too old',
            });

            // answerCallbackQuery doesn't throw on error, just logs
            await expect(
                answerCallbackQuery('old-query-id', 'Test')
            ).resolves.not.toThrow();
        });
    });

    describe('Integration scenarios', () => {
        it('should handle rapid successive messages', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: async () => ({ ok: true }),
            });

            const promises = Array.from({ length: 5 }, (_, i) =>
                sendTelegramMessage({
                    chatId: '123456789',
                    text: `Message ${i + 1}`,
                })
            );

            await Promise.all(promises);

            expect(global.fetch).toHaveBeenCalledTimes(5);
        });

        it('should handle empty button array', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ ok: true }),
            });

            await sendTelegramMessage({
                chatId: '123456789',
                text: 'Test message',
                buttons: [],
            });

            const callBody = JSON.parse(
                (global.fetch as jest.Mock).mock.calls[0][1].body
            );
            expect(callBody.reply_markup).toBeUndefined();
        });
    });
});
