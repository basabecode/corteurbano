'use client';

import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ConnectTelegramButtonProps {
    userId: string;
    botUsername: string;
}

export function ConnectTelegramButton({ userId, botUsername, phone }: { userId?: string; botUsername: string; phone?: string }) {
    const handleConnect = () => {
        let startParam = '';

        if (userId) {
            startParam = userId;
        } else if (phone) {
            // Limpiar el teléfono de espacios y caracteres no numéricos
            const cleanPhone = phone.replace(/\D/g, '');
            startParam = `TELEFONO_${cleanPhone}`;
        }

        const url = `https://t.me/${botUsername}?start=${startParam}`;
        window.open(url, '_blank');
    };

    return (
        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-medium text-slate-200 mb-2">
                🔔 Finalizar activación de notificaciones
            </h3>
            <p className="text-slate-400 text-sm mb-4">
                Solo falta un paso: Haz clic abajo y presiona <strong>"Iniciar"</strong> en Telegram.
            </p>
            <Button
                onClick={handleConnect}
                className="bg-[#2AABEE] hover:bg-[#229ED9] text-white gap-2 w-full sm:w-auto shadow-lg shadow-blue-500/20"
            >
                <Send className="w-4 h-4" />
                Activar Telegram Ahora
            </Button>
            <p className="text-xs text-slate-500 mt-3">
                Recibirás la confirmación de tu cita inmediatamente.
            </p>
        </div>
    );
}
