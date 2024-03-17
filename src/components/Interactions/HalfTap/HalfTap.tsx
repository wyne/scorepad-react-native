import React from 'react';


import { selectGameById } from '../../../../redux/GamesSlice';
import { useAppSelector } from '../../../../redux/hooks';
import { selectPlayerById } from '../../../../redux/PlayersSlice';

import { TouchSurface } from './TouchSurface';

interface HalfTapProps {
    children: React.ReactNode;
    index: number;
    playerId: string;
    fontColor: string;
}

const HalfTap: React.FC<HalfTapProps> = ({
    children,
    index,
    fontColor,
    playerId
}) => {
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentGame = useAppSelector(state => selectGameById(state, currentGameId));
    if (typeof currentGame == 'undefined') return null;

    const player = useAppSelector(state => selectPlayerById(state, playerId));
    if (typeof player == 'undefined') return null;

    return (
        <>
            {children}

            <TouchSurface
                scoreType='increment'
                fontColor={fontColor}
                playerId={playerId}
                playerIndex={index} />

            <TouchSurface
                scoreType='decrement'
                fontColor={fontColor}
                playerId={playerId}
                playerIndex={index} />
        </>
    );
};

export default HalfTap;
