import { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Layout, Easing } from 'react-native-reanimated';

export const animationDuration = 200;
export const enteringAnimation = ZoomIn.duration(animationDuration);
export const exitingAnimation = ZoomOut.duration(animationDuration);
export const layoutAnimation = Layout.easing(Easing.ease).duration(animationDuration);

import { withTiming } from 'react-native-reanimated';

export const calcPlayerFontSize = (maxWidth: number, length: number) => {
    // console.log("maxWidth", maxWidth);
    // console.log("length", length);

    const baseScale = Math.min(1 / length * 200, 100);
    let widthFactor: number = maxWidth / 200;
    if (Number.isNaN(widthFactor)) {
        widthFactor = 1;
    }

    // console.log("widthfactor", widthFactor);

    return baseScale * widthFactor;

    if (length <= 3) {
        return 200;
    } else if (length <= 4) {
        return 200;
    } else if (length <= 5) {
        return 200;
    } else if (length <= 6) {
        return 200;
    } else if (length <= 7) {
        return 200;
    } else if (length <= 8) {
        return 120;
    } else if (length <= 8) {
        return 67;
    } else {
        return 64;
    }
};

export const calcFontSize = (maxWidth: number, length: number) => {
    const baseScale = Math.min(1 / length * 200, 100);
    let widthFactor: number = maxWidth / 200;

    if (Number.isNaN(widthFactor)) {
        widthFactor = 1;
    }
    // console.log("widthfactor", widthFactor);

    return baseScale * widthFactor;

    return Math.min(1 / length * 250, 80);

    if (length <= 3) {
        return 200 * calcScoreLengthRatio(length);
    } else if (length <= 4) {
        return 200 * calcScoreLengthRatio(length);
    } else if (length <= 5) {
        return 200 * calcScoreLengthRatio(length);
    } else if (length <= 6) {
        return 200 * calcScoreLengthRatio(length);
    } else if (length <= 7) {
        return 200 * calcScoreLengthRatio(length);
    } else if (length <= 8) {
        return 200 * calcScoreLengthRatio(length);
    } else if (length <= 8) {
        return 200 * calcScoreLengthRatio(length);
    } else {
        return 200 * calcScoreLengthRatio(length);
    }
};

export const calcScoreLengthRatio = (length: number) => {
    return 1;
    if (length <= 3) {
        return .8;
    } else if (length <= 4) {
        return .35;
    } else if (length <= 5) {
        return .3;
    } else {
        return .3;
    }
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
