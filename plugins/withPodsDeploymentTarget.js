// Raises any CocoaPods target whose IPHONEOS_DEPLOYMENT_TARGET is below 15.0.
// Xcode 27 beta requires a minimum of 15.0 across all targets, but many third-party
// pods still ship with older minimums (9.0, 12.x, 13.x), causing archive failures.
//
// Also patches expo-modules-jsi Swift source for Swift 6.2 / Xcode 27 compatibility:
// `weak let runtime` is no longer valid in Swift 6.2 — must be `nonisolated(unsafe) weak var`.
// Ref: https://github.com/expo/expo/issues/46242
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MIN_TARGET = '15.0';

const deploymentTargetFix = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        if config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < ${MIN_TARGET}
          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${MIN_TARGET}'
        end
      end
    end
`;

// Patches weak let → nonisolated(unsafe) weak var across expo-modules-jsi Swift sources.
// The xcframework build runs after pod install, reading from ${PODS_ROOT}/ExpoModulesJSI/,
// so patching here is sufficient.
const expoModulesJSIFix = `
    jsi_sources = Dir.glob(File.join(installer.sandbox.root, 'ExpoModulesJSI', '**', '*.swift'))
    jsi_sources.each do |file|
      content = File.read(file)
      modified = content.gsub(/\\bweak let /, 'nonisolated(unsafe) weak var ')
      File.write(file, modified) if modified != content
    end
`;

module.exports = function withPodsDeploymentTarget(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      const marker = '  post_install do |installer|\n    react_native_post_install(';
      if (!podfile.includes(marker)) {
        throw new Error(
          'withPodsDeploymentTarget: Could not find post_install block in Podfile to inject fixes.'
        );
      }

      podfile = podfile.replace(
        marker,
        `  post_install do |installer|${deploymentTargetFix}${expoModulesJSIFix}    react_native_post_install(`
      );

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
};
