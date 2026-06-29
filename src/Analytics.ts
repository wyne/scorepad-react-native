import { getAnalytics, logEvent as firebaseLogEvent } from '@react-native-firebase/analytics';

import logger from './Logger';

/**
 * Logs an event to Firebase Analytics with additional logging.
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logEvent = async (eventName: string, params?: Record<string, any>) => {
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
