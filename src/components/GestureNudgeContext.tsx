import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { AccessibilityInfo } from 'react-native';

import { logEvent } from '../Analytics';

import { InteractionType } from './Interactions/InteractionType';

export const GESTURE_NUDGE_MESSAGES: Partial<Record<InteractionType, string>> = {
    [InteractionType.SwipeVertical]: 'Swipe up or down to change a score.',
    [InteractionType.Dial]: 'Turn the ring to change the score.',
};

const NUDGE_DURATION_MS = 2500;
/** A second miss within this window shows the nudge; one stray touch never does. */
export const MISS_WINDOW_MS = 8000;
/** Stop nudging after this many per app session. */
export const MAX_NUDGES_PER_SESSION = 3;

type GestureNudgeContextType = {
    nudgeMessage: string | null;
    /** Report a gesture that changed no score (e.g. a tap in swipe mode). */
    reportMiss: (type: InteractionType) => void;
    /** Report a gesture that scored, so a later miss starts a fresh count. */
    reportSuccess: () => void;
    hideNudge: () => void;
};

const GestureNudgeContext = createContext<GestureNudgeContextType>({
    nudgeMessage: null,
    reportMiss: () => {},
    reportSuccess: () => {},
    hideNudge: () => {},
});

/**
 * Explains a scoring gesture at the moment it goes wrong: two misses in a row
 * (a tap where a swipe was needed, a tap on the dial ring) show a one-line toast
 * like the locked-game hint. Capped per session so it never nags.
 */
export const GestureNudgeContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastMiss = useRef<{ type: InteractionType; at: number } | null>(null);
    const shownCount = useRef(0);

    const clearTimer = () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
    };

    const reportMiss = useCallback((type: InteractionType) => {
        const message = GESTURE_NUDGE_MESSAGES[type];
        if (!message) return;
        const now = Date.now();
        const previous = lastMiss.current;
        lastMiss.current = { type, at: now };
        if (!previous || previous.type !== type || now - previous.at > MISS_WINDOW_MS) return;
        if (shownCount.current >= MAX_NUDGES_PER_SESSION) return;

        shownCount.current += 1;
        lastMiss.current = null;
        clearTimer();
        AccessibilityInfo.announceForAccessibility(message);
        setNudgeMessage(message);
        logEvent('gesture_nudge', { interaction_type: type });
        timer.current = setTimeout(() => setNudgeMessage(null), NUDGE_DURATION_MS);
    }, []);

    const reportSuccess = useCallback(() => {
        lastMiss.current = null;
    }, []);

    const hideNudge = useCallback(() => {
        clearTimer();
        setNudgeMessage(null);
    }, []);

    useEffect(() => clearTimer, []);

    const value = useMemo(
        () => ({ nudgeMessage, reportMiss, reportSuccess, hideNudge }),
        [nudgeMessage, reportMiss, reportSuccess, hideNudge],
    );

    return (
        <GestureNudgeContext.Provider value={value}>
            {children}
        </GestureNudgeContext.Provider>
    );
};

export const useGestureNudge = () => useContext(GestureNudgeContext);
