import React from 'react';

import { getContrastRatio } from 'colorsheet';
import { DimensionValue, StyleSheet } from 'react-native';
import Animated, { Easing, FadeIn } from 'react-native-reanimated';
import { shallowEqual } from 'react-redux';

import { selectGameById } from '../../../redux/GamesSlice';
import { useAppSelector } from '../../../redux/hooks';
import { selectInteractionType } from '../../../redux/selectors';
import { getPalette } from '../../ColorPalette';
import { useTheme } from '../../theme';
import { interactionComponents } from '../Interactions/InteractionComponents';
import { InteractionType } from '../Interactions/InteractionType';
import AdditionTile from '../PlayerTiles/AdditionTile/AdditionTile';
import PlayerIndexLabel from '../PlayerTiles/PlayerIndexLabel';
import PlayerWinnerLabel from '../PlayerTiles/PlayerWinnerLabel';

interface Props {
    index: number;
    playerId: string;
    cols: number;
    rows: number;
    width: number;
    height: number;
    showHint: boolean;
}

const PlayerTile: React.FunctionComponent<Props> = React.memo(({
    index,
    width,
    height,
    cols,
    rows,
    playerId,
    showHint,
}) => {
    // Short circuit if width or height is not yet defined
    if (!(width > 0 && height > 0)) return null;
    if (Number.isNaN(width) || Number.isNaN(height)) return null;

    const theme = useTheme();
    const playerIndexLabel = useAppSelector(state => state.settings.showPlayerIndex);
    const { bg, fg, isWinner } = useAppSelector(state => {
        const currentGameId = state.settings.currentGameId;
        const currentGame = currentGameId ? selectGameById(state, currentGameId) : undefined;
        const palette = getPalette(currentGame?.palette || 'original') || getPalette('original');
        const playerIndex = currentGame?.playerIds.indexOf(playerId) ?? 0;
        const paletteBG = palette[playerIndex % palette.length];
        const bg = state.players.entities[playerId]?.color || paletteBG;

        const blackContrast = getContrastRatio(bg, '#000').number;
        const whiteContrast = getContrastRatio(bg, '#fff').number;
        const fg = blackContrast >= whiteContrast + 1 ? '#000000' : '#FFFFFF';

        return {
            bg,
            fg,
            isWinner: !!(currentGame?.locked && currentGame?.winnerIds?.includes(playerId)),
        };
    }, shallowEqual);

    const widthPerc: DimensionValue = `${(100 / cols)}%`;
    const heightPerc: DimensionValue = `${(100 / rows)}%`;

    // Dynamic InteractionComponent
    const interactionType: InteractionType = useAppSelector(selectInteractionType);
    const InteractionComponent = interactionComponents[interactionType];

    return (
        <Animated.View
            entering={FadeIn.delay(25 * index + 50).duration(400).easing(Easing.ease)}
            style={[
                styles.playerCard,
                {
                    backgroundColor: bg,
                    borderColor: theme.background,
                    width: widthPerc,
                    height: heightPerc,
                    borderBottomLeftRadius: playerIndexLabel ? 7 : undefined,
                }]}>
            <PlayerIndexLabel index={index} fontColor={fg} enabled={playerIndexLabel} />
            <PlayerWinnerLabel fontColor={fg} enabled={isWinner} />
            <InteractionComponent index={index} fontColor={fg} playerId={playerId} showHint={showHint} tileHeight={height}>
                <AdditionTile
                    playerId={playerId}
                    fontColor={fg}
                    maxWidth={width}
                    maxHeight={height}
                    index={index}
                />
            </InteractionComponent>
        </Animated.View>
    );
});

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

export default PlayerTile;
