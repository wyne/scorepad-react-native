import { getAnalytics, getAppInstanceId, getSessionId, logEvent as firebaseLogEvent } from '@react-native-firebase/analytics';
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
    if (process.env.EXPO_PUBLIC_FIREBASE_ANALYTICS == 'false') {
        logger.info('\x1b[34m', 'EVENT', eventName, JSON.stringify(params ?? {}, null, 2), '\x1b[0m');
        return;
    }

    const analytics = getAnalytics();
    const appInstanceId = await getAppInstanceId(analytics);
    const sessionId = await getSessionId(analytics);
    const os = Platform.OS;
    const osVersion = Platform.Version;
    const appVersion = Application.nativeApplicationVersion;

    const fullParams = Object.fromEntries(
        Object.entries({
            ...params,
            appInstanceId,
            sessionId,
            os,
            appVersion,
            osVersion,
        }).filter(([, v]) => v != null && v !== undefined),
    );

    logger.info(
        '\x1b[34m',
        'EVENT',
        eventName,
        JSON.stringify(fullParams, null, 2),
        '\x1b[0m'
    );

    await firebaseLogEvent(analytics, eventName, fullParams);
};
