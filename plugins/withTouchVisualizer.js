const { withAppDelegate, withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const withTouchVisualizerPod = (config) =>
  withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (!contents.includes("pod 'TouchVisualizer'")) {
        contents = contents.replace(
          '  use_expo_modules!\n',
          "  use_expo_modules!\n  pod 'TouchVisualizer', :configurations => ['Debug']\n"
        );
        fs.writeFileSync(podfilePath, contents);
      }

      return config;
    },
  ]);

const withTouchVisualizerAppDelegate = (config) =>
  withAppDelegate(config, (config) => {
    let contents = config.modResults.contents;

    if (contents.includes('TouchVisualizer')) return config;

    contents = contents.replace(
      'import ReactAppDependencyProvider',
      'import ReactAppDependencyProvider\n#if DEBUG\nimport TouchVisualizer\n#endif'
    );

    contents = contents.replace(
      'factory.startReactNative(',
      '#if DEBUG\n    var tvConfig = Configuration()\n    tvConfig.color = .systemGray\n    tvConfig.defaultSize = CGSize(width: 30.0, height: 30.0)\n    Visualizer.start(tvConfig)\n    #endif\n    factory.startReactNative('
    );

    config.modResults.contents = contents;
    return config;
  });

module.exports = (config) =>
  withTouchVisualizerPod(withTouchVisualizerAppDelegate(config));
