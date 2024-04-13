import React from 'react';

import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { getPalette, getPalettes } from '../../ColorPalette';

import ColorCircle from './ColorCircle';

interface Props {
    // selectedPalette: ColorPalette;
    // onSelect: (palette: ColorPalette) => void;
}

const MemoizedColorCircle = React.memo(ColorCircle);

const PaletteSelector: React.FunctionComponent<Props> = () => {
    const colorPalettes = getPalettes();

    return (
        <ScrollView horizontal={true} contentContainerStyle={styles.container}>
            {colorPalettes.map((palette, index) => (
                <TouchableOpacity
                    key={index}
                    style={[
                        styles.palette,
                    ]}
                // onPress={() => onSelect(palette)}
                >
                    <MemoizedColorCircle colors={getPalette(palette)} />
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

export default PaletteSelector;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 20,
    },
    palette: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'transparent',
        marginHorizontal: 5,
    },
});
