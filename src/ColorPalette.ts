import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectPlayerById, updatePlayer } from '../redux/PlayersSlice';

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
        '#fdfffc',
        '#2ec4b6',
        '#e71d36',
        '#ff9f1c',
        '#f3722c',
    ],
    'f': [
        '#fcaa67',
        '#b0413e',
        '#ffffc7',
        '#548687',
        '#473335'
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
};

export const getPalettes = (): string[] => {
    return Object.keys(palettes);
};

export const getPalette = (name: string): string[] => {
    return palettes[name];
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
