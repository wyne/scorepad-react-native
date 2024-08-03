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
        '#e9ecef',
        '#212529',
    ],
    'tropical-fiesta': [
        '#f8ffe5',
        '#06d6a0',
        '#1b9aaa',
        '#ef476f',
        '#ffc43d'
    ],
    'spring': [
        '#7bdff2',
        '#b2f7ef',
        '#eff7f6',
        '#f7d6e0',
        '#f2b5d4'
    ],
    'autumn': [
        '#fcaa67',
        '#b0413e',
        '#ffffc7',
        '#548687',
        '#473335'
    ],
    'harkonnen': [
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
    'electric-orchid': [
        '#f72585',
        '#b5179e',
        '#7209b7',
        '#560bad',
        '#480ca8',
        '#3a0ca3',
        '#3f37c9',
        '#4361ee',
        '#4895ef',
        '#4cc9f0',
    ],
    'autumn-ocean': [
        '#005f73',
        '#0a9396',
        '#94d2bd',
        '#e9d8a6',
        '#ee9b00',
        '#ca6702',
        '#bb3e03',
        '#ae2012',
    ],
    'sunset-harbor': [
        '#edae49',
        '#d1495b',
        '#00798c',
        '#30638e',
        '#003d5b',
    ]
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
