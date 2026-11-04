import React, { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react';

import { InteractionType } from './Interactions/InteractionType';

type GestureHintContextType = {
    /** The gesture whose first-use toast was dismissed this app session. */
    dismissedFor: InteractionType | null;
    dismissHint: (type: InteractionType) => void;
};

const GestureHintContext = createContext<GestureHintContextType>({
    dismissedFor: null,
    dismissHint: () => {},
});

/**
 * Remembers, for the rest of the app session, that the first-use gesture toast
 * was dismissed. It lives above navigation so leaving and reopening a game
 * doesn't bring the toast back; switching gestures still does.
 */
export const GestureHintContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const [dismissedFor, dismissHint] = useState<InteractionType | null>(null);
    const value = useMemo(() => ({ dismissedFor, dismissHint }), [dismissedFor]);

    return (
        <GestureHintContext.Provider value={value}>
            {children}
        </GestureHintContext.Provider>
    );
};

export const useGestureHintDismissal = () => useContext(GestureHintContext);
