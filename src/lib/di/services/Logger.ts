/**
 * Logger Service Implementation
 * Production-grade logging with levels and formatting
 */

import { ILogger } from '../types';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  enableTimestamp?: boolean;
  enableColors?: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
};

const RESET_COLOR = '\x1b[0m';

export class Logger implements ILogger {
  private config: Required<LoggerConfig>;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level || 'info',
      prefix: config.prefix || '[LabIQ Health]',
      enableTimestamp: config.enableTimestamp ?? true,
      enableColors: config.enableColors ?? typeof window === 'undefined',
    };
  }

  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, error?: Error, ...args: any[]): void {
    this.log('error', message, ...args);
    if (error) {
      console.error(error.stack || error.message);
    }
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.level]) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message);
    const logFn = level === 'error' ? console.error :
                  level === 'warn' ? console.warn :
                  level === 'debug' ? console.debug :
                  console.log;

    logFn(formattedMessage, ...args);
  }

  private formatMessage(level: LogLevel, message: string): string {
    const parts: string[] = [];

    if (this.config.enableColors) {
      parts.push(LOG_COLORS[level]);
    }

    if (this.config.enableTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    parts.push(this.config.prefix);
    parts.push(`[${level.toUpperCase()}]`);
    parts.push(message);

    if (this.config.enableColors) {
      parts.push(RESET_COLOR);
    }

    return parts.join(' ');
  }

  /**
   * Create a child logger with additional prefix
   */
  child(prefix: string): Logger {
    return new Logger({
      ...this.config,
      prefix: `${this.config.prefix}[${prefix}]`,
    });
  }
}

// Default logger instance
export const defaultLogger = new Logger();
