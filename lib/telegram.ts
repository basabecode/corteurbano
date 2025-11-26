const TELEGRAM_BASE_URL = 'https://api.telegram.org';

type TelegramButton = {
  text: string;
  callback_data: string;
};

export async function sendTelegramMessage({
  text,
  chatId,
  buttons
}: {
  text: string;
  chatId: string;
  buttons?: TelegramButton[];
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN no configurado');

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown'
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
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN no configurado');

  await fetch(`${TELEGRAM_BASE_URL}/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: id, text })
  });
}







