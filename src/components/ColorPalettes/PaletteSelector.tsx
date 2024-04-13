import React from 'react';

import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { getPalette, getPalettes } from '../../ColorPalette';

import PalettePreview from './PalettePreview';

interface Props {
    // selectedPalette: ColorPalette;
    // onSelect: (palette: ColorPalette) => void;
}

const MemoizedColorCircle = React.memo(PalettePreview);

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
                    <MemoizedColorCircle colors={getPalette(palette)} selected={index == 0} />
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
        marginVertical: 20,
    },
    palette: {
        width: 40,
        height: 40,
        borderWidth: 2,
        borderColor: 'transparent',
        marginHorizontal: 5,
    },
});
