'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { User, LogOut, LayoutDashboard, Scissors, Calendar, LogIn, Sparkles } from 'lucide-react';
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
                    <Link
                        href="/estilos"
                        className="group flex items-center gap-2 px-3 py-2 rounded-full text-slate-300 hover:text-amber-400 hover:bg-slate-900/50 transition-all"
                    >
                        <Sparkles className="h-4 w-4" />
                        <span className="text-sm font-medium">Estilos</span>
                    </Link>

                    <Link
                        href="/#servicios"
                        className="group flex items-center gap-2 px-3 py-2 rounded-full text-slate-300 hover:text-amber-400 hover:bg-slate-900/50 transition-all"
                    >
                        <Scissors className="h-4 w-4" />
                        <span className="text-sm font-medium">Servicios</span>
                    </Link>

                    <Link
                        href="/#agenda"
                        className="group flex items-center gap-2 px-3 py-2 rounded-full text-slate-300 hover:text-amber-400 hover:bg-slate-900/50 transition-all"
                    >
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">Reservar</span>
                    </Link>

                    {!loading && (
                        user ? (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/dashboard/customer"
                                    className="group flex items-center gap-2 px-3 py-2 rounded-full text-slate-300 hover:text-amber-400 hover:bg-slate-900/50 transition-all"
                                >
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span className="text-sm font-medium">Mi Panel</span>
                                </Link>

                                <div className="h-6 w-px bg-slate-800 mx-1"></div>

                                <div className="flex items-center gap-2 px-3 py-2 text-slate-300 cursor-default">
                                    <User className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                        {user.name?.split(' ')[0] || user.email.split('@')[0]}
                                    </span>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    title="Cerrar Sesión"
                                    className="flex items-center justify-center p-2 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                >
                                    <LogOut className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="group flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 text-slate-950 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
                            >
                                <LogIn className="h-4 w-4" />
                                <span className="text-sm font-bold">Iniciar sesión</span>
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
                    <Link
                        href="/estilos"
                        className="block text-slate-300 hover:text-amber-400 py-2"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        Estilos
                    </Link>
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
