'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { User, LogOut, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        checkUser();
    }, []);

    async function checkUser() {
        const supabase = createSupabaseBrowserClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
            // Obtener nombre del perfil
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', authUser.id)
                .single();

            setUser({
                email: authUser.email || '',
                name: profile?.full_name
            });
        }
        setLoading(false);
    }

    async function handleLogout() {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        setUser(null);
        router.push('/');
        router.refresh();
    }

    return (
        <header
            className={`sticky top-0 z-50 transition-all duration-300 ${scrolled || mobileMenuOpen
                ? 'bg-slate-950/95 backdrop-blur-lg border-b border-slate-900 shadow-lg shadow-black/20'
                : 'bg-transparent'
                }`}
        >
            <nav className="container mx-auto flex items-center justify-between px-6 py-4">
                <Link
                    href="/"
                    className="text-2xl font-bold text-amber-500 hover:text-amber-400 transition-colors"
                >
                    BarberKing
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-6">
                    <a
                        href="/#servicios"
                        className="text-slate-300 hover:text-amber-400 transition-colors text-sm font-medium"
                    >
                        Servicios
                    </a>
                    <a
                        href="/#agenda"
                        className="text-slate-300 hover:text-amber-400 transition-colors text-sm font-medium"
                    >
                        Reservar
                    </a>

                    {!loading && (
                        user ? (
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/dashboard/customer"
                                    className="flex items-center gap-2 text-slate-300 hover:text-amber-400 transition-colors text-sm font-medium"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    Mi Panel
                                </Link>
                                <div className="h-6 w-px bg-slate-700"></div>
                                <div className="flex items-center gap-2 text-slate-300">
                                    <User className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                        {user.name || user.email.split('@')[0]}
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 transition-all duration-300"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Salir
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/30"
                            >
                                Iniciar sesión
                            </Link>
                        )
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-slate-100 p-2"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? '✕' : '☰'}
                </button>
            </nav>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className="md:hidden border-t border-slate-800 bg-slate-950 px-6 py-4 space-y-4 animate-fade-in">
                    <a
                        href="/#servicios"
                        className="block text-slate-300 hover:text-amber-400 py-2"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Servicios
                    </a>
                    <a
                        href="/#agenda"
                        className="block text-slate-300 hover:text-amber-400 py-2"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Reservar
                    </a>

                    {!loading && (
                        user ? (
                            <>
                                <div className="border-t border-slate-800 pt-4">
                                    <div className="flex items-center gap-2 text-slate-300 mb-3">
                                        <User className="h-4 w-4" />
                                        <span className="text-sm font-medium">
                                            {user.name || user.email.split('@')[0]}
                                        </span>
                                    </div>
                                    <Link
                                        href="/dashboard/customer"
                                        className="block w-full text-center rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-400 mb-2"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Mi Panel
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="block w-full text-center rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-700"
                                    >
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </>
                        ) : (
                            <Link
                                href="/login"
                                className="block w-full text-center rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-400"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Iniciar sesión
                            </Link>
                        )
                    )}
                </div>
            )}
        </header>
    );
}
