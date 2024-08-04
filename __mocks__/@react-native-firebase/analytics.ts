const mockedLogEvent = jest.fn();
export default () => ({
    __esModule: true,
    logEvent: mockedLogEvent,
    getAppInstanceId: jest.fn(),
    getSessionId: jest.fn(),
});
