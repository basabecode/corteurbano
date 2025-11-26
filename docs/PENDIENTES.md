# 📋 Lista de Pendientes - BarberKing

Este documento lista las tareas pendientes y mejoras futuras para el proyecto BarberKing.

## 🔴 Crítico - Antes de Producción

### 1. Configuración de Variables de Entorno
- [ ] Crear archivo `.env.local` basado en `.env.example`
- [ ] Obtener credenciales de Supabase:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Configurar bot de Telegram:
  - [ ] Crear bot con @BotFather
  - [ ] Obtener `TELEGRAM_BOT_TOKEN`
  - [ ] Obtener `TELEGRAM_ADMIN_CHAT_ID` usando @userinfobot
- [ ] Configurar webhook de Telegram apuntando a `/api/telegram-webhook`

### 2. Base de Datos
- [ ] Ejecutar el script SQL completo en Supabase (ver `docs/SETUP_DATABASE.md`)
- [ ] Crear datos iniciales (servicios de ejemplo)
- [ ] Verificar que las políticas RLS funcionan correctamente
- [ ] Crear perfil de admin manualmente en la tabla `profiles`

### 3. Autenticación
- [ ] Configurar Google OAuth en Supabase Dashboard
- [ ] Probar flujo completo de registro/login
- [ ] Implementar verificación de email (si se requiere)
- [ ] Crear trigger en Supabase para crear perfil automáticamente al registrarse

## 🟡 Importante - Funcionalidades Core

### 4. Gestión de Citas
- [ ] Implementar cancelación de citas por parte del cliente
- [ ] Agregar notificaciones push/email cuando se confirma una cita
- [ ] Implementar recordatorios automáticos (24h antes)
- [ ] Agregar validación de solapamiento de horarios

### 5. Dashboard Admin
- [ ] Implementar vista de calendario con todas las citas
- [ ] Agregar filtros por fecha/estado
- [ ] Implementar edición de citas (cambiar hora/servicio)
- [ ] Agregar estadísticas avanzadas (ingresos por mes, servicios más populares)
- [ ] Exportar reportes a PDF/Excel

### 6. Dashboard Cliente
- [ ] Mostrar historial completo de citas
- [ ] Permitir re-agendar citas futuras
- [ ] Agregar sistema de valoraciones/reseñas
- [ ] Implementar favoritos de servicios

## 🟢 Mejoras - UX/UI

### 7. Interfaz de Usuario
- [ ] Agregar animaciones y transiciones suaves
- [ ] Implementar modo oscuro/claro (toggle)
- [ ] Optimizar para móviles (responsive completo)
- [ ] Agregar loading skeletons
- [ ] Implementar toast notifications (reemplazar alerts)

### 8. Imágenes y Assets
- [ ] Reemplazar placeholder del Hero con imagen real de alta calidad
- [ ] Agregar imágenes para cada servicio
- [ ] Optimizar imágenes con Next.js Image
- [ ] Crear favicon y meta tags para SEO

### 9. Accesibilidad
- [ ] Agregar ARIA labels
- [ ] Mejorar contraste de colores
- [ ] Implementar navegación por teclado
- [ ] Agregar soporte para lectores de pantalla

## 🔵 Opcional - Features Avanzadas

### 10. Integración con Telegram
- [ ] Permitir que clientes se registren vía Telegram
- [ ] Implementar comandos del bot (/start, /mis_citas, /cancelar)
- [ ] Agregar notificaciones bidireccionales (cliente ↔ admin)
- [ ] Crear panel de administración dentro de Telegram

### 11. Pagos
- [ ] Integrar Stripe/PayPal para pagos online
- [ ] Implementar sistema de depósitos
- [ ] Agregar facturación automática
- [ ] Historial de pagos en dashboard

### 12. MCP (Model Context Protocol)
- [ ] Configurar herramientas MCP para interacción con BD
- [ ] Implementar queries seguras mediante MCP
- [ ] Documentar uso de MCP para el agente

### 13. Analytics y Monitoreo
- [ ] Integrar Google Analytics
- [ ] Agregar Sentry para error tracking
- [ ] Implementar métricas de rendimiento
- [ ] Dashboard de analytics para admin

### 14. Multi-tenancy
- [ ] Soporte para múltiples barberías
- [ ] Sistema de roles más granular (barbero, recepcionista, admin)
- [ ] Asignación de barberos a citas específicas

## 🛠️ Técnico - Optimizaciones

### 15. Performance
- [ ] Implementar caching de servicios
- [ ] Optimizar queries de base de datos
- [ ] Agregar paginación en listas largas
- [ ] Implementar ISR (Incremental Static Regeneration) donde aplique

### 16. Testing
- [ ] Escribir tests unitarios (Jest/Vitest)
- [ ] Tests de integración para API routes
- [ ] Tests E2E con Playwright
- [ ] Tests de componentes con Testing Library

### 17. Seguridad
- [ ] Implementar rate limiting en API routes
- [ ] Agregar CSRF protection
- [ ] Validar y sanitizar todas las entradas
- [ ] Auditoría de seguridad

### 18. DevOps
- [ ] Configurar CI/CD (GitHub Actions)
- [ ] Setup de staging environment
- [ ] Configurar dominio personalizado
- [ ] SSL/HTTPS configuration
- [ ] Backup automático de base de datos

## 📝 Documentación

### 19. Documentación Técnica
- [ ] Documentar arquitectura del proyecto
- [ ] Crear diagramas de flujo
- [ ] Documentar API endpoints
- [ ] Guía de contribución

### 20. Documentación de Usuario
- [ ] Manual de usuario para clientes
- [ ] Manual de administración
- [ ] Video tutoriales
- [ ] FAQ

---

**Última actualización:** Noviembre 2024

**Nota:** Prioriza las tareas marcadas como 🔴 Crítico antes de desplegar a producción.




