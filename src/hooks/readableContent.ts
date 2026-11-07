import { ViewStyle } from 'react-native';

/**
 * The widest that lists of settings and other reading content get in a wide
 * window (an iPad, the iPhone Duo's inner display), like iOS's own readable
 * content width. Narrower windows use their whole width.
 */
export const READABLE_CONTENT_WIDTH = 680;

/** Caps a content container at the readable width, centred in the window. */
export const readableContentStyle: ViewStyle = {
    width: '100%',
    maxWidth: READABLE_CONTENT_WIDTH,
    alignSelf: 'center',
};
