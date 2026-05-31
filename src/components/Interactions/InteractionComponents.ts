import HalfTap from './HalfTap/HalfTap';
import { InteractionType } from './InteractionType';
import RadialGesture from './Radial/RadialGesture';
import Swipe from './Swipe/Swipe';

export const interactionComponents = {
    [InteractionType.HalfTap]: HalfTap,
    [InteractionType.SwipeVertical]: Swipe,
    [InteractionType.RadialGesture]: RadialGesture,
};
