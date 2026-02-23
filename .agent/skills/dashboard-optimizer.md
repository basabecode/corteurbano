---
name: dashboard-optimizer
description: Specialized in high-performance React dashboards and real-time.
---
# Dashboard Performance
- **Skeleton Screens**: Crea estados de carga que imiten la estructura del tracker.
- **Optimistic UI**: Si el técnico actualiza un estado, la UI debe cambiar instantáneamente antes de confirmar con Supabase.
- **Data Strategy**: Prioriza el uso de `React Query` o `SWR` para caché y optimismo en la UI (Optimistic Updates).
- **UX Patterns**: Implementa "Skeleton Screens" en lugar de spinners de carga genéricos.
- **Supabase Realtime**: Usa canales específicos para actualizar el dashboard de técnicos sin refrescar la página cuando entra una nueva orden.
