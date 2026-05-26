import { getAnalytics, getAppInstanceId, getSessionId, logEvent as firebaseLogEvent } from '@react-native-firebase/analytics';
import { Platform } from 'react-native';

import { logEvent } from './Analytics';
import logger from './Logger';

// Mock Firebase Analytics — uses manual mock at __mocks__/@react-native-firebase/analytics.js
jest.mock('@react-native-firebase/analytics');

// Mock Logger
jest.mock('./Logger', () => ({
  info: jest.fn(),
}));

// Mock Expo Application
jest.mock('expo-application', () => ({
  nativeApplicationVersion: '1.0.0',
}));

// Mock React Native Platform
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: '14.0',
  },
}));

describe('Analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAppInstanceId as jest.Mock).mockResolvedValue('test-app-instance-id');
    (getSessionId as jest.Mock).mockResolvedValue('test-session-id');
    (firebaseLogEvent as jest.Mock).mockResolvedValue(undefined);
    
    // Reset Platform to default state
    (Platform as unknown as { OS: string; Version: string | number }).OS = 'ios';
    (Platform as unknown as { OS: string; Version: string | number }).Version = '14.0';
  });

  describe('logEvent', () => {
    it('should log event with all required parameters', async () => {
      const eventName = 'test_event';
      const params = { customParam: 'customValue' };

      await logEvent(eventName, params);

      expect(getAnalytics).toHaveBeenCalled();
      expect(getAppInstanceId).toHaveBeenCalledWith(expect.anything());
      expect(getSessionId).toHaveBeenCalledWith(expect.anything());
      
      expect(firebaseLogEvent).toHaveBeenCalledWith(expect.anything(), eventName, {
        customParam: 'customValue',
        appInstanceId: 'test-app-instance-id',
        sessionId: 'test-session-id',
        os: 'ios',
        appVersion: '1.0.0',
        osVersion: '14.0',
      });
    });

    it('should log event without additional parameters', async () => {
      const eventName = 'simple_event';

      await logEvent(eventName);

      expect(firebaseLogEvent).toHaveBeenCalledWith(expect.anything(), eventName, {
        appInstanceId: 'test-app-instance-id',
        sessionId: 'test-session-id',
        os: 'ios',
        appVersion: '1.0.0',
        osVersion: '14.0',
      });
    });

    it('should log to console with logger', async () => {
      const eventName = 'console_test_event';
      const params = { testParam: 123 };

      await logEvent(eventName, params);

      expect(logger.info).toHaveBeenCalledWith(
        '\x1b[34m',
        'EVENT',
        eventName,
        JSON.stringify({
          testParam: 123,
          appInstanceId: 'test-app-instance-id',
          sessionId: 'test-session-id',
          os: 'ios',
          appVersion: '1.0.0',
          osVersion: '14.0',
        }, null, 2),
        '\x1b[0m'
      );
    });

    it('should handle empty parameters object', async () => {
      const eventName = 'empty_params_event';
      const params = {};

      await logEvent(eventName, params);

      expect(firebaseLogEvent).toHaveBeenCalledWith(expect.anything(), eventName, {
        appInstanceId: 'test-app-instance-id',
        sessionId: 'test-session-id',
        os: 'ios',
        appVersion: '1.0.0',
        osVersion: '14.0',
      });
    });

    it('should work with different platform values', async () => {
      // Test Android platform
      (Platform as unknown as { OS: string; Version: string | number }).OS = 'android';
      (Platform as unknown as { OS: string; Version: string | number }).Version = 30;

      const eventName = 'android_event';

      await logEvent(eventName);

      expect(firebaseLogEvent).toHaveBeenCalledWith(expect.anything(), eventName, {
        appInstanceId: 'test-app-instance-id',
        sessionId: 'test-session-id',
        os: 'android',
        appVersion: '1.0.0',
        osVersion: 30,
      });
    });

    it('should propagate Firebase Analytics errors', async () => {
      const error = new Error('Firebase error');
      (getAppInstanceId as jest.Mock).mockRejectedValue(error);

      const eventName = 'error_event';

      // Should not throw, but will reject
      await expect(logEvent(eventName)).rejects.toThrow('Firebase error');
    });

    it('should handle complex parameter types', async () => {
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

      await logEvent(eventName, params);

      expect(firebaseLogEvent).toHaveBeenCalledWith(expect.anything(), eventName, {
        ...params,
        appInstanceId: 'test-app-instance-id',
        sessionId: 'test-session-id',
        os: 'ios',
        appVersion: '1.0.0',
        osVersion: '14.0',
      });
    });

    it('should override system params if provided in custom params', async () => {
      const eventName = 'override_event';
      const params = {
        os: 'custom-os',
        appVersion: 'custom-version',
      };

      await logEvent(eventName, params);

      expect(firebaseLogEvent).toHaveBeenCalledWith(expect.anything(), eventName, {
        os: 'ios', // System value should override custom
        appVersion: '1.0.0', // System value should override custom
        appInstanceId: 'test-app-instance-id',
        sessionId: 'test-session-id',
        osVersion: '14.0',
      });
    });
  });
});
