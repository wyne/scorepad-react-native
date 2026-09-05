const fs = require('fs');
const path = require('path');

const {
  IOSConfig,
  withAppDelegate,
  withDangerousMod,
  withInfoPlist,
  withXcodeProject,
} = require('expo/config-plugins');

const SCENE_DELEGATE_FILE = 'SceneDelegate.swift';
const SCENE_DELEGATE_CONTENT = `import React
import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene,
          let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let reactNativeFactory = appDelegate.reactNativeFactory else {
      return
    }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window

    reactNativeFactory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: nil
    )
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    URLContexts.forEach { context in
      RCTLinkingManager.application(
        UIApplication.shared,
        open: context.url,
        options: [:]
      )
    }
  }

  func scene(
    _ scene: UIScene,
    continue userActivity: NSUserActivity
  ) {
    RCTLinkingManager.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
  }
}
`;

const withSceneManifest = (config) =>
  withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    };

    return config;
  });

const withSceneDelegateFile = (config) =>
  withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectName = IOSConfig.XcodeUtils.getProjectName(
        config.modRequest.projectRoot
      );
      const sceneDelegatePath = path.join(
        config.modRequest.platformProjectRoot,
        projectName,
        SCENE_DELEGATE_FILE
      );

      fs.writeFileSync(sceneDelegatePath, SCENE_DELEGATE_CONTENT);

      return config;
    },
  ]);

const withSceneDelegateProjectFile = (config) =>
  withXcodeProject(config, (config) => {
    const project = config.modResults;
    const projectName = IOSConfig.XcodeUtils.getProjectName(
      config.modRequest.projectRoot
    );
    const sceneDelegateProjectPath = `${projectName}/${SCENE_DELEGATE_FILE}`;
    const appGroup = project.findPBXGroupKey({ name: projectName });

    if (!project.hasFile(sceneDelegateProjectPath)) {
      project.addSourceFile(sceneDelegateProjectPath, undefined, appGroup);
    }

    return config;
  });

const withSceneAppDelegate = (config) =>
  withAppDelegate(config, (config) => {
    let contents = config.modResults.contents;

    if (!contents.includes('configurationForConnecting connectingSceneSession')) {
      const insertion = `

  public func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    let configuration = UISceneConfiguration(
      name: "Default Configuration",
      sessionRole: connectingSceneSession.role
    )
    configuration.delegateClass = SceneDelegate.self
    return configuration
  }`;

      const beforeLinkingApi = contents;
      contents = contents.replace('\n\n  // Linking API', `${insertion}\n\n  // Linking API`);
      if (contents === beforeLinkingApi) {
        throw new Error(
          'withIosSceneLifecycle: could not find AppDelegate insertion point'
        );
      }
    }

    const startBlock = `    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)`;

    if (contents.includes(startBlock)) {
      contents = contents.replace(startBlock, '');
    }

    const windowLine = '    window = UIWindow(frame: UIScreen.main.bounds)\n';
    if (contents.includes(windowLine)) {
      contents = contents.replace(windowLine, '');
    }

    config.modResults.contents = contents;
    return config;
  });

module.exports = (config) =>
  withSceneManifest(
    withSceneDelegateProjectFile(
      withSceneDelegateFile(withSceneAppDelegate(config))
    )
  );
