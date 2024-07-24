import analytics from '@react-native-firebase/analytics';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

import logger from './Logger';

/**
 * Logs an event to Firebase Analytics with additional logging.
 * @param eventName The name of the event to log.
 * @param params The parameters of the event.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logEvent = async (eventName: string, params?: Record<string, any>) => {
    const appInstanceId = await analytics().getAppInstanceId();
    const sessionId = await analytics().getSessionId();
    const os = Platform.OS;
    const osVersion = Platform.Version;
    const appVersion = Application.nativeApplicationVersion;

    const fullParams = {
        ...params,
        appInstanceId,
        sessionId,
        os,
        appVersion,
        osVersion,
    };

    logger.info(
        '\x1b[34m', // Set the color to blue
        'EVENT',
        eventName,
        JSON.stringify(fullParams, null, 2),
        '\x1b[0m' // Reset the color
    );

    // Log the event to Firebase Analytics
    await analytics().logEvent(eventName, fullParams);
};
