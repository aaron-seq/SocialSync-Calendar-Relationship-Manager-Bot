/**
 * Telemetry System for SocialSync
 * 
 * enhanced logging and performance tracking implementation.
 * Handles:
 * - API Latency tracking
 * - User Action logging
 * - Error reporting
 * - Feature usage analytics
 */

type TelemetryEvent = {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
};

type PerformanceMetric = {
  name: string;
  duration: number;
  properties?: Record<string, any>;
  timestamp: number;
};

class TelemetryService {
  private static instance: TelemetryService;
  private queue: TelemetryEvent[] = [];
  private isDev = import.meta.env.DEV;

  private constructor() {
    // Initialize send loop if needed for keeping alive
  }

  public static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  /**
   * Track a distinct user action or business event
   */
  public track(eventName: string, properties?: Record<string, any>) {
    const event: TelemetryEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
    };

    if (this.isDev) {
      console.groupCollapsed(`📊 Telemetry: ${eventName}`);
      console.log('Properties:', properties);
      console.log('Timestamp:', new Date(event.timestamp).toISOString());
      console.groupEnd();
    }

    // In a real app, you might batch send these to an analytics backend (PostHog, Mixpanel, etc.)
    // For now, we'll keep them in memory or log to console
    this.queue.push(event);
  }

  /**
   * Track latency or duration of an operation
   */
  public trackDuration(name: string, durationMs: number, properties?: Record<string, any>) {
    if (this.isDev) {
      const color = durationMs > 1000 ? 'red' : durationMs > 200 ? 'orange' : 'green';
      console.log(
        `%c⏱️ Performance: ${name} took ${durationMs.toFixed(2)}ms`,
        `color: ${color}; font-weight: bold;`
      );
    }
    
    this.track(`performance.${name}`, {
      ...properties,
      duration: durationMs,
      metricType: 'latency'
    });
  }

  /**
   * Helper to measure execution time of an async function
   */
  public async measure<T>(
    name: string, 
    fn: () => Promise<T>, 
    properties?: Record<string, any>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      this.trackDuration(name, performance.now() - start, { ...properties, status: 'success' });
      return result;
    } catch (error) {
      this.trackDuration(name, performance.now() - start, { ...properties, status: 'error' });
      throw error;
    }
  }

  /**
   * Log an error with context
   */
  public trackError(error: Error, context: string, properties?: Record<string, any>) {
    console.error(`🚨 Error in ${context}:`, error);
    
    this.track('error', {
      ...properties,
      context,
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }
}

export const telemetry = TelemetryService.getInstance();
