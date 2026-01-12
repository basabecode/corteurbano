const WHATSAPP_API_URL = 'https://graph.facebook.com/v17.0';

type WhatsAppButton = {
    type: 'reply';
    reply: {
        id: string;
        title: string;
    };
};

export async function sendWhatsAppMessage({
    to,
    text,
    buttons,
}: {
    to: string;
    text: string;
    buttons?: WhatsAppButton[];
}) {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
        throw new Error('WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID not configured');
    }

    // Body structure checks
    // WhatsApp requires specific formatting.
    // For text: { messaging_product: "whatsapp", to: "...", type: "text", text: { body: "..." } }
    // For buttons: { ..., type: "interactive", interactive: { type: "button", body: { text: "..." }, action: { buttons: [...] } } }

    let body: Record<string, unknown> = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
    };

    if (buttons && buttons.length > 0) {
        body = {
            ...body,
            type: 'interactive',
            interactive: {
                type: 'button',
                body: {
                    text: text,
                },
                action: {
                    buttons: buttons,
                },
            },
        };
    } else {
        body = {
            ...body,
            type: 'text',
            text: {
                body: text,
            },
        };
    }

    const res = await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(`WhatsApp API error: ${error}`);
    }
}

export async function markWhatsAppMessageAsRead(messageId: string) {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) return;

    await fetch(`${WHATSAPP_API_URL}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId,
        }),
    });
}
