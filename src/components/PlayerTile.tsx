import React from 'react';

import { DimensionValue, StyleSheet } from 'react-native';
import Animated, { Easing, FadeIn } from 'react-native-reanimated';

import { selectGameById } from '../../redux/GamesSlice';
import { useAppSelector } from '../../redux/hooks';
import { selectPlayerById } from '../../redux/PlayersSlice';

import HalfTap from './Interactions/HalfTap/HalfTap';
import Slide from './Interactions/Slide/Slide';
import AdditionTile from './PlayerTiles/AdditionTile/AdditionTile';

interface Props {
    index: number;
    playerId: string;
    color: string;
    fontColor: string;
    cols: number;
    rows: number;
    width: number;
    height: number;
}

const PlayerTile: React.FunctionComponent<Props> = ({
    index,
    color,
    fontColor,
    width,
    height,
    cols,
    rows,
    playerId
}) => {
    // Short circuit if width or height is not yet defined
    if (!(width > 0 && height > 0)) return null;

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentGame = useAppSelector(state => selectGameById(state, currentGameId));
    if (typeof currentGame == 'undefined') return null;

    const roundCurrent = currentGame.roundCurrent;

    const player = useAppSelector(state => selectPlayerById(state, playerId));
    if (typeof player == 'undefined') return null;
    const playerName = player.playerName;
    const scoreTotal = player.scores.reduce(
        (sum, current, round) => {
            if (round > roundCurrent) { return sum; }
            return (sum || 0) + (current || 0);
        }
    );
    const scoreRound = player.scores[roundCurrent] || 0;

    const widthPerc: DimensionValue = `${(100 / cols)}%`;
    const heightPerc: DimensionValue = `${(100 / rows)}%`;

    if (Number.isNaN(width) || Number.isNaN(height)) return null;

    const interaction = 'slide' as 'slide' | 'tap';

    return (
        <Animated.View
            entering={FadeIn.delay(100 * index + 200).duration(400).easing(Easing.ease)}
            style={[
                styles.playerCard,
                {
                    borderRadius: 20,
                    borderWidth: 3,
                    backgroundColor: color,
                    width: widthPerc,
                    height: heightPerc
                }]}>

            {interaction === 'slide' &&
                <Slide
                    index={index}
                    playerId={playerId}
                >
                    <AdditionTile
                        totalScore={scoreTotal}
                        roundScore={scoreRound}
                        fontColor={fontColor}
                        playerName={playerName}
                        maxWidth={width}
                        maxHeight={height}
                        index={index} />
                </Slide>
            }

            {interaction === 'tap' &&
                <HalfTap index={index} fontColor={fontColor} playerId={playerId}>
                    <AdditionTile
                        totalScore={scoreTotal}
                        roundScore={scoreRound}
                        fontColor={fontColor}
                        playerName={playerName}
                        maxWidth={width}
                        maxHeight={height}
                        index={index} />
                </HalfTap>
            }
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    playerCard: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    surface: {
        position: 'absolute',
        width: '100%',
        borderColor: 'red',
    },
    surfaceAdd: {
        top: 0,
        bottom: '50%',
    },
    surfaceSubtract: {
        top: '50%',
        bottom: 0,
    },
});

export default PlayerTile;
