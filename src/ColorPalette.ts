import { getContrastRatio } from 'colorsheet';

import { updateGame } from "../redux/GamesSlice";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { selectPlayerById, updatePlayer } from "../redux/PlayersSlice";
import { selectCurrentGame } from "../redux/selectors";

type PaletteType = Record<string, string[]>;

const palettes: PaletteType = {
    'original': [
        "#01497c",
        "#c25858",
        "#f5c800",
        "#275436",
        "#dc902c",
        "#62516a",
        "#755647",
        "#925561",
    ],
    'pastel': [
        "#f9d5e5",
        "#eeac99",
        "#e06377",
        "#c83349",
        "#5b9aa0",
        "#d1b59b",
        "#8f3e3f",
        "#f6416c",
    ],
    'dark': [
        "#011627",
        "#fdfffc",
        "#2ec4b6",
        "#e71d36",
        "#ff9f1c",
        "#f3722c",
        "#f8961e",
        "#f9844a",
    ],
};

export const getPlayerColors = (index: number): [string, string] => {
    const palette = 'original';

    // TODO: Get player color if it exists

    const bg = palettes[palette][index % palette.length];

    const contrast = getContrastRatio(bg, '#000').number;

    const fg = contrast > 7 ? "#000000" : "#FFFFFF";

    return [bg, fg];
};

export const setPlayerColor = (playerId: string, color: string) => {
    const dispatch = useAppDispatch();

    const player = useAppSelector(state => selectPlayerById(state, playerId));
    if (typeof player == 'undefined') return;
    player.color = color;

    dispatch(updatePlayer({
        id: playerId,
        changes: {
            color: color,
        }
    }));
};

export const setGamePalette = (gameId: string, palette: string) => {
    const dispatch = useAppDispatch();

    const game = useAppSelector(selectCurrentGame);
    if (typeof game == 'undefined') return;
    dispatch(updateGame({
        id: game.id,
        changes: {
            palette: palette,
        }
    }));
};
