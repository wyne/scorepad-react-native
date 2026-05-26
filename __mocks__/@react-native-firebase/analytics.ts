const mockGetAnalytics = jest.fn(() => ({}));
const mockGetAppInstanceId = jest.fn();
const mockGetSessionId = jest.fn();
const mockLogEvent = jest.fn();

export { mockGetAnalytics, mockGetAppInstanceId, mockGetSessionId, mockLogEvent };

export const getAnalytics = mockGetAnalytics;
export const getAppInstanceId = mockGetAppInstanceId;
export const getSessionId = mockGetSessionId;
export const logEvent = mockLogEvent;
