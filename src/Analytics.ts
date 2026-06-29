import { getAnalytics, logEvent as firebaseLogEvent } from '@react-native-firebase/analytics';

import type { AnalyticsEventParams } from './AnalyticsEvents';
import logger from './Logger';

/**
 * Logs an event to Firebase Analytics with additional logging.
 *
 * Events and their params are defined in the typed catalog (AnalyticsEvents.ts).
 * A wrong event name or a mistyped/camelCase param key is a compile error.
 *
 * Note: we intentionally do NOT attach os / osVersion / appVersion / sessionId /
 * appInstanceId here. GA4 already auto-collects equivalents on every event
 * (platform, device.operating_system_version, app_info.version, ga_session_id,
 * user_pseudo_id), so stamping them again only duplicated first-class columns and
 * cost two native bridge calls (getAppInstanceId/getSessionId) per event.
 *
 * @param eventName The name of the event to log.
 * @param params The parameters of the event.
 */
export const logEvent = async <K extends keyof AnalyticsEventParams>(
    eventName: K,
    params?: AnalyticsEventParams[K],
): Promise<void> => {
    const analytics = getAnalytics();

    const sanitized = Object.fromEntries(
        Object.entries({ ...params }).filter(
            ([, v]) => v != null && v !== undefined,
        ),
    );

    logger.info(
        '\x1b[34m', // Set the color to blue
        'EVENT',
        eventName,
        JSON.stringify(sanitized, null, 2),
        '\x1b[0m' // Reset the color
    );

    // Log the event to Firebase Analytics
    await firebaseLogEvent(analytics, eventName, sanitized);
};
