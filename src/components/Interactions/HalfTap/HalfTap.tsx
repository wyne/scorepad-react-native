import React from 'react';

import { selectGameById } from '../../../../redux/GamesSlice';
import { useAppSelector } from '../../../../redux/hooks';

import { HalfTileTouchSurface } from './HalfTileTouchSurface';

interface HalfTapProps {
    children: React.ReactNode;
    index: number;
    playerId: string;
    fontColor: string;
    showHint?: boolean;
    tileHeight?: number;
    /** Test-only render probe for selector invalidation regressions. */
    onRender?: (id: string) => void;
}

const HINT_MIN_HEIGHT = 200;

const HalfTap: React.FC<HalfTapProps> = ({
    children,
    index,
    fontColor,
    playerId,
    showHint,
    tileHeight,
    onRender,
}) => {
    onRender?.(playerId);

    const hintVisible = showHint && (!tileHeight || tileHeight >= HINT_MIN_HEIGHT);
    const hasCurrentGame = useAppSelector(state => {
        const currentGameId = state.settings.currentGameId;
        return currentGameId ? typeof selectGameById(state, currentGameId) !== 'undefined' : false;
    });
    const hasPlayer = useAppSelector(state => typeof state.players.entities[playerId] !== 'undefined');

    if (!hasCurrentGame || !hasPlayer) return null;

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
