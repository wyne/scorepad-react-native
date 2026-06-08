const fs = require('fs');
const path = require('path');

const { withAppDelegate, withDangerousMod } = require('expo/config-plugins');

const withTouchVisualizerPod = (config) =>
  withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfilePath, 'utf8');

      if (!contents.includes('pod \'TouchVisualizer\'')) {
        const before = contents;
        contents = contents.replace(
          '  use_expo_modules!\n',
          '  use_expo_modules!\n  pod \'TouchVisualizer\', :configurations => [\'Debug\']\n'
        );
        if (contents === before) {
          throw new Error('withTouchVisualizer: could not find insertion point in Podfile (expected "  use_expo_modules!\\n")');
        }
        fs.writeFileSync(podfilePath, contents);
      }

      return config;
    },
  ]);

const withTouchVisualizerAppDelegate = (config) =>
  withAppDelegate(config, (config) => {
    let contents = config.modResults.contents;

    if (contents.includes('TouchVisualizer')) return config;

    const beforeImport = contents;
    contents = contents.replace(
      'import ReactAppDependencyProvider',
      'import ReactAppDependencyProvider\n#if DEBUG\nimport TouchVisualizer\n#endif'
    );
    if (contents === beforeImport) {
      throw new Error('withTouchVisualizer: could not find "import ReactAppDependencyProvider" in AppDelegate');
    }

    const beforeInit = contents;
    contents = contents.replace(
      'factory.startReactNative(',
      '#if DEBUG\n    var tvConfig = Configuration()\n    tvConfig.color = .systemGray\n    tvConfig.defaultSize = CGSize(width: 30.0, height: 30.0)\n    Visualizer.start(tvConfig)\n    #endif\n    factory.startReactNative('
    );
    if (contents === beforeInit) {
      throw new Error('withTouchVisualizer: could not find "factory.startReactNative(" in AppDelegate');
    }

    config.modResults.contents = contents;
    return config;
  });

module.exports = (config) =>
  withTouchVisualizerPod(withTouchVisualizerAppDelegate(config));
