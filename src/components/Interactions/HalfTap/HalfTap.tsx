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
}

const HalfTap: React.FC<HalfTapProps> = ({
    children,
    index,
    fontColor,
    playerId
}) => {
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
