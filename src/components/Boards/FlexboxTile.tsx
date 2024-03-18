import React from 'react';

import { DimensionValue, StyleSheet } from 'react-native';
import Animated, { Easing, FadeIn } from 'react-native-reanimated';

import { selectGameById } from '../../../redux/GamesSlice';
import { useAppSelector } from '../../../redux/hooks';
import { interactionComponents } from '../Interactions/InteractionComponents';
import { InteractionType } from '../Interactions/InteractionType';
import AdditionTile from '../PlayerTiles/AdditionTile/AdditionTile';

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

const FlexboxTile: React.FunctionComponent<Props> = ({
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
    if (Number.isNaN(width) || Number.isNaN(height)) return null;

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentGame = useAppSelector(state => selectGameById(state, currentGameId));
    if (typeof currentGame == 'undefined') return null;

    const widthPerc: DimensionValue = `${(100 / cols)}%`;
    const heightPerc: DimensionValue = `${(100 / rows)}%`;

    // Dynamic InteractionComponent
    const interactionType: InteractionType = useAppSelector(state => state.settings.interactionType);

    const InteractionComponent = interactionComponents[interactionType];

    return (
        <Animated.View
            entering={FadeIn.delay(100 * index + 200).duration(400).easing(Easing.ease)}
            style={[
                styles.playerCard,
                {
                    backgroundColor: color,
                    width: widthPerc,
                    height: heightPerc
                }]}>
            <InteractionComponent index={index} fontColor={fontColor} playerId={playerId}>
                <AdditionTile
                    playerId={playerId}
                    fontColor={fontColor}
                    maxWidth={width}
                    maxHeight={height}
                    index={index}
                />
            </InteractionComponent>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    playerCard: {
        borderRadius: 20,
        borderWidth: 3,
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

export default FlexboxTile;
