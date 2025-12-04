'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Calendar, User, BarChart3, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type NavItem = {
    icon: React.ElementType;
    label: string;
    href: string;
    active?: (pathname: string) => boolean;
};

const customerNavItems: NavItem[] = [
    {
        icon: Home,
        label: 'Inicio',
        href: '/',
    },
    {
        icon: Calendar,
        label: 'Mis Citas',
        href: '/dashboard/customer',
        active: (pathname) => pathname.startsWith('/dashboard/customer'),
    },
    {
        icon: User,
        label: 'Perfil',
        href: '/dashboard/customer/profile',
    },
];

const adminNavItems: NavItem[] = [
    {
        icon: Home,
        label: 'Inicio',
        href: '/',
    },
    {
        icon: Calendar,
        label: 'Citas',
        href: '/dashboard/admin',
        active: (pathname) => pathname === '/dashboard/admin',
    },
    {
        icon: BarChart3,
        label: 'Reportes',
        href: '/dashboard/admin/reports',
    },
];

type BottomNavProps = {
    role?: 'customer' | 'admin';
};

export function BottomNav({ role = 'customer' }: BottomNavProps) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    const navItems = role === 'admin' ? adminNavItems : customerNavItems;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const isActive = (item: NavItem) => {
        if (item.active) {
            return item.active(pathname);
        }
        return pathname === item.href;
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-bottom">
            <div className="bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 shadow-2xl">
                <div className="flex items-center justify-around px-2 py-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item);

                        return (
                            <button
                                key={item.href}
                                onClick={() => router.push(item.href)}
                                className={cn(
                                    'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 active:scale-95',
                                    'min-w-[64px] min-h-[56px]', // Touch-friendly
                                    active
                                        ? 'bg-amber-500/10 text-amber-400'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                )}
                                aria-label={item.label}
                                aria-current={active ? 'page' : undefined}
                            >
                                <Icon className={cn('h-5 w-5', active && 'scale-110')} />
                                <span className={cn('text-xs font-medium', active && 'font-semibold')}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className={cn(
                            'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 active:scale-95',
                            'min-w-[64px] min-h-[56px]',
                            'text-rose-400 hover:text-rose-300 hover:bg-rose-900/20'
                        )}
                        aria-label="Cerrar sesión"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="text-xs font-medium">Salir</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
