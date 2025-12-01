/**
 * Logger utility that automatically handles console output based on environment
 * In production, all console.log statements are disabled
 * In development, all logging is enabled
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  log(...args: any[]): void {
    if (this.isDevelopment) {
      console.log(...args);
    }
  }

  warn(...args: any[]): void {
    if (this.isDevelopment) {
      console.warn(...args);
    }
  }

  error(...args: any[]): void {
    // Always log errors, even in production
    console.error(...args);
  }

  info(...args: any[]): void {
    if (this.isDevelopment) {
      console.info(...args);
    }
  }

  debug(...args: any[]): void {
    if (this.isDevelopment) {
      console.debug(...args);
    }
  }

  // Method to conditionally log based on custom conditions
  conditional(condition: boolean, ...args: any[]): void {
    if (this.isDevelopment && condition) {
      console.log(...args);
    }
  }

  // Method to log API requests/responses
  api(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[API] ${message}`, data || '');
    }
  }

  // Method to log component lifecycle events
  component(componentName: string, event: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[${componentName}] ${event}`, data || '');
    }
  }
}

// Export a singleton instance
export const logger = new Logger();

// Export individual methods for convenience
export const { log, warn, error, info, debug, conditional, api, component } = logger;
