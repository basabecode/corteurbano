# Skill: Test Operations & Quality Guard

## Contexto

Este skill permite al agente ejecutar la suite de pruebas de Corte Urbano utilizando `jest` y `playwright`.

## Comandos Rápidos

- **Unit:** `pnpm test:unit` (Validaciones, Utils, Mocks)
- **Integration:** `pnpm test:integration` (API + Supabase RLS)
- **E2E:** `pnpm test:e2e` (Flujos completos en navegador)
- **Coverage:** `pnpm test:coverage` (Verificar zonas sin testear)

## Protocolo de Decisión (Self-Correction)

1. **Antes de implementar:** El agente debe buscar tests existentes en `tests/` que cubran la funcionalidad a modificar.
2. **Durante la implementación:** Si se cambia un esquema de **Zod**, ejecutar inmediatamente `tests/unit/validation.test.ts`.
3. **Post-implementación:** - Si es un cambio visual/UI: Ejecutar `pnpm test:e2e --project=chromium`.
   - Si es un cambio en base de datos: Ejecutar `tests/integration/database/rls-policies.test.ts`.

## Reglas de Oro para el Agente

- **Isolation:** Si un test falla, no asumas que es culpa del test. Revisa primero si rompiste la lógica.
- **Side Effects:** Si creas datos en la DB de test, asegúrate de invocar `cleanupTestData()` al finalizar.
- **Headless Mode:** Siempre usa el modo headless en terminal a menos que se solicite `pnpm test:e2e:ui`.
