import React from 'react';

import { selectGameById } from '../../../../redux/GamesSlice';
import { useAppSelector } from '../../../../redux/hooks';

import { HalfTileTouchSurface } from './HalfTileTouchSurface';

interface HalfTapProps {
    children: React.ReactNode;
    index: number;
    playerId: string;
    fontColor: string;
    /** Test-only render probe for selector invalidation regressions. */
    onRender?: (id: string) => void;
}

const HalfTap: React.FC<HalfTapProps> = ({
    children,
    index,
    fontColor,
    playerId,
    onRender,
}) => {
    onRender?.(playerId);

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
                playerIndex={index} />

            <HalfTileTouchSurface
                scoreType='decrement'
                fontColor={fontColor}
                playerId={playerId}
                playerIndex={index} />
        </>
    );
};

export default HalfTap;
