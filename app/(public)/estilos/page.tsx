import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Catálogo de Estilos | Corte Urbano',
    description: 'Explora nuestros estilos de corte y tratamientos diseñados para ti.',
};

type StyleItem = {
    id: string;
    name: string;
    category: 'Cortes' | 'Barba' | 'Tratamientos' | 'Niños';
    image: string;
    description: string;
    matchFaceShape?: string;
};

const STYLES: StyleItem[] = [
    {
        id: 'low-fade',
        name: 'Low Fade',
        category: 'Cortes',
        image: '/images/styles/low-fade.png',
        description: 'Desvanecimiento sutil que comienza justo por encima de las orejas. Ideal para profesionales que buscan un look elegante, discreto y pulcro.',
        matchFaceShape: 'Versátil, Ovalado',
    },
    {
        id: 'mid-fade',
        name: 'Mid Fade',
        category: 'Cortes',
        image: '/images/styles/mid-fade.png',
        description: 'El equilibrio perfecto entre lo moderno y lo clásico. El desvanecimiento inicia en la zona media, aportando frescura sin ser extremo.',
        matchFaceShape: 'Versátil, Cuadrado',
    },
    {
        id: 'high-fade',
        name: 'High Fade',
        category: 'Cortes',
        image: '/images/styles/high-fade.png',
        description: 'Contraste marcado con laterales muy cortos desde la zona superior. Un estilo audaz, limpio y de alto impacto visual.',
        matchFaceShape: 'Ovalado, Alargado',
    },
    {
        id: 'french-crop',
        name: 'French Crop',
        category: 'Cortes',
        image: '/images/styles/french-crop.png',
        description: 'Texturizado en la parte superior con un flequillo corto y recto. Un estilo urbano, fácil de peinar y muy vanguardista.',
        matchFaceShape: 'Angular, Ovalado',
    },
    {
        id: 'mullet',
        name: 'Mullet Moderno',
        category: 'Cortes',
        image: '/images/styles/mullet.png',
        description: 'Corto en los laterales y frente, con longitud notable en la parte posterior. Un look rebelde y con mucha personalidad.',
        matchFaceShape: 'Ovalado, Corazón',
    },
    {
        id: 'bowl-cut',
        name: 'Corte Tazón (Bowl Cut)',
        category: 'Niños',
        image: '/images/styles/bowl-cut-boy.png',
        description: 'Un clásico retro renovado. Corte recto uniforme que enmarca el rostro. Ideal para niños con cabello liso.',
        matchFaceShape: 'Redondo, Ovalado',
    },
    {
        id: 'beard-express',
        name: 'Afeitado Express',
        category: 'Barba',
        image: '/images/shave.png',
        description: 'Afeitado rápido pero preciso con toalla caliente. Para mantener una piel suave y libre de irritación.',
        matchFaceShape: 'Todos',
    },
    {
        id: 'beard-design',
        name: 'Diseño de Barba',
        category: 'Barba',
        image: '/images/beard-design.png',
        description: 'Perfilado y diseño de barba para resaltar tus facciones. Incluye hidratación y aceites esenciales.',
        matchFaceShape: 'Cuadrado, Rectangular',
    },
    {
        id: 'pigmento',
        name: 'Pigmento en Cabello',
        category: 'Tratamientos',
        image: '/images/hair-treatment.png',
        description: 'Cubrimiento de canas o realce de color con acabado natural. Rejuvenece tu estilo al instante sin que se note artificial.',
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
