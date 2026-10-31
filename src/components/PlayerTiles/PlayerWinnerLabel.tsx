import React from 'react';

import { Icon } from '@rneui/base';
import { StyleSheet, Text, View } from 'react-native';

interface PlayerWinnerLabelProps {
    fontColor: string;
    enabled: boolean;
}

const PlayerWinnerLabel: React.FC<PlayerWinnerLabelProps> = ({ fontColor, enabled }) => {
    if (!enabled) return null;

    return (
        <View style={styles.container}>
            <Icon name="trophy" type="ionicon" color={fontColor} size={14} style={{ marginRight: 2 }} />
            <Text style={[styles.label, { color: fontColor }]}>WINNER</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 4,
        right: 6,
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        fontSize: 11,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
});

export default PlayerWinnerLabel;
