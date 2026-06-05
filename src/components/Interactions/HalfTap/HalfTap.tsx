import React from 'react';

import { useAppSelector } from '../../../../redux/hooks';
import { selectPlayerById } from '../../../../redux/PlayersSlice';
import { selectCurrentGame } from '../../../../redux/selectors';

import { HalfTileTouchSurface } from './HalfTileTouchSurface';

interface HalfTapProps {
    children: React.ReactNode;
    index: number;
    playerId: string;
    fontColor: string;
    showHint?: boolean;
    tileHeight?: number;
}

const HINT_MIN_HEIGHT = 200;

const HalfTap: React.FC<HalfTapProps> = ({
    children,
    index,
    fontColor,
    playerId,
    showHint,
    tileHeight,
}) => {
    const hintVisible = showHint && (!tileHeight || tileHeight >= HINT_MIN_HEIGHT);
    const currentGame = useAppSelector(selectCurrentGame);
    if (typeof currentGame == 'undefined') return null;

    const player = useAppSelector(state => selectPlayerById(state, playerId));
    if (typeof player == 'undefined') return null;

    return (
        <>
            {children}

            <HalfTileTouchSurface
                scoreType='increment'
                fontColor={fontColor}
                playerId={playerId}
                playerIndex={index}
                showHint={hintVisible} />

            <HalfTileTouchSurface
                scoreType='decrement'
                fontColor={fontColor}
                playerId={playerId}
                playerIndex={index}
                showHint={hintVisible} />
        </>
    );
};

export default HalfTap;
