// Tipos compartidos para la aplicación pública

export type Service = {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
    image_url?: string | null;
};

export type AppointmentSlot = {
    start_time: string;
};

export type BookingStep = 1 | 2 | 3;

// Constantes compartidas
export const WORKING_HOURS = {
    start: 8,
    end: 20
} as const;

// Mapeo de imágenes mock para servicios
export const SERVICE_MOCK_IMAGES: Record<string, string> = {
    'Corte Básico': '/images/classic-cut.png',
    'Afeitado Express': '/images/shave.png',
    'Corte con Estilo': '/images/fade.png',
    'Corte + Barba': '/images/fade.png',
    'Corte Niño': '/images/classic-cut.png',
    'Diseño de Barba': '/images/beard-design.png',
    'Tratamiento Capilar': '/images/hair-treatment.png',
    'Corte + Barba + Bigote': '/images/fade.png',
    'Pigmento en Cabello': '/images/hair-treatment.png'
};

// Servicios mock de fallback
export const MOCK_SERVICES: Service[] = [
    {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Corte Básico',
        price: 50000,
        duration_minutes: 45,
        image_url: '/images/classic-cut.png'
    },
    {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Afeitado Express',
        price: 35000,
        duration_minutes: 40,
        image_url: '/images/shave.png'
    },
    {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Corte con Estilo',
        price: 60000,
        duration_minutes: 60,
        image_url: '/images/fade.png'
    },
    {
        id: '44444444-4444-4444-4444-444444444444',
        name: 'Pigmento en Cabello',
        price: 80000,
        duration_minutes: 60,
        image_url: '/images/hair-treatment.png'
    }
];

// Utilidad para scroll suave a un elemento
export function scrollToElement(elementId: string, block: ScrollLogicalPosition = 'start') {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block });
    }
}
