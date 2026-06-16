// Local copy of expo-ios-scene-lifecycle-plugin with revised patching strategy.
// The upstream plugin matched the entire #if os(iOS) ... #endif block as one unit,
// which breaks when other plugins (Firebase, TouchVisualizer) inject code between
// `window = UIWindow(...)` and `factory.startReactNative(...)`.
// Instead, we target each line individually and wrap them in if #unavailable(iOS 13.0).
// Ref: https://github.com/expo/expo/issues/46664
const { withAppDelegate, withInfoPlist } = require('@expo/config-plugins');

const sceneConfigurationMethod = `  public func application(
    _ application: UIApplication,
    configurationForConnecting connectingSceneSession: UISceneSession,
    options: UIScene.ConnectionOptions
  ) -> UISceneConfiguration {
    let configuration = UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    configuration.delegateClass = SceneDelegate.self
    return configuration
  }
`;

const sceneDelegateClass = `class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else {
      return
    }

    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate,
      let factory = appDelegate.reactNativeFactory else {
      return
    }

    let nextWindow = UIWindow(windowScene: windowScene)
    window = nextWindow
    appDelegate.window = nextWindow

    factory.startReactNative(
      withModuleName: "main",
      in: nextWindow,
      launchOptions: nil)

    if !connectionOptions.urlContexts.isEmpty {
      self.scene(scene, openURLContexts: connectionOptions.urlContexts)
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let urlContext = URLContexts.first,
      let appDelegate = UIApplication.shared.delegate as? AppDelegate else {
      return
    }

    var options: [UIApplication.OpenURLOptionsKey: Any] = [
      .openInPlace: urlContext.options.openInPlace,
    ]

    if let sourceApplication = urlContext.options.sourceApplication {
      options[.sourceApplication] = sourceApplication
    }

    if let annotation = urlContext.options.annotation {
      options[.annotation] = annotation
    }

    _ = appDelegate.application(UIApplication.shared, open: urlContext.url, options: options)
  }
}
`;

function addInfoPlistSceneManifest(config) {
  return withInfoPlist(config, (nextConfig) => {
    nextConfig.modResults.UIApplicationSceneManifest = {
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

    return nextConfig;
  });
}

function patchAppDelegate(contents) {
  if (contents.includes('class SceneDelegate: UIResponder, UIWindowSceneDelegate')) {
    return contents;
  }

  let nextContents = contents;

  // Wrap the window creation line — capture only horizontal whitespace (spaces/tabs)
  // so the preceding newline isn't included and we don't get spurious blank lines.
  const windowPattern = /([ \t]+)window = UIWindow\(frame: UIScreen\.main\.bounds\)/;
  if (!windowPattern.test(nextContents)) {
    throw new Error(
      'Could not find "window = UIWindow(frame: UIScreen.main.bounds)" to patch for UIScene lifecycle.'
    );
  }
  nextContents = nextContents.replace(windowPattern, (_, ws) =>
    `${ws}if #unavailable(iOS 13.0) {\n${ws}  window = UIWindow(frame: UIScreen.main.bounds)\n${ws}}`
  );

  // Wrap the factory.startReactNative call — capture only horizontal whitespace.
  const factoryPattern =
    /([ \t]+)factory\.startReactNative\(\n[ \t]+withModuleName: "main",\n[ \t]+in: window,\n[ \t]+launchOptions: launchOptions\)/;
  if (!factoryPattern.test(nextContents)) {
    throw new Error(
      'Could not find "factory.startReactNative(...)" block to patch for UIScene lifecycle.'
    );
  }
  nextContents = nextContents.replace(factoryPattern, (_, ws) =>
    `${ws}if #unavailable(iOS 13.0) {\n${ws}  factory.startReactNative(\n${ws}    withModuleName: "main",\n${ws}    in: window,\n${ws}    launchOptions: launchOptions)\n${ws}}`
  );

  // Insert the scene configuration method before the Linking API section.
  if (!nextContents.includes('configurationForConnecting connectingSceneSession')) {
    const linkingMarker = '\n  // Linking API';
    if (!nextContents.includes(linkingMarker)) {
      throw new Error('Could not find the AppDelegate linking section to insert the UIScene configuration method.');
    }
    nextContents = nextContents.replace(linkingMarker, `\n${sceneConfigurationMethod}\n  // Linking API`);
  }

  // Insert the SceneDelegate class before ReactNativeDelegate.
  const reactNativeDelegateMarker = '\nclass ReactNativeDelegate: ExpoReactNativeFactoryDelegate';
  if (!nextContents.includes(reactNativeDelegateMarker)) {
    throw new Error('Could not find ReactNativeDelegate to insert SceneDelegate.');
  }

  return nextContents.replace(reactNativeDelegateMarker, `\n${sceneDelegateClass}${reactNativeDelegateMarker}`);
}

function addAppDelegateSceneLifecycle(config) {
  return withAppDelegate(config, (nextConfig) => {
    if (nextConfig.modResults.language !== 'swift') {
      throw new Error(
        `Cannot apply iOS scene lifecycle plugin to ${nextConfig.modResults.language} AppDelegate. Swift is required.`
      );
    }

    nextConfig.modResults.contents = patchAppDelegate(nextConfig.modResults.contents);
    return nextConfig;
  });
}

module.exports = function withIosSceneLifecycle(config) {
  return addAppDelegateSceneLifecycle(addInfoPlistSceneManifest(config));
};
