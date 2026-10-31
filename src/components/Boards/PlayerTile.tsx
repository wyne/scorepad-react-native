import React from 'react';

import { getContrastRatio } from 'colorsheet';
import { DimensionValue, StyleSheet, View } from 'react-native';
import { shallowEqual } from 'react-redux';

import { selectGameById } from '../../../redux/GamesSlice';
import { useAppSelector } from '../../../redux/hooks';
import { selectInteractionType } from '../../../redux/selectors';
import { getPalette } from '../../ColorPalette';
import { interactionComponents } from '../Interactions/InteractionComponents';
import { InteractionType } from '../Interactions/InteractionType';
import AdditionTile from '../PlayerTiles/AdditionTile/AdditionTile';
import PlayerIndexLabel from '../PlayerTiles/PlayerIndexLabel';
import PlayerWinnerLabel from '../PlayerTiles/PlayerWinnerLabel';

// Space around each tile, so neighbouring tiles sit twice this far apart.
export const TILE_BORDER = 3;
// The usual corner radius of a tile's slot (the tile plus the space around
// it), for corners not drawn concentric with the display.
export const TILE_RADIUS = 20;

interface Props {
    index: number;
    playerId: string;
    cols: number;
    rows: number;
    width: number;
    height: number;
    showHint: boolean;
    // Per-corner radii, for corners drawn concentric with the display's.
    radiusTopLeft?: number;
    radiusTopRight?: number;
    radiusBottomLeft?: number;
    radiusBottomRight?: number;
}

const PlayerTile: React.FunctionComponent<Props> = React.memo(({
    index,
    width,
    height,
    cols,
    rows,
    playerId,
    showHint,
    radiusTopLeft,
    radiusTopRight,
    radiusBottomLeft,
    radiusBottomRight,
}) => {
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
    const interactionType: InteractionType = useAppSelector(
        state => selectInteractionType(state, state.settings.currentGameId)
    );
    const InteractionComponent = interactionComponents[interactionType];

    if (!(width > 0 && height > 0)) return null;
    if (Number.isNaN(width) || Number.isNaN(height)) return null;

    // The gap around the tile is padding, not a border in the background color:
    // with uneven corner radii a border leaves a faint seam along its edge.
    const inner = (radius: number | undefined) => (radius ?? TILE_RADIUS) - TILE_BORDER;

    return (
        <View style={[styles.playerSlot, { width: widthPerc, height: heightPerc }]}>
            <View
                style={[
                    styles.playerCard,
                    {
                        backgroundColor: bg,
                        borderTopLeftRadius: inner(radiusTopLeft),
                        borderTopRightRadius: inner(radiusTopRight),
                        // The player number sits in this corner, tucked into a tighter curve.
                        borderBottomLeftRadius: playerIndexLabel ? inner(7) : inner(radiusBottomLeft),
                        borderBottomRightRadius: inner(radiusBottomRight),
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
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    playerSlot: {
        flexGrow: 1,
        padding: TILE_BORDER,
    },
    playerCard: {
        flex: 1,
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
