/**
 * Next.js instrumentation hook
 * This runs before the application starts and allows us to configure Node.js settings
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { logger } = await import('./src/lib/logger');
    // Configure timezone from environment variable
    const timezone = process.env.TZ || 'America/Sao_Paulo';
    
    // Set TZ environment variable for Node.js
    process.env.TZ = timezone;
    
    // Log timezone configuration
    logger.info(`Timezone configured: ${timezone}`);
    
    // Verify timezone is set correctly
    const testDate = new Date();
    const tzString = Intl.DateTimeFormat().resolvedOptions().timeZone;
    logger.info(`Node.js timezone: ${tzString}, current time: ${testDate.toLocaleString('pt-BR', { timeZone: timezone })}`);
    
    // Initialize Redis in background so server can start listening immediately.
    // Cache/rate-limit already degrade when Redis is unavailable.
    void import('./src/lib/cache').then(({ initializeRedis }) =>
      initializeRedis()
        .then((ok) => { if (ok) logger.info('Redis initialized successfully'); else logger.warn('Redis initialization failed - cache will be disabled'); })
        .catch((err) => logger.error('Failed to initialize Redis', err instanceof Error ? err : new Error(String(err))))
    );
  }
}

