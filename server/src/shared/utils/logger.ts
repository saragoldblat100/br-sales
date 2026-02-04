import { isDevelopment } from '@/config/env';

/**
 * Log levels
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Simple logger utility
 * In production, you might want to use Winston or Pino
 */
class Logger {
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.context}]`;

    if (data) {
      return `${prefix} ${message} ${JSON.stringify(data)}`;
    }

    return `${prefix} ${message}`;
  }

  /**
   * Debug level - only in development
   */
  debug(message: string, data?: unknown): void {
    if (isDevelopment) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }

  /**
   * Info level
   */
  info(message: string, data?: unknown): void {
    console.info(this.formatMessage('info', message, data));
  }

  /**
   * Warning level
   */
  warn(message: string, data?: unknown): void {
    console.warn(this.formatMessage('warn', message, data));
  }

  /**
   * Error level
   */
  error(message: string, error?: unknown): void {
    const errorData = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error;

    console.error(this.formatMessage('error', message, errorData));
  }

  /**
   * Create a child logger with a new context
   */
  child(context: string): Logger {
    return new Logger(`${this.context}:${context}`);
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a logger with specific context
 */
export const createLogger = (context: string): Logger => new Logger(context);
