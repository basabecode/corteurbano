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
        id: 'skin-fade',
        name: 'Skin Fade Pulido',
        category: 'Cortes',
        image: '/images/styles/skin-fade.jpg',
        description: 'Degradado total desde la piel, ideal para un look limpio y definido.',
        matchFaceShape: 'Ovalado, Cuadrado',
    },
    {
        id: 'textured-crop',
        name: 'Textured Crop',
        category: 'Cortes',
        image: '/images/styles/custom-crop.png',
        description: 'Flequillo corto con textura arriba; moderno, juvenil y fácil de peinar.',
        matchFaceShape: 'Versátil, Angular',
    },
    {
        id: 'modern-mullet',
        name: 'Modern Mullet',
        category: 'Cortes',
        image: '/images/styles/mullet%20moderno.jpg',
        description: 'El regreso del clásico: corto a los lados y largo en la nuca con flow urbano.',
        matchFaceShape: 'Ovalado, Corazón',
    },
    {
        id: 'buzz-cut',
        name: 'Buzz Cut (Rapado)',
        category: 'Cortes',
        image: '/images/styles/imgi_166_Buzz_Cut_Degradado.png',
        description: 'Estilo minimalista y rudo. Bajo mantenimiento, máximo impacto.',
        matchFaceShape: 'Cuadrado, Ovalado',
    },
    {
        id: 'burst-fade',
        name: 'Burst Fade',
        category: 'Cortes',
        image: '/images/styles/burst%20fade.jpg',
        description: 'El desvanecido rodea la oreja en forma de semicírculo. Ideal para tipos audaces.',
        matchFaceShape: 'Redondo, Ovalado',
    },
    {
        id: 'pompadour-moderno',
        name: 'Pompadour Moderno',
        category: 'Cortes',
        image: '/images/styles/pompadour%20moderno.jpg',
        description: 'Volumen alto en la parte superior peinado hacia atrás con acabado mate.',
        matchFaceShape: 'Redondo, Ovalado',
    },
    {
        id: 'wolf-cut',
        name: 'Wolf Cut Masculino',
        category: 'Cortes',
        image: '/images/styles/imgi_116_Wolf-Cut-Masculino-2.jpg',
        description: 'Capas desordenadas y rebeldes. Perfecto para cabello ondulado o largo.',
        matchFaceShape: 'Alargado, Redondo',
    },
    {
        id: 'taper-fade',
        name: 'Taper Fade Clásico',
        category: 'Cortes',
        image: '/images/styles/taper-fade.png',
        description: 'Un degradado sutil solo en patillas y nuca. Elegancia discreta.',
        matchFaceShape: 'Todos',
    },
    {
        id: 'french-crop-v2',
        name: 'French Crop',
        category: 'Cortes',
        image: '/images/styles/french-crop.png',
        description: 'Similar al Textured Crop pero con un flequillo más recto y definido.',
        matchFaceShape: 'Angular, Ovalado',
    },
    {
        id: 'slick-back',
        name: 'Slick Back (Efecto Mojado)',
        category: 'Cortes',
        image: '/images/styles/Corte-De-Cabello-Masculino-Slicked-Back.jpg',
        description: 'Peinado hacia atrás con brillo. El look "Old Money" del 2026.',
        matchFaceShape: 'Ovalado, Cuadrado',
    },
    {
        id: 'mohicano-urbano',
        name: 'Mohicano Urbano',
        category: 'Cortes',
        image: '/images/styles/mohicano%20urbano.png',
        description: 'Cresta central con laterales degradados. Estilo de futbolistas y rockeros.',
        matchFaceShape: 'Redondo, Cuadrado',
    },
    {
        id: 'curtain-bangs',
        name: 'Curtain Bangs (Librillo)',
        category: 'Cortes',
        image: '/images/styles/Curtain-bangs-masculino-1.png',
        description: 'Partidura al medio con caída natural. Muy popular en la Gen Z.',
        matchFaceShape: 'Corazón, Alargado',
    },
    {
        id: 'high-top-curly',
        name: 'High Top Curly',
        category: 'Cortes',
        image: '/images/styles/high-top-curly.jpg',
        description: 'Laterales muy cortos y rizos con altura. Resalta la textura natural.',
        matchFaceShape: 'Redondo, Cuadrado',
    },
    {
        id: 'bro-flow',
        name: 'Bro Flow',
        category: 'Cortes',
        image: '/images/styles/Bro-Flow-Image.png',
        description: 'Cabello de largo medio peinado hacia atrás de forma relajada.',
        matchFaceShape: 'Ovalado, Cuadrado',
    },
    {
        id: 'corte-cesar',
        name: 'Corte César',
        category: 'Cortes',
        image: '/images/styles/cortes-de-pelo-para-hombre-joven-cesar.png',
        description: 'Flequillo corto y horizontal. Un clásico que nunca falla para rostros cuadrados.',
        matchFaceShape: 'Cuadrado, Diamante',
    },
    {
        id: 'side-part',
        name: 'Side Part Fade',
        category: 'Cortes',
        image: '/images/styles/Corte-De-Cabello-Masculino-Side-Part-Fade.jpg',
        description: 'La raya a un lado marcada con navaja para una simetría perfecta.',
        matchFaceShape: 'Todos',
    },
    {
        id: 'militar-crew-cut',
        name: 'Militar (Crew Cut)',
        category: 'Cortes',
        image: '/images/styles/militar-cut.png',
        description: 'Corto arriba, más corto a los lados. Práctico y muy masculino.',
        matchFaceShape: 'Cuadrado, Redondo',
    },
    {
        id: 'shaggy-masculino',
        name: 'Shaggy Masculino',
        category: 'Cortes',
        image: '/images/styles/shaggy_masculino.png',
        description: 'Muchas capas y mucho movimiento. Para un estilo artístico y libre.',
        matchFaceShape: 'Alargado, Angular',
    },
    {
        id: 'top-knot',
        name: 'Top Knot (Moño)',
        category: 'Cortes',
        image: '/images/styles/top-knot.png',
        description: 'Laterales rapados y el largo recogido arriba. Estilo samurái urbano.',
        matchFaceShape: 'Ovalado, Diamante',
    },
    {
        id: 'induction-buzz',
        name: 'Induction Buzz',
        category: 'Cortes',
        image: '/images/styles/induction-buzz.png',
        description: 'El rapado más extremo (#0). Resalta los rasgos faciales al máximo.',
        matchFaceShape: 'Cuadrado, Ovalado',
    }
];

export default function EstilosPage() {
    return (
        <div className="min-h-screen bg-slate-950 px-4 py-8 md:px-8 md:py-12">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <header className="mb-12 text-center md:text-left">
                    <Link
                        href="/"
                        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-yellow-500 hover:text-yellow-400 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver al Inicio
                    </Link>
                    <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                        Nuestros <span className="text-yellow-500">Estilos</span>
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
                            className="group relative overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-slate-800 transition-all hover:ring-yellow-500/50 hover:shadow-2xl hover:shadow-yellow-500/10"
                        >
                            {/* Image Container */}
                            <div className="relative aspect-square sm:aspect-[4/5] w-full overflow-hidden bg-slate-800/50 p-4">
                                {/* Fallback image logic is handled by Next.js Image component if configured, otherwise simple styling */}
                                <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                                    {/* Placeholder content if image fails or is dummy */}
                                    <span className="sr-only">{style.name}</span>
                                </div>
                                {style.image && (
                                    <div className="relative h-full w-full">
                                        <Image
                                            src={style.image}
                                            alt={style.name}
                                            fill
                                            className="object-contain object-center drop-shadow-xl transition-transform duration-500 group-hover:scale-105"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    </div>
                                )}
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60" />
                            </div>

                            {/* Content */}
                            <div className="relative p-6">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-500">
                                        {style.category}
                                    </span>
                                    {style.matchFaceShape && (
                                        <span className="text-xs text-slate-400">
                                            Rostro: {style.matchFaceShape}
                                        </span>
                                    )}
                                </div>

                                <h3 className="mb-2 text-xl font-bold text-slate-100 group-hover:text-yellow-400 transition-colors">
                                    {style.name}
                                </h3>
                                <p className="mb-6 text-sm leading-relaxed text-slate-400">
                                    {style.description}
                                </p>

                                <Link
                                    href="/#agenda"
                                    className="inline-flex w-full items-center justify-center rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 ring-1 ring-slate-700 transition-all hover:bg-yellow-500 hover:text-slate-950 hover:ring-yellow-500"
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
