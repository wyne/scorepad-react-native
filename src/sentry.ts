import * as Sentry from '@sentry/react-native';

// DSN is not a secret; it identifies the Sentry project for event ingestion.
// Set EXPO_PUBLIC_SENTRY_DSN in EAS environment variables (or replace the
// fallback below) once the Sentry project is created. With no DSN, the SDK
// stays fully disabled.
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export const navigationIntegration = Sentry.reactNavigationIntegration({
    enableTimeToInitialDisplay: true,
});

Sentry.init({
    dsn: SENTRY_DSN,
    enabled: Boolean(SENTRY_DSN) && !__DEV__,
    // Low event volume app: trace every session so slow/frozen frame and
    // screen-load regressions are visible per release.
    tracesSampleRate: 1.0,
    integrations: [navigationIntegration],
    enableNativeFramesTracking: true,
    // Release health: track session adoption/crash-free rate per version.
    enableAutoSessionTracking: true,
});

export default Sentry;
