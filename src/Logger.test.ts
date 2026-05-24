// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleInfo = jest.spyOn(console, 'info').mockImplementation();
const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

// Mock __DEV__ global 
const mockDev = jest.fn();
Object.defineProperty(global, '__DEV__', {
  get: () => mockDev(),
  configurable: true,
});

describe('Logger', () => {
  let logger: typeof import('./Logger').default;

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear module cache to get fresh logger instance
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
      logger = require('./Logger').default;
  });

  describe('when in development mode (__DEV__ = true)', () => {
    beforeEach(() => {
      mockDev.mockReturnValue(true);
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      logger = require('./Logger').default;
    });

    it('should log messages with log()', () => {
      logger.log('test message', 123, { key: 'value' });
      expect(mockConsoleLog).toHaveBeenCalledWith('test message', 123, { key: 'value' });
    });

    it('should log info messages with info()', () => {
      logger.info('info message', 'additional data');
      expect(mockConsoleInfo).toHaveBeenCalledWith('info message', 'additional data');
    });

    it('should log warning messages with warn()', () => {
      logger.warn('warning message');
      expect(mockConsoleWarn).toHaveBeenCalledWith('warning message');
    });

    it('should log error messages with error()', () => {
      logger.error('error message', new Error('test error'));
      expect(mockConsoleError).toHaveBeenCalledWith('error message', new Error('test error'));
    });
  });

  describe('when in production mode (__DEV__ = false)', () => {
    beforeEach(() => {
      mockDev.mockReturnValue(false);
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      logger = require('./Logger').default;
    });

    it('should not log messages with log() in production', () => {
      logger.log('test message');
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('should not log info messages with info() in production', () => {
      logger.info('info message');
      expect(mockConsoleInfo).not.toHaveBeenCalled();
    });

    it('should not log warning messages with warn() in production', () => {
      logger.warn('warning message');
      expect(mockConsoleWarn).not.toHaveBeenCalled();
    });

    it('should always log error messages with error() even in production', () => {
      logger.error('error message');
      expect(mockConsoleError).toHaveBeenCalledWith('error message');
    });
  });

  describe('argument handling', () => {
    beforeEach(() => {
      mockDev.mockReturnValue(true);
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      logger = require('./Logger').default;
    });

    it('should handle no arguments', () => {
      logger.log();
      expect(mockConsoleLog).toHaveBeenCalledWith();
    });

    it('should handle multiple arguments of different types', () => {
      const obj = { test: true };
      const arr = [1, 2, 3];
      logger.log('string', 42, obj, arr, null, undefined);
      expect(mockConsoleLog).toHaveBeenCalledWith('string', 42, obj, arr, null, undefined);
    });
  });
});

