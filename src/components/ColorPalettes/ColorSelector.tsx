import React from 'react';

import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { updatePlayer } from '../../../redux/PlayersSlice';
import { selectCurrentGame } from '../../../redux/selectors';
import { logEvent } from '../../Analytics';
import { getPalette, getPalettes } from '../../ColorPalette';
import SectionLabel from '../SectionLabel';

interface ColorSelectorProps {
    playerId: string;
}

const ColorButton: React.FC<{ color: string, playerColor: string | undefined; }> = ({ color, playerColor }) => {
    return (
        <View style={{
            ...styles.colorBadge, backgroundColor: color,
            borderWidth: color == playerColor ? 2 : 1,
            transform: [{ scale: color == playerColor ? 1.4 : 1 }],
            borderColor: color == playerColor ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)',
            // TODO: Animate borderRadius
            borderRadius: color == playerColor ? 25 : 3,
        }} />
    );
};

const ColorSelector: React.FC<ColorSelectorProps> = ({ playerId }) => {
    const colorPalettes = getPalettes();
    const currentGameId = useAppSelector(state => selectCurrentGame(state)?.id);
    const currentGame = useAppSelector(state => selectCurrentGame(state));
    const currentPalette = useAppSelector(state => selectCurrentGame(state)?.palette);
    const playerColor = useAppSelector(state => state.players.entities[playerId]?.color);
    const dispatch = useAppDispatch();

    if (!currentGameId) return null;

    const tapColorHandler = (color: string, inCurrentPalette: boolean = false) => {
        dispatch(updatePlayer({
            id: playerId,
            changes: { color: color }
        }));
        logEvent('set_player_color', {
            game_id: currentGameId,
            palette: currentGame?.palette,
            color,
            in_current_palette: inCurrentPalette,
        });
    };

    return (
        <View style={{ flexDirection: 'column' }}>


            <SectionLabel>Current palette</SectionLabel>

            {currentPalette &&
                <View style={styles.paletteRow}>
                    {
                        getPalette(currentPalette).map((color, i) => (
                            <TouchableOpacity
                                key={'currentPalette' + i}
                                onPress={() => tapColorHandler(color, true)}
                            >
                                <ColorButton color={color} playerColor={playerColor} />
                            </TouchableOpacity>
                        ))
                    }
                </View>
            }


            <SectionLabel>Other palettes</SectionLabel>

            {colorPalettes.map((palette, palette_index) => (
                currentPalette !== palette && (
                    <View style={styles.paletteRow} key={'v' + palette_index}>
                        {
                            getPalette(palette).map((color, i) => (
                                <TouchableOpacity
                                    key={'TO' + i}
                                    onPress={() => tapColorHandler(color)}
                                >
                                    <ColorButton color={color} playerColor={playerColor} />
                                </TouchableOpacity>
                            ))
                        }
                    </View>
                )
            ))}
        </View>
    );
};

export default ColorSelector;

const styles = StyleSheet.create({
    paletteRow: {
        flexDirection: 'row',
        marginVertical: 5,
        // Each badge carries its own 5pt side margin, so the row is pulled in
        // by that much to land the first swatch on the same 20pt gutter as the
        // labels and the name field above.
        marginHorizontal: 15,
    },
    colorBadge: {
        borderColor: '#999',
        borderWidth: 1,
        borderRadius: 25,
        borderStyle: 'solid',
        height: 25,
        marginHorizontal: 5,
        padding: 5,
        width: 25,
    },
});
