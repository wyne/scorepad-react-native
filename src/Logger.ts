const isDebugMode = __DEV__;

export interface LogEntry {
    timestamp: number;
    level: 'log' | 'info' | 'warn' | 'error';
    args: unknown[];
}

const MAX_LOG_ENTRIES = 500;
const logBuffer: LogEntry[] = [];

const push = (level: LogEntry['level'], args: unknown[]) => {
    logBuffer.push({ timestamp: Date.now(), level, args });
    if (logBuffer.length > MAX_LOG_ENTRIES) {
        logBuffer.splice(0, logBuffer.length - MAX_LOG_ENTRIES);
    }
};

export const getLogs = (): readonly LogEntry[] => logBuffer;

export const clearLogs = () => {
    logBuffer.length = 0;
};

const origLog = console.log.bind(console);
const origInfo = console.info.bind(console);
const origWarn = console.warn.bind(console);
const origError = console.error.bind(console);

console.log = (...args: unknown[]) => {
    push('log', args);
    origLog(...args);
};

console.info = (...args: unknown[]) => {
    push('info', args);
    origInfo(...args);
};

console.warn = (...args: unknown[]) => {
    push('warn', args);
    origWarn(...args);
};

console.error = (...args: unknown[]) => {
    push('error', args);
    origError(...args);
};

const logger = {
    log: (...args: unknown[]) => {
        push('log', args);
        if (isDebugMode) {
            origLog(...args);
        }
    },
    info: (...args: unknown[]) => {
        push('info', args);
        if (isDebugMode) {
            origInfo(...args);
        }
    },
    warn: (...args: unknown[]) => {
        push('warn', args);
        if (isDebugMode) {
            origWarn(...args);
        }
    },
    error: (...args: unknown[]) => {
        push('error', args);
        origError(...args);
    },
};

export default logger;
