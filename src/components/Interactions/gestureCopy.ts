import { InteractionType } from './InteractionType';

export const GESTURE_NAMES: Record<InteractionType, string> = {
    [InteractionType.SwipeVertical]: 'Swipe',
    [InteractionType.HalfTap]: 'Tap',
    [InteractionType.Dial]: 'Dial',
};

/** Order of the gestures in the menu and the How to Score tabs. */
export const GESTURE_ORDER: InteractionType[] = [
    InteractionType.SwipeVertical,
    InteractionType.HalfTap,
    InteractionType.Dial,
];

/** Title and one-sentence body for the first-use toast. */
export const gestureToastCopy = (type: InteractionType, addendOne: number, addendTwo: number) => {
    switch (type) {
        case InteractionType.HalfTap:
            return {
                title: 'Tap to score',
                body: `Tap the top half of a tile to add ${addendOne}, the bottom half to subtract. Hold for ${addendTwo}.`,
            };
        case InteractionType.Dial:
            return {
                title: 'Tap a player to score',
                body: 'Then turn the ring: clockwise adds, counter-clockwise subtracts.',
            };
        case InteractionType.SwipeVertical:
        default:
            return {
                title: 'Swipe to score',
                body: `Swipe a tile up to add ${addendOne}, down to subtract. Swipe farther for more.`,
            };
    }
};

/** Three short steps for the How to Score sheet. */
export const gestureSteps = (type: InteractionType, addendOne: number, addendTwo: number): string[] => {
    switch (type) {
        case InteractionType.HalfTap:
            return [
                `Tap the top half of a player's tile to add ${addendOne}.`,
                `Tap the bottom half to subtract ${addendOne}.`,
                `Long-press either half to add or subtract ${addendTwo} instead.`,
            ];
        case InteractionType.Dial:
            return [
                'Tap a player\'s row to open their dial.',
                `Turn the ring clockwise to add ${addendOne} per step, counter-clockwise to subtract.`,
                `Hold still on the ring to use ${addendTwo} per step, or tap − / + for single steps.`,
            ];
        case InteractionType.SwipeVertical:
        default:
            return [
                `Swipe up on a player's tile to add ${addendOne}, down to subtract.`,
                'Swipe farther to count more, one notch at a time.',
                `Hold still for a moment, then swipe, to use ${addendTwo} per notch. The tile wiggles to confirm.`,
            ];
    }
};

/** The score the demo animation lands on. */
export const gestureDemoLabel = (type: InteractionType, addendOne: number) => {
    switch (type) {
        case InteractionType.HalfTap: return `+${addendOne}`;
        case InteractionType.Dial: return `+${addendOne * 2}`;
        case InteractionType.SwipeVertical:
        default: return `+${addendOne * 3}`;
    }
};
