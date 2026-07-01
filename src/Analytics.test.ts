import {
  getAnalytics,
  logEvent as firebaseLogEvent,
  setUserProperty as firebaseSetUserProperty,
} from '@react-native-firebase/analytics';

import { logEvent, logScreenView, setUserProperty } from './Analytics';
import logger from './Logger';

// The wrapper's runtime behavior (sanitization, logging) is event-agnostic, so these
// tests use a loosely-typed alias to exercise it with arbitrary names / param shapes.
// Real event/param typing is covered by the catalog (AnalyticsEvents.ts) at call sites.
const log = logEvent as unknown as (eventName: string, params?: Record<string, unknown>) => Promise<void>;

// Mock Firebase Analytics — uses manual mock at __mocks__/@react-native-firebase/analytics.ts
jest.mock('@react-native-firebase/analytics');

// Mock Logger
jest.mock('./Logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('Analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (firebaseLogEvent as jest.Mock).mockResolvedValue(undefined);
    (firebaseSetUserProperty as jest.Mock).mockResolvedValue(undefined);
  });

  describe('logEvent', () => {
    it('should log the event with exactly the params provided (no injected globals)', async () => {
      const eventName = 'test_event';
      const params = { customParam: 'customValue' };

      await log(eventName, params);

      expect(getAnalytics).toHaveBeenCalled();
      // GA4 auto-collects os / appVersion / sessionId / appInstanceId — we no longer
      // attach them, so the payload should be exactly the caller's params.
      expect(firebaseLogEvent).toHaveBeenCalledWith(expect.anything(), eventName, {
        customParam: 'customValue',
      });
    });

    it('should log an event with no params as an empty payload', async () => {
      const eventName = 'simple_event';

      await log(eventName);

      expect(firebaseLogEvent).toHaveBeenCalledWith(expect.anything(), eventName, {});
    });

    it('should log to console with logger', async () => {
      const eventName = 'console_test_event';
      const params = { testParam: 123 };

      await log(eventName, params);

      expect(logger.info).toHaveBeenCalledWith(
        '\x1b[34m',
        'EVENT',
        eventName,
        JSON.stringify({ testParam: 123 }, null, 2),
        '\x1b[0m'
      );
    });

    it('should handle empty parameters object', async () => {
      const eventName = 'empty_params_event';

      await log(eventName, {});

      expect(firebaseLogEvent).toHaveBeenCalledWith(expect.anything(), eventName, {});
    });

    it('should absorb and report Firebase Analytics errors', async () => {
      const error = new Error('Firebase error');
      (firebaseLogEvent as jest.Mock).mockRejectedValue(error);

      await expect(log('error_event')).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith(
        'ANALYTICS_ERROR',
        'event',
        'error_event',
        error
      );
    });

    it('should strip null and undefined parameter values', async () => {
      const eventName = 'complex_event';
      const params = {
        stringParam: 'test',
        numberParam: 42,
        booleanParam: true,
        arrayParam: [1, 2, 3],
        objectParam: { nested: 'value' },
        nullParam: null,
        undefinedParam: undefined,
      };

      await log(eventName, params);

      expect(firebaseLogEvent).toHaveBeenCalledWith(expect.anything(), eventName, {
        stringParam: 'test',
        numberParam: 42,
        booleanParam: true,
        arrayParam: [1, 2, 3],
        objectParam: { nested: 'value' },
      });
    });
  });

  it('absorbs screen-view failures', async () => {
    const error = new Error('Screen view failed');
    (firebaseLogEvent as jest.Mock).mockRejectedValue(error);

    await expect(logScreenView('Game')).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      'ANALYTICS_ERROR',
      'screen_view',
      'Game',
      error
    );
  });

  it('absorbs user-property failures', async () => {
    const error = new Error('User property failed');
    (firebaseSetUserProperty as jest.Mock).mockRejectedValue(error);

    await expect(setUserProperty('color_scheme', 'dark')).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      'ANALYTICS_ERROR',
      'user_property',
      'color_scheme',
      error
    );
  });
});
