import {
    getAnalytics,
    logEvent as firebaseLogEvent,
    setUserProperty as firebaseSetUserProperty,
} from '@react-native-firebase/analytics';

import type { AnalyticsEventParams, AnalyticsUserProperty } from './AnalyticsEvents';
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

    try {
        await firebaseLogEvent(getAnalytics(), eventName, sanitized);
    } catch (error) {
        logger.error('ANALYTICS_ERROR', 'event', eventName, error);
    }
};

export const logScreenView = async (screenName: string): Promise<void> => {
    try {
        await firebaseLogEvent(getAnalytics(), 'screen_view', {
            screen_name: screenName,
            screen_class: screenName,
        });
    } catch (error) {
        logger.error('ANALYTICS_ERROR', 'screen_view', screenName, error);
    }
};

/**
 * Sets a GA4 user property — user-scoped state you can segment on directly
 * (vs. reconstructing it from a stream of events). Names are constrained to the
 * catalog (AnalyticsUserProperty). Pass null to clear.
 */
export const setUserProperty = async (
    name: AnalyticsUserProperty,
    value: string | null,
): Promise<void> => {
    logger.info(
        '\x1b[35m', // magenta
        'USER_PROPERTY',
        name,
        String(value),
        '\x1b[0m'
    );

    try {
        await firebaseSetUserProperty(getAnalytics(), name, value);
    } catch (error) {
        logger.error('ANALYTICS_ERROR', 'user_property', name, error);
    }
};
