import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';

/**
 * Whether this build can draw Liquid Glass.
 *
 * False everywhere but an iOS 26 device running a binary compiled against the
 * iOS 26 SDK — so Android, web and older iOS all take a flat fallback. The
 * second check is for the iOS 26 betas that ship the design without the API
 * behind it, where touching `UIGlassEffect` crashes.
 *
 * Read once: neither answer can change while the app is running.
 */
export const LIQUID_GLASS = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
