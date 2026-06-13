import * as Sentry from '@sentry/react-native';
import * as Application from 'expo-application';

// DSN is not a secret; it identifies the Sentry project for event ingestion.
// Presence of the DSN is the on/off switch: set EXPO_PUBLIC_SENTRY_DSN in EAS
// environment variables for builds, or in a local .env (gitignored) to test
// from a dev client. With no DSN, the SDK stays fully disabled.
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

// One Sentry project for all variants; the environment tag separates
// dev/preview/production events. Derived from the bundle id suffix
// (com.wyne.scorepad[.dev|.preview]) so no extra env plumbing is needed.
const appId = Application.applicationId ?? '';
const environment = __DEV__ || appId.endsWith('.dev')
    ? 'development'
    : appId.endsWith('.preview')
        ? 'preview'
        : 'production';

export const navigationIntegration = Sentry.reactNavigationIntegration({
    enableTimeToInitialDisplay: true,
});

Sentry.init({
    dsn: SENTRY_DSN,
    enabled: Boolean(SENTRY_DSN),
    environment,
    // Low event volume app: trace every session so slow/frozen frame and
    // screen-load regressions are visible per release.
    tracesSampleRate: 1.0,
    integrations: [navigationIntegration],
    enableNativeFramesTracking: true,
    // Release health: track session adoption/crash-free rate per version.
    enableAutoSessionTracking: true,
});

export default Sentry;
