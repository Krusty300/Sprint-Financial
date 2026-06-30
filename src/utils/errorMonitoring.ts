/**
 * Enhanced error monitoring and logging system for settings operations
 */

export interface ErrorLog {
  id: string;
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  code?: string;
  context?: any;
  stack?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface MonitoringConfig {
  enableConsoleLogging: boolean;
  enableLocalStorage: boolean;
  maxLogEntries: number;
  retentionDays: number;
  enablePerformanceMonitoring: boolean;
  enableUserTracking: boolean;
}

class ErrorMonitoringSystem {
  private config: MonitoringConfig;
  private logs: ErrorLog[] = [];
  private sessionId: string;
  private performanceMetrics: Map<string, number[]> = new Map();

  constructor(config: Partial<MonitoringConfig> = {}) {
    this.config = {
      enableConsoleLogging: true,
      enableLocalStorage: true,
      maxLogEntries: 1000,
      retentionDays: 30,
      enablePerformanceMonitoring: true,
      enableUserTracking: false,
      ...config
    };

    this.sessionId = this.generateSessionId();
    if (typeof window !== 'undefined') {
      this.loadLogsFromStorage();
      this.setupGlobalErrorHandlers();
      this.cleanupOldLogs();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers(): void {
    // Catch unhandled errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.log({
          level: 'error',
          category: 'global',
          message: event.message,
          context: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error?.stack
          },
          stack: event.error?.stack
        });
      });

      // Catch unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.log({
          level: 'error',
          category: 'promise',
          message: event.reason?.message || 'Unhandled promise rejection',
          context: { reason: event.reason },
          stack: event.reason?.stack
        });
      });
    }
  }

  log(entry: Omit<ErrorLog, 'id' | 'timestamp' | 'sessionId' | 'resolved'>): void {
    const logEntry: ErrorLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      sessionId: this.sessionId,
      resolved: false,
      ...entry
    };

    // Add browser context
    if (typeof window !== 'undefined') {
      logEntry.userAgent = navigator.userAgent;
      logEntry.url = window.location.href;
    }

    this.logs.push(logEntry);

    // Console logging
    if (this.config.enableConsoleLogging) {
      this.logToConsole(logEntry);
    }

    // Local storage
    if (this.config.enableLocalStorage) {
      this.saveLogsToStorage();
    }

    // Cleanup if exceeded max entries
    if (this.logs.length > this.config.maxLogEntries) {
      this.logs = this.logs.slice(-this.config.maxLogEntries);
    }

    // Trigger error monitoring hooks
    this.triggerErrorHooks(logEntry);
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logToConsole(log: ErrorLog): void {
    const consoleMethod = log.level === 'error' ? 'error' : 
                        log.level === 'warn' ? 'warn' : 
                        log.level === 'info' ? 'info' : 'debug';

    const logData = {
      id: log.id,
      category: log.category,
      message: log.message,
      context: log.context,
      timestamp: log.timestamp.toISOString()
    };

    console[consoleMethod](`[SettingsMonitor] ${log.category}:`, logData);
  }

  private saveLogsToStorage(): void {
    try {
      if (typeof window === 'undefined') return;
      const storageKey = 'finance-tracker-error-logs';
      localStorage.setItem(storageKey, JSON.stringify(this.logs));
    } catch (error) {
      console.warn('Failed to save logs to localStorage:', error);
    }
  }

  private loadLogsFromStorage(): void {
    try {
      if (typeof window === 'undefined') return;
      const storageKey = 'finance-tracker-error-logs';
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedLogs = JSON.parse(stored);
        this.logs = parsedLogs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
          resolvedAt: log.resolvedAt ? new Date(log.resolvedAt) : undefined
        }));
      }
    } catch (error) {
      console.warn('Failed to load logs from localStorage:', error);
    }
  }

  private cleanupOldLogs(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    this.logs = this.logs.filter(log => log.timestamp > cutoffDate);
    this.saveLogsToStorage();
  }

  private triggerErrorHooks(log: ErrorLog): void {
    // Performance monitoring for critical errors
    if (log.level === 'error' && this.config.enablePerformanceMonitoring) {
      this.recordPerformanceMetric('error_rate', 1);
    }

    // Could trigger external monitoring services here
    // For example: send to analytics service, error tracking service, etc.
  }

  // Performance monitoring
  startPerformanceTimer(operation: string): () => void {
    if (!this.config.enablePerformanceMonitoring) {
      return () => {};
    }

    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.recordPerformanceMetric(operation, duration);
    };
  }

  private recordPerformanceMetric(operation: string, value: number): void {
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, []);
    }

    const metrics = this.performanceMetrics.get(operation)!;
    metrics.push(value);

    // Keep only last 100 measurements per operation
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  getPerformanceMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    this.performanceMetrics.forEach((values, operation) => {
      if (values.length === 0) return;

      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      result[operation] = { avg, min, max, count: values.length };
    });

    return result;
  }

  // Query methods
  getLogs(filters?: {
    level?: ErrorLog['level'];
    category?: string;
    resolved?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): ErrorLog[] {
    let filteredLogs = [...this.logs];

    if (filters) {
      if (filters.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filters.level);
      }
      if (filters.category) {
        filteredLogs = filteredLogs.filter(log => log.category === filters.category);
      }
      if (filters.resolved !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.resolved === filters.resolved);
      }
      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
      }
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getErrorStatistics(): {
    total: number;
    byLevel: Record<string, number>;
    byCategory: Record<string, number>;
    resolved: number;
    unresolved: number;
    recent: ErrorLog[];
  } {
    const byLevel: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let resolved = 0;
    let unresolved = 0;

    this.logs.forEach(log => {
      byLevel[log.level] = (byLevel[log.level] || 0) + 1;
      byCategory[log.category] = (byCategory[log.category] || 0) + 1;
      
      if (log.resolved) {
        resolved++;
      } else {
        unresolved++;
      }
    });

    return {
      total: this.logs.length,
      byLevel,
      byCategory,
      resolved,
      unresolved,
      recent: this.logs.slice(-10)
    };
  }

  // Resolution management
  resolveLog(logId: string, resolvedBy?: string): boolean {
    const log = this.logs.find(l => l.id === logId);
    if (log) {
      log.resolved = true;
      log.resolvedAt = new Date();
      log.resolvedBy = resolvedBy;
      this.saveLogsToStorage();
      return true;
    }
    return false;
  }

  // Export functionality
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    const logs = this.getLogs();
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else {
      const headers = ['id', 'timestamp', 'level', 'category', 'message', 'code', 'resolved', 'resolvedAt'];
      const csvRows = logs.map(log => [
        log.id,
        log.timestamp.toISOString(),
        log.level,
        log.category,
        `"${log.message.replace(/"/g, '""')}"`,
        log.code || '',
        log.resolved,
        log.resolvedAt?.toISOString() || ''
      ]);
      
      return [headers, ...csvRows].map(row => row.join(',')).join('\n');
    }
  }

  // Clear functionality
  clearLogs(): void {
    this.logs = [];
    this.performanceMetrics.clear();
    this.saveLogsToStorage();
  }

  // Configuration updates
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): MonitoringConfig {
    return { ...this.config };
  }
}

// Singleton instance
export const errorMonitor = new ErrorMonitoringSystem();

// Convenience methods for common logging patterns
export const logSettingsError = (category: string, message: string, context?: any, code?: string) => {
  errorMonitor.log({
    level: 'error',
    category,
    message,
    context,
    code
  });
};

export const logSettingsWarning = (category: string, message: string, context?: any, code?: string) => {
  errorMonitor.log({
    level: 'warn',
    category,
    message,
    context,
    code
  });
};

export const logSettingsInfo = (category: string, message: string, context?: any) => {
  errorMonitor.log({
    level: 'info',
    category,
    message,
    context
  });
};

export const withPerformanceMonitoring = <T extends (...args: any[]) => any>(
  operation: string,
  fn: T
): T => {
  return ((...args: any[]) => {
    const endTimer = errorMonitor.startPerformanceTimer(operation);
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        return result.finally(() => endTimer());
      } else {
        endTimer();
        return result;
      }
    } catch (error) {
      endTimer();
      logSettingsError('performance', `Operation ${operation} failed`, { error });
      throw error;
    }
  }) as T;
};
