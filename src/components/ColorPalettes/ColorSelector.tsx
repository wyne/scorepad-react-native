import React from 'react';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { updatePlayer } from '../../../redux/PlayersSlice';
import { selectCurrentGame } from '../../../redux/selectors';
import { getPalette, getPalettes } from '../../ColorPalette';

interface ColorSelectorProps {
    playerId: string;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({ playerId }) => {
    const colorPalettes = getPalettes();
    const currentGameId = useAppSelector(state => selectCurrentGame(state)?.id);
    const currentPalette = useAppSelector(state => selectCurrentGame(state)?.palette);
    const playerColor = useAppSelector(state => state.players.entities[playerId]?.color);

    if (!currentGameId) return null;

    const dispatch = useAppDispatch();

    const tapColorHandler = (color: string) => {
        dispatch(updatePlayer({
            id: playerId,
            changes: { color: color }
        }));
    };

    return (
        <View style={{ flexDirection: 'column' }}>


            <View style={[styles.titleContainer]}>
                <Text style={[styles.title]}>Current Pallete</Text>
            </View>

            {currentPalette &&
                <View style={{ flexDirection: 'row', marginVertical: 5 }}>
                    {
                        getPalette(currentPalette).map((color, i) => (
                            <TouchableOpacity
                                key={'currentPalette' + i}
                                onPress={() => tapColorHandler(color)}
                            >
                                <View style={{
                                    ...styles.colorBadge, backgroundColor: color,
                                    borderWidth: color == playerColor ? 2 : 1,
                                    borderColor: color == playerColor ? 'white' : '#999',
                                    borderRadius: color == playerColor ? 3 : 25,
                                }} />
                            </TouchableOpacity>
                        ))
                    }
                </View>
            }


            <View style={[styles.titleContainer]}>
                <Text style={[styles.title]}>Other Palletes</Text>
            </View>

            {colorPalettes.map((palette, palette_index) => (
                currentPalette !== palette && (
                    <View style={{ flexDirection: 'row', marginVertical: 5 }} key={'v' + palette_index}>
                        {
                            getPalette(palette).map((color, i) => (
                                <TouchableOpacity
                                    key={'TO' + i}
                                    onPress={() => tapColorHandler(color)}
                                >
                                    <View style={{
                                        ...styles.colorBadge, backgroundColor: color,
                                        borderWidth: color == playerColor ? 2 : 1,
                                        borderColor: color == playerColor ? 'white' : '#999',
                                        // TODO: Animated this for fun
                                        borderRadius: color == playerColor ? 3 : 25,
                                    }} />
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
    title: {
        color: 'white',
    },
    titleContainer: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        marginVertical: 20,
    }
});
