/**
 * Genera el enlace de deep linking para abrir el bot de Telegram con el número de teléfono.
 * Esto permite vincular la cuenta del usuario automáticamente.
 */
export function generarLinkTelegram(telefono: string) {
    const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'BarberKingBot';
    // Limpiamos el teléfono de espacios o caracteres especiales
    const phoneClean = telefono.replace(/\D/g, '');
    return `https://t.me/${botUsername}?start=TELEFONO_${phoneClean}`;
}
