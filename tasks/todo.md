# Tareas: Live Appointment Tracker (CORTEURBANO)

## Fase 1: Planificación y Contexto (Completado)
- [x] Corregir el enfoque del negocio: Pasar de "Reparación" a "Barbería / Citas".
- [x] Redactar `PRD-appointment-tracker.md` combinando estética Industrial-Utilitaria + Dark Luxury e incluyendo las skills de SEO, Dashboard Optimizer y Seguridad.
- [x] Recibir "GO" definitivo del usuario.

## Fase 2: Infraestructura y Base de Datos (Completado)
- [x] Auditar políticas RLS en la tabla `appointments` para acceso de lectura seguro desde el tracker. *(Se determinó que es más seguro y eficiente requerir que el usuario esté logueado, lo cual se integra naturalmente con Corte Urbano).*
- [x] Validar los tipos de estado (`pending`, `confirmed`, `completed`, `cancelled`) y sus interfaces de TypeScript.

## Fase 3: UI, Diseño & Performance (Completado)
- [x] Crear el layout/página del tracker (`app/(public)/tracker/[id]/page.tsx`).
- [x] Implementar `generateMetadata` para SEO (título dinámico "Estado de Cita #ID").
- [x] Diseñar `Skeleton Screens` para el estado de carga inicial.
- [x] Construir el `Stepper` con la estética *Industrial-Luxury* (Slate-950/Amber-500, fuentes monoespaciadas para IDs y horas).
- [x] Implementar animaciones de *staggered reveal* con Framer Motion en `TrackerClient.tsx`.

## Fase 4: Sincronización Realtime (Completado)
- [x] Conectar el componente con Supabase.
- [x] Suscribirse al canal Realtime de `appointments` para recibir actualizaciones y animar el stepper instantáneamente.
- [x] Se añadió Link en el Dashboard del cliente para acceder al Tracker.

## Fase 5: QA & Testing (Completado)
- [x] `tests/unit/appointment-tracker.test.ts` (y `lib/tracker-utils.ts`): Lógica comprobada exitosamente.
- [x] `tests/e2e/tracker.spec.ts`: Simula la navegación al tracker desde el dashboard.
- [x] Ejecutar linting completo del proyecto.

## Fase 6: Cierre y Documentación (Actual)
- [x] Anotar lecciones aprendidas en `tasks/lessons.md`.
- [ ] Listo para revisión final del usuario y despliegue.
