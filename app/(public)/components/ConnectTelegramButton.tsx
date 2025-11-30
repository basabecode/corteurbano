'use client';

import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ConnectTelegramButtonProps {
    userId: string;
    botUsername: string;
}

export function ConnectTelegramButton({ userId, botUsername }: ConnectTelegramButtonProps) {
    const handleConnect = () => {
        const url = `https://t.me/${botUsername}?start=${userId}`;
        window.open(url, '_blank');
    };

    return (
        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
            <h3 className="text-lg font-medium text-slate-200 mb-2">
                🔔 Recibe notificaciones en Telegram
            </h3>
            <p className="text-slate-400 text-sm mb-4">
                Vincula tu cuenta para recibir confirmaciones y recordatorios de tus citas al instante.
            </p>
            <Button
                onClick={handleConnect}
                className="bg-[#2AABEE] hover:bg-[#229ED9] text-white gap-2"
            >
                <Send className="w-4 h-4" />
                Conectar con Telegram
            </Button>
        </div>
    );
}
