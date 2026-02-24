import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

/**
 * 1. CARGA DE ENTORNO CRÍTICA
 * Forzamos la carga de .env.test para que los agentes nunca
 * contaminen la base de datos de desarrollo o producción.
 */
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') })

export default defineConfig({
  testDir: '../e2e',
  fullyParallel: true,
  /* Evita que el agente deje tests "skipped" en el CI */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Damos 1 reintento en local por si Next.js está compilando
  /* En CI usamos 1 worker para evitar colisiones en Supabase RLS */
  workers: process.env.CI ? 1 : undefined,

  /**
   * 2. REPORTERÍA PARA AGENTES
   * Añadimos 'list' para que el agente vea el progreso en la terminal.
   * El reporter 'html' se mantiene para tu revisión manual.
   */
  reporter: [['list'], ['html', { outputFolder: '../playwright-report' }]],

  use: {
    /* Prioridad a la URL del entorno de test */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure', // Útil para que el agente "vea" qué falló
  },

  /**
   * 3. PROYECTOS OPTIMIZADOS
   * Mantenemos Chromium como principal y Mobile para asegurar
   * que la app de Corte Urbano sea responsive.
   */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /**
   * 4. SERVIDOR WEB
   * Ajustado para esperar a que Next.js esté totalmente listo.
   */
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutos (Next.js 14 puede ser pesado en el arranque)
    stdout: 'ignore', // Cambiar a 'pipe' si necesitas que el agente debuguee el server
    stderr: 'pipe',
  },
})
