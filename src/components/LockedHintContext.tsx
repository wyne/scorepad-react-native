import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import * as Haptics from 'expo-haptics';
import { AccessibilityInfo } from 'react-native';

export const LOCKED_HINT_MESSAGE = 'Game is locked. Tap Final to unlock.';
const LOCKED_HINT_DURATION_MS = 2500;

type LockedHintContextType = {
    lockedHintVisible: boolean;
    showLockedHint: () => void;
    hideLockedHint: () => void;
};

const LockedHintContext = createContext<LockedHintContextType>({
    lockedHintVisible: false,
    showLockedHint: () => {},
    hideLockedHint: () => {},
});

/**
 * Tells someone who taps a score in a locked game why nothing happened, and
 * points them at the Final pill in the header, which opens the sheet to Unlock.
 */
export const LockedHintContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [lockedHintVisible, setLockedHintVisible] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimer = () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
    };

    const showLockedHint = useCallback(() => {
        clearTimer();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        AccessibilityInfo.announceForAccessibility(LOCKED_HINT_MESSAGE);
        setLockedHintVisible(true);
        timer.current = setTimeout(() => setLockedHintVisible(false), LOCKED_HINT_DURATION_MS);
    }, []);

    const hideLockedHint = useCallback(() => {
        clearTimer();
        setLockedHintVisible(false);
    }, []);

    useEffect(() => clearTimer, []);

    const value = useMemo(
        () => ({ lockedHintVisible, showLockedHint, hideLockedHint }),
        [lockedHintVisible, showLockedHint, hideLockedHint],
    );

    return (
        <LockedHintContext.Provider value={value}>
            {children}
        </LockedHintContext.Provider>
    );
};

export const useLockedHint = () => useContext(LockedHintContext);
