const isDebugMode = __DEV__;

const logger = {
    log: (...args: unknown[]) => {
        if (isDebugMode) {
            console.log(...args);
        }
    },
    info: (...args: unknown[]) => {
        if (isDebugMode) {
            console.info(...args);
        }
    },
    warn: (...args: unknown[]) => {
        if (isDebugMode) {
            console.warn(...args);
        }
    },
    error: (...args: unknown[]) => {
        console.error(...args); // Always log errors
    },
};

export default logger;
