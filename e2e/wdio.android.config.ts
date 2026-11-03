export const config: WebdriverIO.Config = {
  runner: 'local',
  logLevel: 'warn',

  specs: ['./tests/android.smoke.test.ts'],

  capabilities: [
    {
      platformName: 'Android',
      'appium:automationName': 'UiAutomator2',
      'appium:deviceName': process.env.ANDROID_DEVICE_NAME ?? 'Android Emulator',
      'appium:udid': process.env.ANDROID_UDID ?? 'emulator-5554',
      'appium:appPackage': 'com.wyne.scorepad',
      'appium:appActivity': '.MainActivity',
      'appium:autoGrantPermissions': true,
      'appium:noReset': false,
      'appium:newCommandTimeout': 120,
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
