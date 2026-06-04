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
      'appium:bundleId': 'com.wyne.scorepad.dev',
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
