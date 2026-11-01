import { useEffect, useState } from 'react';

import { requireOptionalNativeModule } from 'expo';
import { Dimensions, useWindowDimensions } from 'react-native';

interface DisplayCornersModule {
    getDisplayCornerRadiusAsync(): Promise<number>;
}

const DisplayCorners = requireOptionalNativeModule<DisplayCornersModule>('DisplayCorners');

// Keyed by the display's size: the iPhone Duo's two displays have different
// corners. A device has only a display or two, so this stays small.
const radii = new Map<string, Promise<number>>();
const settledRadii = new Map<string, number>();

const sizeKey = (width: number, height: number) =>
    `${Math.round(Math.min(width, height))}x${Math.round(Math.max(width, height))}`;

const loadDisplayCornerRadius = (key: string): Promise<number> => {
    let radius = radii.get(key);
    if (radius == null) {
        radius = (DisplayCorners?.getDisplayCornerRadiusAsync() ?? Promise.resolve(0))
            .catch(() => 0)
            .then((value) => {
                settledRadii.set(key, value);
                return value;
            });
        radii.set(key, radius);
    }
    return radius;
};

/**
 * The corner radius of the display the app is on, in points, or 0 where the
 * OS can't report it (before iOS 26, Android, web) and while the app's window
 * doesn't fill the display (iPad Split View, Slide Over, Stage Manager), where
 * the window's corners aren't the display's.
 */
export const useDisplayCornerRadius = (): number => {
    // The window size re-renders this on a resize or a move between displays;
    // the display's size picks the radius.
    const window = useWindowDimensions();
    const screen = Dimensions.get('screen');
    const displayKey = sizeKey(screen.width, screen.height);
    const fillsDisplay = sizeKey(window.width, window.height) === displayKey;
    const [radius, setRadius] = useState(() => settledRadii.get(displayKey) ?? 0);

    useEffect(() => {
        const settled = settledRadii.get(displayKey);
        if (settled != null) {
            setRadius(settled);
            return;
        }
        let active = true;
        loadDisplayCornerRadius(displayKey).then((value) => {
            if (active) setRadius(value);
        });
        return () => {
            active = false;
        };
    }, [displayKey]);

    // Until a new display's radius arrives, use none rather than the old one.
    const current = settledRadii.get(displayKey) ?? radius;
    return fillsDisplay ? current : 0;
};
