export const config: WebdriverIO.Config = {
  runner: 'local',
  logLevel: 'warn',

  specs: ['./tests/**/*.test.ts'],

  capabilities: [
    {
      platformName: 'iOS',
      'appium:platformVersion': '26.5',
      'appium:deviceName': 'iPhone 17 Pro',
      'appium:udid': 'D94A02E7-4640-4351-9364-E8CC10D9C222',
      'appium:automationName': 'XCUITest',
      'appium:bundleId': 'com.wyne.scorepad',
      'appium:newCommandTimeout': 240,
      'appium:noReset': true,
      'appium:simulatorTracePointer': true,
    },
    {
      platformName: 'iOS',
      'appium:platformVersion': '26.5',
      'appium:deviceName': 'iPhone 17 Pro Max',
      'appium:udid': 'F13A9725-1162-4594-8847-84161EBC9E42',
      'appium:automationName': 'XCUITest',
      'appium:bundleId': 'com.wyne.scorepad',
      'appium:newCommandTimeout': 240,
      'appium:noReset': true,
      'appium:simulatorTracePointer': true,
    },
    {
      platformName: 'iOS',
      'appium:platformVersion': '26.5',
      'appium:deviceName': 'iPhone 17e',
      'appium:udid': '6A09F3D2-ED46-4F8C-95AF-A8F6A5E9F614',
      'appium:automationName': 'XCUITest',
      'appium:bundleId': 'com.wyne.scorepad',
      'appium:newCommandTimeout': 240,
      'appium:noReset': true,
      'appium:simulatorTracePointer': true,
    },
    {
      platformName: 'iOS',
      'appium:platformVersion': '26.5',
      'appium:deviceName': 'iPad Pro 13-inch (M5)',
      'appium:udid': '196BBCBC-2FF0-48EE-846C-D3B1DE58F493',
      'appium:automationName': 'XCUITest',
      'appium:bundleId': 'com.wyne.scorepad',
      'appium:newCommandTimeout': 240,
      'appium:noReset': true,
      'appium:simulatorTracePointer': true,
    },
  ],

  services: [
    [
      'appium',
      {
        command: 'appium',
        args: {
          relaxedSecurity: true,
        },
      },
    ],
  ],

  framework: 'mocha',
  reporters: ['spec'],

  mochaOpts: {
    ui: 'bdd',
    timeout: 120000,
  },
};
