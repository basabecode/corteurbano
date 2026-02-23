# PRD: Live Appointment Tracker (Seguimiento de Citas CORTEURBANO)

## 1. Contexto y Objetivo
El "Live Appointment Tracker" es el componente diseñado para que los clientes de **CORTEURBANO (BarberKing)** puedan seguir en tiempo real el estado de su reserva de corte de cabello. Aporta transparencia, mejora la experiencia premium y se integra perfectamente con el ecosistema de la barbería.

## 2. Requerimientos de Diseño de UI (Frontend Design & Dashboard Optimizer)
- **Estética "Industrial-Luxury" (Anti AI-slop):** Fusión entre la identidad "Dark Luxury" del proyecto (Slate-950, Amber-500) y la petición de una estética utilitaria y de "precisión técnica".
- **Tipografía Técnica:** Uso de tipografías monoespaciadas para los identificadores de la cita (ID de reserva, horarios) para denotar exclusividad y precisión en el corte.
- **Componente Stepper (Framer Motion):** Animación *staggered reveal* fluida. Los estados de la cita se iluminarán en tiempo real de forma mecánica.
- **UX Patterns (Dashboard Optimizer):**
  - **Skeleton Screens** simulando la estructura del tracker durante la carga inicial en lugar de spinners genéricos.
  - Diseño enfocado en optimismo en la UI y sincronización limpia.

## 3. Lógica de Datos y Backend (Supabase Master)
- **Fuente de Datos:** Tabla `appointments` en Supabase.
- **Flujo de Estados de Citas de Barbería:**
  1. **Pendiente:** Cita solicitada, esperando confirmación del barbero.
  2. **Confirmada:** El administrador/barbero ha aceptado la cita (vía Telegram o Dashboard).
  3. **En Servicio / Hoy:** (Estado derivado cuando la fecha es hoy y la hora se acerca).
  4. **Completada:** Corte finalizado.
- **Supabase Realtime:** Uso de canales en tiempo real para iluminar el stepper instantáneamente cuando el estado cambia de `pending` a `confirmed` o `completed`.
- **Database Architecture:**
  - Auditar políticas RLS para garantizar que solo el dueño de la cita (basado en Auth) o mediante un link público seguro (token/ID) pueda ver el estado.

## 4. Requerimientos SEO y Web Vitals (SEO Architect)
- **Metadata Dinámica:** Generación de título con `generateMetadata` (ej: "Estado de Cita #892 - CORTEURBANO").
- **HTML Semántico:** Uso de `<article aria-labelledby="tracker-title">` o `<section>` para que el stepper sea accesible.
- **Performance:** Carga priorizada (`priority`) de los elementos visuales clave con `next/image` si hay logos.

## 5. Requisitos de Calidad y Testing (Test Operations)
- **Unit Tests (Jest):** En `tests/unit/` para comprobar que la lógica de conversión de estados (ej. `pending` -> paso 1) es correcta.
- **E2E Tests (Playwright):** En `tests/e2e/tracker.spec.ts` para verificar la carga inicial, la presencia de los *Skeleton Screens* y el renderizado del stepper sin errores de hidratación.
