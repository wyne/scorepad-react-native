import { useSyncExternalStore } from 'react';

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

/** The fold crossing the app's window right now, or null (see useFold). */
export const getFold = (): Fold | null => FoldFeatures?.getFold() ?? null;

/** Calls `listener` whenever the fold crossing the window changes. */
export const addFoldListener = (listener: (event: { fold: Fold | null }) => void): { remove: () => void } =>
    FoldFeatures?.addListener('foldChange', listener) ?? { remove: () => {} };

// One native listener and one cached value shared by every useFold caller, so
// they all see a fold change in the same commit.
let currentFold: Fold | null = getFold();
let subscription: { remove: () => void } | null = null;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    if (subscription == null) {
        currentFold = getFold();
        subscription = addFoldListener(({ fold }) => {
            currentFold = fold;
            listeners.forEach(notify => notify());
        });
    }
    return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
            subscription?.remove();
            subscription = null;
        }
    };
};

// The native module builds a new object on every call, so the snapshot is the
// cached value, refreshed when the first caller subscribes.
const getSnapshot = (): Fold | null => currentFold;

/**
 * The fold crossing the app's window, or null when there is none (no fold, the
 * window is on one side of it, or not Android).
 */
export const useFold = (): Fold | null => useSyncExternalStore(subscribe, getSnapshot, () => null);
