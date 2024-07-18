import analytics from '@react-native-firebase/analytics';

import logger from './Logger';

/**
 * Logs an event to Firebase Analytics with additional logging.
 * @param eventName The name of the event to log.
 * @param params The parameters of the event.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logEvent = async (eventName: string, params?: Record<string, any>) => {
    // Additional logging logic here (e.g., console.log for debugging)
    logger.log(`Logging event: ${eventName}`, params);

    // Log the event to Firebase Analytics
    await analytics().logEvent(eventName, params);
};
