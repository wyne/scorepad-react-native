import React from 'react';

import { Icon } from '@rneui/base';
import { StyleSheet, Text, View } from 'react-native';

interface PlayerWinnerLabelProps {
    fontColor: string;
    enabled: boolean;
}

// A tab hanging from the top edge of the tile, centered over the player name.
const PlayerWinnerLabel: React.FC<PlayerWinnerLabelProps> = ({ fontColor, enabled }) => {
    if (!enabled) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            {/* Tinted with the tile's text color at ~16% opacity, so it reads on any tile color. */}
            <View style={[styles.tab, { backgroundColor: fontColor + '29' }]}>
                <Icon name="trophy" type="ionicon" color={fontColor} size={12} style={{ marginRight: 4 }} />
                <Text style={[styles.label, { color: fontColor }]}>WINNER</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 4,
        paddingBottom: 5,
        paddingHorizontal: 12,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
    },
    label: {
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});

export default PlayerWinnerLabel;
