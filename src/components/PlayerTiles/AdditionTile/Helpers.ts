import { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Layout, Easing } from 'react-native-reanimated';

export const animationDuration = 200;
export const enteringAnimation = ZoomIn.duration(animationDuration);
export const exitingAnimation = ZoomOut.duration(animationDuration);
export const layoutAnimation = Layout.easing(Easing.ease).duration(animationDuration);

import { withTiming } from 'react-native-reanimated';

export const calcPlayerFontSize = (length: number) => {
    if (length <= 3) {
        return 50;
    } else if (length <= 4) {
        return 40;
    } else if (length <= 5) {
        return 40;
    } else if (length <= 6) {
        return 46;
    } else if (length <= 7) {
        return 43;
    } else if (length <= 8) {
        return 40;
    } else if (length <= 8) {
        return 37;
    } else {
        return 34;
    }
};

export const calcFontSize = (length: number) => {
    if (length <= 3) {
        return 50 * calcScoreLengthRatio(length);
    } else if (length <= 4) {
        return 40 * calcScoreLengthRatio(length);
    } else if (length <= 5) {
        return 40 * calcScoreLengthRatio(length);
    } else if (length <= 6) {
        return 46 * calcScoreLengthRatio(length);
    } else if (length <= 7) {
        return 43 * calcScoreLengthRatio(length);
    } else if (length <= 8) {
        return 40 * calcScoreLengthRatio(length);
    } else if (length <= 8) {
        return 37 * calcScoreLengthRatio(length);
    } else {
        return 34 * calcScoreLengthRatio(length);
    }
};

export const calcScoreLengthRatio = (length: number) => {
    if (length <= 3) {
        return .8;
    } else if (length <= 4) {
        return .75;
    } else if (length <= 5) {
        return .7;
    } else {
        return .6;
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
