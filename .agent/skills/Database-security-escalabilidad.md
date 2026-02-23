---
name: supabase-master
description: Advanced database orchestration. Focuses on RLS, Database Functions (RPC), and Edge Functions.
---
# Database Architecture
- **RLS Audit**: Revisa que ninguna política de seguridad sea `true` por defecto.
- **Edge Functions**: Usa funciones de borde para tareas pesadas como el envío de correos o integración con APIs externas (Telegram).
- **Indexing**: Sugiere índices GIN para búsquedas de texto completo en las descripciones de las reparaciones.
