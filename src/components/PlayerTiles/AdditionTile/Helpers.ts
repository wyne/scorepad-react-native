import { Easing, LinearTransition, ZoomIn, ZoomOut, withTiming } from 'react-native-reanimated';

/**
 * The duration of the animation in milliseconds.
 */
export const animationDuration = 200;

/**
 * The duration of the entering animation in milliseconds.
 */
export const enteringAnimation = ZoomIn.duration(animationDuration);

/**
 * The duration of the exiting animation in milliseconds.
 */
export const exitingAnimation = ZoomOut.duration(animationDuration);

/**
 * The easing and duration of the layout animation.
 */
export const layoutAnimation = LinearTransition.easing(Easing.ease).duration(animationDuration);

export const singleLineScoreSizeMultiplier = 1.2;

export const multiLineScoreSizeMultiplier = 0.7;

export const baseScoreFontSize = 40;

export const scoreMathOpacity = 0.75;

/**
 * Calculates the font size based on the maximum width.
 * @param containerWidth The maximum width of the text.
 * @returns The calculated font size.
 */
export const calculateFontSize = (containerWidth: number) => {
    return baseScoreFontSize * widthFactor(containerWidth);
};

export const widthFactor = (containerWidth: number) => {
    let widthFactor: number = containerWidth / 200;
    if (Number.isNaN(widthFactor)) { widthFactor = 1; }
    return widthFactor;
};

/**
 * The ZoomOutFadeOut animation.
 * @returns The initial values and animations for the ZoomOutFadeOut animation.
 */
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
