import React from 'react';

import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { asyncSetGamePalette } from '../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { selectCurrentGame } from '../../../redux/selectors';
import { logEvent } from '../../Analytics';
import { getPalette, getPalettes } from '../../ColorPalette';

import PalettePreview from './PalettePreview';

const MemoizedPalettePreview = React.memo(PalettePreview);

const PaletteSelector: React.FunctionComponent = () => {
    const colorPalettes = getPalettes();
    const currentGameId = useAppSelector(state => selectCurrentGame(state)?.id);
    const currentPalette = useAppSelector(state => selectCurrentGame(state)?.palette);

    const dispatch = useAppDispatch();

    if (!currentGameId) return null;

    const onSelect = (palette: string) => {
        dispatch(
            asyncSetGamePalette({
                gameId: currentGameId,
                palette: palette,
            })
        );
        logEvent('set_game_palette', {
            game_id: currentGameId,
            palette,
        });
    };

    return (
        <ScrollView horizontal={true} contentContainerStyle={styles.container}>
            {colorPalettes.map((palette, index) => (
                <TouchableOpacity
                    key={index}
                    style={[
                        styles.palette,
                    ]}
                    onPress={() => onSelect(palette)}
                >
                    <MemoizedPalettePreview colors={getPalette(palette)} selected={palette == currentPalette} />
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
        height: 42,
        borderWidth: 2,
        borderColor: 'transparent',
        marginHorizontal: 5,
    },
});
