import { useEffect, useState } from 'react';

import { requireOptionalNativeModule, type EventSubscription } from 'expo';

/** The fold crossing the app's window, as Android's window manager reports it. */
export interface Fold {
    /** Which way the fold line runs across the window. */
    orientation: 'vertical' | 'horizontal';
    state: 'halfOpened' | 'flat';
    /** Where the fold is, in points relative to the window. */
    bounds: { x: number; y: number; width: number; height: number };
}

interface FoldFeaturesModule {
    getFold(): Fold | null;
    addListener(event: 'foldChange', listener: (event: { fold: Fold | null }) => void): EventSubscription;
}

// Android only: iOS has no API for the fold's position yet.
const FoldFeatures = requireOptionalNativeModule<FoldFeaturesModule>('FoldFeatures');

/**
 * The fold crossing the app's window, or null when there is none (no fold, the
 * window is on one side of it, or not Android).
 */
export const useFold = (): Fold | null => {
    const [fold, setFold] = useState(() => FoldFeatures?.getFold() ?? null);

    useEffect(() => {
        if (FoldFeatures == null) return;
        // The fold can change between the first render and the subscription.
        setFold(FoldFeatures.getFold());
        const subscription = FoldFeatures.addListener('foldChange', (event) => setFold(event.fold));
        return () => subscription.remove();
    }, []);

    return fold;
};
