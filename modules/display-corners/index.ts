import { useEffect, useState } from 'react';

import { requireOptionalNativeModule } from 'expo';
import { useWindowDimensions } from 'react-native';

interface DisplayCornersModule {
    getDisplayCornerRadiusAsync(): Promise<number>;
}

const DisplayCorners = requireOptionalNativeModule<DisplayCornersModule>('DisplayCorners');

// Keyed by window size: the iPhone Duo's two displays have different corners,
// and the window changes size when the app moves between them.
const radii = new Map<string, Promise<number>>();
const settledRadii = new Map<string, number>();

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
 * OS can't report it (before iOS 26, Android, web).
 */
export const useDisplayCornerRadius = (): number => {
    const { width, height } = useWindowDimensions();
    const key = `${Math.round(Math.min(width, height))}x${Math.round(Math.max(width, height))}`;
    const [radius, setRadius] = useState(settledRadii.get(key) ?? 0);

    useEffect(() => {
        const settled = settledRadii.get(key);
        if (settled != null) {
            setRadius(settled);
            return;
        }
        let active = true;
        loadDisplayCornerRadius(key).then((value) => {
            if (active) setRadius(value);
        });
        return () => {
            active = false;
        };
    }, [key]);

    return radius;
};
