import { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Layout, Easing } from 'react-native-reanimated';

export const animationDuration = 200;
export const enteringAnimation = ZoomIn.duration(animationDuration);
export const exitingAnimation = ZoomOut.duration(animationDuration);
export const layoutAnimation = Layout.easing(Easing.ease).duration(animationDuration);

import { withTiming } from 'react-native-reanimated';

export const calcFontSize = (maxWidth: number, length: number) => {
    const baseScale = Math.min(1 / length * 200, 100);
    let widthFactor: number = maxWidth / 200;

    if (Number.isNaN(widthFactor)) {
        widthFactor = 1;
    }

    return baseScale * widthFactor;
};

export const ZoomOutFadeOut = () => {
    'worklet';
    const animations = {
        transform: [{ scale: withTiming(0, { duration: animationDuration }) }],
        opacity: withTiming(0, { duration: animationDuration }),
    };
    const initialValues = {
        transform: [{ scale: 1 }],
        opacity: 1,
    };
    return {
        initialValues,
        animations,
    };
};
