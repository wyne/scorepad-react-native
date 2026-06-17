const { withAndroidStyles } = require('expo/config-plugins');

/**
 * expo-splash-screen always writes a `windowSplashScreenAnimatedIcon` item that
 * points at `@drawable/splashscreen_logo`, even when the splash config only sets
 * a `backgroundColor` (no image). With no icon image configured, that drawable is
 * never generated, so a clean Android prebuild fails resource linking with:
 *   error: resource drawable/splashscreen_logo not found
 *
 * We intentionally use a color-only native splash (the animated logo is handled in
 * JS by src/components/SplashOverlay.tsx), so this plugin strips the dangling icon
 * reference after expo-splash-screen runs. It MUST be listed AFTER
 * 'expo-splash-screen' in the plugins array so its withAndroidStyles mod runs last.
 */
module.exports = (config) =>
  withAndroidStyles(config, (config) => {
    const styles = config.modResults.resources.style ?? [];
    let removed = false;

    for (const style of styles) {
      if (!Array.isArray(style.item)) continue;
      const before = style.item.length;
      style.item = style.item.filter(
        ({ $ }) => $.name !== 'windowSplashScreenAnimatedIcon'
      );
      if (style.item.length !== before) removed = true;
    }

    if (!removed) {
      throw new Error(
        'withAndroidSplashNoIcon: did not find a windowSplashScreenAnimatedIcon item to remove. ' +
          'Ensure this plugin is listed after expo-splash-screen.'
      );
    }

    return config;
  });
