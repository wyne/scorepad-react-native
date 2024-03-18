import HalfTap from "./HalfTap/HalfTap";
import { InteractionType } from "./InteractionType";
import Slide from "./Slide/Slide";

export const interactionComponents = {
    [InteractionType.HalfTap]: HalfTap,
    [InteractionType.SlideVertical]: Slide,
};
