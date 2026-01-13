/**
 * Structured Logger
 * 
 * Provides consistent logging across the application with:
 * - Log levels (debug, info, warn, error)
 * - Structured context for searchability
 * - Environment-aware output (console in dev, could send to service in prod)
 * 
 * Why structured logging:
 * - Enables filtering and searching in log aggregators
 * - Provides consistent format for debugging
 * - Separates telemetry intent from implementation
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

/**
 * Determine if we should log at the given level based on environment.
 * In production, we suppress debug logs.
 */
function shouldLog(level: LogLevel): boolean {
  const isDev = import.meta.env.DEV;
  
  if (level === 'debug' && !isDev) {
    return false;
  }
  
  return true;
}

/**
 * Format a log entry for console output.
 */
function formatLogEntry(entry: LogEntry): string {
  const contextStr = entry.context 
    ? ` ${JSON.stringify(entry.context)}`
    : '';
  
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}`;
}

/**
 * Core logging function.
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  if (!shouldLog(level)) {
    return;
  }
  
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };
  
  const formatted = formatLogEntry(entry);
  
  switch (level) {
    case 'debug':
      console.debug(formatted);
      break;
    case 'info':
      console.info(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      // In production, could send to error tracking service here
      break;
  }
}

/**
 * Logger interface for application-wide use.
 * 
 * Usage:
 * ```typescript
 * import { logger } from '@/lib/logger';
 * 
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Failed to fetch contacts', { error: err.message, stack: err.stack });
 * ```
 */
export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),
};

/**
 * Performance timing utility.
 * Use to measure operation duration for telemetry.
 * 
 * Usage:
 * ```typescript
 * const timer = startTimer('fetchContacts');
 * await fetchContacts();
 * timer.end(); // Logs: "fetchContacts completed in 123ms"
 * ```
 */
export function startTimer(operation: string) {
  const start = performance.now();
  
  return {
    end: () => {
      const duration = Math.round(performance.now() - start);
      logger.debug(`${operation} completed in ${duration}ms`, { operation, durationMs: duration });
      return duration;
    },
  };
}

/**
 * Wrap an async function with automatic error logging.
 * The error is re-thrown after logging.
 * 
 * Usage:
 * ```typescript
 * const safeFetch = withErrorLogging(fetchContacts, 'fetchContacts');
 * const result = await safeFetch();
 * ```
 */
export function withErrorLogging<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  operation: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      const err = error as Error;
      logger.error(`${operation} failed`, {
        error: err.message,
        stack: err.stack,
        args: args.length > 0 ? args : undefined,
      });
      throw error;
    }
  }) as T;
}
