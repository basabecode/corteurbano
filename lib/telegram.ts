const TELEGRAM_BASE_URL = 'https://api.telegram.org';

type TelegramButton = {
  text: string;
  callback_data: string;
};

export async function sendTelegramMessage({
  text,
  chatId,
  buttons,
  parse_mode = 'Markdown'
}: {
  text: string;
  chatId: string | number;
  buttons?: TelegramButton[];
  parse_mode?: 'HTML' | 'Markdown';
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.trim() === '') throw new Error('TELEGRAM_BOT_TOKEN no configurado');

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode
  };

  if (buttons?.length) {
    body.reply_markup = {
      inline_keyboard: [buttons]
    };
  }

  const res = await fetch(`${TELEGRAM_BASE_URL}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Telegram error: ${error}`);
  }
}

export async function answerCallbackQuery(id: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.trim() === '') throw new Error('TELEGRAM_BOT_TOKEN no configurado');

  console.log(`Sending answerCallbackQuery for ID: ${id}`);

  const res = await fetch(`${TELEGRAM_BASE_URL}/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: id, text })
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('Telegram answerCallbackQuery error:', error);
    // No lanzamos error para no interrumpir el flujo principal
    return;
  }
}

export async function editMessageText({
  chatId,
  messageId,
  text,
  parse_mode = 'HTML'
}: {
  chatId: number | string;
  messageId: number;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.trim() === '') throw new Error('TELEGRAM_BOT_TOKEN no configurado');

  const body = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode
  };

  const res = await fetch(`${TELEGRAM_BASE_URL}/bot${token}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const error = await res.text();
    // Log error but don't crash flow - message might be too old or deleted
    console.error('Telegram editMessageText error:', error);
  }
}







