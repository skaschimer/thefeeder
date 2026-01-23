/**
 * Structured logging utility
 * Provides consistent log formatting across the application
 */

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

export interface LogContext {
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private minLevel: LogLevel;
  private isProduction: boolean;
  private readonly MAX_MESSAGE_LENGTH = 500;
  private readonly MAX_STACK_LINES = 3;

  constructor() {
    // Set minimum log level from environment
    const envLevel = process.env.LOG_LEVEL?.toLowerCase() || "error";
    this.minLevel = this.parseLogLevel(envLevel);
    this.isProduction = process.env.NODE_ENV === "production";
    
    // In production, force ERROR level minimum if not already set
    if (this.isProduction && this.minLevel === LogLevel.DEBUG) {
      this.minLevel = LogLevel.ERROR;
    }
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level) {
      case "debug":
        return LogLevel.DEBUG;
      case "info":
        return LogLevel.INFO;
      case "warn":
        return LogLevel.WARN;
      case "error":
        return LogLevel.ERROR;
      default:
        return LogLevel.ERROR;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    // Never log DEBUG in production
    if (this.isProduction && level === LogLevel.DEBUG) {
      return false;
    }
    
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private truncateMessage(message: string): string {
    if (message.length <= this.MAX_MESSAGE_LENGTH) {
      return message;
    }
    return message.substring(0, this.MAX_MESSAGE_LENGTH) + "... [truncated]";
  }

  private truncateStack(stack?: string): string | undefined {
    if (!stack) return undefined;
    
    if (this.isProduction) {
      // In production, limit to first 3 lines of stack
      const lines = stack.split('\n').slice(0, this.MAX_STACK_LINES + 1);
      return lines.join('\n');
    }
    
    return stack;
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry;
    
    // Truncate message
    const truncatedMessage = this.truncateMessage(message);
    let logLine = `[${timestamp}] [${level.toUpperCase()}] ${truncatedMessage}`;
    
    // In production, skip context to reduce log size
    if (!this.isProduction && context && Object.keys(context).length > 0) {
      const contextStr = JSON.stringify(context);
      // Limit context size too
      const truncatedContext = contextStr.length > 200 
        ? contextStr.substring(0, 200) + "... [truncated]" 
        : contextStr;
      logLine += ` ${truncatedContext}`;
    }
    
    if (error) {
      logLine += ` Error: ${error.name}: ${this.truncateMessage(error.message)}`;
      if (error.stack && level === LogLevel.ERROR) {
        const truncatedStack = this.truncateStack(error.stack);
        if (truncatedStack) {
          logLine += `\n${truncatedStack}`;
        }
      }
    }
    
    return logLine;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
    };

    const formatted = this.formatLog(entry);

    // Output to console with appropriate method
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log(LogLevel.ERROR, message, context, error);
  }
}

// Export singleton instance
export const logger = new Logger();

