import React from 'react';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { selectCurrentGame } from '../../../redux/selectors';
import { getPalette, getPalettes } from '../../ColorPalette';

interface ColorSelectorProps {
    // Add any props you need here
}

const ColorSelector: React.FC<ColorSelectorProps> = () => {
    const colorPalettes = getPalettes();
    const currentGameId = useAppSelector(state => selectCurrentGame(state)?.id);
    const currentPalette = useAppSelector(state => selectCurrentGame(state)?.palette);

    if (!currentGameId) return null;

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
                                style={[]}
                            >
                                <View style={{ ...styles.colorBadge, backgroundColor: color }} />
                            </TouchableOpacity>
                        ))
                    }
                </View>
            }


            <View style={[styles.titleContainer]}>
                <Text style={[styles.title]}>Other Palletes</Text>
            </View>

            {colorPalettes.map((palette) => (
                currentPalette !== palette && (
                    <View style={{ flexDirection: 'row', marginVertical: 5 }}>
                        {
                            getPalette(palette).map((color, i) => (
                                <TouchableOpacity
                                    key={'TO' + i}
                                    style={[]}
                                >
                                    <View style={{ ...styles.colorBadge, backgroundColor: color }} />
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
        borderColor: '#eee',
        borderRadius: 25,
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
