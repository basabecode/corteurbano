import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Catálogo de Estilos | BarberKing',
    description: 'Explora nuestros estilos de corte y tratamientos diseñados para ti.',
};

type StyleItem = {
    id: string;
    name: string;
    category: 'Cortes' | 'Barba' | 'Tratamientos';
    image: string;
    description: string;
    matchFaceShape?: string; // Optional: good for "Face Shape" recommendation
};

const STYLES: StyleItem[] = [
    {
        id: '1',
        name: 'Corte Básico (Clásico)',
        category: 'Cortes',
        image: '/images/classic-cut.png',
        description: 'Un estilo atemporal y limpio. Ideal para profesionales que buscan una imagen pulcra y ordenada.',
        matchFaceShape: 'Ovalado, Cuadrado',
    },
    {
        id: '2',
        name: 'Corte con Estilo (Fade)',
        category: 'Cortes',
        image: '/images/fade.png',
        description: 'Degradado moderno que aporta frescura y definición. Perfecto para un look urbano y actual.',
        matchFaceShape: 'Redondo, Diamante',
    },
    {
        id: '3',
        name: 'Afeitado Express',
        category: 'Barba',
        image: '/images/shave.png',
        description: 'Afeitado rápido pero preciso con toalla caliente. Para mantener una piel suave y libre de irritación.',
        matchFaceShape: 'Todos',
    },
    {
        id: '4',
        name: 'Diseño de Barba',
        category: 'Barba',
        image: '/images/beard-design.png',
        description: 'Perfilado y diseño de barba para resaltar tus facciones. Incluye hidratación.',
        matchFaceShape: 'Cuadrado, Rectangular',
    },
    {
        id: '5',
        name: 'Pigmento en Cabello',
        category: 'Tratamientos',
        image: '/images/hair-treatment.png',
        description: 'Cubrimiento de canas o realce de color con acabado natural. Rejuvenece tu estilo al instante.',
        matchFaceShape: 'Todos',
    },
    {
        id: '6',
        name: 'Corte Niño',
        category: 'Cortes',
        image: '/images/classic-cut.png',
        description: 'Estilos divertidos y cómodos para los más pequeños. Paciencia y dedicación garantizadas.',
        matchFaceShape: 'Todos',
    },
];

export default function EstilosPage() {
    return (
        <div className="min-h-screen bg-slate-950 px-4 py-8 md:px-8 md:py-12">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <header className="mb-12 text-center md:text-left">
                    <Link
                        href="/"
                        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-amber-500 hover:text-amber-400 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver al Inicio
                    </Link>
                    <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                        Nuestros <span className="text-amber-500">Estilos</span>
                    </h1>
                    <p className="mt-4 max-w-2xl text-lg text-slate-400">
                        Explora nuestro catálogo de cortes y servicios diseñados para resaltar tu personalidad.
                        Encuentra el estilo perfecto para tu tipo de rostro y cabello.
                    </p>
                </header>

                {/* Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {STYLES.map((style) => (
                        <div
                            key={style.id}
                            className="group relative overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-slate-800 transition-all hover:ring-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10"
                        >
                            {/* Image Container */}
                            <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-800">
                                {/* Fallback image logic is handled by Next.js Image component if configured, otherwise simple styling */}
                                <div className="absolute inset-0 flex items-center justify-center text-slate-600 bg-slate-800">
                                    {/* Placeholder content if image fails or is dummy */}
                                    <span className="sr-only">{style.name}</span>
                                </div>
                                {style.image && (
                                    <Image
                                        src={style.image}
                                        alt={style.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />
                            </div>

                            {/* Content */}
                            <div className="relative p-6">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-500">
                                        {style.category}
                                    </span>
                                    {style.matchFaceShape && (
                                        <span className="text-xs text-slate-400">
                                            Rostro: {style.matchFaceShape}
                                        </span>
                                    )}
                                </div>

                                <h3 className="mb-2 text-xl font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                                    {style.name}
                                </h3>
                                <p className="mb-6 text-sm leading-relaxed text-slate-400">
                                    {style.description}
                                </p>

                                <Link
                                    href="/#agenda"
                                    className="inline-flex w-full items-center justify-center rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 ring-1 ring-slate-700 transition-all hover:bg-amber-500 hover:text-slate-950 hover:ring-amber-500"
                                >
                                    Reservar este estilo
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
