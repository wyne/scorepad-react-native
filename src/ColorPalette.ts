import { getContrastRatio } from 'colorsheet';

import { updateGame } from '../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectPlayerById, updatePlayer } from '../redux/PlayersSlice';
import { selectCurrentGame } from '../redux/selectors';

type PaletteType = Record<string, string[]>;

const palettes: PaletteType = {
    'original': [
        '#01497c',
        '#c25858',
        '#f5c800',
        '#275436',
        '#dc902c',
        '#62516a',
        '#755647',
        '#925561',
    ],
    'pastel': [
        '#f9d5e5',
        '#eeac99',
        '#e06377',
        '#c83349',
        '#5b9aa0',
        '#d1b59b',
        '#8f3e3f',
        '#f6416c',
    ],
    'dark': [
        '#011627',
        '#fdfffc',
        '#2ec4b6',
        '#e71d36',
        '#ff9f1c',
        '#f3722c',
        '#f8961e',
        '#f9844a',
    ],
    'grey': [
        '#f8f9fa',
        '#e9ecef',
        '#dee2e6',
        '#ced4da',
        '#adb5bd',
        '#6c757d',
        '#495057',
        '#343a40',
        '#212529',
        '#000000',
    ],
    'a': [
        '#114b5f',
        '#456990',
        '#e4fde1',
        '#f45b69',
        '#6b2737'
    ],
    'b': [
        '#c25858',
        '#01497c',
    ],
    'c': [
        '#88498f',
        '#779fa1',
        '#e0cba8',
        '#ff6542',
        '#564154'
    ],
    'd': [
        '#f8ffe5',
        '#06d6a0',
        '#1b9aaa',
        '#ef476f',
        '#ffc43d'
    ],
    'e': [
        '#1f2041',
        '#4b3f72',
        '#ffc857',
        '#119da4',
        '#19647e'
    ],
    'f': [
        '#fcaa67',
        '#b0413e',
        '#ffffc7',
        '#548687',
        '#473335'
    ],
    'g': [
        '#ffa400',
        '#009ffd',
        '#2a2a72',
        '#232528',
        '#eaf6ff'
    ]
};

export const getPalettes = (): string[] => {
    return Object.keys(palettes);
};

export const getPalette = (name: string): string[] => {
    return palettes[name];
};

export const getPlayerColors = (index: number): [string, string] => {
    const palette = Object.keys(palettes)[0 % Object.keys(palettes).length];

    // TODO: Get player color if it exists

    const length = palettes[palette].length;
    const bg = palettes[palette][index % length];

    const blackContrast = getContrastRatio(bg, '#000').number;
    const whiteContrast = getContrastRatio(bg, '#fff').number;

    // +1 to give a slight preference to white
    const fg = blackContrast >= whiteContrast + 1 ? '#000000' : '#FFFFFF';

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
