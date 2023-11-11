import { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Layout, Easing } from 'react-native-reanimated';
import { withTiming } from 'react-native-reanimated';

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
export const layoutAnimation = Layout.easing(Easing.ease).duration(animationDuration);

/**
 * Calculates the font size based on the maximum width.
 * @param containerWidth The maximum width of the text.
 * @returns The calculated font size.
 */
export const calculateFontSize = (containerWidth: number) => {
    // const baseScale: number = Math.min(1 / stringLength * 200, 100);
    const baseScale = 40;

    let widthFactor: number = containerWidth / 200;

    if (Number.isNaN(widthFactor)) { widthFactor = 1; }

    return baseScale * widthFactor;
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
